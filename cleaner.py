from __future__ import annotations

import os
import shutil
import subprocess
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable
from uuid import uuid4

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import cv2
import fitz
import numpy as np
from PIL import Image, ImageOps
from pptx import Presentation

try:
    import imageio_ffmpeg
except ImportError:  # pragma: no cover
    imageio_ffmpeg = None


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
MODEL_DIR = BASE_DIR / ".models" / "easyocr"
USER_NETWORK_DIR = BASE_DIR / ".models" / "easyocr-user-network"
TEMP_DIR = BASE_DIR / ".tmp"
DEFAULT_OCR_MAX_DIMENSION = int(os.getenv("OCR_MAX_DIMENSION", "1280"))
DEFAULT_PDF_OCR_SCALE = float(os.getenv("PDF_OCR_SCALE", "1.5"))

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
TEXT_EXTENSIONS = {".txt", ".csv", ".md", ".json", ".xml", ".html", ".rtf"}
PPTX_MEDIA_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
SUPPORTED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS | TEXT_EXTENSIONS | {".pdf", ".pptx"}


_OCR_CACHE = {}  # Type will be resolved during lazy load


class CleanerError(RuntimeError):
    pass


@dataclass(slots=True)
class ProcessingOptions:
    strip_metadata: bool = True
    compress_output: bool = True
    redact_visible_text: bool = False
    remove_audio: bool = False
    aggressive: bool = False
    image_quality: int = 80
    image_max_width: int = 2200
    document_image_max_width: int = 1920
    video_crf: int = 30
    max_video_width: int = 1280
    video_ocr_interval: int = 4
    ocr_languages: tuple[str, ...] = ("fr", "en")
    ocr_max_dimension: int = DEFAULT_OCR_MAX_DIMENSION


@dataclass(slots=True)
class ProcessResult:
    input_path: str
    output_path: str
    original_bytes: int
    output_bytes: int
    warnings: list[str] = field(default_factory=list)

    @property
    def reduction_percent(self) -> float:
        if not self.original_bytes:
            return 0.0
        return (1 - (self.output_bytes / self.original_bytes)) * 100


def get_output_dir() -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR


def create_temp_work_dir() -> Path:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    work_dir = TEMP_DIR / f"job_{uuid4().hex}"
    work_dir.mkdir(parents=True, exist_ok=True)
    return work_dir


def report(progress_callback: Callable[[str], None] | None, message: str) -> None:
    if progress_callback is not None:
        progress_callback(message)


def get_ocr_reader(languages: Iterable[str]):
    import easyocr

    try:
        import torch

        torch.set_num_threads(1)
        if hasattr(torch, "set_num_interop_threads"):
            torch.set_num_interop_threads(1)
    except Exception:
        pass

    key = tuple(languages)
    reader = _OCR_CACHE.get(key)
    if reader is None:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        USER_NETWORK_DIR.mkdir(parents=True, exist_ok=True)
        reader = easyocr.Reader(
            list(key),
            gpu=False,
            verbose=False,
            model_storage_directory=str(MODEL_DIR),
            user_network_directory=str(USER_NETWORK_DIR),
        )
        _OCR_CACHE[key] = reader
    return reader


def normalize_bbox(
    bbox: Iterable[Iterable[float]],
    width: int,
    height: int,
    padding: int = 3,
) -> tuple[int, int, int, int]:
    points = list(bbox)
    xs = [int(point[0]) for point in points]
    ys = [int(point[1]) for point in points]
    left = max(min(xs) - padding, 0)
    top = max(min(ys) - padding, 0)
    right = min(max(xs) + padding, width)
    bottom = min(max(ys) + padding, height)
    return left, top, right, bottom


def find_text_boxes_bgr(image_bgr: np.ndarray, options: ProcessingOptions) -> list[tuple[int, int, int, int]]:
    reader = get_ocr_reader(options.ocr_languages)
    height, width = image_bgr.shape[:2]
    ocr_image = image_bgr
    scale = min(1.0, options.ocr_max_dimension / max(width, height))
    if scale < 1.0:
        resized_width = max(1, int(width * scale))
        resized_height = max(1, int(height * scale))
        ocr_image = cv2.resize(image_bgr, (resized_width, resized_height), interpolation=cv2.INTER_AREA)

    rgb = cv2.cvtColor(ocr_image, cv2.COLOR_BGR2RGB)
    try:
        results = reader.readtext(rgb)
    except MemoryError as exc:
        raise CleanerError("Memoire insuffisante pour le caviardage OCR. Reduisez le fichier ou desactivez le masquage du texte.") from exc
    except RuntimeError as exc:
        lowered = str(exc).lower()
        if "memory" in lowered or "allocator" in lowered:
            raise CleanerError("Memoire insuffisante pour le caviardage OCR. Reduisez le fichier ou desactivez le masquage du texte.") from exc
        raise CleanerError("Le moteur OCR n'a pas pu analyser ce fichier.") from exc

    target_height, target_width = ocr_image.shape[:2]
    boxes = [normalize_bbox(bbox, target_width, target_height) for bbox, _text, _score in results]
    if scale == 1.0:
        return boxes

    inverse_scale = 1.0 / scale
    return [
        (
            max(0, int(left * inverse_scale)),
            max(0, int(top * inverse_scale)),
            min(width, int(right * inverse_scale)),
            min(height, int(bottom * inverse_scale)),
        )
        for left, top, right, bottom in boxes
    ]


def fill_boxes(image_bgr: np.ndarray, boxes: Iterable[tuple[int, int, int, int]]) -> None:
    for left, top, right, bottom in boxes:
        cv2.rectangle(image_bgr, (left, top), (right, bottom), (0, 0, 0), thickness=-1)


def get_ffmpeg_executable() -> str | None:
    if imageio_ffmpeg is not None:
        try:
            return imageio_ffmpeg.get_ffmpeg_exe()
        except Exception:
            pass
    return shutil.which("ffmpeg")


def round_even(value: int) -> int:
    return max(2, value - (value % 2))


def resize_image_if_needed(image: Image.Image, max_width: int) -> Image.Image:
    if image.width <= max_width:
        return image
    ratio = max_width / image.width
    target_height = int(image.height * ratio)
    return image.resize((max_width, target_height), Image.Resampling.LANCZOS)


def save_image_without_metadata(image: Image.Image, output_path: Path, options: ProcessingOptions) -> None:
    suffix = output_path.suffix.lower()
    save_kwargs: dict[str, object] = {}
    if suffix in {".jpg", ".jpeg", ".webp"}:
        save_kwargs["quality"] = options.image_quality if options.compress_output else 95
        save_kwargs["optimize"] = True
    elif suffix == ".png":
        save_kwargs["optimize"] = True
        save_kwargs["compress_level"] = 9 if options.compress_output else 3
    image.save(output_path, **save_kwargs)


def clean_image(
    input_path: str,
    output_path: str,
    options: ProcessingOptions,
    progress_callback: Callable[[str], None] | None = None,
) -> list[str]:
    warnings: list[str] = []
    report(progress_callback, "Ouverture de l'image")
    with Image.open(input_path) as source_image:
        normalized = ImageOps.exif_transpose(source_image).convert("RGB")
        normalized = resize_image_if_needed(normalized, options.image_max_width if options.compress_output else normalized.width)
        image_bgr = cv2.cvtColor(np.array(normalized), cv2.COLOR_RGB2BGR)

    if options.redact_visible_text:
        report(progress_callback, "Detection du texte visible")
        boxes = find_text_boxes_bgr(image_bgr, options)
        if boxes:
            fill_boxes(image_bgr, boxes)
        else:
            warnings.append("Aucun texte visible detecte sur l'image.")

    result_image = Image.fromarray(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))
    report(progress_callback, "Sauvegarde de l'image nettoyee")
    save_image_without_metadata(result_image, Path(output_path), options)
    return warnings


def collect_pdf_native_rects(page: fitz.Page) -> list[fitz.Rect]:
    rects: list[fitz.Rect] = []
    data = page.get_text("dict")
    for block in data.get("blocks", []):
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                bbox = span.get("bbox")
                if bbox:
                    rects.append(fitz.Rect(bbox))
    return rects


def collect_pdf_ocr_rects(page: fitz.Page, options: ProcessingOptions) -> list[fitz.Rect]:
    matrix = fitz.Matrix(DEFAULT_PDF_OCR_SCALE, DEFAULT_PDF_OCR_SCALE)
    pixmap = page.get_pixmap(matrix=matrix, alpha=False)
    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
    if pixmap.n == 4:
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    elif pixmap.n == 3:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    boxes = find_text_boxes_bgr(image, options)
    x_scale = page.rect.width / pixmap.width
    y_scale = page.rect.height / pixmap.height
    return [
        fitz.Rect(left * x_scale, top * y_scale, right * x_scale, bottom * y_scale)
        for left, top, right, bottom in boxes
    ]


def clean_pdf(
    input_path: str,
    output_path: str,
    options: ProcessingOptions,
    progress_callback: Callable[[str], None] | None = None,
) -> list[str]:
    warnings: list[str] = []
    report(progress_callback, "Ouverture du PDF")
    document = fitz.open(input_path)

    if options.strip_metadata:
        try:
            document.set_metadata({})
        except Exception:
            warnings.append("Certaines metadonnees PDF n'ont pas pu etre effacees.")

    if options.redact_visible_text:
        for page_number, page in enumerate(document, start=1):
            report(progress_callback, f"Analyse OCR page {page_number}")
            rects = collect_pdf_native_rects(page)
            rects.extend(collect_pdf_ocr_rects(page, options))
            if not rects:
                continue
            for rect in rects:
                page.add_redact_annot(rect, fill=(0, 0, 0))
            page.apply_redactions()

    report(progress_callback, "Sauvegarde du PDF")
    document.save(output_path, garbage=4, clean=True, deflate=True)
    document.close()
    return warnings


def strip_pptx_metadata(presentation: Presentation) -> None:
    core = presentation.core_properties
    for attribute in (
        "author",
        "category",
        "comments",
        "content_status",
        "identifier",
        "keywords",
        "language",
        "last_modified_by",
        "subject",
        "title",
        "version",
    ):
        try:
            setattr(core, attribute, "")
        except Exception:
            continue


def recompress_embedded_image(image_path: Path, options: ProcessingOptions) -> bool:
    suffix = image_path.suffix.lower()
    if suffix not in PPTX_MEDIA_EXTENSIONS:
        return False

    original_size = image_path.stat().st_size
    try:
        with Image.open(image_path) as source_image:
            # Preserve alpha channel for PNG/WebP if present
            if source_image.mode in ("RGBA", "LA") or (source_image.mode == "P" and "transparency" in source_image.info):
                # Keep as PNG if it has transparency to avoid black backgrounds
                target_mode = "RGBA"
                fmt = "PNG"
            else:
                target_mode = "RGB"
                fmt = "JPEG" if suffix in {".jpg", ".jpeg"} else "PNG"

            normalized = ImageOps.exif_transpose(source_image).convert(target_mode)
            max_width = options.document_image_max_width if options.compress_output else normalized.width
            normalized = resize_image_if_needed(normalized, max_width)

            temp_path = image_path.with_suffix(f"{image_path.suffix}.tmp")
            
            save_kwargs: dict[str, object] = {"optimize": True}
            if fmt == "JPEG":
                save_kwargs["quality"] = options.image_quality if options.compress_output else 95
            elif fmt == "PNG":
                save_kwargs["compress_level"] = 9 if options.compress_output else 3
            
            normalized.save(temp_path, format=fmt, **save_kwargs)
            
        if temp_path.stat().st_size < original_size:
            temp_path.replace(image_path)
            return True
        else:
            temp_path.unlink()
            return False
    except Exception:
        return False


def rebuild_zip_from_folder(source_dir: Path, output_path: Path) -> None:
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in sorted(source_dir.rglob("*")):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(source_dir).as_posix())


def clean_pptx(
    input_path: str,
    output_path: str,
    options: ProcessingOptions,
    progress_callback: Callable[[str], None] | None = None,
) -> list[str]:
    warnings: list[str] = []
    if options.redact_visible_text:
        warnings.append("Le mode web ne supprime pas le texte des slides PPTX pour eviter de casser la presentation.")

    work_dir = create_temp_work_dir()
    try:
        staged_pptx = work_dir / "stage.pptx"
        report(progress_callback, "Ouverture du PowerPoint")
        presentation = Presentation(input_path)
        if options.strip_metadata:
            strip_pptx_metadata(presentation)
        presentation.save(staged_pptx)

        if not options.compress_output:
            shutil.copyfile(staged_pptx, output_path)
            return warnings

        extracted_dir = work_dir / "pptx"
        extracted_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(staged_pptx, "r") as archive:
            archive.extractall(extracted_dir)

        media_dir = extracted_dir / "ppt" / "media"
        optimized_count = 0
        if media_dir.exists():
            for media_file in media_dir.iterdir():
                if media_file.is_file() and recompress_embedded_image(media_file, options):
                    optimized_count += 1

        if optimized_count == 0:
            warnings.append("Aucun media PPTX n'a pu etre allege de facon visible.")

        report(progress_callback, "Reconstruction du PowerPoint")
        rebuild_zip_from_folder(extracted_dir, Path(output_path))
        
        # Check if re-zipped file is actually smaller than the staged one
        if output_path.exists() and output_path.stat().st_size > staged_pptx.stat().st_size:
            shutil.copyfile(staged_pptx, output_path)
            
        return warnings
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def clean_text_document(
    input_path: str,
    output_path: str,
    _options: ProcessingOptions,
    progress_callback: Callable[[str], None] | None = None,
) -> list[str]:
    report(progress_callback, "Copie du document texte")
    shutil.copyfile(input_path, output_path)
    return ["Document texte conserve tel quel: pas de metadonnees lourdes a nettoyer."]


def open_video_writer(base_path: Path, fps: float, width: int, height: int) -> tuple[cv2.VideoWriter, Path]:
    candidates = [
        (base_path.with_suffix(".avi"), cv2.VideoWriter_fourcc(*"XVID")),
        (base_path.with_suffix(".mp4"), cv2.VideoWriter_fourcc(*"mp4v")),
        (base_path.with_suffix(".avi"), cv2.VideoWriter_fourcc(*"MJPG")),
    ]
    for candidate_path, fourcc in candidates:
        writer = cv2.VideoWriter(str(candidate_path), fourcc, fps, (width, height))
        if writer.isOpened():
            return writer, candidate_path
        writer.release()
    raise CleanerError("Impossible de creer le fichier video temporaire.")


def build_video_ffmpeg_command(
    ffmpeg_exe: str,
    processed_video_path: str,
    original_input_path: str,
    output_path: str,
    options: ProcessingOptions,
) -> list[str]:
    command = [ffmpeg_exe, "-y", "-i", processed_video_path]
    if not options.remove_audio:
        command.extend(["-i", original_input_path, "-map", "0:v:0", "-map", "1:a?"])
    command.extend([
        "-map_metadata",
        "-1",
        "-movflags",
        "+faststart",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        str(options.video_crf),
    ])
    if options.remove_audio:
        command.append("-an")
    else:
        command.extend(["-c:a", "aac", "-b:a", "128k"])
    command.append(output_path)
    return command


def clean_video(
    input_path: str,
    output_path: str,
    options: ProcessingOptions,
    progress_callback: Callable[[str], None] | None = None,
) -> list[str]:
    warnings: list[str] = []
    capture = cv2.VideoCapture(input_path)
    if not capture.isOpened():
        raise CleanerError("Impossible d'ouvrir la video.")

    fps = capture.get(cv2.CAP_PROP_FPS) or 24.0
    original_width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    original_height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 360
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

    scale = 1.0
    if options.compress_output and original_width > options.max_video_width:
        scale = options.max_video_width / original_width
    width = round_even(int(original_width * scale))
    height = round_even(int(original_height * scale))

    work_dir = create_temp_work_dir()
    writer: cv2.VideoWriter | None = None
    try:
        writer, processed_video_file = open_video_writer(work_dir / "video", fps, width, height)
        cached_boxes: list[tuple[int, int, int, int]] = []
        frame_index = 0

        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if scale != 1.0:
                frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)
            if options.redact_visible_text:
                if frame_index % max(1, options.video_ocr_interval) == 0 or not cached_boxes:
                    cached_boxes = find_text_boxes_bgr(frame, options)
                fill_boxes(frame, cached_boxes)
            writer.write(frame)
            frame_index += 1
            if total_frames and frame_index % 20 == 0:
                report(progress_callback, f"Video {frame_index}/{total_frames}")

        writer.release()
        writer = None
        capture.release()

        ffmpeg_exe = get_ffmpeg_executable()
        if ffmpeg_exe is None:
            warnings.append("FFmpeg introuvable: la video a ete reecrite sans nettoyage audio avance.")
            shutil.copyfile(processed_video_file, output_path)
            return warnings

        report(progress_callback, "Compression et nettoyage final de la video")
        command = build_video_ffmpeg_command(ffmpeg_exe, str(processed_video_file), input_path, output_path, options)
        completed = subprocess.run(command, capture_output=True, text=True)
        if completed.returncode != 0:
            raise CleanerError(f"Echec FFmpeg: {completed.stderr.strip() or 'erreur inconnue'}")
        return warnings
    finally:
        if writer is not None:
            writer.release()
        capture.release()
        shutil.rmtree(work_dir, ignore_errors=True)


def build_output_path(file_path: str, output_dir: str | Path | None = None, prefix: str = "CLEANED") -> Path:
    source = Path(file_path)
    suffix = ".mp4" if source.suffix.lower() in VIDEO_EXTENSIONS else source.suffix.lower()
    safe_prefix = prefix.strip().upper() or "CLEANED"
    target_dir = Path(output_dir) if output_dir is not None else get_output_dir()
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir / f"{safe_prefix}_{source.stem}{suffix}"


def clean_file(
    file_path: str,
    options: ProcessingOptions | None = None,
    progress_callback: Callable[[str], None] | None = None,
    output_dir: str | Path | None = None,
    prefix: str = "CLEANED",
) -> ProcessResult:
    options = options or ProcessingOptions()
    source = Path(file_path)
    if not source.exists():
        raise CleanerError("Fichier introuvable.")

    suffix = source.suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise CleanerError("Format non supporte.")

    output_path = build_output_path(file_path, output_dir=output_dir, prefix=prefix)
    warnings: list[str] = []
    report(progress_callback, f"Traitement de {source.name}")

    if suffix in IMAGE_EXTENSIONS:
        warnings.extend(clean_image(file_path, str(output_path), options, progress_callback))
    elif suffix == ".pdf":
        warnings.extend(clean_pdf(file_path, str(output_path), options, progress_callback))
    elif suffix == ".pptx":
        warnings.extend(clean_pptx(file_path, str(output_path), options, progress_callback))
    elif suffix in VIDEO_EXTENSIONS:
        warnings.extend(clean_video(file_path, str(output_path), options, progress_callback))
    elif suffix in TEXT_EXTENSIONS:
        warnings.extend(clean_text_document(file_path, str(output_path), options, progress_callback))

    if not output_path.exists():
        raise CleanerError("Aucun fichier de sortie n'a ete genere.")

    return ProcessResult(
        input_path=str(source),
        output_path=str(output_path),
        original_bytes=source.stat().st_size,
        output_bytes=output_path.stat().st_size,
        warnings=list(dict.fromkeys(warnings)),
    )
