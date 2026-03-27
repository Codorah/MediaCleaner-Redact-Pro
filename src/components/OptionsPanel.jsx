import { motion } from "framer-motion";
import { Shield, EyeOff, FileText, VolumeX, CheckSquare } from "lucide-react";

export default function OptionsPanel({ options, setOptions, preset, setPreset }) {
    const handleToggle = (key) => {
        setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const OptionItem = ({ icon: Icon, title, description, id, checked }) => (
        <button
            type="button"
            onClick={() => handleToggle(id)}
            className={`glass-panel p-4 rounded-2xl flex items-start gap-4 cursor-pointer transition-all border-2 text-left ${checked ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'}`}
        >
            <div className={`p-3 rounded-xl ${checked ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
                <h4 className="text-white font-bold mb-1">{title}</h4>
                <p className="text-sm text-gray-400 leading-tight">{description}</p>
            </div>
            <div className="pt-1">
                <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${checked ? 'border-primary bg-primary' : 'border-white/30'}`}>
                    {checked && <CheckSquare className="w-4 h-4 text-white" />}
                </div>
            </div>
        </button>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-white mb-2">Options de nettoyage</h2>
                <p className="text-gray-400">Selectionne les parametres utiles avant de lancer le traitement.</p>
            </div>

            <div className="flex gap-4 mb-8 justify-center flex-wrap">
                {['light', 'medium', 'heavy', 'custom'].map((currentPreset) => (
                    <button
                        key={currentPreset}
                        onClick={() => setPreset(currentPreset)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all border ${preset === currentPreset ? 'bg-primary border-primary text-white scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {currentPreset}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OptionItem
                    id="strip_metadata"
                    icon={Shield}
                    title="Purger les metadonnees"
                    description="Supprime l'auteur, l'EXIF, la date et les infos de localisation."
                    checked={options.strip_metadata}
                />
                <OptionItem
                    id="compress_output"
                    icon={FileText}
                    title="Compression optimale"
                    description="Reduit la taille sans trop degrader le rendu visible."
                    checked={options.compress_output}
                />
                <OptionItem
                    id="redact_visible_text"
                    icon={EyeOff}
                    title="Masquer le texte"
                    description="Utilise l'OCR pour caviarder le texte visible. Plus lent et plus gourmand."
                    checked={options.redact_visible_text}
                />
                <OptionItem
                    id="remove_audio"
                    icon={VolumeX}
                    title="Supprimer l'audio"
                    description="Retire la piste sonore des videos exportees."
                    checked={options.remove_audio}
                />
            </div>
        </motion.div>
    );
}
