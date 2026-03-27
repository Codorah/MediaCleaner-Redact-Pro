import { motion } from "framer-motion";
import { Shield, EyeOff, FileText, VolumeX, CheckSquare, Sparkles } from "lucide-react";
import clsx from "clsx";

const presetLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  custom: "Custom",
};

const presetDescriptions = {
  low: "Priorite a la rapidite: purge des metadonnees uniquement.",
  medium: "Equilibre recommande: nettoyage + compression.",
  high: "Protection maximale: OCR, compression et suppression audio.",
  custom: "Configuration libre, a ajuster selon ton besoin.",
};

export default function OptionsPanel({ options, preset, onPresetChange, onOptionToggle }) {
  const OptionItem = ({ icon: Icon, title, description, id, checked }) => (
    <button
      type="button"
      onClick={() => onOptionToggle(id)}
      className={clsx(
        "glass-panel glass-panel-solid rounded-[1.5rem] p-5 flex items-start gap-4 cursor-pointer transition-all border text-left",
        checked ? "border-primary/35 shadow-[0_18px_32px_rgba(255,59,92,0.12)]" : "border-[var(--app-border)] hover:border-[var(--app-border-strong)]"
      )}
    >
      <div className={clsx("cp-icon-shell", checked && "border-primary/30 bg-primary/10 text-primary")}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="cp-title font-bold">{title}</h4>
          <span className={clsx("text-xs font-semibold", checked ? "text-primary" : "cp-muted")}>{checked ? "Actif" : "Off"}</span>
        </div>
        <p className="cp-muted text-sm leading-relaxed">{description}</p>
      </div>
      <div className="pt-1">
        <div className={clsx("w-7 h-7 rounded-xl flex items-center justify-center border transition-colors", checked ? "border-primary bg-primary text-white" : "border-[var(--app-border-strong)] cp-muted")}>
          {checked && <CheckSquare className="w-4 h-4" />}
        </div>
      </div>
    </button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-4">
        <p className="cp-label mb-3">Etape 2</p>
        <h2 className="cp-title text-4xl font-display font-bold mb-2">Choisis ton niveau de nettoyage</h2>
        <p className="cp-muted max-w-2xl mx-auto">Les presets te donnent une base immediate, puis tu peux basculer en mode custom si tu veux controler chaque option.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["low", "medium", "high", "custom"].map((currentPreset) => (
          <button
            key={currentPreset}
            onClick={() => onPresetChange(currentPreset)}
            className={clsx(
              "glass-panel glass-panel-solid rounded-[1.35rem] p-4 text-left border transition-all",
              preset === currentPreset ? "border-primary/40 shadow-[0_18px_30px_rgba(255,59,92,0.12)]" : "border-[var(--app-border)]"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="cp-title font-bold">{presetLabels[currentPreset]}</span>
              {preset === currentPreset && <Sparkles className="w-4 h-4 text-primary" />}
            </div>
            <p className="cp-muted text-sm leading-relaxed">{presetDescriptions[currentPreset]}</p>
          </button>
        ))}
      </div>

      <div className="glass-panel rounded-[1.5rem] px-5 py-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary mt-0.5" />
        <p className="cp-soft text-sm leading-relaxed">{presetDescriptions[preset]}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptionItem
          id="strip_metadata"
          icon={Shield}
          title="Purger les metadonnees"
          description="Supprime l'auteur, l'EXIF, les dates techniques et les informations de localisation quand elles existent."
          checked={options.strip_metadata}
        />
        <OptionItem
          id="compress_output"
          icon={FileText}
          title="Compression optimale"
          description="Reduit la taille du fichier pour faciliter le partage sans sacrifier inutilement la lisibilite."
          checked={options.compress_output}
        />
        <OptionItem
          id="redact_visible_text"
          icon={EyeOff}
          title="Masquer le texte"
          description="Utilise l'OCR pour caviarder le texte visible dans les images, PDF et autres medias compatibles."
          checked={options.redact_visible_text}
        />
        <OptionItem
          id="remove_audio"
          icon={VolumeX}
          title="Supprimer l'audio"
          description="Retire la piste sonore des videos exportees pour eviter les fuites d'informations vocales."
          checked={options.remove_audio}
        />
      </div>
    </motion.div>
  );
}
