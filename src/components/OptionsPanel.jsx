import { motion } from "framer-motion";
import { Shield, EyeOff, FileText, VolumeX, CheckSquare } from "lucide-react";

export default function OptionsPanel({ options, setOptions, preset, setPreset }) {
    const handleToggle = (key) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const OptionItem = ({ icon: Icon, title, description, id, checked }) => (
        <div
            onClick={() => handleToggle(id)}
            className={`glass-panel p-4 rounded-2xl flex items-start gap-4 cursor-pointer transition-all border-2 ${checked ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/30'}`}
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
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto space-y-6"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-display font-bold text-white mb-2">Options de nettoyage</h2>
                <p className="text-gray-400">Sélectionne les paramètres pour le traitement de ton fichier.</p>
            </div>

            <div className="flex gap-4 mb-8 justify-center">
                {['light', 'medium', 'heavy', 'custom'].map(p => (
                    <button
                        key={p}
                        onClick={() => setPreset(p)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all border ${preset === p ? 'bg-primary border-primary text-white scale-105' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OptionItem
                    id="strip_metadata"
                    icon={Shield}
                    title="Purger métadonnées"
                    description="Supprime l'auteur, EXIF, date, localisation..."
                    checked={options.strip_metadata}
                />
                <OptionItem
                    id="compress_output"
                    icon={FileText}
                    title="Compression optimale"
                    description="Réduit la taille sans perte de qualité visible."
                    checked={options.compress_output}
                />
                <OptionItem
                    id="redact_visible_text"
                    icon={EyeOff}
                    title="Masquer le texte"
                    description="Censure automatiquement le texte sensible."
                    checked={options.redact_visible_text}
                />
                <OptionItem
                    id="remove_audio"
                    icon={VolumeX}
                    title="Supprimer l'audio"
                    description="Enlève la piste sonore des vidéos."
                    checked={options.remove_audio}
                />
            </div>
        </motion.div>
    );
}
