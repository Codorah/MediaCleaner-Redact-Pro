import { motion } from 'framer-motion';
import { useState } from 'react';
import { Mail, Github, Linkedin, Send } from 'lucide-react';

const fieldClassName = "w-full bg-dark/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:border-primary transition-colors";

export default function SettingsTab() {
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [formSent, setFormSent] = useState(false);

    const handleSend = (event) => {
        event.preventDefault();
        const subject = `Contact depuis Cleaner Pro par ${contactForm.name}`;
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
            <h2 className="text-3xl font-display font-bold text-white mb-2">Parametres et infos</h2>
            <p className="text-gray-400 text-sm mb-8">Retrouve les infos produit, les liens de contact et les bonnes pratiques de confidentialite.</p>

            <div className="glass-panel rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-4">Confidentialite et stockage</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    <strong>Vie privee :</strong> l'application est pensee pour limiter au maximum l'exposition de tes
                    fichiers. Sur le web, les traitements passent par l'instance que tu deploies. En local, les
                    sorties et l'historique restent sur ton poste tant que tu ne les supprimes pas.
                </p>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                    <strong>Protection active :</strong> chaque upload passe dans un dossier temporaire isole, avec
                    limitation par IP, journaux de securite et possibilite d'activer un antivirus cote serveur sans
                    imposer de compte utilisateur.
                </p>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mt-6">
                    <div>
                        <span className="block text-white font-medium">Historique local</span>
                        <span className="text-xs text-gray-400">Active surtout en usage local. En production, il vaut mieux le desactiver publiquement.</span>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-semibold border border-accent/30">
                        Recommande
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-xl font-bold text-white mb-6">Equipe et contact</h3>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-primary/20">
                        EA
                    </div>
                    <div className="flex-1">
                        <h4 className="text-xl font-bold text-white">Elodie ATANA H. (Codorah)</h4>
                        <p className="text-primary font-medium text-sm mb-3">IT Project Manager et developpeuse full stack IA</p>
                        <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                            Profil produit et technique du projet. Cette section sert aussi de point de contact pour les
                            retours, la feuille de route et les demandes de deploiement.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="mailto:codorah@hotmail.com" className="text-gray-400 hover:text-white hover:scale-110 transition-all border border-white/10 p-2 rounded-lg bg-white/5" title="Email"><Mail className="w-5 h-5" /></a>
                            <a href="https://linkedin.com/in/codorah" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all border border-white/10 p-2 rounded-lg bg-white/5" title="LinkedIn"><Linkedin className="w-5 h-5" /></a>
                            <a href="https://github.com/Codorah" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all border border-white/10 p-2 rounded-lg bg-white/5" title="GitHub"><Github className="w-5 h-5" /></a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">FAQ et message rapide</h3>

                <div className="space-y-3 mb-8">
                    <details className="bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer group">
                        <summary className="font-medium text-white select-none">Que fait exactement le nettoyage ?</summary>
                        <p className="text-sm text-gray-400 mt-3 pl-2 border-l-2 border-primary leading-relaxed">
                            Le service peut supprimer les metadonnees, reduire la taille des medias et, selon l'option
                            choisie, masquer le texte visible sur certaines categories de fichiers.
                        </p>
                    </details>
                    <details className="bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer group">
                        <summary className="font-medium text-white select-none">Quelles protections sont actives sur le site ?</summary>
                        <p className="text-sm text-gray-400 mt-3 pl-2 border-l-2 border-primary leading-relaxed">
                            Le service applique des limites par IP, isole les traitements dans des dossiers temporaires,
                            ajoute des en-tetes HTTP de securite et peut brancher un scanner antivirus sur les uploads.
                        </p>
                    </details>
                    <details className="bg-white/5 p-4 rounded-xl border border-white/10 cursor-pointer group">
                        <summary className="font-medium text-white select-none">Pourquoi le mode OCR est-il plus lent ?</summary>
                        <p className="text-sm text-gray-400 mt-3 pl-2 border-l-2 border-accent leading-relaxed">
                            Le caviardage OCR analyse visuellement les pages, images ou frames video. C'est donc plus
                            gourmand en CPU et en memoire qu'un simple nettoyage de metadonnees.
                        </p>
                    </details>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                    <h4 className="font-bold text-white mb-2">Envoyer un message</h4>
                    <p className="text-sm text-gray-400 mb-6">Pour une question produit, un bug ou une aide au deploiement.</p>

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
                    (c) 2026 Cleaner Pro v2.0.0. Developpe par Codorah.
                </p>
            </div>
        </motion.div>
    );
}
