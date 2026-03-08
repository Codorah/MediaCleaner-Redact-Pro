import { motion } from 'framer-motion';

export default function SettingsTab() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto py-12 w-full"
        >
            <h2 className="text-3xl font-display font-bold text-white mb-8">Préférences</h2>

            <div className="glass-panel rounded-3xl p-8 mb-6">
                <h3 className="text-xl font-bold text-white mb-4">Stockage Local</h3>
                <p className="text-gray-400 text-sm mb-6">MediaCleaner traite tous vos fichiers en local. Vos données ne sont jamais envoyées sur le cloud.</p>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                        <span className="block text-white font-medium">Historique des fichiers</span>
                        <span className="text-xs text-gray-400">Garder une trace locale des fichiers traités.</span>
                    </div>
                    <div className="w-14 h-8 rounded-full p-1 bg-accent relative cursor-pointer">
                        <div className="w-6 h-6 bg-white rounded-full shadow-md ml-auto" />
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">À propos</h3>
                <p className="text-gray-400 text-sm">MediaCleaner Redact Pro v2.0.0<br />Créé par Elodie ATANA (Codorah).</p>
            </div>
        </motion.div>
    );
}
