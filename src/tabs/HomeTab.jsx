import { motion } from 'framer-motion';
import ThreeDFileIcon from '../components/3DFileIcon';
import { ArrowRight, Download, ShieldCheck, Zap, FileJson, Clock, ServerOff } from 'lucide-react';

export default function HomeTab({ onStart }) {
    return (
        <div className="w-full flex flex-col gap-24">
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row items-center justify-between min-h-[70vh] gap-12 mt-12"
            >
                <div className="flex-1 space-y-8 max-w-2xl relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase">
                        <ShieldCheck className="w-4 h-4" />
                        Confidentialite locale
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight text-white">
                        Nettoie et protege <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">tes fichiers sensibles</span>
                    </h1>

                    <p className="text-xl text-gray-400 leading-relaxed font-medium">
                        MediaCleaner Redact Pro retire les metadonnees sensibles, optimise la taille des fichiers
                        et peut masquer le texte visible selon le niveau de protection souhaite.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <button
                            onClick={onStart}
                            className="group relative px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 overflow-hidden shadow-[0_0_40px_rgba(255,59,92,0.4)] hover:shadow-[0_0_60px_rgba(255,59,92,0.6)] transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative z-10 text-lg">Nettoyer maintenant</span>
                            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <a href="/api/downloads/file" className="px-8 py-4 glass-panel rounded-2xl font-bold flex items-center gap-3 hover:bg-white/5 transition-colors">
                            <Download className="w-5 h-5 text-accent" />
                            <span className="text-gray-200">Version desktop</span>
                        </a>
                    </div>
                </div>

                <div className="flex-1 w-full lg:max-w-md relative">
                    <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full mix-blend-screen" />
                    <ThreeDFileIcon className="w-full h-[400px] md:h-[500px] relative z-10" />
                </div>
            </motion.section>

            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <FeatureCard
                    icon={<FileJson />}
                    title="Support multi-format"
                    desc="Images, videos, PDF, PPTX et fichiers texte peuvent etre traites dans une seule interface."
                />
                <FeatureCard
                    icon={<Zap />}
                    title="Optimisation intelligente"
                    desc="Le service allegue les fichiers quand c'est pertinent pour accelerer le partage et reduire le stockage."
                />
                <FeatureCard
                    icon={<ServerOff />}
                    title="Traitement maitrise"
                    desc="Le produit vise une execution sobre et controlee, avec un backend que tu peux heberger toi-meme."
                />
                <FeatureCard
                    icon={<Clock />}
                    title="Workflow rapide"
                    desc="Charge ton fichier, choisis les options utiles et recupere une version nettoyee en quelques etapes."
                />
            </motion.section>

            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

                <h2 className="text-3xl font-display font-bold text-white mb-6">A propos de MediaCleaner Redact Pro</h2>

                <div className="space-y-6 text-gray-300 text-lg leading-relaxed max-w-4xl relative z-10">
                    <p>
                        Chaque image, video ou document partage souvent plus d'informations que prevu. Les metadonnees
                        peuvent reveler l'auteur, la date, le logiciel utilise ou la localisation.
                    </p>
                    <p>
                        <strong className="text-white">MediaCleaner Redact Pro</strong> aide a reduire cette exposition
                        en supprimant les traces inutiles et en proposant un mode OCR pour masquer le texte visible
                        lorsque le niveau de confidentialite l'exige.
                    </p>
                    <p>
                        L'objectif est simple: une interface claire, un traitement local ou auto-heberge, et un
                        resultat exploitable sans bricolage.
                    </p>
                </div>
            </motion.section>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="glass-panel p-8 rounded-3xl border border-white/5 hover:border-primary/50 transition-colors duration-300 group">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:text-primary text-gray-400 transition-colors duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}
