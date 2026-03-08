from __future__ import annotations

import shutil
import sqlite3
from pathlib import Path
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from cleaner import BASE_DIR, CleanerError, ProcessingOptions, TEMP_DIR, clean_file


DB_DIR = BASE_DIR / "data"
DB_PATH = DB_DIR / "mediacleaner.db"
FRONTEND_DIST = BASE_DIR / "frontend-dist"
PUBLIC_DOWNLOADS_DIR = BASE_DIR / "public" / "downloads"

app = FastAPI(
    title="MediaCleaner Redact Pro",
    description="API pour nettoyer les metadonnees, alleger les fichiers et masquer le texte visible a la demande.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Autorise toutes les origines pour le déploiement
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


def get_desktop_exe() -> Path | None:
    PUBLIC_DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    zip_files = sorted(PUBLIC_DOWNLOADS_DIR.glob("*.zip"))
    if zip_files:
        return zip_files[0]
    exe_files = sorted(PUBLIC_DOWNLOADS_DIR.glob("*.exe"))
    return exe_files[0] if exe_files else None


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/api/jobs")
def recent_jobs(limit: int = 8) -> JSONResponse:
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
    file_path = get_desktop_exe()
    if file_path is not None:
        return JSONResponse(
            {
                "available": True,
                "filename": file_path.name,
                "url": "/api/downloads/file",
                "size_bytes": file_path.stat().st_size,
                "note": "Telechargement direct actif pour la version desktop."
            }
        )

    return JSONResponse(
        {
            "available": False,
            "filename": "",
            "url": "",
            "size_bytes": 0,
            "note": "Aucun .zip ou .exe n'est encore depose dans public/downloads."
        }
    )


@app.get("/api/downloads/file", response_model=None)
def desktop_download_file():
    file_path = get_desktop_exe()
    if file_path is None:
        raise HTTPException(status_code=404, detail="Aucun .exe disponible pour le telechargement.")
    return FileResponse(
        file_path,
        media_type="application/octet-stream",
        filename=file_path.name,
    )


@app.post("/api/process")
async def process_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    strip_metadata: str = Form("true"),
    compress_output: str = Form("true"),
    redact_visible_text: str = Form("false"),
    remove_audio: str = Form("false"),
) -> FileResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant.")

    request_dir = TEMP_DIR / "web" / uuid4().hex
    request_dir.mkdir(parents=True, exist_ok=True)

    upload_name = Path(file.filename).name
    upload_path = request_dir / upload_name
    job_id: int | None = None

    try:
        with upload_path.open("wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)

        options = ProcessingOptions(
            strip_metadata=bool_from_form(strip_metadata),
            compress_output=bool_from_form(compress_output),
            redact_visible_text=bool_from_form(redact_visible_text),
            remove_audio=bool_from_form(remove_audio),
        )

        job_id = log_job_start(upload_name, options, upload_path.stat().st_size)

        result = clean_file(
            str(upload_path),
            options=options,
            output_dir=request_dir,
            prefix="CLEANED",
        )
        log_job_success(job_id, result.output_bytes, result.reduction_percent)
    except CleanerError as exc:
        log_job_failure(job_id, str(exc))
        cleanup_directory(request_dir)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        log_job_failure(job_id, str(exc))
        cleanup_directory(request_dir)
        raise HTTPException(status_code=500, detail=f"Traitement impossible: {exc}") from exc
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
        target = FRONTEND_DIST / full_path
        if full_path and target.exists() and target.is_file():
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
            {"message": "L'interface React n'a pas été construite sur le serveur. Sur Render, assurez-vous que le champ 'Build Command' est bien './build.sh' (et non pip install...). Le déploiement est peut-être encore en cours !"},
            status_code=503,
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
