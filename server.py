from __future__ import annotations

import asyncio
import ipaddress
import logging
import os
import shlex
import shutil
import sqlite3
import subprocess
import time
from collections import defaultdict, deque
from pathlib import Path
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from cleaner import BASE_DIR, CleanerError, ProcessingOptions, SUPPORTED_EXTENSIONS, TEMP_DIR, clean_file, inspect_file_metadata


APP_NAME = "Cleaner Pro"
DB_DIR = BASE_DIR / "data"
DB_PATH = DB_DIR / "mediacleaner.db"
FRONTEND_DIST = BASE_DIR / "frontend-dist"
FRONTEND_DIST_RESOLVED = FRONTEND_DIST.resolve()
PUBLIC_DOWNLOADS_DIR = BASE_DIR / "public" / "downloads"
SECURITY_LOG_PATH = Path(os.getenv("SECURITY_LOG_PATH", str(DB_DIR / "security.log")))
CHUNK_SIZE = 1024 * 1024
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(100 * 1024 * 1024)))
PUBLIC_HISTORY_ENABLED = os.getenv("ENABLE_PUBLIC_HISTORY", "false").lower() in {"1", "true", "yes", "on"}
DOWNLOAD_URL = os.getenv("PUBLIC_DOWNLOAD_URL", "/api/downloads/file")
DESKTOP_DOWNLOAD_EXTERNAL_URL = os.getenv("DESKTOP_DOWNLOAD_EXTERNAL_URL", "").strip()
DESKTOP_DOWNLOAD_FILENAME = os.getenv("DESKTOP_DOWNLOAD_FILENAME", "").strip()
DESKTOP_DOWNLOAD_NOTE = os.getenv("DESKTOP_DOWNLOAD_NOTE", "").strip()
DESKTOP_DOWNLOAD_MIN_BYTES = max(1024, int(os.getenv("DESKTOP_DOWNLOAD_MIN_BYTES", str(1024 * 1024))))
DEFAULT_ALLOWED_ORIGINS = "http://127.0.0.1:5173,http://localhost:5173"
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS).split(",") if origin.strip()]
DEFAULT_ALLOWED_HOSTS = "127.0.0.1,localhost,testserver,*.onrender.com"
ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", DEFAULT_ALLOWED_HOSTS).split(",") if host.strip()]
MAX_CONCURRENT_JOBS = max(1, int(os.getenv("MAX_CONCURRENT_JOBS", "2")))
PROCESSING_SEMAPHORE = asyncio.Semaphore(MAX_CONCURRENT_JOBS)
RATE_LIMIT_WINDOW_SECONDS = max(10, int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "300")))
RATE_LIMIT_PROCESS_REQUESTS = max(1, int(os.getenv("RATE_LIMIT_PROCESS_REQUESTS", "12")))
RATE_LIMIT_DOWNLOAD_REQUESTS = max(1, int(os.getenv("RATE_LIMIT_DOWNLOAD_REQUESTS", "40")))
RATE_LIMIT_BUCKETS: dict[str, deque[float]] = defaultdict(deque)
SECURITY_LOG_ENABLED = os.getenv("SECURITY_LOG_ENABLED", "true").lower() in {"1", "true", "yes", "on"}
MALWARE_SCANNER_PATH = os.getenv("MALWARE_SCANNER_PATH", "").strip()
MALWARE_SCANNER_ARGS = os.getenv("MALWARE_SCANNER_ARGS", "--no-summary").strip()
MALWARE_SCAN_TIMEOUT_SECONDS = max(5, int(os.getenv("MALWARE_SCAN_TIMEOUT_SECONDS", "60")))
STALE_TEMP_MAX_AGE_SECONDS = max(300, int(os.getenv("STALE_TEMP_MAX_AGE_SECONDS", str(24 * 3600))))
DEFAULT_CSP = (
    "default-src 'self'; "
    "img-src 'self' data: blob:; "
    "style-src 'self' 'unsafe-inline'; "
    "script-src 'self'; "
    "connect-src 'self'; "
    "font-src 'self' data:; "
    "frame-ancestors 'none'; "
    "base-uri 'self'; "
    "form-action 'self'"
)
ALLOWED_CONTENT_TYPES = {
    ".txt": {"text/plain", "application/octet-stream"},
    ".csv": {"text/csv", "text/plain", "application/vnd.ms-excel", "application/octet-stream"},
    ".md": {"text/markdown", "text/plain", "application/octet-stream"},
    ".json": {"application/json", "text/plain", "application/octet-stream"},
    ".xml": {"application/xml", "text/xml", "text/plain", "application/octet-stream"},
    ".html": {"text/html", "text/plain", "application/octet-stream"},
    ".rtf": {"application/rtf", "text/rtf", "application/octet-stream"},
    ".jpg": {"image/jpeg", "application/octet-stream"},
    ".jpeg": {"image/jpeg", "application/octet-stream"},
    ".png": {"image/png", "application/octet-stream"},
    ".bmp": {"image/bmp", "application/octet-stream"},
    ".webp": {"image/webp", "application/octet-stream"},
    ".tif": {"image/tiff", "application/octet-stream"},
    ".tiff": {"image/tiff", "application/octet-stream"},
    ".pdf": {"application/pdf", "application/octet-stream"},
    ".pptx": {"application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/octet-stream"},
    ".mp4": {"video/mp4", "application/octet-stream"},
    ".mov": {"video/quicktime", "application/octet-stream"},
    ".avi": {"video/x-msvideo", "application/octet-stream"},
    ".mkv": {"video/x-matroska", "application/octet-stream"},
    ".webm": {"video/webm", "application/octet-stream"},
}

app = FastAPI(
    title=APP_NAME,
    description="API pour nettoyer les métadonnées, alléger les fichiers et masquer le texte visible à la demande.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS or ["127.0.0.1", "localhost", "*.onrender.com"])

security_logger = logging.getLogger("cleaner_pro.security")
if SECURITY_LOG_ENABLED and not security_logger.handlers:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    handler = logging.FileHandler(SECURITY_LOG_PATH, encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    security_logger.addHandler(handler)
    security_logger.setLevel(logging.INFO)
    security_logger.propagate = False


def db_connection() -> sqlite3.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    with db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                status TEXT NOT NULL,
                original_bytes INTEGER DEFAULT 0,
                output_bytes INTEGER DEFAULT 0,
                reduction_percent REAL DEFAULT 0,
                strip_metadata INTEGER DEFAULT 1,
                compress_output INTEGER DEFAULT 1,
                redact_visible_text INTEGER DEFAULT 0,
                remove_audio INTEGER DEFAULT 0,
                error_message TEXT DEFAULT '',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


init_db()


def log_job_start(filename: str, options: ProcessingOptions, original_bytes: int) -> int:
    with db_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO jobs (
                filename, status, original_bytes, strip_metadata,
                compress_output, redact_visible_text, remove_audio
            ) VALUES (?, 'processing', ?, ?, ?, ?, ?)
            """,
            (
                filename,
                original_bytes,
                int(options.strip_metadata),
                int(options.compress_output),
                int(options.redact_visible_text),
                int(options.remove_audio),
            ),
        )
        return int(cursor.lastrowid)


def log_job_success(job_id: int, output_bytes: int, reduction_percent: float) -> None:
    with db_connection() as connection:
        connection.execute(
            """
            UPDATE jobs
            SET status = 'done', output_bytes = ?, reduction_percent = ?
            WHERE id = ?
            """,
            (output_bytes, reduction_percent, job_id),
        )


def log_job_failure(job_id: int | None, error_message: str) -> None:
    if job_id is None:
        return
    with db_connection() as connection:
        connection.execute(
            """
            UPDATE jobs
            SET status = 'failed', error_message = ?
            WHERE id = ?
            """,
            (error_message[:500], job_id),
        )


def bool_from_form(value: str) -> bool:
    return value.lower() in {"1", "true", "yes", "on"}


def cleanup_directory(path: Path) -> None:
    shutil.rmtree(path, ignore_errors=True)


def security_event(event: str, **fields: object) -> None:
    if not SECURITY_LOG_ENABLED:
        return
    payload = " ".join(f"{key}={fields[key]!r}" for key in sorted(fields))
    security_logger.info("%s %s", event, payload)


def client_ip(request: Request) -> str:
    client_host = request.client.host if request.client and request.client.host else ""
    if client_host:
        try:
            parsed = ipaddress.ip_address(client_host)
            if parsed.is_private or parsed.is_loopback or parsed.is_link_local:
                forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                if forwarded_for:
                    return forwarded_for
        except ValueError:
            if client_host in {"localhost", "testclient"}:
                forwarded_for = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
                if forwarded_for:
                    return forwarded_for
        return client_host
    return "unknown"


def enforce_rate_limit(request: Request, action: str, limit: int) -> None:
    key = f"{action}:{client_ip(request)}"
    now = time.monotonic()
    bucket = RATE_LIMIT_BUCKETS[key]
    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= limit:
        security_event("rate_limit", action=action, ip=client_ip(request), limit=limit)
        raise HTTPException(
            status_code=429,
            detail="Trop de requetes sur une courte periode. Merci de reessayer un peu plus tard.",
        )
    bucket.append(now)


def client_safe_error(exc: Exception) -> str:
    lowered = str(exc).lower()
    if "memory" in lowered or "allocator" in lowered:
        return "Memoire insuffisante pour traiter ce fichier avec les options actuelles."
    return "Traitement impossible pour ce fichier."


def resolve_frontend_file(full_path: str) -> Path | None:
    candidate = (FRONTEND_DIST / full_path).resolve()
    try:
        candidate.relative_to(FRONTEND_DIST_RESOLVED)
    except ValueError:
        return None
    return candidate


def get_desktop_exe() -> Path | None:
    PUBLIC_DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    zip_files = sorted(PUBLIC_DOWNLOADS_DIR.glob("*.zip"))
    exe_files = sorted(PUBLIC_DOWNLOADS_DIR.glob("*.exe"))
    for file_path in [*zip_files, *exe_files]:
        try:
            if file_path.stat().st_size >= DESKTOP_DOWNLOAD_MIN_BYTES:
                return file_path
        except OSError:
            continue
    return None


def cleanup_stale_temp_dirs() -> None:
    temp_root = TEMP_DIR / "web"
    if not temp_root.exists():
        return
    now = time.time()
    for path in temp_root.iterdir():
        try:
            if not path.is_dir():
                continue
            if now - path.stat().st_mtime > STALE_TEMP_MAX_AGE_SECONDS:
                cleanup_directory(path)
        except OSError:
            continue


def scan_uploaded_file(upload_path: Path) -> None:
    if not MALWARE_SCANNER_PATH:
        return

    args = shlex.split(MALWARE_SCANNER_ARGS, posix=False) if MALWARE_SCANNER_ARGS else []
    command = [MALWARE_SCANNER_PATH, *args, str(upload_path)]
    try:
        completed = subprocess.run(command, capture_output=True, text=True, timeout=MALWARE_SCAN_TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired as exc:
        security_event("malware_scan_timeout", file=upload_path.name, timeout=MALWARE_SCAN_TIMEOUT_SECONDS)
        raise HTTPException(status_code=503, detail="Le scanner de securite a expire avant la fin de l'analyse.") from exc
    except FileNotFoundError as exc:
        security_event("malware_scan_unavailable", file=upload_path.name, reason="missing_executable")
        raise HTTPException(status_code=503, detail="Le scanner de securite n'est pas disponible sur cette instance.") from exc
    except OSError as exc:
        security_event("malware_scan_unavailable", file=upload_path.name, reason=str(exc)[:250])
        raise HTTPException(status_code=503, detail="Le scanner de securite n'a pas pu etre lance.") from exc

    if completed.returncode == 0:
        security_event("malware_scan_clean", file=upload_path.name)
        return
    if completed.returncode == 1:
        security_event("malware_scan_blocked", file=upload_path.name, stdout=completed.stdout[:300], stderr=completed.stderr[:300])
        raise HTTPException(status_code=400, detail="Le fichier a ete bloque par le scanner de securite.")

    security_event("malware_scan_error", file=upload_path.name, code=completed.returncode, stderr=completed.stderr[:300])
    raise HTTPException(status_code=503, detail="Le scanner de securite est indisponible pour le moment.")


def desktop_download_payload() -> dict[str, object]:
    if DESKTOP_DOWNLOAD_EXTERNAL_URL:
        return {
            "available": True,
            "filename": DESKTOP_DOWNLOAD_FILENAME or Path(DESKTOP_DOWNLOAD_EXTERNAL_URL).name or "Cleaner-Pro-Desktop",
            "url": DESKTOP_DOWNLOAD_EXTERNAL_URL,
            "size_bytes": 0,
            "note": DESKTOP_DOWNLOAD_NOTE or "Téléchargement desktop disponible.",
            "external": True,
        }

    file_path = get_desktop_exe()
    if file_path is not None:
        return {
            "available": True,
            "filename": file_path.name,
            "url": "/api/downloads/file",
            "size_bytes": file_path.stat().st_size,
            "note": DESKTOP_DOWNLOAD_NOTE or "Téléchargement direct actif pour la version desktop.",
            "external": False,
        }

    return {
        "available": False,
        "filename": "",
        "url": "",
        "size_bytes": 0,
        "note": "Aucun .zip ou .exe n'est encore déposé dans public/downloads et aucune URL externe n'est configurée.",
        "external": False,
    }


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    cleanup_stale_temp_dirs()


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Content-Security-Policy"] = os.getenv("CONTENT_SECURITY_POLICY", DEFAULT_CSP)
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response


@app.get("/api/health")
def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/api/version")
def get_version() -> JSONResponse:
    return JSONResponse(
        {
            "version": "2.0.0",
            "stable": True,
            "download_url": DOWNLOAD_URL,
            "name": APP_NAME,
        }
    )


@app.get("/api/jobs")
def recent_jobs(limit: int = 8) -> JSONResponse:
    if not PUBLIC_HISTORY_ENABLED:
        raise HTTPException(status_code=404, detail="Historique indisponible sur cette instance.")

    with db_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, filename, status, original_bytes, output_bytes, reduction_percent, created_at
            FROM jobs
            ORDER BY id DESC
            LIMIT ?
            """,
            (max(1, min(limit, 30)),),
        ).fetchall()

    return JSONResponse(
        {
            "jobs": [
                {
                    "id": row["id"],
                    "filename": row["filename"],
                    "status": row["status"],
                    "original_bytes": row["original_bytes"],
                    "output_bytes": row["output_bytes"],
                    "reduction_percent": row["reduction_percent"],
                    "created_at": row["created_at"],
                }
                for row in rows
            ]
        }
    )


@app.get("/api/downloads")
def desktop_download() -> JSONResponse:
    return JSONResponse(desktop_download_payload())


@app.get("/api/downloads/file", response_model=None)
def desktop_download_file(request: Request):
    enforce_rate_limit(request, "downloads", RATE_LIMIT_DOWNLOAD_REQUESTS)
    if DESKTOP_DOWNLOAD_EXTERNAL_URL:
        raise HTTPException(status_code=404, detail="Le téléchargement desktop est configuré via une URL externe.")
    file_path = get_desktop_exe()
    if file_path is None:
        raise HTTPException(status_code=404, detail="Aucun fichier desktop disponible pour le téléchargement.")
    security_event("desktop_download", filename=file_path.name, ip=client_ip(request))
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=file_path.name,
    )


@app.post("/api/inspect")
async def inspect_metadata(request: Request, file: UploadFile = File(...)) -> JSONResponse:
    enforce_rate_limit(request, "inspect", RATE_LIMIT_PROCESS_REQUESTS)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant.")

    request_dir = TEMP_DIR / "web" / uuid4().hex
    request_dir.mkdir(parents=True, exist_ok=True)

    upload_name = Path(file.filename).name
    upload_suffix = Path(upload_name).suffix.lower()
    if upload_suffix not in SUPPORTED_EXTENSIONS:
        cleanup_directory(request_dir)
        raise HTTPException(status_code=400, detail="Format non supporté pour l'analyse.")

    allowed_content_types = ALLOWED_CONTENT_TYPES.get(upload_suffix, {"application/octet-stream"})
    if file.content_type and file.content_type not in allowed_content_types:
        cleanup_directory(request_dir)
        raise HTTPException(status_code=400, detail="Type MIME non autorisé pour cette extension.")

    upload_path = request_dir / upload_name
    total_bytes = 0

    try:
        with upload_path.open("wb") as buffer:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Fichier trop volumineux. Limite actuelle: {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
                    )
                buffer.write(chunk)

        scan_uploaded_file(upload_path)
        payload = inspect_file_metadata(str(upload_path))
        payload.update({"filename": upload_name, "size_bytes": total_bytes})
        security_event("inspection_succeeded", filename=upload_name, ip=client_ip(request), detected=payload.get("detected_count", 0))
        return JSONResponse(payload)
    except CleanerError as exc:
        security_event("inspection_failed", filename=upload_name, ip=client_ip(request), reason=str(exc)[:250])
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        security_event("inspection_rejected", filename=upload_name, ip=client_ip(request))
        raise
    except Exception as exc:
        security_event("inspection_error", filename=upload_name, ip=client_ip(request), reason=str(exc)[:250])
        raise HTTPException(status_code=500, detail=client_safe_error(exc)) from exc
    finally:
        await file.close()
        cleanup_directory(request_dir)


@app.post("/api/process")
async def process_file(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    strip_metadata: str = Form("true"),
    compress_output: str = Form("true"),
    redact_visible_text: str = Form("false"),
    remove_audio: str = Form("false"),
) -> FileResponse:
    enforce_rate_limit(request, "process", RATE_LIMIT_PROCESS_REQUESTS)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant.")

    request_dir = TEMP_DIR / "web" / uuid4().hex
    request_dir.mkdir(parents=True, exist_ok=True)

    upload_name = Path(file.filename).name
    upload_suffix = Path(upload_name).suffix.lower()
    if upload_suffix not in SUPPORTED_EXTENSIONS:
        security_event("upload_blocked_extension", filename=upload_name, ip=client_ip(request), extension=upload_suffix)
        cleanup_directory(request_dir)
        raise HTTPException(status_code=400, detail="Format non supporte.")
    allowed_content_types = ALLOWED_CONTENT_TYPES.get(upload_suffix, {"application/octet-stream"})
    if file.content_type and file.content_type not in allowed_content_types:
        security_event("upload_blocked_mime", filename=upload_name, ip=client_ip(request), content_type=file.content_type)
        cleanup_directory(request_dir)
        raise HTTPException(status_code=400, detail="Type MIME non autorise pour cette extension.")

    upload_path = request_dir / upload_name
    job_id: int | None = None
    total_bytes = 0

    try:
        with upload_path.open("wb") as buffer:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    security_event("upload_blocked_size", filename=upload_name, ip=client_ip(request), size=total_bytes)
                    raise HTTPException(
                        status_code=413,
                        detail=f"Fichier trop volumineux. Limite actuelle: {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
                    )
                buffer.write(chunk)

        scan_uploaded_file(upload_path)

        options = ProcessingOptions(
            strip_metadata=bool_from_form(strip_metadata),
            compress_output=bool_from_form(compress_output),
            redact_visible_text=bool_from_form(redact_visible_text),
            remove_audio=bool_from_form(remove_audio),
        )

        job_id = log_job_start(upload_name, options, total_bytes)
        security_event("processing_started", filename=upload_name, ip=client_ip(request), size=total_bytes)

        async with PROCESSING_SEMAPHORE:
            result = clean_file(
                str(upload_path),
                options=options,
                output_dir=request_dir,
                prefix="CLEANED",
            )
        log_job_success(job_id, result.output_bytes, result.reduction_percent)
        security_event("processing_succeeded", filename=upload_name, ip=client_ip(request), output_bytes=result.output_bytes)
    except CleanerError as exc:
        security_event("processing_failed", filename=upload_name, ip=client_ip(request), reason=str(exc)[:250])
        log_job_failure(job_id, str(exc))
        cleanup_directory(request_dir)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        security_event("processing_rejected", filename=upload_name, ip=client_ip(request))
        log_job_failure(job_id, "Requete refusee.")
        cleanup_directory(request_dir)
        raise
    except Exception as exc:
        security_event("processing_error", filename=upload_name, ip=client_ip(request), reason=str(exc)[:250])
        log_job_failure(job_id, str(exc))
        cleanup_directory(request_dir)
        raise HTTPException(status_code=500, detail=client_safe_error(exc)) from exc
    finally:
        await file.close()

    output_path = Path(result.output_path)
    background_tasks.add_task(cleanup_directory, request_dir)
    response = FileResponse(
        output_path,
        media_type="application/octet-stream",
        filename=output_path.name,
        background=background_tasks,
    )
    response.headers["X-Original-Bytes"] = str(result.original_bytes)
    response.headers["X-Output-Bytes"] = str(result.output_bytes)
    response.headers["X-Reduction-Percent"] = f"{result.reduction_percent:.1f}"
    response.headers["X-Warnings"] = " | ".join(result.warnings[:6])
    return response


if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")
    downloads_dir = FRONTEND_DIST / "downloads"
    if downloads_dir.exists():
        app.mount("/downloads", StaticFiles(directory=str(downloads_dir)), name="frontend-downloads")

    @app.get("/", include_in_schema=False, response_model=None)
    @app.get("/{full_path:path}", include_in_schema=False, response_model=None)
    def frontend(full_path: str = ""):
        target = resolve_frontend_file(full_path) if full_path else None
        if target is not None and target.exists() and target.is_file():
            return FileResponse(target)
        index_file = FRONTEND_DIST / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        return JSONResponse({"message": "Frontend non disponible."}, status_code=503)
else:
    if PUBLIC_DOWNLOADS_DIR.exists():
        app.mount("/downloads", StaticFiles(directory=str(PUBLIC_DOWNLOADS_DIR)), name="dev-downloads")

    @app.get("/", include_in_schema=False, response_model=None)
    @app.get("/{full_path:path}", include_in_schema=False, response_model=None)
    def frontend_unavailable(full_path: str = ""):
        return JSONResponse(
            {"message": "L'interface React n'a pas encore ete construite sur ce serveur."},
            status_code=503,
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
