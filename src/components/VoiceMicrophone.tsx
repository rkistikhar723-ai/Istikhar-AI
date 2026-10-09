import React from 'react';
import { Mic, MicOff, Radio, Sparkles } from 'lucide-react';

interface VoiceMicrophoneProps {
  isListening: boolean;
  onToggleListening: () => void;
  statusText?: string;
  isProcessing?: boolean;
  language?: 'hi' | 'en';
}

export const VoiceMicrophone: React.FC<VoiceMicrophoneProps> = ({
  isListening,
  onToggleListening,
  statusText,
  isProcessing,
  language = 'hi',
}) => {
  const isHindi = language === 'hi';

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-6">
      {/* Outer ambient glow & concentric rings */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring 1 */}
        {isListening && (
          <div className="absolute inset-0 -m-6 rounded-full border border-[#D4AF37]/30 animate-ping opacity-60 pointer-events-none" />
        )}

        {/* Pulsing ring 2 */}
        {isListening && (
          <div className="absolute inset-0 -m-3 rounded-full border border-[#F5D061]/40 animate-pulse pointer-events-none" />
        )}

        {/* Halo Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 pointer-events-none ${
            isListening
              ? 'bg-[#D4AF37]/30 scale-125'
              : isProcessing
              ? 'bg-[#D4AF37]/15 scale-105'
              : 'bg-[#D4AF37]/10 scale-95 hover:scale-105'
          }`}
        />

        {/* Large Microphone Button (Feature 4) */}
        <button
          onClick={onToggleListening}
          className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[2px] transition-all duration-300 transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
            isListening
              ? 'bg-gradient-to-tr from-rose-500 via-[#F5D061] to-amber-300 shadow-2xl shadow-[#D4AF37]/50 scale-105'
              : isProcessing
              ? 'bg-gradient-to-tr from-[#997B2A] to-[#F5D061] animate-spin'
              : 'bg-gradient-to-b from-[#FFF1B8] via-[#D4AF37] to-[#5C4713] shadow-xl shadow-black/80 hover:shadow-[#D4AF37]/25'
          }`}
          aria-label={isListening ? (isHindi ? 'सुनना बंद करें' : 'Stop listening') : (isHindi ? 'बोलना शुरू करें' : 'Start voice command')}
        >
          {/* Inner Button Canvas */}
          <div
            className={`w-full h-full rounded-full flex flex-col items-center justify-center transition-all ${
              isListening
                ? 'bg-gradient-to-b from-[#2B0E14] to-[#120508]'
                : isProcessing
                ? 'bg-[#121217]'
                : 'bg-gradient-to-b from-[#18181D] via-[#0E0E12] to-[#08080A] hover:bg-[#1A1A22]'
            }`}
          >
            {isListening ? (
              <div className="flex flex-col items-center">
                <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-rose-400 animate-pulse" />
                <span className="text-[10px] font-medium tracking-wider text-rose-300 uppercase mt-1">
                  {isHindi ? 'सुन रहा हूँ' : 'Listening'}
                </span>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center">
                <Radio className="w-8 h-8 sm:w-9 sm:h-9 text-[#F5D061] animate-pulse" />
                <span className="text-[10px] font-medium tracking-wider text-[#F5D061] uppercase mt-1">
                  {isHindi ? 'सोच रहा हूँ' : 'Thinking'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center group">
                <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-[#F5D061] group-hover:scale-110 transition-transform duration-200" />
                <span className="text-[10px] font-medium tracking-wider text-[#A1A1AA] group-hover:text-[#F5D061] uppercase mt-1">
                  {isHindi ? 'बोलें' : 'Speak'}
                </span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Voice Status Indicator Caption */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-[#F4F4F5] tracking-wide">
          {statusText ||
            (isListening
              ? (isHindi ? 'वॉइस कमांड सुन रहा हूँ...' : 'Listening to voice command...')
              : (isHindi ? 'माइक पर टैप करें या नीचे टाइप करें' : 'Tap the microphone or type below'))}
        </p>
        <p className="text-xs text-[#71717A] mt-0.5">
          {isListening
            ? (isHindi ? 'डिवाइस माइक्रोफ़ोन में स्वाभाविक रूप से बोलें' : 'Speak naturally into your device microphone')
            : (isHindi ? 'एंड्रॉइड कार्यों हेतु आपका निजी एआई' : 'Private personal AI for Android tasks')}
        </p>
      </div>

      {/* Audio Waveform Bars Simulation when Listening */}
      {isListening && (
        <div className="flex items-center gap-1.5 mt-3 h-5">
          {[40, 75, 90, 50, 100, 60, 85, 45, 95, 30].map((h, i) => (
            <span
              key={i}
              className="w-1 bg-gradient-to-t from-[#D4AF37] to-[#F5D061] rounded-full animate-pulse"
              style={{
                height: `${h}%`,
                animationDelay: `${i * 90}ms`,
                animationDuration: '600ms',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
