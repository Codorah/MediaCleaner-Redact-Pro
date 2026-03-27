import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ThreeDFileIcon from "../components/3DFileIcon";
import {
  ArrowRight,
  Download,
  ShieldCheck,
  Zap,
  FileJson,
  Clock3,
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
    description: "Supprime les metadonnees pour aller vite, sans surtraiter le fichier.",
  },
  {
    name: "Medium",
    description: "Ajoute une compression propre pour un usage partage / mail plus confortable.",
  },
  {
    name: "High",
    description: "Ajoute OCR et suppression audio pour les cas sensibles ou a risque.",
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
    desc: "Images, videos, PDF, PPTX et fichiers texte peuvent etre traites dans une seule interface.",
  },
  {
    icon: <Zap />,
    title: "Presets preconfigures",
    desc: "Low, Medium, High et Custom donnent un point de depart clair selon ton niveau de protection.",
  },
  {
    icon: <Server />,
    title: "Execution maitrisee",
    desc: "Le produit vise une execution locale ou auto-hebergee pour garder le controle sur le traitement.",
  },
  {
    icon: <Clock3 />,
    title: "Workflow rapide",
    desc: "Charge ton fichier, choisis ton niveau et telecharge une version nettoyee en quelques etapes.",
  },
];

export default function HomeTab({ onStart }) {
  const [desktopDownload, setDesktopDownload] = useState({
    available: false,
    filename: "",
    url: "",
    size_bytes: 0,
    note: "Verification du telechargement desktop...",
    external: false,
  });

  useEffect(() => {
    let active = true;

    async function loadDesktopDownload() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const response = await fetch(`${apiUrl}/api/downloads`);
        if (!response.ok) throw new Error("Impossible de verifier la version desktop.");
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
            note: "La version desktop n'est pas encore configuree sur cette instance.",
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
            Confidentialite proactive
          </div>

          <div className="space-y-5 max-w-3xl">
            <h1 className="cp-title text-5xl md:text-7xl font-display font-bold leading-[0.95]">
              Nettoie, reduis et protege
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">tes fichiers sensibles</span>
            </h1>

            <p className="cp-soft text-lg md:text-xl leading-relaxed">
              Cleaner Pro retire les metadonnees sensibles, optimise la taille des fichiers et peut masquer le texte visible quand le niveau de confidentialite l'exige.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="cp-stat-card">
              <p className="cp-label mb-2">Protection</p>
              <p className="cp-title text-lg font-bold">Metadonnees, OCR, audio</p>
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
                <p className="cp-soft text-sm leading-relaxed">Un outil simple a comprendre pour les utilisateurs, mais serieux sur la confidentialite.</p>
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
              <p className="cp-label mb-1">Niveaux preconfigures</p>
              <h2 className="cp-title text-2xl font-display font-bold">Choisir sans hesiter</h2>
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

        <div
          id="desktop-download"
          className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 relative overflow-hidden"
        >
          <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
          <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="cp-pill text-xs">
                <MonitorDown className="w-4 h-4 text-accent" />
                Application desktop
              </div>
              <h2 className="cp-title text-3xl font-display font-bold">Telechargement de l'application bureau</h2>
              <p className="cp-soft leading-relaxed">
                Cette section sert de point d'entree unique pour le binaire Windows. Tu peux soit deposer un `.zip` ou un `.exe` dans `public/downloads/`, soit configurer une URL externe via `DESKTOP_DOWNLOAD_EXTERNAL_URL`.
              </p>
              <p className="cp-muted text-sm">{desktopDownload.note}</p>
              {desktopDownload.filename && (
                <p className="cp-muted text-sm">
                  Fichier detecte: <span className="cp-title font-medium">{desktopDownload.filename}</span>
                  {desktopDownload.size_bytes ? ` - ${formatBytes(desktopDownload.size_bytes)}` : ""}
                </p>
              )}
            </div>

            <div className="w-full lg:max-w-sm">
              <div className="cp-info-strip rounded-[1.6rem] p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="cp-title font-semibold">Distribution controlee</p>
                    <p className="cp-muted text-sm leading-relaxed">
                      Le site ne sert que ce que tu configures explicitement. Aucun binaire n'est expose tant qu'il n'est pas fourni.
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
                    Telecharger la version desktop
                  </a>
                ) : (
                  <div className="cp-warning rounded-[1.2rem] px-4 py-4 text-sm">
                    La version desktop n'est pas encore branchee a cette instance.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {featureCards.map((card) => (
          <FeatureCard key={card.title} icon={card.icon} title={card.title} desc={card.desc} />
        ))}
      </motion.section>

      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="glass-panel glass-panel-solid rounded-[2rem] p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[90px]" />
        <div className="relative z-10 space-y-8">
          <div>
            <p className="cp-label mb-3">A propos</p>
            <h2 className="cp-title text-4xl font-display font-bold">Comprendre pourquoi Cleaner Pro existe</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div className="cp-info-strip rounded-[1.4rem] p-5">
                <h3 className="cp-title text-xl font-display font-bold mb-3">1. C'est quoi une metadonnee ?</h3>
                <p className="cp-muted leading-relaxed">
                  Une metadonnee est une information cachee ou technique attachee a un fichier. Par exemple: l'auteur d'un document, le logiciel utilise, la date de creation, la localisation GPS d'une photo ou certains details internes d'edition.
                </p>
              </div>

              <div className="cp-info-strip rounded-[1.4rem] p-5">
                <h3 className="cp-title text-xl font-display font-bold mb-3">2. Pourquoi c'est important ?</h3>
                <p className="cp-muted leading-relaxed">
                  Parce qu'un fichier peut reveler plus que son contenu visible. Une image banale peut exposer un lieu. Un document peut trahir son origine, son auteur ou son historique. Dans un contexte pro, cela peut faciliter l'OSINT, la fuite d'information ou la reidentification d'une source.
                </p>
              </div>

              <div className="cp-info-strip rounded-[1.4rem] p-5">
                <h3 className="cp-title text-xl font-display font-bold mb-3">3. Ce que l'application fait</h3>
                <p className="cp-muted leading-relaxed">
                  Cleaner Pro inspecte les fichiers compatibles, retire les metadonnees inutiles, peut compresser la sortie pour alleger le partage et, si tu l'actives, masquer le texte visible avec OCR ou retirer l'audio des videos.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="cp-info-strip rounded-[1.4rem] p-5">
                <h3 className="cp-title text-xl font-display font-bold mb-3">4. Pourquoi c'est plus rassurant</h3>
                <p className="cp-muted leading-relaxed">
                  L'outil est pense pour minimiser les traces: traitements limites, historique local facultatif, dossiers temporaires isoles cote serveur, limitation des requetes et possibilite d'activer un scanner antivirus sur les uploads.
                </p>
              </div>

              <div className="cp-info-strip rounded-[1.4rem] p-5">
                <h3 className="cp-title text-xl font-display font-bold mb-3">5. Qui en a besoin ?</h3>
                <p className="cp-muted leading-relaxed">
                  Toute personne qui partage des fichiers sensibles: consultants, RH, juristes, journalistes, equipes produit, freelances, ou simplement des utilisateurs qui veulent eviter de diffuser plus d'informations que prevu.
                </p>
              </div>

              <div className="cp-info-strip rounded-[1.4rem] p-5">
                <h3 className="cp-title text-xl font-display font-bold mb-3">6. La vision du produit</h3>
                <p className="cp-muted leading-relaxed">
                  Rendre l'hygiene documentaire simple, lisible et accessible. Cleaner Pro ne cherche pas a faire joli uniquement: il doit aider un utilisateur non expert a comprendre ce qu'il nettoie, pourquoi il le fait et quel niveau de protection il choisit.
                </p>
              </div>
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
