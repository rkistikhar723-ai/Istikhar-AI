import React, { useState } from 'react';
import { Send, Mic, MicOff, X, CornerDownLeft } from 'lucide-react';

interface CommandInputBarProps {
  onSendCommand: (command: string) => void;
  isListening: boolean;
  onToggleListening: () => void;
  isProcessing: boolean;
  language?: 'hi' | 'en';
}

export const CommandInputBar: React.FC<CommandInputBarProps> = ({
  onSendCommand,
  isListening,
  onToggleListening,
  isProcessing,
  language = 'hi',
}) => {
  const [inputText, setInputText] = useState('');
  const isHindi = language === 'hi';

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isProcessing) return;
    onSendCommand(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-[#0A0A0D] border-t border-[#202028]">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        {/* Quick Mic Access Button */}
        <button
          type="button"
          onClick={onToggleListening}
          className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border transition-all ${
            isListening
              ? 'bg-rose-950/60 border-rose-700 text-rose-400 animate-pulse'
              : 'bg-[#14141A] border-[#27272A] text-[#A1A1AA] hover:text-[#F5D061] hover:border-[#D4AF37]/50'
          }`}
          title={isListening ? (isHindi ? 'सुनना बंद करें' : 'Stop listening') : (isHindi ? 'बोलकर निर्देश दें' : 'Start voice recognition')}
          aria-label="Microphone input"
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input Box (Feature 5) */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={
              isHindi
                ? 'हिंदी, हिंग्लिश या अंग्रेज़ी में निर्देश टाइप करें...'
                : 'Type command or question for ISTIKHAR AI...'
            }
            className="w-full h-11 sm:h-12 pl-4 pr-10 bg-[#121217] border border-[#27272A] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm text-[#F4F4F5] placeholder-[#71717A] rounded-xl transition-all outline-none"
          />

          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#71717A] hover:text-[#F4F4F5]"
              title="Clear text"
              aria-label="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className={`min-w-[44px] min-h-[44px] px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-md ${
            inputText.trim() && !isProcessing
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA820A] text-black font-semibold hover:shadow-[#D4AF37]/30 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-[#141419] text-[#52525B] border border-[#27272A] cursor-not-allowed'
          }`}
          aria-label="Send command"
        >
          <span className="hidden sm:inline">{isHindi ? 'भेजें' : 'Execute'}</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
