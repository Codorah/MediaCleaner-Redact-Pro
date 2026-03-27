import { motion } from "framer-motion";
import { Download, RefreshCcw, Info } from "lucide-react";

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
  const savings = formatBytes((result?.originalBytes || 0) - (result?.outputBytes || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl mx-auto">
      <div className="glass-panel glass-panel-solid p-8 md:p-10 rounded-[2rem] relative overflow-hidden">
        <div className="absolute -top-24 -right-16 w-56 h-56 bg-accent/14 blur-[90px] rounded-full pointer-events-none" />

        <p className="cp-label mb-3">Résultat</p>
        <h2 className="cp-title text-4xl font-display font-bold mb-8">Nettoyage terminé</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="cp-stat-card flex flex-col gap-2">
            <span className="cp-muted text-sm">Taille d'origine</span>
            <strong className="cp-title text-3xl font-display">{formatBytes(result?.originalBytes)}</strong>
          </div>
          <div className="cp-stat-card border-primary/20 bg-primary/10 flex flex-col gap-2">
            <span className="cp-muted text-sm">Taille optimisée</span>
            <strong className="text-3xl font-display text-accent">{formatBytes(result?.outputBytes)}</strong>
          </div>
          <div className="cp-stat-card flex flex-col gap-2">
            <span className="cp-muted text-sm">Réduction</span>
            <strong className="cp-title text-3xl font-display">{percentStr}%</strong>
          </div>
        </div>

        <div className="cp-info-strip rounded-[1.25rem] p-4 flex items-start gap-3 mb-8">
          <Info className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="cp-soft text-sm leading-relaxed">
            Tu as économisé <strong className="cp-title">{savings}</strong>. Les métadonnées invisibles ont été traitées en local sur cette session avant téléchargement.
          </p>
        </div>

        {result?.warnings && <p className="cp-warning rounded-[1.25rem] p-4 text-sm mb-8">Notes: {result.warnings}</p>}

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={onDownload} className="cp-action-primary flex-1">
            <Download className="w-5 h-5" />
            Télécharger le fichier
          </button>
          <button onClick={onReset} className="cp-action-secondary sm:w-auto">
            <RefreshCcw className="w-5 h-5" />
            Nouveau
          </button>
        </div>
      </div>
    </motion.div>
  );
}
