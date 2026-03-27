import { motion } from "framer-motion";
import { Home, ShieldAlert, History, Settings } from "lucide-react";
import clsx from "clsx";

export default function BottomNav({ currentTab, onTabChange }) {
  const tabs = [
    { id: "home", label: "Accueil", icon: Home },
    { id: "redact", label: "Nettoyer", icon: ShieldAlert },
    { id: "history", label: "Suivi", icon: History },
    { id: "settings", label: "Réglages", icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 p-4 pb-6 sm:hidden">
      <div className="glass-panel glass-panel-solid cp-mobile-nav rounded-[26px] px-2 py-2">
        <div className="flex justify-around items-center">
          {tabs.map((tab) => {
            const isActive = tab.id === currentTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={clsx("cp-nav-button relative flex flex-col items-center gap-1 p-2 min-w-[64px]", isActive && "is-active")}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="cp-nav-indicator absolute inset-0 rounded-[18px]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.div animate={{ y: isActive ? -3 : 0 }} className="relative z-10 transition-colors">
                  <Icon className="w-5 h-5" />
                </motion.div>

                <span className="relative z-10 text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
