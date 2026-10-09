import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Volume2, 
  Vibrate, 
  RotateCcw, 
  Sparkles, 
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  KeyRound,
  FileText,
  Trash2,
  Server,
  Wifi
} from 'lucide-react';
import { AssistantSettings } from '../types/assistant';
import { geminiAdapter, GeminiServerStatus, getApiBaseUrl } from '../services/geminiService';
import { vaultService, AssistantNote } from '../services/vaultService';

interface SettingsScreenProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => void;
  onResetDefaults: () => void;
  availableVoices: SpeechSynthesisVoice[];
  onTestVoice: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
  availableVoices,
  onTestVoice,
}) => {
  const [serverStatus, setServerStatus] = useState<GeminiServerStatus>(geminiAdapter.getCachedStatus());
  const [copiedKey, setCopiedKey] = useState(false);
  const [notes, setNotes] = useState<AssistantNote[]>([]);
  const [backendUrl, setBackendUrl] = useState<string>(() => getApiBaseUrl());
  const [isSavedUrl, setIsSavedUrl] = useState(false);
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  useEffect(() => {
    geminiAdapter.refreshStatus().then(setServerStatus);
    setNotes(vaultService.getNotes());
  }, []);

  const handleSaveBackendUrl = async () => {
    setIsCheckingBackend(true);
    const cleaned = backendUrl.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined') {
      localStorage.setItem('istikhar_backend_url', cleaned);
      try {
        const bridge = (window as any).IstikharNativeBridge;
        if (bridge?.setServerUrl) {
          bridge.setServerUrl(cleaned);
        }
      } catch {}
    }
    const updated = await geminiAdapter.refreshStatus();
    setServerStatus(updated);
    setIsCheckingBackend(false);
    setIsSavedUrl(true);
    setTimeout(() => setIsSavedUrl(false), 2500);
  };

  const copyEnvVar = () => {
    navigator.clipboard.writeText('GEMINI_API_KEY');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleClearNotes = () => {
    vaultService.clearAllNotes();
    setNotes([]);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-3 border-b border-[#27272A] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="font-display text-lg font-bold text-[#F4F4F5]">
              {settings.language === 'hi' ? 'ISTIKHAR AI सेटिंग्स' : 'ISTIKHAR AI Settings'}
            </h2>
          </div>
          <p className="text-xs text-[#71717A] mt-0.5">
            {settings.language === 'hi'
              ? 'भाषा चयन, आवाज़ प्राथमिकताएं, जेमिनी एआई ब्रिज और मेमोरी वॉल्ट।'
              : 'Language selector, voice output preferences, Gemini API bridge, and local memory vault.'}
          </p>
        </div>

        <button
          onClick={onResetDefaults}
          className="px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#121217] text-xs text-[#A1A1AA] hover:text-[#F4F4F5] flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{settings.language === 'hi' ? 'डिफ़ॉल्ट रीसेट करें' : 'Reset Defaults'}</span>
        </button>
      </div>

      {/* Language Selector (Feature 1, 4, 5: Hindi default with English optional) */}
      <div className="bg-[#0E0E12] border border-[#D4AF37]/40 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg shadow-black/40">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                {settings.language === 'hi' ? 'प्राथमिक भाषा (Primary Language)' : 'Primary Language'}
              </h3>
              <span className="text-[10px] bg-[#1C1709] border border-[#5C4713] text-[#F5D061] px-2 py-0.5 rounded font-medium">
                {settings.language === 'hi' ? 'डिफ़ॉल्ट: हिन्दी' : 'Active: English'}
              </span>
            </div>
            <p className="text-xs text-[#71717A]">
              {settings.language === 'hi'
                ? 'सभी एआई उत्तर, आवाज़ उच्चारण और टास्क स्टेटस इसी भाषा में होंगे।'
                : 'All AI responses, spoken speech, and task status updates will use this language.'}
            </p>
          </div>
        </div>

        {/* Segmented Language Selector Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onUpdateSettings({ language: 'hi' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.language === 'hi'
                ? 'bg-gradient-to-r from-[#2A2109] to-[#1A1506] border-[#D4AF37] ring-1 ring-[#D4AF37]/50 text-[#F5D061]'
                : 'bg-[#121217] border-[#27272A] text-[#A1A1AA] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">हिन्दी (Hindi)</span>
              {settings.language === 'hi' && <Check className="w-4 h-4 text-[#F5D061]" />}
            </div>
            <p className="text-[11px] text-[#A1A1AA] mt-1">
              डिफ़ॉल्ट: हिंदी और हिंग्लिश में समझें और प्राकृतिक हिंदी में बोलें
            </p>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ language: 'en' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.language === 'en'
                ? 'bg-gradient-to-r from-[#2A2109] to-[#1A1506] border-[#D4AF37] ring-1 ring-[#D4AF37]/50 text-[#F5D061]'
                : 'bg-[#121217] border-[#27272A] text-[#A1A1AA] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">English (अंग्रेज़ी)</span>
              {settings.language === 'en' && <Check className="w-4 h-4 text-[#F5D061]" />}
            </div>
            <p className="text-[11px] text-[#A1A1AA] mt-1">
              Optional: AI responses and status updates in English
            </p>
          </button>
        </div>
      </div>

      {/* Voice & Speech Synthesis Settings (Feature 2 & 3) */}
      <div className="bg-[#0E0E12] border border-[#27272A] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                {settings.language === 'hi' ? 'आवाज़ में जवाब (Speech Synthesis)' : 'Voice Response Synthesis'}
              </h3>
              <p className="text-xs text-[#71717A]">
                {settings.language === 'hi'
                  ? 'प्राकृतिक हिंदी में बोलकर उत्तर दें (जब सक्रिय हो)'
                  : 'Speak assistant answers aloud using browser speech synthesis'}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.voiceResponseEnabled}
              onChange={(e) => onUpdateSettings({ voiceResponseEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#27272A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4AF37]" />
          </label>
        </div>

        {settings.voiceResponseEnabled && (
          <div className="pt-3 border-t border-[#1F1F26] space-y-4">
            {/* Voice Selector */}
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                {settings.language === 'hi' ? 'सिंथेसाइज़र आवाज़ (Voice Engine)' : 'Speech Synthesizer Voice'} ({availableVoices.length} detected)
              </label>
              <select
                value={settings.selectedVoiceURI}
                onChange={(e) => onUpdateSettings({ selectedVoiceURI: e.target.value })}
                className="w-full h-10 px-3 bg-[#141419] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] outline-none focus:border-[#D4AF37]"
              >
                <option value="">
                  {settings.language === 'hi' ? 'प्राकृतिक हिन्दी आवाज़ (Auto Hindi Natural)' : 'Default System Natural Voice'}
                </option>
                {/* Show Hindi voices first, then others */}
                {availableVoices
                  .filter((v) => v.lang.startsWith('hi') || v.lang === 'hi-IN')
                  .map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      ⭐ {voice.name} ({voice.lang}) - Hindi
                    </option>
                  ))}
                {availableVoices
                  .filter((v) => !v.lang.startsWith('hi') && v.lang !== 'hi-IN')
                  .map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
              </select>
            </div>

            {/* Speech Rate & Pitch sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-[#A1A1AA] mb-1">
                  <span>{settings.language === 'hi' ? 'बोलने की गति (Speed)' : 'Speech Rate (Speed)'}</span>
                  <span className="font-mono text-[#D4AF37]">{settings.speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.1"
                  value={settings.speechRate}
                  onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
                  className="w-full accent-[#D4AF37]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#A1A1AA] mb-1">
                  <span>{settings.language === 'hi' ? 'आवाज़ की पिच (Pitch)' : 'Voice Pitch'}</span>
                  <span className="font-mono text-[#D4AF37]">{settings.speechPitch.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.2"
                  step="0.1"
                  value={settings.speechPitch}
                  onChange={(e) => onUpdateSettings({ speechPitch: parseFloat(e.target.value) })}
                  className="w-full accent-[#D4AF37]"
                />
              </div>
            </div>

            <button
              onClick={onTestVoice}
              className="text-xs text-[#D4AF37] hover:text-[#FFF1B8] font-medium flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{settings.language === 'hi' ? 'हिंदी आवाज़ परीक्षण (Test Voice)' : 'Test Audio Playback'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Real Local Notes & Memory Vault (Feature 3 & 5) */}
      <div className="bg-[#0E0E12] border border-[#27272A] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#1F1F26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                Assistant Local Memory Vault
              </h3>
              <p className="text-xs text-[#71717A]">
                {notes.length} note(s) stored locally in browser storage
              </p>
            </div>
          </div>

          {notes.length > 0 && (
            <button
              onClick={handleClearNotes}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Vault</span>
            </button>
          )}
        </div>

        {notes.length === 0 ? (
          <p className="text-xs text-[#71717A]">
            No notes saved. Speak or type <code className="text-[#F5D061]">"note: remember groceries"</code> to save a note.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {notes.map((n) => (
              <div key={n.id} className="p-2 bg-[#121217] rounded-lg border border-[#27272A] text-xs flex justify-between items-center">
                <span className="text-[#E4E4E7]">{n.content}</span>
                <span className="text-[10px] text-[#71717A] font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tactile & Interaction Settings */}
      <div className="bg-[#0E0E12] border border-[#27272A] rounded-2xl p-4 sm:p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#F4F4F5] pb-2 border-b border-[#1F1F26]">
          Tactile Feedback
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Vibrate className="w-4 h-4 text-[#A1A1AA]" />
            <div>
              <p className="text-xs font-medium text-[#F4F4F5]">Haptic Vibration</p>
              <p className="text-[11px] text-[#71717A]">Vibrate device gently on voice command trigger</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.hapticFeedback}
            onChange={(e) => onUpdateSettings({ hapticFeedback: e.target.checked })}
            className="w-4 h-4 accent-[#D4AF37]"
          />
        </div>
      </div>

      {/* Secure Gemini API Integration Status & Setup Instructions (Feature 6 & 7) */}
      <div className="bg-[#0E0E12] border border-[#2A2310] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#D4AF37]/40 flex items-center justify-center text-[#F5D061] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F4F4F5]">
                  Gemini API Server Integration
                </h3>
                {serverStatus.configured ? (
                  <span className="text-[10px] bg-emerald-950/50 border border-emerald-800 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Connected ({serverStatus.model})
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-950/50 border border-amber-800 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Key Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Endpoint: <code className="text-[#F5D061] font-mono text-[11px]">POST /api/gemini/plan</code> (Server-Side Proxy).
                The client browser never sees or stores your API key.
              </p>
            </div>
          </div>
        </div>

        {/* Clear Setup Instructions if not configured (Feature 7) */}
        {!serverStatus.configured ? (
          <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>How to Configure Gemini API</span>
            </div>
            <ol className="list-decimal list-inside text-xs text-[#D4D4D8] space-y-1.5 leading-relaxed">
              <li>Open the <strong>Secrets</strong> panel in Google AI Studio.</li>
              <li>
                Add a new secret named <code className="text-[#F5D061] font-mono font-semibold">GEMINI_API_KEY</code> with your Google AI Studio API key.
              </li>
              <li>The server will automatically detect the key and use <strong>Gemini 3.8 Flash</strong> for command reasoning.</li>
            </ol>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={copyEnvVar}
                className="text-xs font-medium text-[#D4AF37] hover:text-[#FFF1B8] flex items-center gap-1 px-2.5 py-1 bg-[#1A180E] border border-[#5C4713] rounded-lg transition-colors"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy Secret Name (GEMINI_API_KEY)'}</span>
              </button>
            </div>

            <p className="text-[11px] text-[#A1A1AA] italic">
              Note: While unconfigured, ISTIKHAR AI's local deterministic engine is active, executing calculations, timers, notes, and Android bridge blueprints with zero downtime.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-xs text-[#D4D4D8] space-y-1">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Gemini 3.8 Flash Active</span>
            </div>
            <p className="text-xs text-[#A1A1AA]">
              Natural language tasks are reasoned by Gemini on the server and verified through the 5-stage task monitor.
            </p>
          </div>
        )}
      </div>

      {/* Backend Server Connection (Android APK & Remote Proxy) */}
      <div className="bg-[#0E0E12] border border-[#27272A] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#181820] border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F5]">
                {settings.language === 'hi' ? 'बैकएंड सर्वर कनेक्शन (Backend Server Endpoint)' : 'Backend Server Endpoint'}
              </h3>
              <p className="text-xs text-[#71717A]">
                {settings.language === 'hi'
                  ? 'जेमिनी 3.8 फ्लैश एआई प्रॉक्सी और सुरक्षित सर्वर संचार के लिए।'
                  : 'Configures backend URL for Gemini 3.8 Flash proxy requests.'}
              </p>
            </div>
          </div>

          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
            serverStatus.configured 
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' 
              : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700'
          }`}>
            {serverStatus.configured ? 'ऑनलाइन (Online)' : 'ऑफ़लाइन / लोकल मोड'}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          <label className="block text-xs text-[#A1A1AA]">
            {settings.language === 'hi'
              ? 'बैकएंड सर्वर URL (खाली छोड़ने पर स्टैंडअलोन लोकल एआई मोड चलेगा):'
              : 'Server Base URL (leave blank for standalone offline local AI mode):'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="उदा. http://192.168.1.5:3000 या https://your-server.com"
              className="flex-1 px-3 py-2 bg-[#121217] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#52525B] focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              onClick={handleSaveBackendUrl}
              disabled={isCheckingBackend}
              className="px-3 py-2 bg-[#1C1709] border border-[#5C4713] text-[#F5D061] text-xs font-medium rounded-xl hover:bg-[#2A2109] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>{isCheckingBackend ? 'जांच...' : isSavedUrl ? 'सहेजा गया!' : 'सहेजें व जांचें'}</span>
            </button>
          </div>
          <p className="text-[11px] text-[#71717A] leading-relaxed">
            {settings.language === 'hi'
              ? '💡 एंड्रॉइड APK में सभी स्थानीय फीचर्स (वॉइस, स्पीच, नोट्स, कैलकुलेटर, कैमरा, हार्डवेयर इंटेंट) बिना इंटरनेट के 100% ऑफ़लाइन काम करते हैं। जेमिनी एआई के लिए अपने सर्वर का पता यहां जोड़ें।'
              : '💡 In the Android APK, all local features (Voice, Speech, Vault, Calculations, Camera, Hardware Intents) work 100% offline. Connect your server URL here to route tasks through Gemini 3.8 Flash.'}
          </p>
        </div>
      </div>

      {/* How to Run ISTIKHAR AI Guide (Feature 12) */}
      <div className="bg-[#0E0E12] border border-[#27272A] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-[#F4F4F5]">
            How to Run & Deploy ISTIKHAR AI
          </h3>
        </div>

        <div className="space-y-2 text-xs text-[#A1A1AA] leading-relaxed">
          <p>
            1. <strong>Local Full-Stack Server:</strong> Run <code className="text-[#F5D061] font-mono">npm run dev</code> to start the Express server and Vite on port 3000.
          </p>
          <p>
            2. <strong>Production Build:</strong> Run <code className="text-[#F5D061] font-mono">npm run build</code> to produce static assets in <code className="text-[#F5D061] font-mono">dist/</code>.
          </p>
          <p>
            3. <strong>Android Native Companion:</strong> Check the <em>Android Bridge</em> tab to view the Kotlin service for physical device hardware automation.
          </p>
        </div>
      </div>
    </div>
  );
};
