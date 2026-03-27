from __future__ import annotations

import os
import re
import shutil
import subprocess
import zipfile
from importlib import import_module
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable
from uuid import uuid4
from xml.etree import ElementTree as ET

os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import cv2
import fitz
import numpy as np
from PIL import Image, ImageOps
from PIL.ExifTags import GPSTAGS, TAGS
from pptx import Presentation


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

IMAGE_METADATA_RULES = {
    "Artist": ("Auteur", "Identité", "sensitive"),
    "Copyright": ("Copyright", "Identité", "sensitive"),
    "DateTime": ("Dernière modification", "Chronologie", "sensitive"),
    "DateTimeDigitized": ("Date de numérisation", "Chronologie", "sensitive"),
    "DateTimeOriginal": ("Date de prise de vue", "Chronologie", "sensitive"),
    "HostComputer": ("Ordinateur hôte", "Environnement", "sensitive"),
    "ImageDescription": ("Description", "Contenu", "sensitive"),
    "Make": ("Marque de l'appareil", "Appareil", "sensitive"),
    "Model": ("Modèle de l'appareil", "Appareil", "sensitive"),
    "Software": ("Logiciel", "Origine", "sensitive"),
    "OwnerName": ("Propriétaire", "Identité", "sensitive"),
    "BodySerialNumber": ("Numéro de série boîtier", "Appareil", "sensitive"),
    "LensModel": ("Modèle d'objectif", "Appareil", "sensitive"),
    "LensSerialNumber": ("Numéro de série objectif", "Appareil", "sensitive"),
    "SerialNumber": ("Numéro de série", "Appareil", "sensitive"),
    "UserComment": ("Commentaire utilisateur", "Contenu", "sensitive"),
    "XPAuthor": ("Auteur (XP)", "Identité", "sensitive"),
    "XPComment": ("Commentaire (XP)", "Contenu", "sensitive"),
    "XPSubject": ("Sujet (XP)", "Contenu", "sensitive"),
    "XPTitle": ("Titre (XP)", "Contenu", "sensitive"),
}
PNG_METADATA_RULES = {
    "Author": ("Auteur", "Identité", "sensitive"),
    "Comment": ("Commentaire", "Contenu", "sensitive"),
    "Description": ("Description", "Contenu", "sensitive"),
    "Software": ("Logiciel", "Origine", "sensitive"),
    "Creation Time": ("Date de création", "Chronologie", "sensitive"),
    "Disclaimer": ("Clause de non-responsabilité", "Légal", "sensitive"),
    "Warning": ("Avertissement", "Légal", "sensitive"),
    "Source": ("Source", "Origine", "sensitive"),
    "dpi": ("DPI", "Technique", "technical"),
}
PDF_METADATA_RULES = {
    "title": ("Titre", "Contenu", "sensitive"),
    "author": ("Auteur", "Identité", "sensitive"),
    "subject": ("Sujet", "Contenu", "sensitive"),
    "keywords": ("Mots-clés", "Contenu", "sensitive"),
    "creator": ("Application source", "Origine", "sensitive"),
    "producer": ("Producteur PDF", "Origine", "sensitive"),
    "creationDate": ("Date de création", "Chronologie", "sensitive"),
    "modDate": ("Date de modification", "Chronologie", "sensitive"),
}
PPTX_CORE_METADATA_RULES = {
    "author": ("Auteur", "Identité", "sensitive"),
    "title": ("Titre", "Contenu", "sensitive"),
    "subject": ("Sujet", "Contenu", "sensitive"),
    "category": ("Catégorie", "Contenu", "sensitive"),
    "keywords": ("Mots-clés", "Contenu", "sensitive"),
    "comments": ("Commentaires", "Contenu", "sensitive"),
    "last_modified_by": ("Dernière modification par", "Identité", "sensitive"),
    "language": ("Langue", "Contexte", "technical"),
    "created": ("Date de création", "Chronologie", "sensitive"),
    "modified": ("Date de modification", "Chronologie", "sensitive"),
}
PPTX_APP_METADATA_RULES = {
    "Application": ("Application", "Origine", "sensitive"),
    "Company": ("Entreprise", "Organisation", "sensitive"),
    "Manager": ("Manager", "Organisation", "sensitive"),
    "HyperlinkBase": ("Base des liens", "Origine", "sensitive"),
    "AppVersion": ("Version de l'application", "Technique", "technical"),
    "PresentationFormat": ("Format de présentation", "Technique", "technical"),
}
VIDEO_METADATA_RULES = {
    "location": ("Localisation GPS", "Géolocalisation", "sensitive"),
    "location-eng": ("Localisation GPS", "Géolocalisation", "sensitive"),
    "com.apple.quicktime.location.ISO6709": ("Localisation GPS", "Géolocalisation", "sensitive"),
    "com.apple.quicktime.make": ("Marque de l'appareil", "Appareil", "sensitive"),
    "com.apple.quicktime.model": ("Modèle de l'appareil", "Appareil", "sensitive"),
    "com.apple.quicktime.software": ("Logiciel", "Origine", "sensitive"),
    "com.apple.quicktime.creationdate": ("Date de création (Apple)", "Chronologie", "sensitive"),
    "creation_time": ("Date de création", "Chronologie", "sensitive"),
    "encoder": ("Encodeur", "Origine", "sensitive"),
    "handler_name": ("Nom du flux", "Origine", "technical"),
    "vendor_id": ("Identifiant fournisseur", "Origine", "technical"),
    "major_brand": ("Format principal", "Technique", "technical"),
    "minor_version": ("Version du conteneur", "Technique", "technical"),
    "compatible_brands": ("Formats compatibles", "Technique", "technical"),
    "make": ("Marque de l'appareil", "Appareil", "sensitive"),
    "model": ("Modèle de l'appareil", "Appareil", "sensitive"),
    "software": ("Logiciel", "Origine", "sensitive"),
    "artist": ("Auteur", "Identité", "sensitive"),
    "author": ("Auteur", "Identité", "sensitive"),
    "comment": ("Commentaire", "Contenu", "sensitive"),
    "copyright": ("Copyright", "Identité", "sensitive"),
    "description": ("Description", "Contenu", "sensitive"),
    "title": ("Titre", "Contenu", "sensitive"),
}


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


def stringify_metadata_value(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        try:
            value = value.decode("utf-8", errors="ignore")
        except Exception:
            return ""
    if isinstance(value, (list, tuple)):
        parts = [stringify_metadata_value(part) for part in value]
        return ", ".join([part for part in parts if part])
    if hasattr(value, "isoformat"):
        try:
            # type: ignore - we know it has isoformat
            return value.isoformat(sep=" ", timespec="seconds") 
        except Exception:
            try:
                # type: ignore
                return value.isoformat()
            except Exception:
                pass
    text = str(value).strip()
    return text if text and text.lower() != "none" else ""


def append_metadata_entry(
    entries: list[dict[str, str]],
    label: str,
    value: object,
    category: str = "Métadonnée",
    risk: str = "sensitive",
    scope: str | None = None,
) -> None:
    rendered = stringify_metadata_value(value)
    if rendered:
        entry = {"label": label, "value": rendered, "category": category, "risk": risk}
        if scope:
            entry["scope"] = scope
        entries.append(entry)


def gps_coordinate_to_decimal(raw_value: object, ref: object) -> float | None:
    if not isinstance(raw_value, (list, tuple)) or len(raw_value) < 3:
        return None
    try:
        degrees = float(raw_value[0])
        minutes = float(raw_value[1])
        seconds = float(raw_value[2])
    except Exception:
        return None
    decimal = degrees + (minutes / 60.0) + (seconds / 3600.0)
    if str(ref).upper() in {"S", "W"}:
        decimal *= -1
    return decimal


def inspect_image_metadata(input_path: str) -> tuple[list[dict[str, str]], list[str]]:
    entries: list[dict[str, str]] = []
    notes: list[str] = []
    with Image.open(input_path) as source_image:
        exif = source_image.getexif()
        if exif:
            for tag_id, raw_value in exif.items():
                tag_name = TAGS.get(tag_id, str(tag_id))
                if tag_name == "GPSInfo" and isinstance(raw_value, dict):
                    gps_info = {GPSTAGS.get(key, str(key)): value for key, value in raw_value.items()}
                    latitude = gps_coordinate_to_decimal(gps_info.get("GPSLatitude"), gps_info.get("GPSLatitudeRef"))
                    longitude = gps_coordinate_to_decimal(gps_info.get("GPSLongitude"), gps_info.get("GPSLongitudeRef"))
                    if latitude is not None and longitude is not None:
                        append_metadata_entry(entries, "Localisation GPS", f"{latitude:.5f}, {longitude:.5f}", "Géolocalisation", "sensitive")
                    append_metadata_entry(entries, "Altitude GPS", gps_info.get("GPSAltitude"), "Géolocalisation", "sensitive")
                    continue

                rule = IMAGE_METADATA_RULES.get(tag_name)
                if rule:
                    label, category, risk = rule
                    append_metadata_entry(entries, label, raw_value, category, risk)

        for info_key, info_value in source_image.info.items():
            rule = PNG_METADATA_RULES.get(info_key)
            if rule:
                label, category, risk = rule
                append_metadata_entry(entries, label, info_value, category, risk)
            elif "xmp" in info_key.lower():
                append_metadata_entry(entries, "Métadonnées XMP", "Présentes dans le fichier", "Origine", "sensitive")

    if not entries:
        notes.append("Aucune donnée de géolocalisation, d'appareil, d'auteur ou de logiciel n'a été trouvée dans cette image.")
    return entries, notes


def inspect_pdf_metadata(input_path: str) -> tuple[list[dict[str, str]], list[str]]:
    entries: list[dict[str, str]] = []
    notes: list[str] = []
    with fitz.open(input_path) as document:
        metadata = document.metadata or {}
        for key, (label, category, risk) in PDF_METADATA_RULES.items():
            append_metadata_entry(entries, label, metadata.get(key), category, risk)
        if document.page_count:
            append_metadata_entry(entries, "Nombre de pages", document.page_count, "Technique", "technical")

        try:
            xml_metadata = document.get_xml_metadata()
        except Exception:
            xml_metadata = ""
        
        if xml_metadata.strip():
            # Deep XMP parsing to find specific tools, history, and users
            if "Adobe" in xml_metadata:
                append_metadata_entry(entries, "Trace logicielle", "Adobe Systems detected", "Origine", "sensitive")
            if "Microsoft" in xml_metadata:
                append_metadata_entry(entries, "Trace logicielle", "Microsoft Office detected", "Origine", "sensitive")
            
            try:
                # Basic regex search for common XMP user tags if ET fails or for broad coverage
                user_match = re.search(r"<dc:creator>\s*<rdf:Seq>\s*<rdf:li>(.+?)</rdf:li>", xml_metadata, re.DOTALL)
                if user_match:
                    append_metadata_entry(entries, "Auteur (XMP DC)", user_match.group(1).strip(), "Identité", "sensitive")
                
                # Search for owner/creator in other XMP namespaces
                owner_match = re.search(r'xmp:Owner\s*=\s*"(.+?)"', xml_metadata)
                if owner_match:
                    append_metadata_entry(entries, "Propriétaire (XMP)", owner_match.group(1).strip(), "Identité", "sensitive")

                tool_match = re.search(r'xmp:CreatorTool\s*>\s*(.+?)\s*<\s*/xmp:CreatorTool', xml_metadata) or \
                             re.search(r'xmp:CreatorTool\s*=\s*"(.+?)"', xml_metadata)
                if tool_match:
                    append_metadata_entry(entries, "Outil de création (XMP)", tool_match.group(1).strip(), "Origine", "sensitive")
                    
                # History entries can reveal internal paths or previous authors
                if "xmpMM:History" in xml_metadata:
                    append_metadata_entry(entries, "Historique XMP", "Contient des traces d'édition", "Origine", "sensitive")
            except Exception:
                pass
                
    if not entries:
        notes.append("Aucune métadonnée PDF explicite n'a été détectée.")
    return entries, notes


def inspect_pptx_metadata(input_path: str) -> tuple[list[dict[str, str]], list[str]]:
    entries: list[dict[str, str]] = []
    notes: list[str] = []
    presentation = Presentation(input_path)
    core = presentation.core_properties
    for attribute, (label, category, risk) in PPTX_CORE_METADATA_RULES.items():
        append_metadata_entry(entries, label, getattr(core, attribute, None), category, risk)

    try:
        with zipfile.ZipFile(input_path, "r") as archive:
            if "docProps/app.xml" in archive.namelist():
                app_xml = archive.read("docProps/app.xml")
                root = ET.fromstring(app_xml)
                namespace = {"ep": "http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"}
                for tag_name, (label, category, risk) in PPTX_APP_METADATA_RULES.items():
                    element = root.find(f"ep:{tag_name}", namespace)
                    if element is not None and element.text:
                        append_metadata_entry(entries, label, element.text, category, risk)
            
            # Check for custom properties which might contain organization/user info
            if "docProps/custom.xml" in archive.namelist():
                custom_xml = archive.read("docProps/custom.xml")
                root_custom = ET.fromstring(custom_xml)
                ns_custom = {"ct": "http://schemas.openxmlformats.org/officeDocument/2006/custom-properties",
                            "vt": "http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"}
                for prop in root_custom.findall("ct:property", ns_custom):
                    name = prop.get("name")
                    value_elem = prop.find("vt:lpwstr", ns_custom) or prop.find("vt:lpstr", ns_custom)
                    if name and value_elem is not None and value_elem.text:
                        append_metadata_entry(entries, f"Propriété personnalisée: {name}", value_elem.text, "Organisation", "sensitive")
    except Exception:
        pass

    if not entries:
        notes.append("Aucune propriété Office sensible n'a été détectée dans cette présentation.")
    return entries, notes


def parse_ffmpeg_metadata(stderr_output: str) -> list[tuple[str, str, str]]:
    entries: list[tuple[str, str, str]] = []
    current_scope: str | None = None
    pending_scope = "Conteneur"

    for line in stderr_output.splitlines():
        stream_match = re.match(r"\s*Stream #.*: (Video|Audio|Subtitle):", line)
        if stream_match:
            stream_type = stream_match.group(1).lower()
            pending_scope = f"Flux {stream_type}"
            current_scope = None
            continue

        if re.match(r"\s{2,}Metadata:\s*$", line):
            current_scope = pending_scope
            continue

        match = re.match(r"\s{4,}([^:]+?)\s*:\s*(.+)$", line)
        if current_scope and match:
            entries.append((current_scope, match.group(1).strip(), match.group(2).strip()))
            continue

        if line.strip() and not line.startswith(" "):
            current_scope = None

    return entries


def inspect_video_metadata(input_path: str) -> tuple[list[dict[str, str]], list[str]]:
    entries: list[dict[str, str]] = []
    notes: list[str] = []
    capture = cv2.VideoCapture(input_path)
    if capture.isOpened():
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        if width and height:
            append_metadata_entry(entries, "Résolution", f"{width} x {height}", "Technique", "technical")
        if fps:
            append_metadata_entry(entries, "Images par seconde", f"{fps:.2f}", "Technique", "technical")
        if frame_count and fps:
            append_metadata_entry(entries, "Durée estimée", f"{frame_count / fps:.1f} s", "Technique", "technical")
    capture.release()

    ffmpeg_exe = get_ffmpeg_executable()
    if ffmpeg_exe is not None:
        try:
            completed = subprocess.run(
                [ffmpeg_exe, "-hide_banner", "-i", input_path],
                capture_output=True,
                text=True,
                timeout=20,
            )
            for scope, raw_key, raw_value in parse_ffmpeg_metadata(completed.stderr):
                # Search for location tags in various formats
                if "location" in raw_key.lower():
                    append_metadata_entry(entries, "Coordonnées GPS raw", raw_value, "Géolocalisation", "sensitive", scope)
                
                rule = VIDEO_METADATA_RULES.get(raw_key)
                if rule:
                    label, category, risk = rule
                    append_metadata_entry(entries, label, raw_value, category, risk, scope)
                elif raw_key.lower() in {"artist", "author", "creator", "owner"}:
                    append_metadata_entry(entries, f"Métadonnée sensitive: {raw_key}", raw_value, "Identité", "sensitive", scope)
        except Exception:
            notes.append("Impossible d'inspecter en profondeur les tags du conteneur vidéo sur cette instance.")

    sensitive_entries = [entry for entry in entries if entry.get("risk") == "sensitive"]
    if not sensitive_entries:
        notes.append("Aucune géolocalisation, identité ou source d'export sensible n'a été trouvée dans cette vidéo. Seules des traces techniques d'encodage ont été relevées.")
    return entries, notes


def inspect_file_metadata(input_path: str) -> dict[str, object]:
    suffix = Path(input_path).suffix.lower()
    entries: list[dict[str, str]]
    notes: list[str]

    if suffix in IMAGE_EXTENSIONS:
        entries, notes = inspect_image_metadata(input_path)
        file_type = "image"
    elif suffix == ".pdf":
        entries, notes = inspect_pdf_metadata(input_path)
        file_type = "pdf"
    elif suffix == ".pptx":
        entries, notes = inspect_pptx_metadata(input_path)
        file_type = "pptx"
    elif suffix in VIDEO_EXTENSIONS:
        entries, notes = inspect_video_metadata(input_path)
        file_type = "video"
    else:
        entries = []
        notes = ["Ce type de document contient peu de métadonnées riches exploitables dans l'interface actuelle."]
        file_type = "document"

    return {
        "file_type": file_type,
        "detected_count": len(entries),
        "sensitive_count": sum(1 for entry in entries if entry.get("risk") == "sensitive"),
        "technical_count": sum(1 for entry in entries if entry.get("risk") == "technical"),
        "entries": entries,
        "notes": notes,
    }


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
    try:
        easyocr = import_module("easyocr")
    except ImportError as exc:
        raise CleanerError("Le module OCR n'est pas disponible dans cette edition desktop.") from exc

    try:
        torch = import_module("torch")

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
    try:
        imageio_ffmpeg = import_module("imageio_ffmpeg")
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
