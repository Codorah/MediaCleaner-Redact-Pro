import { motion } from "framer-motion";
import { useState } from "react";
import {
  Mail,
  Github,
  Linkedin,
  Send,
  MoonStar,
  SunMedium,
  MonitorCog,
  ShieldCheck,
  Clock3,
  Database,
  LockKeyhole,
} from "lucide-react";
import clsx from "clsx";

const fieldClassName = "cp-input";

const themeOptions = [
  {
    id: "system",
    label: "Système",
    description: "Suit automatiquement le thème de ton appareil.",
    icon: MonitorCog,
  },
  {
    id: "dark",
    label: "Sombre",
    description: "Une interface plus dense et plus confortable quand la lumière baisse.",
    icon: MoonStar,
  },
  {
    id: "light",
    label: "Clair",
    description: "Une lecture plus lumineuse et plus sobre pour la journée.",
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
        <p className="cp-label">Réglages</p>
        <h2 className="cp-title text-4xl font-display font-bold">Paramètres et confidentialité locale</h2>
        <p className="cp-muted max-w-3xl leading-relaxed">
          Ajuste l&apos;apparence, choisis si l&apos;historique reste enregistré sur cet appareil et garde sous les yeux les protections principales de Cleaner Pro.
        </p>
      </div>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="cp-label mb-2">Apparence</p>
              <h3 className="cp-title text-2xl font-display font-bold">Mode visuel</h3>
            </div>
            <div className="cp-pill text-sm">Actif : {resolvedTheme === "light" ? "Clair" : "Sombre"}</div>
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
              <h3 className="cp-title text-2xl font-display font-bold">Mémoire locale</h3>
            </div>
            <button
              type="button"
              onClick={() => onHistoryEnabledChange(!historyEnabled)}
              className={clsx("cp-action-secondary min-w-[148px]", historyEnabled && "border-primary/35 text-primary")}
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
                Quand cette option est active, chaque fichier traité apparaît dans l&apos;onglet Suivi uniquement sur cet appareil. Aucune création de compte n&apos;est nécessaire.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="cp-stat-card">
              <p className="cp-muted text-sm mb-2">État</p>
              <p className="cp-title font-bold">{historyEnabled ? "Enregistrement actif" : "Historique en pause"}</p>
            </div>
            <div className="cp-stat-card">
              <p className="cp-muted text-sm mb-2">Entrées</p>
              <p className="cp-title font-bold">{historyCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6">
        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 space-y-5">
          <div>
            <p className="cp-label mb-2">Sécurité</p>
            <h3 className="cp-title text-2xl font-display font-bold">Protection et stockage</h3>
          </div>

          <div className="space-y-4">
            <div className="cp-info-strip rounded-[1.3rem] p-4 flex items-start gap-4">
              <div className="cp-icon-shell">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="cp-title font-semibold mb-1">Traitement maîtrisé</p>
                <p className="cp-muted text-sm leading-relaxed">
                  Cleaner Pro nettoie les métadonnées, limite les traces inutiles et garde une logique de traitement compatible avec un usage local ou auto-hébergé.
                </p>
              </div>
            </div>

            <div className="cp-info-strip rounded-[1.3rem] p-4 flex items-start gap-4">
              <div className="cp-icon-shell">
                <Clock3 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="cp-title font-semibold mb-1">Dossiers temporaires isolés</p>
                <p className="cp-muted text-sm leading-relaxed">
                  Les traitements web passent par des espaces temporaires séparés, nettoyés automatiquement, pour éviter de laisser des fichiers sensibles traîner sur le serveur.
                </p>
              </div>
            </div>

            <div className="cp-info-strip rounded-[1.3rem] p-4 flex items-start gap-4">
              <div className="cp-icon-shell">
                <LockKeyhole className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="cp-title font-semibold mb-1">Défenses actives</p>
                <p className="cp-muted text-sm leading-relaxed">
                  Limitation par IP, validation de type de fichier, en-têtes HTTP de sécurité et antivirus optionnel font partie de la base mise en place côté service.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel glass-panel-solid rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary/15">
                EA
              </div>
              <div className="space-y-3">
                <div>
                  <p className="cp-label mb-1">Contact</p>
                  <h3 className="cp-title text-2xl font-display font-bold">Équipe produit</h3>
                </div>
                <div>
                  <h4 className="cp-title text-lg font-bold">Elodie ATANA H. (Codorah)</h4>
                  <p className="text-primary font-medium text-sm">Pilotage produit, déploiement et développement full stack IA</p>
                </div>
                <p className="cp-muted text-sm leading-relaxed">
                  Utilise ce canal pour un retour produit, une question de sécurité ou un besoin d&apos;accompagnement sur le déploiement.
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

            <div className="cp-info-strip p-5 rounded-[1.5rem]">
              <h4 className="cp-title font-bold mb-2">Envoyer un message</h4>
              <p className="cp-muted text-sm mb-5">Pour un bug, une question produit ou une aide au déploiement.</p>

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
        </div>
      </div>

      <div className="text-center pb-6">
        <p className="cp-muted text-xs text-center inline-block bg-[var(--app-card)] px-4 py-2 rounded-full border border-[var(--app-border)]">
          (c) 2026 Cleaner Pro v2.0.0. Développé par Codorah.
        </p>
      </div>
    </motion.div>
  );
}
