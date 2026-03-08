import { motion } from 'framer-motion';
import { History as HistoryIcon, FileCheck } from 'lucide-react';

export default function HistoryTab() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto py-12 w-full"
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <HistoryIcon className="text-gray-400 w-6 h-6" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white">Historique de nettoyage</h2>
            </div>

            <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <FileCheck className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Aucun fichier récent</h3>
                <p className="text-gray-400 max-w-sm">
                    Les fichiers que vous nettoyez apparaîtront ici. Tout reste stocké localement sur votre appareil.
                </p>
            </div>
        </motion.div>
    );
}
