import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Github, Linkedin, Send, MoonStar, SunMedium, MonitorCog, ShieldCheck, Clock3, Database } from "lucide-react";
import clsx from "clsx";

const fieldClassName = "cp-input";

const themeOptions = [
  {
    id: "system",
    label: "Système",
    description: "Suit automatiquement le mode de ton appareil.",
    icon: MonitorCog,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Interface plus contrastée pour une ambiance tech.",
    icon: MoonStar,
  },
  {
    id: "light",
    label: "Light",
    description: "Lecture plus douce et plus lumineuse en journée.",
    icon: SunMedium,
  },
];

export default function SettingsTab({
  themePreference,
  resolvedTheme,
  onThemePreferenceChange,
  historyEnabled,
  onHistoryEnabledChange,
  historyCount,
}) {
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [formSent, setFormSent] = useState(false);

  const handleSend = (event) => {
    event.preventDefault();
    const subject = `Contact depuis Cleaner Pro par ${contactForm.name}`;
    const body = `${contactForm.message}\n\nDe : ${contactForm.name} (${contactForm.email})`;
    window.location.href = `mailto:codorah@hotmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setFormSent(true);
    setTimeout(() => setFormSent(false), 5000);
    setContactForm({ name: "", email: "", message: "" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto py-12 w-full space-y-8">
      <div className="space-y-3">
        <p className="cp-label">Infos produit</p>
        <h2 className="cp-title text-4xl font-display font-bold">Parametres et pilotage local</h2>
        <p className="cp-muted max-w-3xl leading-relaxed">
          Règle l'apparence, décide si tu veux garder un historique local de tes nettoyages et retrouve les informations utiles pour comprendre comment Cleaner Pro protège tes fichiers.
        </p>
      </div>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="cp-label mb-2">Apparence</p>
              <h3 className="cp-title text-2xl font-display font-bold">Mode visuel</h3>
            </div>
            <div className="cp-pill text-sm">Actif: {resolvedTheme === "light" ? "clair" : "sombre"}</div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isActive = themePreference === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onThemePreferenceChange(option.id)}
                  className={clsx("cp-theme-option", isActive && "is-active")}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="cp-icon-shell">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  <span className={clsx("text-xs font-semibold", isActive ? "text-primary" : "cp-muted")}>{isActive ? "Sélectionné" : "Disponible"}</span>
                  </div>
                  <p className="cp-title font-bold mb-2">{option.label}</p>
                  <p className="cp-muted text-sm leading-relaxed">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="cp-label mb-2">Historique</p>
              <h3 className="cp-title text-2xl font-display font-bold">Memoire locale</h3>
            </div>
            <button
              type="button"
              onClick={() => onHistoryEnabledChange(!historyEnabled)}
              className={clsx("cp-action-secondary min-w-[138px]", historyEnabled && "border-primary/35 text-primary")}
            >
              {historyEnabled ? "Activé" : "Désactivé"}
            </button>
          </div>

          <div className="cp-info-strip rounded-[1.4rem] p-5 flex items-start gap-4">
            <div className="cp-icon-shell">
              <Database className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="cp-title font-bold mb-1">Historique local des nettoyages</p>
              <p className="cp-muted text-sm leading-relaxed">
                Quand cette option est activée, chaque fichier traité est ajouté à l'onglet Suivi sur cet appareil uniquement. Aucune inscription n'est nécessaire.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="cp-stat-card">
              <p className="cp-muted text-sm mb-2">Etat</p>
              <p className="cp-title font-bold">{historyEnabled ? "Enregistrement actif" : "Pause locale"}</p>
            </div>
            <div className="cp-stat-card">
              <p className="cp-muted text-sm mb-2">Entrees</p>
              <p className="cp-title font-bold">{historyCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8">
          <h3 className="cp-title text-2xl font-display font-bold mb-4">Confidentialité et stockage</h3>
          <div className="space-y-4">
            <div className="cp-info-strip rounded-[1.3rem] p-4 flex items-start gap-4">
              <div className="cp-icon-shell">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="cp-title font-semibold mb-1">Traitement maitrise</p>
                <p className="cp-muted text-sm leading-relaxed">
                  Cleaner Pro est pensé pour limiter l'exposition de tes fichiers: nettoyage des métadonnées, limitation des traces inutiles et possibilité de traitement local ou auto-hébergé.
                </p>
              </div>
            </div>

            <div className="cp-info-strip rounded-[1.3rem] p-4 flex items-start gap-4">
              <div className="cp-icon-shell">
                <Clock3 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="cp-title font-semibold mb-1">Dossiers temporaires ephemeres</p>
                <p className="cp-muted text-sm leading-relaxed">
                  Les traitements web passent par des dossiers temporaires isolés, nettoyés automatiquement, avec limitation par IP et en-têtes HTTP de sécurité.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="cp-title text-2xl font-display font-bold mb-6">Équipe et contact</h3>

          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary/20">
              EA
            </div>
            <div className="flex-1">
              <h4 className="cp-title text-xl font-bold">Elodie ATANA H. (Codorah)</h4>
              <p className="text-primary font-medium text-sm mb-3">IT Project Manager et developpeuse full stack IA</p>
              <p className="cp-muted text-sm mb-4 leading-relaxed">
                Profil produit et technique du projet. Cette section sert aussi de point de contact pour les retours, la feuille de route et les demandes de deploiement.
              </p>
              <div className="flex items-center gap-4">
                <a href="mailto:codorah@hotmail.com" className="cp-icon-shell" title="Email">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/in/codorah" target="_blank" rel="noreferrer" className="cp-icon-shell" title="LinkedIn">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="https://github.com/Codorah" target="_blank" rel="noreferrer" className="cp-icon-shell" title="GitHub">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8">
        <h3 className="cp-title text-2xl font-display font-bold mb-6">FAQ et message rapide</h3>

        <div className="space-y-3 mb-8">
          <details className="cp-info-strip p-4 rounded-[1.2rem] cursor-pointer group">
            <summary className="font-medium cp-title select-none">Que fait exactement le nettoyage ?</summary>
            <p className="cp-muted text-sm mt-3 pl-2 border-l-2 border-primary leading-relaxed">
              Le service peut supprimer les métadonnées, réduire la taille des médias et, selon l'option choisie, masquer le texte visible sur certaines catégories de fichiers.
            </p>
          </details>
          <details className="cp-info-strip p-4 rounded-[1.2rem] cursor-pointer group">
            <summary className="font-medium cp-title select-none">Quelles protections sont actives sur le site ?</summary>
            <p className="cp-muted text-sm mt-3 pl-2 border-l-2 border-primary leading-relaxed">
              Le service applique des limites par IP, isole les traitements dans des dossiers temporaires, ajoute des en-têtes HTTP de sécurité et peut brancher un scanner antivirus sur les uploads.
            </p>
          </details>
          <details className="cp-info-strip p-4 rounded-[1.2rem] cursor-pointer group">
            <summary className="font-medium cp-title select-none">Pourquoi le mode OCR est-il plus lent ?</summary>
            <p className="cp-muted text-sm mt-3 pl-2 border-l-2 border-accent leading-relaxed">
              Le caviardage OCR analyse visuellement les pages, images ou frames vidéo. C'est donc plus gourmand en CPU et en mémoire qu'un simple nettoyage de métadonnées.
            </p>
          </details>
        </div>

        <div className="cp-info-strip p-6 rounded-[1.5rem]">
          <h4 className="cp-title font-bold mb-2">Envoyer un message</h4>
          <p className="cp-muted text-sm mb-6">Pour une question produit, un bug ou une aide au deploiement.</p>

          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Votre nom"
                required
                value={contactForm.name}
                onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })}
                className={fieldClassName}
              />
              <input
                type="email"
                placeholder="Votre e-mail"
                required
                value={contactForm.email}
                onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                className={fieldClassName}
              />
            </div>
            <textarea
              placeholder="Votre message..."
              required
              rows={4}
              value={contactForm.message}
              onChange={(event) => setContactForm({ ...contactForm, message: event.target.value })}
              className={`${fieldClassName} resize-none`}
            />

            <button type="submit" className="cp-action-primary w-full">
              <Send className="w-5 h-5" />
              {formSent ? "Ouverture de votre messagerie..." : "Envoyer le message"}
            </button>
          </form>
        </div>
      </div>

      <div className="text-center pb-6">
        <p className="cp-muted text-xs text-center inline-block bg-[var(--app-card)] px-4 py-2 rounded-full border border-[var(--app-border)]">
          (c) 2026 Cleaner Pro v2.0.0. Developpe par Codorah.
        </p>
      </div>
    </motion.div>
  );
}
