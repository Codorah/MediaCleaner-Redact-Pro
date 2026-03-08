import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from './BottomNav';
import { ShieldAlert, Home, History, Settings } from 'lucide-react';
import clsx from 'clsx';

export default function TabLayout({ children, currentTab, onTabChange }) {
    const tabs = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'redact', label: 'Redact', icon: ShieldAlert },
        { id: 'history', label: 'History', icon: History },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-dark w-full flex flex-col relative overflow-x-hidden">
            {/* Dynamic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px]" />
            </div>

            {/* Desktop Sidebar / Header */}
            <header className="hidden sm:flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-6 relative z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="font-display font-bold text-lg text-white">MediaCleaner Redact Pro</h1>
                </div>

                <nav className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={clsx(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-all relative",
                                currentTab === tab.id ? "text-white" : "text-gray-400 hover:text-white"
                            )}
                        >
                            {currentTab === tab.id && (
                                <motion.div
                                    layoutId="desktopActiveTab"
                                    className="absolute inset-0 bg-primary/20 border border-primary/50 rounded-xl"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pb-24 sm:pb-8 flex flex-col">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <BottomNav currentTab={currentTab} onTabChange={onTabChange} />
        </div>
    );
}
