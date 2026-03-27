import { useEffect, useState } from "react";
import TabLayout from "./components/TabLayout";
import HomeTab from "./tabs/HomeTab";
import RedactTab from "./tabs/RedactTab";
import HistoryTab from "./tabs/HistoryTab";
import SettingsTab from "./tabs/SettingsTab";

const THEME_STORAGE_KEY = "cleaner-pro-theme";
const HISTORY_ENABLED_KEY = "cleaner-pro-history-enabled";
const HISTORY_ITEMS_KEY = "cleaner-pro-history";
const AVAILABLE_THEMES = new Set(["system", "dark", "light"]);

function readThemePreference() {
  if (typeof window === "undefined") {
    return "system";
  }
  const savedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return AVAILABLE_THEMES.has(savedPreference) ? savedPreference : "system";
}

function resolveTheme(themePreference) {
  if (typeof window === "undefined") {
    return "dark";
  }
  if (themePreference === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return themePreference;
}

function readHistoryEnabled() {
  if (typeof window === "undefined") {
    return true;
  }
  const savedValue = window.localStorage.getItem(HISTORY_ENABLED_KEY);
  return savedValue === null ? true : savedValue !== "false";
}

function readHistoryItems() {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HISTORY_ITEMS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState("home");
  const [themePreference, setThemePreference] = useState(readThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(readThemePreference()));
  const [historyEnabled, setHistoryEnabled] = useState(readHistoryEnabled);
  const [historyItems, setHistoryItems] = useState(readHistoryItems);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const nextTheme = themePreference === "system" ? (mediaQuery.matches ? "dark" : "light") : themePreference;
      setResolvedTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.style.colorScheme = nextTheme;
      window.localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    };

    applyTheme();

    mediaQuery.addEventListener?.("change", applyTheme);
    mediaQuery.addListener?.(applyTheme);
    return () => {
      mediaQuery.removeEventListener?.("change", applyTheme);
      mediaQuery.removeListener?.(applyTheme);
    };
  }, [themePreference]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(HISTORY_ENABLED_KEY, String(historyEnabled));
  }, [historyEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(HISTORY_ITEMS_KEY, JSON.stringify(historyItems));
  }, [historyItems]);

  const handleStartRedact = () => {
    setCurrentTab("redact");
  };

  const handleAddHistoryEntry = (entry) => {
    if (!historyEnabled) {
      return;
    }
    setHistoryItems((currentItems) => [entry, ...currentItems].slice(0, 20));
  };

  const handleClearHistory = () => {
    setHistoryItems([]);
  };

  return (
    <TabLayout currentTab={currentTab} onTabChange={setCurrentTab} resolvedTheme={resolvedTheme}>
      {currentTab === "home" && <HomeTab onStart={handleStartRedact} />}
      {currentTab === "redact" && <RedactTab historyEnabled={historyEnabled} onAddHistoryEntry={handleAddHistoryEntry} />}
      {currentTab === "history" && <HistoryTab historyEnabled={historyEnabled} historyItems={historyItems} onClearHistory={handleClearHistory} />}
      {currentTab === "settings" && (
        <SettingsTab
          themePreference={themePreference}
          resolvedTheme={resolvedTheme}
          onThemePreferenceChange={setThemePreference}
          historyEnabled={historyEnabled}
          onHistoryEnabledChange={setHistoryEnabled}
          historyCount={historyItems.length}
        />
      )}
    </TabLayout>
  );
}
