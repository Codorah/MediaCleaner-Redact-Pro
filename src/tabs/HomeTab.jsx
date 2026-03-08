import { motion } from 'framer-motion';
import ThreeDFileIcon from '../components/3DFileIcon';
import { ArrowRight, Download, ShieldCheck, Zap, FileJson, Clock, ServerOff } from 'lucide-react';

export default function HomeTab({ onStart }) {
    return (
        <div className="w-full flex flex-col gap-24">
            {/* Hero Section */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row items-center justify-between min-h-[70vh] gap-12 mt-12"
            >
                <div className="flex-1 space-y-8 max-w-2xl relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase">
                        <ShieldCheck className="w-4 h-4" />
                        Confidentialité Absolue
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight text-white">
                        Sécurisez votre <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Empreinte Numérique</span>
                    </h1>

                    <p className="text-xl text-gray-400 leading-relaxed font-medium">
                        MediaCleaner Redact Pro est un logiciel de bureau conçu pour sécuriser vos documents en supprimant l'intégralité du texte visible et des métadonnées cachées.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <button
                            onClick={onStart}
                            className="group relative px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-3 overflow-hidden shadow-[0_0_40px_rgba(255,59,92,0.4)] hover:shadow-[0_0_60px_rgba(255,59,92,0.6)] transition-all hover:scale-105 active:scale-95"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative z-10 text-lg">Nettoyer Maintenant</span>
                            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <a href="#desktop" className="px-8 py-4 glass-panel rounded-2xl font-bold flex items-center gap-3 hover:bg-white/5 transition-colors">
                            <Download className="w-5 h-5 text-accent" />
                            <span className="text-gray-200">Version Desktop</span>
                        </a>
                    </div>
                </div>

                <div className="flex-1 w-full lg:max-w-md relative">
                    <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full mix-blend-screen" />
                    <ThreeDFileIcon className="w-full h-[400px] md:h-[500px] relative z-10" />
                </div>
            </motion.section>

            {/* Feature Grid based on user text */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                <FeatureCard
                    icon={<FileJson />}
                    title="Support Multi-Format"
                    desc="Cet outil polyvalent traite divers formats, tels que les vidéos, les photos et les fichiers PDF, afin de garantir un anonymat total avant tout partage."
                />
                <FeatureCard
                    icon={<Zap />}
                    title="Optimisation du Stockage"
                    desc="En plus de protéger la vie privée, l'application optimise l'espace en réduisant considérablement la taille des fichiers après suppression des données superflues."
                />
                <FeatureCard
                    icon={<ServerOff />}
                    title="Traitement Hors Ligne"
                    desc="Fonctionne de manière totalement hors ligne pour une sécurité absolue. Zéro upload vers le Cloud, vos données privées ne quittent jamais votre appareil."
                />
                <FeatureCard
                    icon={<Clock />}
                    title="Rapidité Inégalée"
                    desc="Son interface intuitive permet un traitement rapide en un clic, rendant l'anonymisation de fichiers volumineux immédiate et sans effort."
                />
            </motion.section>

            {/* Large Documentation Block */}
            <motion.section
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />

                <h2 className="text-3xl font-display font-bold text-white mb-6">À propos de MediaCleaner Redact Pro</h2>

                <div className="space-y-6 text-gray-300 text-lg leading-relaxed max-w-4xl relative z-10">
                    <p>
                        Dans le monde connecté d'aujourd'hui, chaque fichier que nous partageons (une simple photo de famille, une vidéo, ou un document PDF) transporte une mine d'informations appelées "métadonnées". Ces données cachées révèlent l'endroit où la photo a été prise (coordonnées GPS), le modèle de votre caméra, la date exacte, et parfois même votre identité ou les logiciels utilisés.
                    </p>
                    <p>
                        <strong className="text-white">MediaCleaner Redact Pro</strong> s'impose comme la solution logicielle libre et définitive pour effacer toute trace numérique sensible de vos contenus multimédias. Que vous soyez un professionnel (journaliste, avocat, activiste) manipulant des dossiers confidentiels, ou un particulier souhaitant protéger son intimité sur les réseaux sociaux, ce logiciel garantit un anonymat total.
                    </p>
                    <p>
                        Par ailleurs, l'outil propose des fonctionnalités avancées d'<strong className="text-accent hover:text-white transition-colors">OCR (Reconnaissance Optique de Caractères)</strong> pour censurer et caviarder le texte visible à l'intérieur de vos images et documents. Une fois nettoyé, non seulement votre fichier devient anonyme et sécurisé, mais il est également allégé grâce à des algorithmes d'optimisation de taille de fichier pointus, ce qui facilite grandement ses échanges via email ou messagerie.
                    </p>
                    <p>
                        Conçue autour d'une interface de nouvelle génération <em>"Cyber Clean 2026"</em>, l'application lie performance et expérience utilisateur. Simple, épurée et entièrement locale.
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
