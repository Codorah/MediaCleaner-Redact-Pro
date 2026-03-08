import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, File } from 'lucide-react';
import clsx from 'clsx';

export default function DragDropZone({ onFileSelect, selectedFile }) {
    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false
    });

    if (selectedFile) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center border-primary/50"
            >
                <File className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-xl font-display font-bold text-white mb-2 text-center">{selectedFile.name}</h3>
                <p className="text-text-soft text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                    onClick={(e) => { e.stopPropagation(); onFileSelect(null); }}
                    className="mt-6 px-4 py-2 rounded-full border border-white/10 text-sm hover:bg-white/5 transition-colors"
                >
                    Changer de fichier
                </button>
            </motion.div>
        );
    }

    return (
        <div
            {...getRootProps()}
            className={clsx(
                "cursor-pointer rounded-3xl p-12 flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group border-2 border-dashed",
                isDragActive ? "border-primary bg-primary/10" : "border-white/20 hover:border-primary/50 glass-panel"
            )}
        >
            <input {...getInputProps()} />

            <div className="absolute inset-0 pointer-events-none rounded-3xl"
                style={{
                    boxShadow: isDragActive ? "inset 0 0 50px rgba(255, 59, 92, 0.2)" : "none"
                }}
            />

            <motion.div
                animate={{ y: isDragActive ? -10 : 0 }}
                className="relative z-10 flex flex-col items-center"
            >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className={clsx("w-10 h-10 transition-colors", isDragActive ? "text-primary" : "text-gray-400 group-hover:text-primary")} />
                </div>

                <h3 className="text-2xl font-display font-bold text-white mb-3 text-center">
                    {isDragActive ? "Lâche le fichier ici..." : "Glisse ton fichier ici"}
                </h3>
                <p className="text-gray-400 text-center max-w-sm">
                    ou clique pour parcourir tes documents. Supporte images, PDF, PPTX, vidéos et TXT.
                </p>
            </motion.div>
        </div>
    );
}
