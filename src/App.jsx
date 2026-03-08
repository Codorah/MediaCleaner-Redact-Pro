import { useState } from "react";
import TabLayout from "./components/TabLayout";
import HomeTab from "./tabs/HomeTab";
import RedactTab from "./tabs/RedactTab";
import HistoryTab from "./tabs/HistoryTab";
import SettingsTab from "./tabs/SettingsTab";

export default function App() {
  const [currentTab, setCurrentTab] = useState('home');

  const handleStartRedact = () => {
    setCurrentTab('redact');
  };

  return (
    <TabLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'home' && <HomeTab onStart={handleStartRedact} />}
      {currentTab === 'redact' && <RedactTab />}
      {currentTab === 'history' && <HistoryTab />}
      {currentTab === 'settings' && <SettingsTab />}
    </TabLayout>
  );
}
