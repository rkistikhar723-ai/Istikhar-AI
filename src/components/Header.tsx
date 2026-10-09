import React from 'react';
import { Volume2, VolumeX, Shield, Smartphone, Terminal, History, Settings, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: 'assistant' | 'task_monitor' | 'history' | 'bridge' | 'settings';
  setCurrentTab: (tab: 'assistant' | 'task_monitor' | 'history' | 'bridge' | 'settings') => void;
  voiceResponseEnabled: boolean;
  onToggleVoiceResponse: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  geminiConfigured?: boolean;
  language?: 'hi' | 'en';
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  voiceResponseEnabled,
  onToggleVoiceResponse,
  isListening,
  isSpeaking,
  geminiConfigured = false,
  language = 'hi',
}) => {
  const isHindi = language === 'hi';
  return (
    <header className="sticky top-0 z-40 bg-[#070709]/90 backdrop-blur-md border-b border-[#2A2310] transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F5D061] via-[#D4AF37] to-[#785E15] p-[1px] shadow-sm shadow-[#D4AF37]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0C0B0E] rounded-[11px] flex items-center justify-center">
              <span className="font-display font-bold text-sm tracking-wider text-[#F5D061]">IA</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold tracking-widest text-gold-gradient uppercase whitespace-nowrap">
                ISTIKHAR AI
              </h1>
            </div>
            <p className="text-[10px] tracking-wider text-[#A1A1AA] uppercase font-sans">
              {isHindi ? 'एंड्रॉइड पर्सनल इंटेलिजेंस' : 'Android Personal Intelligence'}
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#121217] p-1 rounded-xl border border-[#27272A]/80">
          <button
            onClick={() => setCurrentTab('assistant')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              currentTab === 'assistant'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            {isHindi ? 'असिस्टेंट' : 'Assistant'}
          </button>
          <button
            onClick={() => setCurrentTab('task_monitor')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              currentTab === 'task_monitor'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            {isHindi ? 'टास्क मॉनिटर' : 'Task Monitor'}
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              currentTab === 'history'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            {isHindi ? 'इतिहास' : 'History'}
          </button>
          <button
            onClick={() => setCurrentTab('bridge')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              currentTab === 'bridge'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            {isHindi ? 'एंड्रॉइड ब्रिज' : 'Android Bridge'}
          </button>
          <button
            onClick={() => setCurrentTab('settings')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
              currentTab === 'settings'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            {isHindi ? 'सेटिंग्स' : 'Settings'}
          </button>
        </nav>

        {/* Right: Voice Response Toggle & Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Engine Status Badge */}
          <button
            onClick={() => setCurrentTab('settings')}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all ${
              geminiConfigured
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-[#181820] border-[#2A2310] text-[#D4AF37] hover:border-[#D4AF37]/50'
            }`}
            title={geminiConfigured ? (isHindi ? 'जेमिनी 3.8 सर्वर पर सक्रिय' : 'Gemini 3.8 Flash active on server') : (isHindi ? 'स्थानीय इंजन सक्रिय' : 'Local Engine active')}
          >
            <Sparkles className="w-3 h-3 text-[#F5D061]" />
            <span>{geminiConfigured ? 'Gemini 3.8' : (isHindi ? 'स्थानीय इंजन' : 'Local Engine')}</span>
          </button>

          {/* Active Audio Speech Status */}
          {isSpeaking && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#F5D061] px-2.5 py-1 bg-[#231B08] border border-[#5C4713] rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5D061] animate-ping" />
              <span>{isHindi ? 'बोल रहा हूँ' : 'Speaking'}</span>
            </div>
          )}

          {isListening && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 px-2.5 py-1 bg-rose-950/40 border border-rose-900/60 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{isHindi ? 'सुन रहा हूँ' : 'Listening'}</span>
            </div>
          )}

          {/* Voice Response Toggle Button (Feature 8) */}
          <button
            onClick={onToggleVoiceResponse}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
              voiceResponseEnabled
                ? 'bg-[#1C1709] border-[#D4AF37]/60 text-[#F5D061] hover:bg-[#2A220C]'
                : 'bg-[#121215] border-[#27272A] text-[#71717A] hover:text-[#A1A1AA]'
            }`}
            title={voiceResponseEnabled ? 'Voice responses active (Click to mute)' : 'Voice responses muted (Click to enable)'}
            aria-label="Toggle voice responses"
          >
            {voiceResponseEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                <span className="hidden sm:inline">Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span className="hidden sm:inline">Voice Off</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
