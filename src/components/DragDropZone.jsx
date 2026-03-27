import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { UploadCloud, File, X } from "lucide-react";
import clsx from "clsx";

export default function DragDropZone({ onFileSelect, selectedFile }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  if (selectedFile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel glass-panel-solid rounded-[2rem] p-8 md:p-10 flex flex-col items-center justify-center border border-primary/25"
      >
        <div className="cp-icon-shell mb-5">
          <File className="w-7 h-7 text-primary" />
        </div>
        <h3 className="cp-title text-2xl font-display font-bold mb-2 text-center break-all">{selectedFile.name}</h3>
        <p className="cp-muted text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onFileSelect(null);
          }}
          className="cp-action-ghost mt-6"
        >
          <X className="w-4 h-4" />
          Changer de fichier
        </button>
      </motion.div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={clsx(
        "glass-panel glass-panel-solid cursor-pointer rounded-[2rem] p-10 md:p-14 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden border-2 border-dashed",
        isDragActive ? "border-primary bg-primary/10" : "border-[var(--app-border-strong)] hover:border-primary/40"
      )}
    >
      <input {...getInputProps()} />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDragActive ? "radial-gradient(circle at center, rgba(255,59,92,0.12), transparent 60%)" : "transparent",
        }}
      />

      <motion.div animate={{ y: isDragActive ? -8 : 0 }} className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] flex items-center justify-center mb-6">
          <UploadCloud className={clsx("w-10 h-10 transition-colors", isDragActive ? "text-primary" : "cp-muted")} />
        </div>

        <p className="cp-label mb-3">Etape 1</p>
        <h3 className="cp-title text-3xl font-display font-bold mb-3 text-center">
          {isDragActive ? "Depose le fichier ici" : "Glisse ton fichier ici"}
        </h3>
        <p className="cp-muted text-center max-w-xl leading-relaxed">
          Clique ou depose un document pour lancer le nettoyage. Images, PDF, PPTX, videos et fichiers texte sont pris en charge.
        </p>
      </motion.div>
    </div>
  );
}
