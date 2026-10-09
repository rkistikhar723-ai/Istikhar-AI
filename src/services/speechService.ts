/**
 * ISTIKHAR AI - Speech Service
 * 
 * Provides robust Web Speech-to-Text recognition and Text-to-Speech synthesis
 * with native support for Hindi ('hi-IN') and English ('en-US').
 * Features sentence chunking for Chrome/Safari, Devanagari danda splitting,
 * automatic voice selector, and audio cues.
 */

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSpeakingActive: boolean = false;
  private currentUtterances: SpeechSynthesisUtterance[] = [];
  private currentLanguage: 'hi' | 'en' = 'hi';

  constructor() {
    this.initRecognition();
  }

  public setLanguage(lang: 'hi' | 'en') {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    }
  }

  public getLanguage(): 'hi' | 'en' {
    return this.currentLanguage;
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-US';
        this.recognition.maxAlternatives = 1;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  public isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    );
  }

  public isSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSynthesisSupported()) return [];
    try {
      return window.speechSynthesis.getVoices();
    } catch {
      return [];
    }
  }

  public startListening(
    callbacks: SpeechRecognitionCallbacks,
    language?: 'hi' | 'en'
  ): boolean {
    const lang = language || this.currentLanguage;

    if (!this.isRecognitionSupported()) {
      callbacks.onError?.(
        lang === 'hi'
          ? 'इस ब्राउज़र में स्पीच पहचान समर्थित नहीं है। कृपया नीचे टेक्स्ट बॉक्स का उपयोग करें।'
          : 'Speech recognition is not supported in this browser. Please use the text input below.'
      );
      return false;
    }

    if (!this.recognition) {
      this.initRecognition();
    }

    if (this.recognition) {
      this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }

    this.recognition.onstart = () => {
      this.isListening = true;
      this.playTone(660, 0.08); // Friendly mic open chime
      callbacks.onStart?.();
      this.triggerHaptic(35);
    };

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = (finalTranscript || interimTranscript).trim();
      if (text) {
        callbacks.onResult?.(text, Boolean(finalTranscript));
      }
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (event.error === 'no-speech') {
        callbacks.onError?.(
          lang === 'hi'
            ? 'कोई आवाज़ सुनाई नहीं दी। कृपया पुनः बोलें।'
            : 'No speech was detected. Please try speaking again.'
        );
        return;
      }
      if (event.error === 'not-allowed') {
        callbacks.onError?.(
          lang === 'hi'
            ? 'माइक्रोफोन की अनुमति अस्वीकृत कर दी गई है। कृपया ब्राउज़र सेटिंग्स में माइक्रोफोन की अनुमति दें।'
            : 'Microphone permission was denied. Please allow microphone access in your browser.'
        );
        return;
      }
      callbacks.onError?.(
        lang === 'hi'
          ? `स्पीच पहचान त्रुटि (${event.error})। कृपया टाइप करें।`
          : `Speech recognition error (${event.error}). Please type your command.`
      );
    };

    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onEnd?.();
    };

    try {
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      callbacks.onError?.(
        lang === 'hi'
          ? 'माइक्रोफ़ोन सक्रिय नहीं हो सका। कृपया पुनः प्रयास करें।'
          : 'Could not activate microphone. Please try again or type below.'
      );
      return false;
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  /**
   * High-reliability Text-to-Speech in natural Hindi or English
   */
  public speak(
    text: string,
    options: { rate?: number; pitch?: number; voiceURI?: string; lang?: 'hi' | 'en' } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSynthesisSupported()) {
        resolve();
        return;
      }

      // Stop any active speech before starting new one
      this.stopSpeaking();

      const targetLang = options.lang || this.currentLanguage;

      // Clean technical markdown, code blocks, emojis, and bullet points for clean vocalization
      const clean = text
        .replace(/```[\s\S]*?```/g, targetLang === 'hi' ? 'कोड ब्लॉक छोड़ा गया।' : 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/[#*_~>⚠️]/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      if (!clean) {
        resolve();
        return;
      }

      // Resume synthesis if paused (common Chrome bug)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Split into clean sentence chunks, supporting both Devanagari danda '।' and '.!?'
      const rawSentences = clean.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) || [clean];
      const sentences = rawSentences.map((s) => s.trim()).filter((s) => s.length > 0);

      const voices = this.getAvailableVoices();
      let selectedVoice: SpeechSynthesisVoice | undefined;

      if (options.voiceURI) {
        selectedVoice = voices.find((v) => v.voiceURI === options.voiceURI);
      }

      if (!selectedVoice) {
        if (targetLang === 'hi') {
          // Prioritize Hindi voices
          selectedVoice =
            voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')) ||
            voices.find((v) => v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('हिन्दी')) ||
            voices.find((v) => v.lang.startsWith('en') && (v.name.includes('India') || v.name.includes('Natural'))) ||
            voices[0];
        } else {
          // English voice
          selectedVoice =
            voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
        }
      }

      this.isSpeakingActive = true;
      let completedCount = 0;

      sentences.forEach((sentence) => {
        const utterance = new SpeechSynthesisUtterance(sentence);
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.lang = targetLang === 'hi' ? 'hi-IN' : 'en-US';

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.onend = () => {
          completedCount++;
          if (completedCount >= sentences.length) {
            this.isSpeakingActive = false;
            this.currentUtterances = [];
            resolve();
          }
        };

        utterance.onerror = (e) => {
          if (e.error !== 'canceled') {
            console.warn('SpeechSynthesis error:', e.error);
          }
          completedCount++;
          if (completedCount >= sentences.length) {
            this.isSpeakingActive = false;
            this.currentUtterances = [];
            resolve();
          }
        };

        this.currentUtterances.push(utterance);
        window.speechSynthesis.speak(utterance);
      });
    });
  }

  public stopSpeaking() {
    if (this.isSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
      this.isSpeakingActive = false;
      this.currentUtterances = [];
    }
  }

  public isSpeaking(): boolean {
    if (!this.isSynthesisSupported()) return false;
    return window.speechSynthesis.speaking || this.isSpeakingActive;
  }

  public playTone(freq: number = 880, duration: number = 0.1) {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy
    }
  }

  public triggerHaptic(durationMs = 30) {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(durationMs);
      } catch {
        // ignore
      }
    }
  }
}

export const speechService = new SpeechService();
