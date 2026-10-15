// Web Audio API helper for app success sounds

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play a pleasant chime arpeggio
  public playSuccessChime(type: 'signup' | 'login' | 'profile' | 'subscription' | 'success' = 'success') {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Frequencies for different events
      let notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Default success)
      if (type === 'signup') {
        notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (Bright welcome)
      } else if (type === 'login') {
        notes = [523.25, 783.99, 1046.50]; // C5, G5, C6 (Quick confirmation)
      } else if (type === 'profile') {
        notes = [587.33, 739.98, 880, 1174.66]; // D5, F#5, A5, D6 (Accomplishment)
      } else if (type === 'subscription') {
        notes = [392, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6 (Cash register / premium chime)
      }

      notes.forEach((freq, index) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type === 'subscription' ? 'triangle' : 'sine';
        o.frequency.setValueAtTime(freq, now + index * 0.08);

        g.gain.setValueAtTime(0, now + index * 0.08);
        g.gain.linearRampToValueAtTime(0.15, now + index * 0.08 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);

        o.connect(g);
        g.connect(ctx.destination);

        o.start(now + index * 0.08);
        o.stop(now + index * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn('Web Audio playback failed:', e);
    }
  }
}

export const soundManager = new SoundManager();
