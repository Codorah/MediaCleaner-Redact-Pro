import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Github, Linkedin, Send } from 'lucide-react';

export default function SettingsTab() {
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [formSent, setFormSent] = useState(false);

    const handleSend = (e) => {
        e.preventDefault();
        const subject = `Contact depuis l'app MediaCleaner par ${contactForm.name}`;
        const body = `${contactForm.message}\n\nDe : ${contactForm.name} (${contactForm.email})`;
        window.location.href = `mailto:codorah@hotmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setFormSent(true);
        setTimeout(() => setFormSent(false), 5000);
        setContactForm({ name: '', email: '', message: '' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto py-12 w-full space-y-8"
        >
            <h2 className="text-3xl font-display font-bold text-white mb-2">Paramètres & Infos</h2>
            <p className="text-gray-400 text-sm mb-8">Gérez vos préférences, apprenez-en plus sur l'application et contactez-nous.</p>

            {/* Confidentités & Stockage */}
            <div className="glass-panel rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Confidentialité & Stockage Local</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    <strong>Politique de Cookies et Confidentialité :</strong> MediaCleaner Redact Pro met un point d'honneur à respecter votre vie privée. Vos fichiers sont traités localement. Nous ne collectons, ne stockons et ne revendons aucune de vos données personnelles. Les seuls "cookies" utilisés sont ceux strictement nécessaires au bon fonctionnement de la PWA (Progressive Web App) et aucune donnée de suivi publicitaire n'est injectée.
                </p>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mt-6">
                    <div>
                        <span className="block text-white font-medium">Historique des fichiers</span>
                        <span className="text-xs text-gray-400">Garder une trace locale des fichiers traités.</span>
                    </div>
                    <div className="w-14 h-8 rounded-full p-1 bg-accent relative cursor-pointer">
                        <div className="w-6 h-6 bg-white rounded-full shadow-md ml-auto" />
                    </div>
                </div>
            </div>

            {/* A propos du Fondateur */}
            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-xl font-bold text-white mb-6">L'équipe & Le Fondateur</h3>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary/20">
                        EA
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-white">Elodie ATANA H. (Codorah)</h4>
                        <p className="text-primary font-medium text-sm mb-3">IT Project Manager & Développeuse Full Stack IA</p>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                            Je suis une ingénieure en prompt junior et développeuse passionnée par la création de solutions numériques inclusives et ayant un fort impact social. J'accompagne la transformation digitale via le développement sur-mesure et l'Intelligence Artificielle.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="mailto:codorah@hotmail.com" className="text-gray-400 hover:text-white hover:scale-110 transition-all border border-white/10 p-2 rounded-lg bg-white/5" title="Email"><Mail className="w-5 h-5" /></a>
                            <a href="https://linkedin.com/in/codorah" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all border border-white/10 p-2 rounded-lg bg-white/5" title="LinkedIn"><Linkedin className="w-5 h-5" /></a>
                            <a href="https://github.com/Codorah" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all border border-white/10 p-2 rounded-lg bg-white/5" title="GitHub"><Github className="w-5 h-5" /></a>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ & Formulaire de contact */}
            <div className="glass-panel rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">FAQ & Contactez le Développeur</h3>

                <div className="space-y-3 mb-8">
                    <details className="bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer group">
                        <summary className="font-medium text-white select-none">Comment fonctionne le nettoyage de métadonnées ?</summary>
                        <p className="text-sm text-gray-400 mt-3 pl-2 border-l-2 border-primary leading-relaxed">Le processus détruit de manière sécurisée les métadonnées cachées (données d'appareil photo, GPS, nom d'auteur, etc.) incluses dans vos images et PDF, rendant ces fichiers anonymes tout en gardant leur aspect initial.</p>
                    </details>
                    <details className="bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer group">
                        <summary className="font-medium text-white select-none">Que se passe-t-il lorsque je choisis de masquer le texte (Redact) ?</summary>
                        <p className="text-sm text-gray-400 mt-3 pl-2 border-l-2 border-accent leading-relaxed">Si activée, cette option emploie une technique pour remplacer le contenu textuel jugé sensible par des blocs noirs indéchiffrables avant la compression finale.</p>
                    </details>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h4 className="font-bold text-white mb-2">Envoyer un message à Elodie (Codorah)</h4>
                    <p className="text-sm text-gray-400 mb-6">Une question commerciale, un rapport de bug, ou une idée de fonctionnalité ? N'hésitez pas !</p>

                    <form onSubmit={handleSend} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Votre Nom"
                                required
                                value={contactForm.name}
                                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
                            />
                            <input
                                type="email"
                                placeholder="Votre E-mail"
                                required
                                value={contactForm.email}
                                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <textarea
                            placeholder="Votre message..."
                            required
                            rows={4}
                            value={contactForm.message}
                            onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                            className="w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors resize-none"
                        ></textarea>

                        <button
                            type="submit"
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-primary/90 transition-all hover:scale-[1.01]"
                        >
                            <Send className="w-5 h-5" />
                            {formSent ? "Ouverture de votre messagerie..." : "Envoyer le message"}
                        </button>
                    </form>
                </div>
            </div>

            <div className="text-center pb-6">
                <p className="text-gray-600 text-xs text-center inline-block bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    © 2026 MediaCleaner Redact Pro v2.0.0. Développé par Codorah.
                </p>
            </div>
        </motion.div>
    );
}
