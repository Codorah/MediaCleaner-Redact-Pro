from __future__ import annotations

import os
import threading
from pathlib import Path
from tkinter import filedialog, messagebox

import customtkinter as ctk

from cleaner import OUTPUT_DIR, CleanerError, ProcessingOptions, clean_file


ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

FILETYPES = [
    (
        "Formats supportes",
        "*.jpg *.jpeg *.png *.bmp *.webp *.tif *.tiff *.pdf *.pptx *.mp4 *.mov *.avi *.mkv *.webm *.txt *.csv *.md *.json *.xml *.html *.rtf",
    )
]


class MediaCleanerRedactApp(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        self.title("MediaCleaner Redact Pro")
        self.geometry("980x760")
        self.minsize(920, 700)

        self.selected_files: list[str] = []
        self.worker_thread: threading.Thread | None = None

        self.aggressive_var = ctk.BooleanVar(value=True)
        self.strip_metadata_var = ctk.BooleanVar(value=True)
        self.compress_var = ctk.BooleanVar(value=True)
        self.remove_audio_var = ctk.BooleanVar(value=True)

        self.build_ui()

    def build_ui(self) -> None:
        container = ctk.CTkFrame(self, corner_radius=18)
        container.pack(fill="both", expand=True, padx=18, pady=18)

        header = ctk.CTkFrame(container, fg_color="transparent")
        header.pack(fill="x", padx=22, pady=(22, 14))

        ctk.CTkLabel(
            header,
            text="MediaCleaner Redact Pro",
            font=ctk.CTkFont(size=30, weight="bold"),
        ).pack(anchor="w")
        ctk.CTkLabel(
            header,
            text=(
                "Redaction visible du texte sur images, PDF, PPTX, videos et documents texte. "
                "Nettoyage des metadonnees et compression de sortie quand possible."
            ),
            wraplength=860,
            justify="left",
            text_color="#a9b4c2",
            font=ctk.CTkFont(size=14),
        ).pack(anchor="w", pady=(8, 0))

        controls = ctk.CTkFrame(container, corner_radius=16)
        controls.pack(fill="x", padx=22, pady=(0, 14))

        top_actions = ctk.CTkFrame(controls, fg_color="transparent")
        top_actions.pack(fill="x", padx=18, pady=(18, 10))

        ctk.CTkButton(top_actions, text="Choisir des fichiers", command=self.select_files, width=220, height=42).pack(side="left")
        ctk.CTkButton(top_actions, text="Vider la selection", command=self.clear_selection, width=180, height=42).pack(side="left", padx=(12, 0))
        ctk.CTkButton(top_actions, text="Ouvrir le dossier output", command=self.open_output_folder, width=220, height=42).pack(side="right")

        options_frame = ctk.CTkFrame(controls, fg_color="transparent")
        options_frame.pack(fill="x", padx=18, pady=(0, 16))

        ctk.CTkSwitch(
            options_frame,
            text="Mode agressif",
            variable=self.aggressive_var,
            onvalue=True,
            offvalue=False,
        ).grid(row=0, column=0, padx=(0, 18), pady=8, sticky="w")
        ctk.CTkSwitch(
            options_frame,
            text="Supprimer les metadonnees",
            variable=self.strip_metadata_var,
            onvalue=True,
            offvalue=False,
        ).grid(row=0, column=1, padx=(0, 18), pady=8, sticky="w")
        ctk.CTkSwitch(
            options_frame,
            text="Compresser la sortie",
            variable=self.compress_var,
            onvalue=True,
            offvalue=False,
        ).grid(row=1, column=0, padx=(0, 18), pady=8, sticky="w")
        ctk.CTkSwitch(
            options_frame,
            text="Supprimer l'audio des videos",
            variable=self.remove_audio_var,
            onvalue=True,
            offvalue=False,
        ).grid(row=1, column=1, padx=(0, 18), pady=8, sticky="w")

        selection_frame = ctk.CTkFrame(container, corner_radius=16)
        selection_frame.pack(fill="both", expand=False, padx=22, pady=(0, 14))

        ctk.CTkLabel(
            selection_frame,
            text="Fichiers selectionnes",
            font=ctk.CTkFont(size=18, weight="bold"),
        ).pack(anchor="w", padx=18, pady=(16, 10))

        self.file_summary = ctk.CTkLabel(
            selection_frame,
            text="Aucun fichier selectionne",
            justify="left",
            text_color="#a9b4c2",
            wraplength=860,
        )
        self.file_summary.pack(anchor="w", padx=18, pady=(0, 10))

        self.process_button = ctk.CTkButton(
            selection_frame,
            text="Lancer la redaction",
            command=self.start_processing,
            width=220,
            height=44,
            state="disabled",
            fg_color="#c62828",
            hover_color="#a61f1f",
        )
        self.process_button.pack(anchor="w", padx=18, pady=(0, 16))

        self.progress = ctk.CTkProgressBar(container, mode="indeterminate")
        self.progress.pack(fill="x", padx=22, pady=(0, 14))
        self.progress.set(0)

        log_frame = ctk.CTkFrame(container, corner_radius=16)
        log_frame.pack(fill="both", expand=True, padx=22, pady=(0, 22))

        ctk.CTkLabel(
            log_frame,
            text="Journal d'execution",
            font=ctk.CTkFont(size=18, weight="bold"),
        ).pack(anchor="w", padx=18, pady=(16, 10))

        self.log_box = ctk.CTkTextbox(log_frame, corner_radius=12)
        self.log_box.pack(fill="both", expand=True, padx=18, pady=(0, 18))
        self.log_box.insert("end", "Pret.\n")
        self.log_box.configure(state="disabled")

    def log(self, message: str) -> None:
        self.log_box.configure(state="normal")
        self.log_box.insert("end", f"{message}\n")
        self.log_box.see("end")
        self.log_box.configure(state="disabled")

    def thread_log(self, message: str) -> None:
        self.after(0, lambda: self.log(message))

    def select_files(self) -> None:
        files = list(filedialog.askopenfilenames(filetypes=FILETYPES))
        if not files:
            return
        self.selected_files = files
        self.update_file_summary()
        self.process_button.configure(state="normal")
        self.log(f"{len(files)} fichier(s) selectionne(s).")

    def clear_selection(self) -> None:
        self.selected_files = []
        self.update_file_summary()
        self.process_button.configure(state="disabled")
        self.log("Selection videe.")

    def update_file_summary(self) -> None:
        if not self.selected_files:
            self.file_summary.configure(text="Aucun fichier selectionne")
            return

        preview = [f"• {Path(path).name}" for path in self.selected_files[:8]]
        suffix = "" if len(self.selected_files) <= 8 else f"\n... et {len(self.selected_files) - 8} autre(s)"
        self.file_summary.configure(text="\n".join(preview) + suffix)

    def build_options(self) -> ProcessingOptions:
        return ProcessingOptions(
            aggressive=bool(self.aggressive_var.get()),
            strip_metadata=bool(self.strip_metadata_var.get()),
            compress_output=bool(self.compress_var.get()),
            remove_audio=bool(self.remove_audio_var.get()),
        )

    def set_busy(self, busy: bool) -> None:
        self.process_button.configure(state="disabled" if busy or not self.selected_files else "normal")
        self.progress.stop()
        if busy:
            self.progress.start()
        else:
            self.progress.set(0)

    def start_processing(self) -> None:
        if not self.selected_files:
            messagebox.showwarning("Aucun fichier", "Selectionne au moins un fichier.")
            return

        if self.worker_thread and self.worker_thread.is_alive():
            messagebox.showinfo("Traitement en cours", "Un traitement est deja en cours.")
            return

        options = self.build_options()
        files = list(self.selected_files)
        self.set_busy(True)
        self.log("Demarrage du traitement.")
        self.worker_thread = threading.Thread(target=self.process_files_worker, args=(files, options), daemon=True)
        self.worker_thread.start()

    def process_files_worker(self, files: list[str], options: ProcessingOptions) -> None:
        results = []
        failures = []

        for index, file_path in enumerate(files, start=1):
            filename = Path(file_path).name
            self.thread_log(f"[{index}/{len(files)}] {filename}")
            try:
                result = clean_file(file_path, options, progress_callback=self.thread_log)
                results.append(result)
                self.thread_log(
                    f"OK: {Path(result.output_path).name} | {self.format_bytes(result.original_bytes)} -> "
                    f"{self.format_bytes(result.output_bytes)} ({result.reduction_percent:.1f}%)"
                )
                for warning in result.warnings:
                    self.thread_log(f"Attention: {warning}")
            except CleanerError as exc:
                failures.append((filename, str(exc)))
                self.thread_log(f"Echec: {filename} | {exc}")
            except Exception as exc:  # pragma: no cover - UI protection
                failures.append((filename, str(exc)))
                self.thread_log(f"Echec inattendu: {filename} | {exc}")

        self.after(0, lambda: self.finish_processing(results, failures))

    def finish_processing(self, results, failures) -> None:
        self.set_busy(False)
        summary = [f"Succes: {len(results)}", f"Echecs: {len(failures)}", f"Dossier: {OUTPUT_DIR}"]
        if failures:
            summary.append("\n".join(f"{name}: {message}" for name, message in failures[:5]))

        if results and not failures:
            messagebox.showinfo("Termine", "\n".join(summary))
        elif results:
            messagebox.showwarning("Termine avec alertes", "\n".join(summary))
        else:
            messagebox.showerror("Aucun fichier traite", "\n".join(summary))

        self.log("Traitement termine.")

    def open_output_folder(self) -> None:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        os.startfile(str(OUTPUT_DIR))

    @staticmethod
    def format_bytes(value: int) -> str:
        size = float(value)
        units = ["B", "KB", "MB", "GB"]
        for unit in units:
            if size < 1024 or unit == units[-1]:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} GB"


if __name__ == "__main__":
    app = MediaCleanerRedactApp()
    app.mainloop()
