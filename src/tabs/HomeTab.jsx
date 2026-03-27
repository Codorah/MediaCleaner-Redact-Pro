import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ThreeDFileIcon from "../components/3DFileIcon";
import {
  ArrowRight,
  Download,
  ShieldCheck,
  Zap,
  FileJson,
  Server,
  MonitorDown,
  LockKeyhole,
  Layers3,
  ScanSearch,
} from "lucide-react";

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(1)} ${units[index]}`;
}

const presets = [
  {
    name: "Low",
    description: "Supprime les métadonnées pour aller vite, sans surtraiter le fichier.",
  },
  {
    name: "Medium",
    description: "Ajoute une compression propre pour un usage partage / mail plus confortable.",
  },
  {
    name: "High",
    description: "Ajoute OCR et suppression audio pour les cas sensibles ou à risque.",
  },
  {
    name: "Custom",
    description: "Te laisse choisir manuellement chaque option selon ton contexte.",
  },
];

const featureCards = [
  {
    icon: <FileJson />,
    title: "Support multi-format",
    desc: "Images, vidéos, PDF, PPTX et fichiers texte peuvent être traités dans une seule interface.",
  },
  {
    icon: <Zap />,
    title: "Presets préconfigurés",
    desc: "Low, Medium, High et Custom évitent d'avoir à régler chaque option à la main.",
  },
  {
    icon: <Server />,
    title: "Exécution maîtrisée",
    desc: "Le produit vise une exécution locale ou auto-hébergée pour garder la maîtrise du traitement.",
  },
];

export default function HomeTab({ onStart }) {
  const [desktopDownload, setDesktopDownload] = useState({
    available: false,
    filename: "",
    url: "",
    size_bytes: 0,
    note: "Vérification du téléchargement desktop...",
    external: false,
  });

  useEffect(() => {
    let active = true;

    async function loadDesktopDownload() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${apiUrl}/api/downloads`);
        if (!response.ok) throw new Error("Impossible de vérifier la version desktop.");
        const payload = await response.json();
        if (active) {
          setDesktopDownload(payload);
        }
      } catch {
        if (active) {
          setDesktopDownload({
            available: false,
            filename: "",
            url: "",
            size_bytes: 0,
            note: "La version desktop n'est pas encore configurée sur cette instance.",
            external: false,
          });
        }
      }
    }

    loadDesktopDownload();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="w-full flex flex-col gap-10 md:gap-14 pt-8 pb-10">
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid xl:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        <div className="space-y-8">
          <div className="cp-pill text-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Confidentialité proactive
          </div>

          <div className="space-y-5 max-w-3xl">
            <h1 className="cp-title text-5xl md:text-7xl font-display font-bold leading-[0.95]">
              Nettoie, réduis et protège
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">tes fichiers sensibles</span>
            </h1>

            <p className="cp-soft text-lg md:text-xl leading-relaxed">
              Cleaner Pro retire les métadonnées sensibles, allège le partage des fichiers et peut masquer le texte visible quand le niveau de confidentialité l'exige.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="cp-stat-card">
              <p className="cp-label mb-2">Protection</p>
              <p className="cp-title text-lg font-bold">Métadonnées, OCR, audio</p>
            </div>
            <div className="cp-stat-card">
              <p className="cp-label mb-2">Parcours</p>
              <p className="cp-title text-lg font-bold">4 presets clairs</p>
            </div>
            <div className="cp-stat-card">
              <p className="cp-label mb-2">Usage</p>
              <p className="cp-title text-lg font-bold">Web, PWA et desktop</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button onClick={onStart} className="cp-action-primary">
              <span>Nettoyer maintenant</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href={desktopDownload.available ? desktopDownload.url || "/api/downloads/file" : "#desktop-download"}
              target={desktopDownload.external ? "_blank" : undefined}
              rel={desktopDownload.external ? "noreferrer" : undefined}
              className="cp-action-secondary"
            >
              <Download className="w-5 h-5 text-accent" />
              <span>Version desktop</span>
            </a>
          </div>
        </div>

        <div className="glass-panel glass-panel-solid cp-accent-panel rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-10 w-56 h-56 rounded-full bg-primary/14 blur-[100px] pointer-events-none" />
          <div className="flex flex-col h-full justify-between gap-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="cp-label mb-2">Produit</p>
                <h2 className="cp-title text-2xl font-display font-bold">Cleaner Pro</h2>
              </div>
              <div className="cp-pill text-xs">
                <Layers3 className="w-4 h-4 text-accent" />
                Web + Desktop
              </div>
            </div>

            <ThreeDFileIcon className="w-full h-[320px] md:h-[360px]" />

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="cp-stat-card">
                <p className="cp-label mb-2">Architecture</p>
                <p className="cp-soft text-sm leading-relaxed">Interface React, backend Python et protections serveur pour les traitements sensibles.</p>
              </div>
              <div className="cp-stat-card">
                <p className="cp-label mb-2">Positionnement</p>
                <p className="cp-soft text-sm leading-relaxed">Un outil simple à comprendre pour les utilisateurs, mais sérieux sur la confidentialité.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="cp-icon-shell">
              <ScanSearch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="cp-label mb-1">Niveaux préconfigurés</p>
              <h2 className="cp-title text-2xl font-display font-bold">Choisir sans hésiter</h2>
            </div>
          </div>
          <div className="space-y-3">
            {presets.map((preset) => (
              <div key={preset.name} className="cp-info-strip rounded-[1.2rem] p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="cp-title font-bold">{preset.name}</h3>
                  <span className="cp-pill text-xs px-3 py-1">{preset.name}</span>
                </div>
                <p className="cp-muted text-sm leading-relaxed">{preset.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div id="desktop-download" className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="cp-pill text-xs">
                <MonitorDown className="w-4 h-4 text-accent" />
                Application desktop
              </div>
              <h2 className="cp-title text-3xl font-display font-bold">Version bureau</h2>
              <p className="cp-soft leading-relaxed">
                Quand le binaire Windows sera prêt, cette instance pourra proposer un téléchargement direct de Cleaner Pro.
              </p>
              <p className="cp-muted text-sm">{desktopDownload.note}</p>
              {desktopDownload.filename && (
                <p className="cp-muted text-sm">
                  Fichier détecté: <span className="cp-title font-medium">{desktopDownload.filename}</span>
                  {desktopDownload.size_bytes ? ` - ${formatBytes(desktopDownload.size_bytes)}` : ""}
                </p>
              )}
            </div>

            <div className="w-full lg:max-w-sm">
              <div className="cp-info-strip rounded-[1.6rem] p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="cp-title font-semibold">Distribution contrôlée</p>
                    <p className="cp-muted text-sm leading-relaxed">
                      Le site ne sert que ce que tu configures explicitement. Aucun binaire n'est exposé tant qu'il n'est pas fourni.
                    </p>
                  </div>
                </div>

                {desktopDownload.available ? (
                  <a
                    href={desktopDownload.url || "/api/downloads/file"}
                    target={desktopDownload.external ? "_blank" : undefined}
                    rel={desktopDownload.external ? "noreferrer" : undefined}
                    className="cp-action-primary w-full"
                  >
                    <Download className="w-5 h-5" />
                    Télécharger la version desktop
                  </a>
                ) : (
                  <div className="cp-warning rounded-[1.2rem] px-4 py-4 text-sm">
                    La version desktop n'est pas encore branchée à cette instance.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featureCards.map((card) => (
          <FeatureCard key={card.title} icon={card.icon} title={card.title} desc={card.desc} />
        ))}
      </motion.section>

      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="glass-panel glass-panel-solid rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[90px]" />
        <div className="relative z-10 space-y-8">
          <div>
            <p className="cp-label mb-3">À propos</p>
            <h2 className="cp-title text-4xl font-display font-bold">Comprendre pourquoi Cleaner Pro existe</h2>
            <p className="cp-muted max-w-3xl mt-4 leading-relaxed">
              Cleaner Pro a été pensé pour expliquer simplement un sujet souvent invisible: les métadonnées et les informations techniques qu'un fichier peut révéler sans que son propriétaire s'en rende compte.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            <div className="cp-info-strip rounded-[1.4rem] p-5">
              <h3 className="cp-title text-xl font-display font-bold mb-3">1. Qu'est-ce qu'une métadonnée ?</h3>
              <p className="cp-muted leading-relaxed">
                Une métadonnée est une information cachée ou technique attachée à un fichier. Par exemple: l'auteur d'un document, le logiciel utilisé, la date de création, la localisation GPS d'une photo ou certains détails internes d'édition.
              </p>
            </div>

            <div className="cp-info-strip rounded-[1.4rem] p-5">
              <h3 className="cp-title text-xl font-display font-bold mb-3">2. Ce que Cleaner Pro fait</h3>
              <p className="cp-muted leading-relaxed">
                Cleaner Pro inspecte les fichiers compatibles, retire les métadonnées inutiles, peut compresser la sortie pour alléger le partage et, si tu l'actives, masquer le texte visible avec OCR ou retirer l'audio des vidéos.
              </p>
            </div>

            <div className="cp-info-strip rounded-[1.4rem] p-5">
              <h3 className="cp-title text-xl font-display font-bold mb-3">3. Pourquoi c'est sécurisé</h3>
              <p className="cp-muted leading-relaxed">
                L'outil est pensé pour minimiser les traces: historique local facultatif, dossiers temporaires isolés côté serveur, limitation des requêtes, en-têtes HTTP de sécurité et possibilité d'activer un scanner antivirus sur les uploads.
              </p>
            </div>

            <div className="cp-info-strip rounded-[1.4rem] p-5">
              <h3 className="cp-title text-xl font-display font-bold mb-3">4. Pourquoi on en a besoin</h3>
              <p className="cp-muted leading-relaxed">
                Parce qu'un fichier peut révéler plus que son contenu visible. Une image banale peut exposer un lieu. Un document peut trahir son origine, son auteur ou son historique. Cleaner Pro aide à réduire cette exposition sans demander à l'utilisateur d'être expert.
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-panel glass-panel-solid p-6 rounded-[1.6rem] border border-[var(--app-border)] transition-colors duration-300">
      <div className="cp-icon-shell mb-5">{icon}</div>
      <h3 className="cp-title text-xl font-bold mb-3">{title}</h3>
      <p className="cp-muted leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
