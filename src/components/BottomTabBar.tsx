import React from 'react';
import { Mic, Activity, History, Smartphone, Settings } from 'lucide-react';

interface BottomTabBarProps {
  currentTab: 'assistant' | 'task_monitor' | 'history' | 'bridge' | 'settings';
  setCurrentTab: (tab: 'assistant' | 'task_monitor' | 'history' | 'bridge' | 'settings') => void;
  activeTaskCount: number;
  language?: 'hi' | 'en';
}

interface TabItem {
  id: 'assistant' | 'task_monitor' | 'history' | 'bridge' | 'settings';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  setCurrentTab,
  activeTaskCount,
  language = 'hi',
}) => {
  const isHindi = language === 'hi';
  const TABS: TabItem[] = [
    { id: 'assistant', label: isHindi ? 'असिस्टेंट' : 'Assistant', icon: Mic },
    { id: 'task_monitor', label: isHindi ? 'मॉनिटर' : 'Monitor', icon: Activity, badge: activeTaskCount > 0 },
    { id: 'history', label: isHindi ? 'इतिहास' : 'History', icon: History },
    { id: 'bridge', label: isHindi ? 'ब्रिज' : 'Bridge', icon: Smartphone },
    { id: 'settings', label: isHindi ? 'सेटिंग्स' : 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070709]/95 backdrop-blur-md border-t border-[#27272A] pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className="min-h-[48px] flex flex-col items-center justify-center relative transition-colors focus:outline-none"
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'text-[#F5D061] scale-110' : 'text-[#71717A]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#F5D061] animate-ping" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-[#F5D061] font-semibold' : 'text-[#71717A]'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-[#D4AF37]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
