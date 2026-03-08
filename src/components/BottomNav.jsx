import { motion } from 'framer-motion';
import { Home, ShieldAlert, History, Settings } from 'lucide-react';
import clsx from 'clsx';

export default function BottomNav({ currentTab, onTabChange }) {
    const tabs = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'redact', label: 'Redact', icon: ShieldAlert },
        { id: 'history', label: 'History', icon: History },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 pb-6 bg-dark/80 backdrop-blur-xl border-t border-white/10 sm:hidden">
            <div className="flex justify-around items-center">
                {tabs.map((tab) => {
                    const isActive = tab.id === currentTab;
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center gap-1 p-2 min-w-[64px]"
                        >
                            <motion.div
                                animate={{
                                    y: isActive ? -4 : 0,
                                    color: isActive ? '#FF3B5C' : '#9CA3AF'
                                }}
                                className={clsx("transition-colors")}
                            >
                                <Icon className={clsx("w-6 h-6", isActive ? "text-primary" : "text-gray-400")} />
                            </motion.div>

                            <span className={clsx(
                                "text-[10px] font-medium transition-colors duration-300",
                                isActive ? "text-primary" : "text-gray-500"
                            )}>
                                {tab.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute -top-1 w-1 h-1 rounded-full bg-primary"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
