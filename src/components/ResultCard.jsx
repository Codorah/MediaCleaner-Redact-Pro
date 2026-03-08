import { motion } from 'framer-motion';
import { Download, RefreshCcw, Share2, Info } from 'lucide-react';

function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }
    return `${size.toFixed(1)} ${units[index]}`;
}

export default function ResultCard({ result, onDownload, onReset }) {
    const percentStr = result?.reductionPercent || "0.0";
    const savings = formatBytes(result?.originalBytes - result?.outputBytes);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            <div className="glass-panel p-8 rounded-3xl mb-8 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/20 blur-[100px] rounded-full pointer-events-none" />

                <h2 className="text-3xl font-display font-bold text-white mb-8">Nettoyage terminé</h2>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                        <span className="text-gray-400 text-sm mb-2">Taille d'origine</span>
                        <strong className="text-2xl font-display text-white">{formatBytes(result?.originalBytes)}</strong>
                    </div>
                    <div className="bg-primary/10 p-6 rounded-2xl border border-primary/30 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 pattern-dots pattern-white pattern-opacity-10 pointer-events-none" />
                        <span className="text-gray-400 text-sm mb-2 relative z-10">Taille optimisée</span>
                        <strong className="text-3xl font-display text-accent relative z-10">{formatBytes(result?.outputBytes)}</strong>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 mb-8">
                    <Info className="text-primary w-5 h-5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">
                        Tu as économisé <strong className="text-white">{savings}</strong> ({percentStr}% de réduction). Les métadonnées invisibles ont été purgées en toute sécurité.
                    </p>
                </div>

                {result?.warnings && (
                    <p className="text-red-400 text-sm bg-red-400/10 p-4 rounded-xl mb-8 border border-red-400/20">
                        Notes: {result.warnings}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onDownload}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-primary/30 shadow-xl"
                    >
                        <Download className="w-5 h-5" />
                        Télécharger le fichier
                    </button>
                    <button
                        onClick={onReset}
                        className="sm:w-auto bg-white/5 hover:bg-white/10 text-white py-4 px-6 rounded-2xl font-medium border border-white/10 flex items-center justify-center gap-2 transition-colors"
                    >
                        <RefreshCcw className="w-5 h-5" />
                        Nouveau
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
