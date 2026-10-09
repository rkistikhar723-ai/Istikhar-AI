/**
 * ISTIKHAR AI - Local Memory Vault & Live Utility Execution
 * 
 * Provides real persistent storage for notes, reminders, and active countdown timers.
 */

export interface AssistantNote {
  id: string;
  content: string;
  category: 'note' | 'reminder';
  createdAt: number;
  triggerTime?: number;
}

export interface AssistantTimer {
  id: string;
  label: string;
  durationSeconds: number;
  remainingSeconds: number;
  createdAt: number;
  isRunning: boolean;
  isCompleted: boolean;
}

const STORAGE_KEY_NOTES = 'istikhar_ai_notes_vault';

class VaultService {
  private notes: AssistantNote[] = [];
  private timers: AssistantTimer[] = [];
  private timerInterval: any = null;
  private timerListeners: ((timers: AssistantTimer[]) => void)[] = [];

  constructor() {
    this.loadNotes();
    this.startTimerTicker();
  }

  private loadNotes() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTES);
      if (raw) {
        this.notes = JSON.parse(raw);
      }
    } catch {
      this.notes = [];
    }
  }

  private persistNotes() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(this.notes));
    } catch (e) {
      console.error('Failed to save notes to vault', e);
    }
  }

  public getNotes(): AssistantNote[] {
    return [...this.notes];
  }

  public addNote(content: string, category: 'note' | 'reminder' = 'note', triggerTime?: number): AssistantNote {
    const newNote: AssistantNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      content: content.trim(),
      category,
      createdAt: Date.now(),
      triggerTime,
    };
    this.notes.unshift(newNote);
    this.persistNotes();
    return newNote;
  }

  public deleteNote(id: string): boolean {
    const prevLen = this.notes.length;
    this.notes = this.notes.filter((n) => n.id !== id);
    if (this.notes.length !== prevLen) {
      this.persistNotes();
      return true;
    }
    return false;
  }

  public clearAllNotes(): void {
    this.notes = [];
    this.persistNotes();
  }

  // --- Real Timers Engine ---

  public getTimers(): AssistantTimer[] {
    return [...this.timers];
  }

  public createTimer(durationSeconds: number, label: string = 'Timer'): AssistantTimer {
    const timer: AssistantTimer = {
      id: `timer_${Date.now()}`,
      label,
      durationSeconds,
      remainingSeconds: durationSeconds,
      createdAt: Date.now(),
      isRunning: true,
      isCompleted: false,
    };
    this.timers.unshift(timer);
    this.notifyTimers();
    return timer;
  }

  public stopTimer(id: string): void {
    this.timers = this.timers.filter((t) => t.id !== id);
    this.notifyTimers();
  }

  public subscribeTimers(callback: (timers: AssistantTimer[]) => void): () => void {
    this.timerListeners.push(callback);
    callback(this.getTimers());
    return () => {
      this.timerListeners = this.timerListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyTimers() {
    const list = this.getTimers();
    this.timerListeners.forEach((cb) => cb(list));
  }

  private startTimerTicker() {
    if (typeof window === 'undefined') return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      let changed = false;
      this.timers = this.timers.map((t) => {
        if (!t.isRunning || t.isCompleted) return t;
        if (t.remainingSeconds <= 1) {
          changed = true;
          this.playBeepNotification();
          return { ...t, remainingSeconds: 0, isRunning: false, isCompleted: true };
        }
        changed = true;
        return { ...t, remainingSeconds: t.remainingSeconds - 1 };
      });

      if (changed) {
        this.notifyTimers();
      }
    }, 1000);
  }

  public playBeepNotification() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext policy
    }
  }
}

export const vaultService = new VaultService();
