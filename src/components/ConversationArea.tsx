import React, { useRef, useEffect } from 'react';
import { 
  Volume2, 
  Copy, 
  Check, 
  Sparkles, 
  User, 
  Smartphone, 
  CheckCircle2, 
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ChatMessage } from '../types/assistant';

interface ConversationAreaProps {
  messages: ChatMessage[];
  onSpeakText: (text: string) => void;
  onSelectPrompt: (prompt: string) => void;
  isProcessing: boolean;
  language?: 'hi' | 'en';
}

export const ConversationArea: React.FC<ConversationAreaProps> = ({
  messages,
  onSpeakText,
  onSelectPrompt,
  isProcessing,
  language = 'hi',
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const isHindi = language === 'hi';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SUGGESTED_COMMANDS = isHindi
    ? [
        { label: '340 का 25% कितना होगा', type: 'web', desc: 'गणितीय गणना' },
        { label: 'नोट लिखो: ज़रूरी मीटिंग है', type: 'web', desc: 'मेमोरी वॉल्ट' },
        { label: '30 सेकंड का टाइमर लगाओ', type: 'web', desc: 'लाइव टाइमर' },
        { label: 'ब्लूटूथ चालू करो', type: 'native', desc: 'हार्डवेयर सेटिंग्स' },
        { label: 'फोटो खींचो', type: 'native', desc: 'कैमरा कैप्चर' },
        { label: 'स्क्रीन पढ़ो', type: 'native', desc: 'एक्सेसिबिलिटी इंस्पेक्शन' },
      ]
    : [
        { label: 'Calculate 25% of 340', type: 'web', desc: 'Browser Math' },
        { label: 'Take a note: Project review at 4 PM', type: 'web', desc: 'Assistant Note' },
        { label: 'Set timer for 30 seconds', type: 'web', desc: 'Live Timer' },
        { label: 'Turn on Bluetooth', type: 'native', desc: 'Hardware Setting' },
        { label: 'Take a photo', type: 'native', desc: 'Camera Capture' },
        { label: 'Read current screen', type: 'native', desc: 'Accessibility Inspection' },
      ];

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden">
      {/* Messages Scroll Container */}
      <div className="overflow-y-auto px-4 py-4 space-y-4 max-h-[420px] sm:max-h-[480px]">
        {messages.length === 0 ? (
          <div className="py-8 sm:py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#121217] border border-[#D4AF37]/30 flex items-center justify-center mb-4 shadow-lg shadow-black">
              <span className="font-display text-xl font-bold text-gold-gradient">IA</span>
            </div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#F4F4F5]">
              {isHindi ? 'ISTIKHAR AI प्राइवेट सुइट' : 'ISTIKHAR AI Private Suite'}
            </h2>
            <p className="text-xs text-[#A1A1AA] max-w-md mt-1.5 leading-relaxed">
              {isHindi
                ? 'नमस्ते। मैं आपका व्यक्तिगत AI सहायक हूँ। हिंदी या हिंग्लिश में बोलें अथवा नीचे निर्देश टाइप करें। 5-चरणीय टास्क मॉनिटर प्रत्येक कार्य को पारदर्शी रूप से ट्रैक करता है।'
                : 'Welcome. I am your personal AI assistant. Voice commands and typed instructions are processed through our 5-stage task lifecycle engine.'}
            </p>

            {/* Quick Suggested Commands */}
            <div className="mt-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider">
                  {isHindi ? 'नमूना कमांड आज़माएं' : 'Try Sample Commands'}
                </span>
                <span className="text-[10px] text-[#A1A1AA]">
                  {isHindi ? 'वेब बनाम एंड्रॉइड परीक्षण' : 'Web vs Android test cases'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_COMMANDS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSelectPrompt(item.label)}
                    className="p-2.5 rounded-xl bg-[#0F0F13] hover:bg-[#181820] border border-[#27272A] hover:border-[#D4AF37]/50 text-left transition-all group flex flex-col justify-between"
                  >
                    <span className="text-xs text-[#E4E4E7] font-medium group-hover:text-[#F5D061] transition-colors">
                      "{item.label}"
                    </span>
                    <span className={`text-[10px] mt-1.5 inline-block ${
                      item.type === 'web' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[80%] rounded-2xl p-4 transition-all shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#18181F] border border-[#D4AF37]/30 text-[#F4F4F5] rounded-tr-none'
                    : 'bg-[#101014] border border-[#27272A] text-[#F4F4F5] rounded-tl-none'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    {msg.sender === 'user' ? (
                      <>
                        <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider">
                          {isHindi ? 'आप (You)' : 'You'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                        <span className="text-[11px] font-display font-bold text-[#F5D061] tracking-wider uppercase">
                          ISTIKHAR AI
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-[10px] text-[#71717A] font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Message Body */}
                <div className="text-xs sm:text-sm text-[#E4E4E7] leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.text}
                </div>

                {/* Direct Search Link Button if applicable */}
                {msg.taskMeta?.searchUrl && (
                  <div className="mt-2.5">
                    <a
                      href={msg.taskMeta.searchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F1908] border border-[#5C4713] text-xs font-medium text-[#F5D061] hover:text-[#FFF1B8] hover:border-[#D4AF37] transition-all"
                    >
                      <span>{isHindi ? 'लाइव खोज परिणाम देखें' : 'Open Live Search Results'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Associated Task Status Pill in Message */}
                {msg.taskMeta && (
                  <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {msg.taskMeta.capability === 'web_functional' ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/60 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {isHindi ? 'वेब निष्पादित' : 'Web Executed'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/60 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {isHindi ? 'नेटिव एंड्रॉइड आवश्यक' : 'Requires Native Android'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Audio replay button */}
                      <button
                        onClick={() => onSpeakText(msg.text)}
                        className="p-1 text-[#71717A] hover:text-[#F5D061] rounded transition-colors"
                        title={isHindi ? 'आवाज़ में सुनें' : 'Listen to this response'}
                        aria-label="Listen to response"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy response */}
                      <button
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="p-1 text-[#71717A] hover:text-[#F5D061] rounded transition-colors"
                        title={isHindi ? 'टेक्स्ट कॉपी करें' : 'Copy text'}
                        aria-label="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-start gap-2">
            <div className="bg-[#101014] border border-[#D4AF37]/40 rounded-2xl rounded-tl-none p-3.5 shadow-md flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#F5D061] animate-ping" />
              <div className="text-xs text-[#E4E4E7]">
                <span className="font-semibold text-[#F5D061]">ISTIKHAR AI</span>{' '}
                {isHindi ? 'कमांड का विश्लेषण कर रहा है...' : 'is analyzing command...'}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
