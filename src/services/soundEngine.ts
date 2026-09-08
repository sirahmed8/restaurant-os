import { SoundEffectName } from '../types';

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  constructor() {
    // Lazy initialize on first user gesture
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public play(name: SoundEffectName) {
    if (this.isMuted || this.volume <= 0) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.volume, now);
      masterGain.connect(ctx.destination);

      switch (name) {
        case 'tap': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now);
          osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }

        case 'click': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(1200, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.03);
          break;
        }

        case 'pop': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.06);
          break;
        }

        case 'success': {
          // Major chord C-E-G arpeggio
          const freqs = [523.25, 659.25, 783.99, 1046.50];
          freqs.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + index * 0.07);
            gain.gain.setValueAtTime(0, now);
            gain.gain.setValueAtTime(0.25, now + index * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.25);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + index * 0.07);
            osc.stop(now + index * 0.07 + 0.26);
          });
          break;
        }

        case 'kitchen-bell': {
          // Resonant chime bell
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(1400, now);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(2800, now);

          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.95);
          osc2.stop(now + 0.95);
          break;
        }

        case 'cash-register': {
          // Bell + coin chimes
          const bell = ctx.createOscillator();
          const bellGain = ctx.createGain();
          bell.type = 'sine';
          bell.frequency.setValueAtTime(1760, now); // A6
          bellGain.gain.setValueAtTime(0.5, now);
          bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          bell.connect(bellGain);
          bellGain.connect(masterGain);
          bell.start(now);
          bell.stop(now + 0.6);

          // Coins jingle
          [0.1, 0.16, 0.22, 0.28].forEach((timeOffset, idx) => {
            const coin = ctx.createOscillator();
            const coinGain = ctx.createGain();
            coin.type = 'triangle';
            coin.frequency.setValueAtTime(2200 + idx * 300, now + timeOffset);
            coinGain.gain.setValueAtTime(0.2, now + timeOffset);
            coinGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.08);
            coin.connect(coinGain);
            coinGain.connect(masterGain);
            coin.start(now + timeOffset);
            coin.stop(now + timeOffset + 0.09);
          });
          break;
        }

        case 'alert': {
          const freqs = [880, 587.33];
          freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);
            gain.gain.setValueAtTime(0.18, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.1);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.11);
          });
          break;
        }

        case 'delete': {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }

        case 'slide':
        case 'whoosh': {
          // Bandpass filtered white noise simulation
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(180, now);
          osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.15);
          break;
        }
      }
    } catch {
      // Audio context might be restricted before first click
    }
  }
}

export const soundEngine = new SoundEngine();
export const playSound = (name: SoundEffectName) => soundEngine.play(name);
