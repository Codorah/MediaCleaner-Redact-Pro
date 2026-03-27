import { motion } from "framer-motion";
import BottomNav from "./BottomNav";
import { ShieldAlert, Home, History, Settings, Sparkles } from "lucide-react";
import clsx from "clsx";

export default function TabLayout({ children, currentTab, onTabChange, resolvedTheme }) {
  const tabs = [
    { id: "home", label: "Accueil", icon: Home },
    { id: "redact", label: "Nettoyer", icon: ShieldAlert },
    { id: "history", label: "Suivi", icon: History },
    { id: "settings", label: "Infos", icon: Settings },
  ];

  const themeLabel = resolvedTheme === "light" ? "Mode clair" : "Mode sombre";

  return (
    <div className="app-shell min-h-screen w-full flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-18%] left-[-6%] h-[34rem] w-[34rem] rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute bottom-[-18%] right-[-8%] h-[28rem] w-[28rem] rounded-full bg-accent/14 blur-[110px]" />
      </div>

      <header className="hidden sm:flex items-center justify-between w-full max-w-7xl mx-auto px-6 pt-6 relative z-20">
        <div className="glass-panel glass-panel-solid w-full rounded-[28px] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_18px_30px_rgba(36,107,255,0.22)]">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="cp-label mb-1">Confidentialité appliquée</p>
              <h1 className="font-display font-bold text-xl cp-title">Cleaner Pro</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="cp-pill text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>{themeLabel}</span>
            </div>

            <nav className="flex gap-2 bg-[var(--app-card)] p-1 rounded-[22px] border border-[var(--app-border)]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={clsx(
                    "cp-nav-button px-4 py-2 rounded-2xl text-sm font-medium transition-all relative",
                    currentTab === tab.id && "is-active"
                  )}
                >
                  {currentTab === tab.id && (
                    <motion.div
                      layoutId="desktopActiveTab"
                      className="cp-nav-indicator absolute inset-0 rounded-2xl"
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
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10 pb-24 sm:pb-8 flex flex-col">
        {children}
      </main>

      <BottomNav currentTab={currentTab} onTabChange={onTabChange} />
    </div>
  );
}
