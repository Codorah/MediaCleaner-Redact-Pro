import { motion } from "framer-motion";
import { History as HistoryIcon, FileCheck, ShieldCheck, Trash2 } from "lucide-react";

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

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function HistoryTab({ historyEnabled, historyItems, onClearHistory }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-12 w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="cp-icon-shell">
            <HistoryIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="cp-label mb-2">Historique local</p>
            <h2 className="cp-title text-4xl font-display font-bold">Suivi des nettoyages</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="cp-pill text-sm">{historyEnabled ? "Enregistrement actif" : "Enregistrement desactive"}</div>
          {historyItems.length > 0 && (
            <button onClick={onClearHistory} className="cp-action-ghost">
              <Trash2 className="w-4 h-4" />
              Vider
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="space-y-4">
          {historyItems.length === 0 ? (
            <div className="glass-panel glass-panel-solid cp-empty-card rounded-[2rem] p-10 text-center flex flex-col items-center">
              <div className="cp-icon-shell mb-5">
                <FileCheck className="w-6 h-6 text-primary" />
              </div>
              <h3 className="cp-title text-2xl font-display font-bold mb-2">Aucun nettoyage enregistre</h3>
              <p className="cp-muted max-w-xl leading-relaxed">
                Quand l'historique local est actif, chaque fichier traite reste visible uniquement sur cet appareil pour te permettre de retrouver rapidement les operations recentes.
              </p>
            </div>
          ) : (
            historyItems.map((item) => (
              <div key={item.id} className="glass-panel glass-panel-solid rounded-[1.6rem] p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                  <div>
                    <p className="cp-title text-xl font-display font-bold break-all">{item.filename}</p>
                    <p className="cp-muted text-sm mt-1">Source: {item.sourceName}</p>
                  </div>
                  <div className="cp-pill text-xs">{formatDate(item.createdAt)}</div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="cp-stat-card">
                    <p className="cp-muted text-sm mb-2">Avant</p>
                    <p className="cp-title font-bold">{formatBytes(item.originalBytes)}</p>
                  </div>
                  <div className="cp-stat-card">
                    <p className="cp-muted text-sm mb-2">Apres</p>
                    <p className="cp-title font-bold">{formatBytes(item.outputBytes)}</p>
                  </div>
                  <div className="cp-stat-card">
                    <p className="cp-muted text-sm mb-2">Reduction</p>
                    <p className="cp-title font-bold">{item.reductionPercent}%</p>
                  </div>
                </div>

                {item.warnings ? <p className="cp-warning rounded-[1rem] p-3 text-sm mt-4">Notes: {item.warnings}</p> : null}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-panel glass-panel-solid rounded-[1.6rem] p-6">
            <div className="cp-icon-shell mb-4">
              <ShieldCheck className="w-5 h-5 text-accent" />
            </div>
            <h3 className="cp-title text-xl font-display font-bold mb-2">Pourquoi c'est utile</h3>
            <p className="cp-muted text-sm leading-relaxed">
              L'historique local permet de suivre tes nettoyages recents sans exposer ces informations au serveur. Il est stocke dans ton navigateur ou ta PWA.
            </p>
          </div>

          <div className="glass-panel glass-panel-solid rounded-[1.6rem] p-6">
            <p className="cp-label mb-3">Confidentialite</p>
            <ul className="cp-muted text-sm leading-relaxed space-y-2">
              <li>Les entrees restent sur cet appareil uniquement.</li>
              <li>Tu peux desactiver l'historique dans l'onglet Infos.</li>
              <li>Tu peux aussi vider la liste a tout moment.</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
