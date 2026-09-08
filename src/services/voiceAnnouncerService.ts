/**
 * =====================================================================
 * RESTAURANT OS — SMART VOICE ANNOUNCER & KDS SOUND STUDIO SERVICE
 * =====================================================================
 * Bilingual Web Speech API (TTS) engine for Kitchen Display Systems (KDS),
 * floor plan table alerts, third-party delivery orders, and kitchen chimes.
 * Supports custom voice pitch, speed rate, station filtering, priority queues,
 * and high-fidelity audio chimes.
 */

import { KitchenStation, TableStatus, OrderType } from '../db/schema';
import { DeliveryPlatform } from '../types/delivery';
import { eventBus } from './eventBus';
import { soundEngine } from './soundEngine';

// ==========================================
// 1. TYPES & CONFIGURATION INTERFACES
// ==========================================

export type VoiceAnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type VoiceLanguageMode = 'ar' | 'en' | 'bilingual' | 'auto';
export type ChimeType = 'kitchen-bell' | 'ding-dong' | 'alert' | 'double-high' | 'soft-chime' | 'none';
export type VoiceStudioPreset = 'energetic' | 'professional' | 'calm' | 'express' | 'custom';

export type AnnouncementCategory =
  | 'order_ready'
  | 'item_ready'
  | 'delivery'
  | 'delayed'
  | 'reservation'
  | 'table_status'
  | 'custom';

export interface VoiceAnnouncementItem {
  id: string;
  textAr: string;
  textEn: string;
  priority: VoiceAnnouncementPriority;
  category: AnnouncementCategory;
  station?: KitchenStation | 'all';
  createdAt: number;
  repeatCount?: number;
  chimeOverride?: ChimeType;
  metadata?: Record<string, any>;
}

export interface VoiceAnnouncerConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  rate: number; // 0.5 to 2.0 (speed)
  pitch: number; // 0.5 to 1.5
  languageMode: VoiceLanguageMode;
  arabicVoiceURI?: string;
  englishVoiceURI?: string;
  enableChime: boolean;
  chimeType: ChimeType;
  chimeVolume: number; // 0.0 to 1.0
  enableDeliveryAlerts: boolean;
  enableOrderReadyAlerts: boolean;
  enableItemReadyAlerts: boolean;
  enableDelayedAlerts: boolean;
  enableReservationAlerts: boolean;
  enableTableStatusAlerts: boolean;
  subscribedStations: (KitchenStation | 'all')[];
  repeatCount: number; // 1, 2, 3
  repeatDelayMs: number;
  deduplicationWindowMs: number;
  preset: VoiceStudioPreset;
}

export interface OrderReadyAnnouncementParams {
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  orderType?: OrderType;
  itemsSummary?: string;
  priority?: VoiceAnnouncementPriority;
}

export interface ItemReadyAnnouncementParams {
  itemName: string;
  itemNameEn?: string;
  tableNumber?: string;
  orderNumber: string;
  station?: KitchenStation;
  quantity?: number;
  priority?: VoiceAnnouncementPriority;
}

export interface DeliveryAnnouncementParams {
  platform: DeliveryPlatform | string;
  orderNumber: string;
  shortCode?: string;
  itemCount?: number;
  driverName?: string;
  priority?: VoiceAnnouncementPriority;
}

export interface UrgentTicketAnnouncementParams {
  orderNumber: string;
  tableNumber?: string;
  elapsedMinutes: number;
  station?: KitchenStation;
  priority?: VoiceAnnouncementPriority;
}

export interface TableReservationAnnouncementParams {
  tableNumber: string;
  customerName: string;
  guestCount: number;
  reservationTime?: string;
  priority?: VoiceAnnouncementPriority;
}

export interface TableStatusAnnouncementParams {
  tableNumber: string;
  status: TableStatus;
  reason?: string;
  priority?: VoiceAnnouncementPriority;
}

export interface CustomAnnouncementParams {
  textAr: string;
  textEn?: string;
  priority?: VoiceAnnouncementPriority;
  station?: KitchenStation | 'all';
  chimeType?: ChimeType;
  repeatCount?: number;
}

// ==========================================
// 2. DEFAULT SETTINGS & PRESETS
// ==========================================

export const DEFAULT_VOICE_CONFIG: VoiceAnnouncerConfig = {
  enabled: true,
  volume: 0.9,
  rate: 1.05,
  pitch: 1.0,
  languageMode: 'ar',
  arabicVoiceURI: undefined,
  englishVoiceURI: undefined,
  enableChime: true,
  chimeType: 'kitchen-bell',
  chimeVolume: 0.7,
  enableDeliveryAlerts: true,
  enableOrderReadyAlerts: true,
  enableItemReadyAlerts: true,
  enableDelayedAlerts: true,
  enableReservationAlerts: true,
  enableTableStatusAlerts: true,
  subscribedStations: ['all'],
  repeatCount: 1,
  repeatDelayMs: 600,
  deduplicationWindowMs: 12000,
  preset: 'professional',
};

export const VOICE_STUDIO_PRESETS: Record<VoiceStudioPreset, Partial<VoiceAnnouncerConfig>> = {
  professional: {
    rate: 1.0,
    pitch: 1.0,
    chimeType: 'kitchen-bell',
    chimeVolume: 0.7,
    repeatCount: 1,
    preset: 'professional',
  },
  energetic: {
    rate: 1.15,
    pitch: 1.1,
    chimeType: 'ding-dong',
    chimeVolume: 0.8,
    repeatCount: 1,
    preset: 'energetic',
  },
  calm: {
    rate: 0.9,
    pitch: 0.95,
    chimeType: 'soft-chime',
    chimeVolume: 0.6,
    repeatCount: 1,
    preset: 'calm',
  },
  express: {
    rate: 1.25,
    pitch: 1.05,
    chimeType: 'double-high',
    chimeVolume: 0.9,
    repeatCount: 1,
    preset: 'express',
  },
  custom: {
    preset: 'custom',
  },
};

const PLATFORM_NAMES_AR: Record<string, string> = {
  hungerstation: 'هنقرستيشن',
  jahez: 'جاهز',
  toyou: 'تويو',
  talabat: 'طلبات',
  deliveroo: 'ديلفرو',
  keeta: 'كيتا',
  the_chefz: 'ذا شفز',
  careem: 'كريم ناو',
  mrsool: 'مرسول',
  ninja: 'نينجا',
  barq: 'برق',
  direct: 'الطلب المباشر',
};

const PLATFORM_NAMES_EN: Record<string, string> = {
  hungerstation: 'Hungerstation',
  jahez: 'Jahez',
  toyou: 'ToYou',
  talabat: 'Talabat',
  deliveroo: 'Deliveroo',
  keeta: 'Keeta',
  the_chefz: 'The Chefz',
  careem: 'Careem Now',
  mrsool: 'Mrsool',
  ninja: 'Ninja',
  barq: 'Barq',
  direct: 'Direct Order',
};

const STATION_NAMES_AR: Record<KitchenStation, string> = {
  grill: 'محطة الشواء',
  fryer: 'محطة القلي',
  salad_cold: 'محطة السلطات والمقبلات',
  beverages: 'محطة المشروبات والبار',
  bakery: 'محطة المخبوزات والفرن',
  main_kitchen: 'المطبخ الرئيسي',
  dessert: 'محطة الحلويات',
};

const STATION_NAMES_EN: Record<KitchenStation, string> = {
  grill: 'Grill Station',
  fryer: 'Fryer Station',
  salad_cold: 'Salad & Cold Station',
  beverages: 'Beverage Bar',
  bakery: 'Bakery & Oven',
  main_kitchen: 'Main Kitchen',
  dessert: 'Dessert Station',
};

// ==========================================
// 3. VOICE ANNOUNCER ENGINE CLASS
// ==========================================

export class VoiceAnnouncerService {
  private config: VoiceAnnouncerConfig;
  private queue: VoiceAnnouncementItem[] = [];
  private isSpeaking = false;
  private isPaused = false;
  private currentItem: VoiceAnnouncementItem | null = null;
  private deduplicationCache: Map<string, number> = new Map();
  private unsubscribeEvents: (() => void)[] = [];
  private audioCtx: AudioContext | null = null;
  private synth: SpeechSynthesis | null = null;

  constructor(initialConfig: Partial<VoiceAnnouncerConfig> = {}) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...initialConfig };
    this.initSpeechSynth();
  }

  // -------------------------------------------------------------------
  // INITIALIZATION & AUDIO CONTEXT
  // -------------------------------------------------------------------

  private initSpeechSynth(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // -------------------------------------------------------------------
  // CONFIGURATION & VOICE STUDIO SETTINGS
  // -------------------------------------------------------------------

  public getConfig(): VoiceAnnouncerConfig {
    return { ...this.config };
  }

  public updateConfig(partial: Partial<VoiceAnnouncerConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  public applyPreset(preset: VoiceStudioPreset): void {
    const presetValues = VOICE_STUDIO_PRESETS[preset] || {};
    this.config = {
      ...this.config,
      ...presetValues,
      preset,
    };
  }

  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.cancel();
    }
  }

  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  public setRate(rate: number): void {
    this.config.rate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setPitch(pitch: number): void {
    this.config.pitch = Math.max(0.5, Math.min(1.5, pitch));
  }

  public setLanguageMode(mode: VoiceLanguageMode): void {
    this.config.languageMode = mode;
  }

  public setSubscribedStations(stations: (KitchenStation | 'all')[]): void {
    this.config.subscribedStations = stations.length > 0 ? [...stations] : ['all'];
  }

  public isStationSubscribed(station?: KitchenStation | 'all'): boolean {
    if (!station || station === 'all') return true;
    if (this.config.subscribedStations.includes('all')) return true;
    return this.config.subscribedStations.includes(station);
  }

  public getAvailableVoices(): {
    arabic: SpeechSynthesisVoice[];
    english: SpeechSynthesisVoice[];
    all: SpeechSynthesisVoice[];
  } {
    if (!this.synth && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
    if (!this.synth) {
      return { arabic: [], english: [], all: [] };
    }

    const voices = this.synth.getVoices ? this.synth.getVoices() : [];
    const arabic = voices.filter((v) => v.lang.startsWith('ar'));
    const english = voices.filter((v) => v.lang.startsWith('en'));

    return { arabic, english, all: voices };
  }

  // -------------------------------------------------------------------
  // CHIME AUDIO SYNTHESIZER
  // -------------------------------------------------------------------

  public async playChime(chimeType: ChimeType = this.config.chimeType): Promise<void> {
    if (!this.config.enableChime || chimeType === 'none') return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) {
        // Fallback to soundEngine
        soundEngine.play(chimeType === 'alert' ? 'alert' : 'kitchen-bell');
        return;
      }

      const now = ctx.currentTime;
      const chimeVol = this.config.chimeVolume * this.config.volume;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(chimeVol, now);
      masterGain.connect(ctx.destination);

      switch (chimeType) {
        case 'kitchen-bell': {
          // Resonant dual chime
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(1400, now);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(2800, now);

          gain.gain.setValueAtTime(0.6, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.9);
          osc2.stop(now + 0.9);
          break;
        }

        case 'ding-dong': {
          // Two-tone melodic doorbell (G5 784Hz -> E5 659Hz)
          const tone1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          tone1.type = 'sine';
          tone1.frequency.setValueAtTime(783.99, now);
          gain1.gain.setValueAtTime(0.5, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          tone1.connect(gain1);
          gain1.connect(masterGain);
          tone1.start(now);
          tone1.stop(now + 0.36);

          const tone2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          tone2.type = 'sine';
          tone2.frequency.setValueAtTime(659.25, now + 0.2);
          gain2.gain.setValueAtTime(0, now);
          gain2.gain.setValueAtTime(0.55, now + 0.2);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
          tone2.connect(gain2);
          gain2.connect(masterGain);
          tone2.start(now + 0.2);
          tone2.stop(now + 0.72);
          break;
        }

        case 'alert': {
          // Urgent double warning pulse
          [0, 0.14].forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(950, now + offset);
            gain.gain.setValueAtTime(0.4, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.12);
          });
          break;
        }

        case 'double-high': {
          // Fast C7 (2093Hz) -> E7 (2637Hz)
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(2093, now);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(2637, now + 0.08);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(masterGain);

          osc1.start(now);
          osc2.start(now + 0.08);
          osc1.stop(now + 0.45);
          osc2.stop(now + 0.45);
          break;
        }

        case 'soft-chime': {
          // Gentle warm 3-note chord
          [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.06);
            gain.gain.setValueAtTime(0.3, now + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.6);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.65);
          });
          break;
        }
      }
    } catch (e) {
      // Audio context might fail before user gesture or in node environment
    }
  }

  // -------------------------------------------------------------------
  // DEDUPLICATION & COOLDOWN
  // -------------------------------------------------------------------

  private isDuplicate(key: string): boolean {
    const now = Date.now();
    const lastTimestamp = this.deduplicationCache.get(key);
    if (lastTimestamp && now - lastTimestamp < this.config.deduplicationWindowMs) {
      return true;
    }
    this.deduplicationCache.set(key, now);
    return false;
  }

  public clearDeduplicationCache(): void {
    this.deduplicationCache.clear();
  }

  // -------------------------------------------------------------------
  // QUEUE & PRIORITY ORCHESTRATION
  // -------------------------------------------------------------------

  public enqueue(item: VoiceAnnouncementItem): boolean {
    if (!this.config.enabled) return false;

    // Check station subscription
    if (!this.isStationSubscribed(item.station)) {
      return false;
    }

    // Check deduplication
    const dedupKey = `${item.category}:${item.textAr}:${item.metadata?.orderNumber || ''}:${item.metadata?.tableNumber || ''}`;
    if (this.isDuplicate(dedupKey)) {
      return false;
    }

    // Insert according to priority
    if (item.priority === 'urgent') {
      // Urgent announcements jump before non-urgent items, maintaining FIFO among urgent items
      const insertIdx = this.queue.findIndex((q) => q.priority !== 'urgent');
      if (insertIdx === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIdx, 0, item);
      }
      if (this.isSpeaking && this.synth) {
        // Cancel current non-urgent speech to speak urgent alert immediately
        try {
          this.synth.cancel();
        } catch {}
      }
    } else if (item.priority === 'high') {
      // High priority items go before normal/low
      const insertIdx = this.queue.findIndex((q) => q.priority === 'normal' || q.priority === 'low');
      if (insertIdx === -1) {
        this.queue.push(item);
      } else {
        this.queue.splice(insertIdx, 0, item);
      }
    } else {
      // Normal & Low: FIFO
      this.queue.push(item);
    }

    this.processQueue();
    return true;
  }

  public getQueue(): VoiceAnnouncementItem[] {
    return [...this.queue];
  }

  public getQueueStatus(): {
    length: number;
    isSpeaking: boolean;
    isPaused: boolean;
    currentItem: VoiceAnnouncementItem | null;
  } {
    return {
      length: this.queue.length,
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      currentItem: this.currentItem,
    };
  }

  public clearQueue(): void {
    this.queue = [];
  }

  public pause(): void {
    this.isPaused = true;
    if (this.synth && this.synth.pause) {
      try {
        this.synth.pause();
      } catch {}
    }
  }

  public resume(): void {
    this.isPaused = false;
    if (this.synth && this.synth.resume) {
      try {
        this.synth.resume();
      } catch {}
    }
    this.processQueue();
  }

  public cancel(): void {
    this.queue = [];
    this.isSpeaking = false;
    this.currentItem = null;
    if (this.synth && this.synth.cancel) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }

  // -------------------------------------------------------------------
  // TEXT & LANGUAGE RESOLVER
  // -------------------------------------------------------------------

  public resolveText(item: VoiceAnnouncementItem, mode = this.config.languageMode): string {
    switch (mode) {
      case 'ar':
        return item.textAr || item.textEn;
      case 'en':
        return item.textEn || item.textAr;
      case 'bilingual':
        if (item.textAr && item.textEn && item.textAr !== item.textEn) {
          return `${item.textAr}. ${item.textEn}.`;
        }
        return item.textAr || item.textEn;
      case 'auto':
      default:
        // Default to Arabic if text exists, otherwise English
        return item.textAr || item.textEn;
    }
  }

  // -------------------------------------------------------------------
  // QUEUE PROCESSING & TTS DISPATCH
  // -------------------------------------------------------------------

  private async processQueue(): Promise<void> {
    if (this.isSpeaking || this.isPaused || this.queue.length === 0 || !this.config.enabled) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.isSpeaking = true;
    this.currentItem = item;

    try {
      // 1. Play Pre-Announcement Chime
      const chimeToPlay = item.chimeOverride || this.config.chimeType;
      await this.playChime(chimeToPlay);

      // Short delay after chime
      if (this.config.enableChime && chimeToPlay !== 'none') {
        await new Promise((res) => setTimeout(res, 200));
      }

      // 2. Speak the text (respecting repeatCount)
      const repeats = item.repeatCount ?? this.config.repeatCount ?? 1;
      const textToSpeak = this.resolveText(item);

      // Emit event bus notification
      await eventBus.publish(
        'VOICE_ANNOUNCEMENT_TRIGGERED',
        {
          id: item.id,
          text: textToSpeak,
          language: this.config.languageMode,
          priority: item.priority,
          station: item.station,
        },
        'kds'
      );

      for (let r = 0; r < repeats; r++) {
        if (!this.isSpeaking && this.queue.length > 0 && this.queue[0].priority === 'urgent') {
          // Interrupted by urgent item
          break;
        }

        await this.speakRaw(textToSpeak, item);

        if (r < repeats - 1) {
          await new Promise((res) => setTimeout(res, this.config.repeatDelayMs));
        }
      }

      await eventBus.publish('VOICE_ANNOUNCEMENT_COMPLETED', { id: item.id }, 'kds');
    } catch (err) {
      console.warn('[VoiceAnnouncerService] Speech error:', err);
    } finally {
      this.isSpeaking = false;
      this.currentItem = null;

      // Process next item in queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Raw utterance execution with Web Speech API
   */
  public speakRaw(text: string, item?: VoiceAnnouncementItem): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }

      // If speech synthesis is not supported in the runtime (e.g. headless Node tests)
      if (!this.synth || typeof SpeechSynthesisUtterance === 'undefined') {
        // Fallback simulation for tests or non-supporting browsers
        setTimeout(() => resolve(), 50);
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = this.config.volume;
        utterance.rate = this.config.rate;
        utterance.pitch = this.config.pitch;

        // Language code
        const isAr = /[\u0600-\u06FF]/.test(text);
        utterance.lang = isAr ? 'ar-SA' : 'en-US';

        // Select voice if configured
        const voices = this.synth.getVoices ? this.synth.getVoices() : [];
        if (isAr && this.config.arabicVoiceURI) {
          const matchedVoice = voices.find((v) => v.voiceURI === this.config.arabicVoiceURI);
          if (matchedVoice) utterance.voice = matchedVoice;
        } else if (!isAr && this.config.englishVoiceURI) {
          const matchedVoice = voices.find((v) => v.voiceURI === this.config.englishVoiceURI);
          if (matchedVoice) utterance.voice = matchedVoice;
        }

        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = (e) => {
          // speechSynthesis can throw error on cancel or interrupt
          resolve();
        };

        this.synth.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  // -------------------------------------------------------------------
  // HIGH-LEVEL DOMAIN ANNOUNCEMENTS
  // -------------------------------------------------------------------

  /**
   * 1. Order Ready for Delivery or Pickup Alert
   */
  public announceOrderReady(params: OrderReadyAnnouncementParams): boolean {
    if (!this.config.enableOrderReadyAlerts) return false;

    let textAr = '';
    let textEn = '';

    if (params.tableNumber) {
      textAr = `طاولة ${params.tableNumber}، الطلب رقم ${params.orderNumber} جاهز للتسليم`;
      textEn = `Table ${params.tableNumber}, Order #${params.orderNumber} is ready for delivery`;
    } else if (params.orderType === 'takeaway' || params.orderType === 'drive_thru') {
      textAr = `طلب سفري رقم ${params.orderNumber} جاهز للاستلام`;
      textEn = `Takeaway Order #${params.orderNumber} is ready for pickup`;
    } else if (params.customerName) {
      textAr = `الطلب رقم ${params.orderNumber} للعميل ${params.customerName} جاهز`;
      textEn = `Order #${params.orderNumber} for ${params.customerName} is ready`;
    } else {
      textAr = `الطلب رقم ${params.orderNumber} جاهز`;
      textEn = `Order #${params.orderNumber} is ready`;
    }

    return this.enqueue({
      id: `order_ready_${params.orderNumber}_${Date.now()}`,
      textAr,
      textEn,
      priority: params.priority || 'high',
      category: 'order_ready',
      station: 'all',
      createdAt: Date.now(),
      metadata: {
        orderNumber: params.orderNumber,
        tableNumber: params.tableNumber,
      },
    });
  }

  /**
   * 2. Individual Dish / Item Ready Alert from a specific Station
   */
  public announceItemReady(params: ItemReadyAnnouncementParams): boolean {
    if (!this.config.enableItemReadyAlerts) return false;

    const stationAr = params.station ? STATION_NAMES_AR[params.station] || 'المطبخ' : 'المطبخ';
    const stationEn = params.station ? STATION_NAMES_EN[params.station] || 'Kitchen' : 'Kitchen';
    const qtyPrefix = params.quantity && params.quantity > 1 ? `${params.quantity} ` : '';

    let textAr = '';
    let textEn = '';

    if (params.tableNumber) {
      textAr = `${stationAr}: ${qtyPrefix}${params.itemName} لطاولة ${params.tableNumber} جاهز`;
      textEn = `${stationEn}: ${qtyPrefix}${params.itemNameEn || params.itemName} for Table ${params.tableNumber} is ready`;
    } else {
      textAr = `${stationAr}: ${qtyPrefix}${params.itemName} للطلب ${params.orderNumber} جاهز`;
      textEn = `${stationEn}: ${qtyPrefix}${params.itemNameEn || params.itemName} for Order #${params.orderNumber} is ready`;
    }

    return this.enqueue({
      id: `item_ready_${params.orderNumber}_${params.itemName}_${Date.now()}`,
      textAr,
      textEn,
      priority: params.priority || 'normal',
      category: 'item_ready',
      station: params.station || 'all',
      createdAt: Date.now(),
      metadata: {
        orderNumber: params.orderNumber,
        tableNumber: params.tableNumber,
        itemName: params.itemName,
        station: params.station,
      },
    });
  }

  /**
   * 3. Third-Party Delivery Order Received Alert
   */
  public announceDeliveryOrder(params: DeliveryAnnouncementParams): boolean {
    if (!this.config.enableDeliveryAlerts) return false;

    const platformKey = String(params.platform).toLowerCase().replace(/\s+/g, '_');
    const platNameAr = PLATFORM_NAMES_AR[platformKey] || params.platform;
    const platNameEn = PLATFORM_NAMES_EN[platformKey] || params.platform;
    const orderCode = params.shortCode || params.orderNumber;

    const textAr = `طلب جديد من ${platNameAr} رقم ${orderCode}`;
    const textEn = `New order received from ${platNameEn}, Order #${orderCode}`;

    return this.enqueue({
      id: `delivery_${platformKey}_${orderCode}_${Date.now()}`,
      textAr,
      textEn,
      priority: params.priority || 'urgent',
      category: 'delivery',
      station: 'all',
      chimeOverride: 'ding-dong',
      createdAt: Date.now(),
      metadata: {
        platform: params.platform,
        orderNumber: params.orderNumber,
        shortCode: params.shortCode,
      },
    });
  }

  /**
   * 4. Urgent / Delayed Kitchen Ticket Alert (>15-20 min)
   */
  public announceUrgentTicket(params: UrgentTicketAnnouncementParams): boolean {
    if (!this.config.enableDelayedAlerts) return false;

    let textAr = '';
    let textEn = '';

    if (params.tableNumber) {
      textAr = `تنبيه عاجل: طاولة ${params.tableNumber} تأخرت ${params.elapsedMinutes} دقيقة في المطبخ`;
      textEn = `Urgent Alert: Table ${params.tableNumber} is delayed by ${params.elapsedMinutes} minutes`;
    } else {
      textAr = `تنبيه عاجل: الطلب رقم ${params.orderNumber} متأخر منذ ${params.elapsedMinutes} دقيقة`;
      textEn = `Urgent Alert: Order #${params.orderNumber} is delayed by ${params.elapsedMinutes} minutes`;
    }

    return this.enqueue({
      id: `urgent_ticket_${params.orderNumber}_${Date.now()}`,
      textAr,
      textEn,
      priority: 'urgent',
      category: 'delayed',
      station: params.station || 'all',
      chimeOverride: 'alert',
      createdAt: Date.now(),
      metadata: {
        orderNumber: params.orderNumber,
        tableNumber: params.tableNumber,
        elapsedMinutes: params.elapsedMinutes,
      },
    });
  }

  /**
   * 5. Table Reservation Alert
   */
  public announceTableReserved(params: TableReservationAnnouncementParams): boolean {
    if (!this.config.enableReservationAlerts) return false;

    const textAr = `حجز جديد: طاولة ${params.tableNumber} باسم ${params.customerName} لعدد ${params.guestCount} ضيوف`;
    const textEn = `New reservation: Table ${params.tableNumber} for ${params.customerName}, ${params.guestCount} guests`;

    return this.enqueue({
      id: `reservation_${params.tableNumber}_${Date.now()}`,
      textAr,
      textEn,
      priority: params.priority || 'high',
      category: 'reservation',
      station: 'all',
      chimeOverride: 'soft-chime',
      createdAt: Date.now(),
      metadata: {
        tableNumber: params.tableNumber,
        customerName: params.customerName,
        guestCount: params.guestCount,
      },
    });
  }

  /**
   * 6. Floor Plan Table Status Alert (Billing, Cleaning, Available)
   */
  public announceTableStatus(params: TableStatusAnnouncementParams): boolean {
    if (!this.config.enableTableStatusAlerts) return false;

    let textAr = '';
    let textEn = '';

    switch (params.status) {
      case 'billing':
        textAr = `طاولة ${params.tableNumber} تطلب الحساب`;
        textEn = `Table ${params.tableNumber} requested the bill`;
        break;
      case 'cleaning':
        textAr = `طاولة ${params.tableNumber} بحاجة إلى تنظيف وتجهيز`;
        textEn = `Table ${params.tableNumber} needs cleaning`;
        break;
      case 'available':
        textAr = `طاولة ${params.tableNumber} شاغرة وجاهزة للاستقبال`;
        textEn = `Table ${params.tableNumber} is now clean and available`;
        break;
      case 'occupied':
        textAr = `طاولة ${params.tableNumber} تم إشغالها الآن`;
        textEn = `Table ${params.tableNumber} is now occupied`;
        break;
      case 'reserved':
        textAr = `طاولة ${params.tableNumber} محجوزة الآن`;
        textEn = `Table ${params.tableNumber} is now reserved`;
        break;
      case 'out_of_service':
        textAr = `طاولة ${params.tableNumber} خارج الخدمة`;
        textEn = `Table ${params.tableNumber} is out of service`;
        break;
      default:
        textAr = `تحديث حالة طاولة ${params.tableNumber}`;
        textEn = `Status update for Table ${params.tableNumber}`;
    }

    return this.enqueue({
      id: `table_status_${params.tableNumber}_${params.status}_${Date.now()}`,
      textAr,
      textEn,
      priority: params.priority || (params.status === 'billing' ? 'high' : 'normal'),
      category: 'table_status',
      station: 'all',
      createdAt: Date.now(),
      metadata: {
        tableNumber: params.tableNumber,
        status: params.status,
      },
    });
  }

  /**
   * 7. Custom Speech Announcement
   */
  public announceCustom(params: CustomAnnouncementParams): boolean {
    return this.enqueue({
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      textAr: params.textAr,
      textEn: params.textEn || params.textAr,
      priority: params.priority || 'normal',
      category: 'custom',
      station: params.station || 'all',
      chimeOverride: params.chimeType,
      repeatCount: params.repeatCount,
      createdAt: Date.now(),
    });
  }

  /**
   * Test current voice settings
   */
  public async testVoice(testText?: string): Promise<void> {
    const textAr = testText || 'تجربة المذيع الصوتي الذكي لنظام المطاعم. الصوت يعمل بنجاح.';
    const textEn = 'Smart voice announcer test. Voice audio working successfully.';

    this.announceCustom({
      textAr,
      textEn,
      priority: 'high',
      chimeType: this.config.chimeType,
    });
  }

  // -------------------------------------------------------------------
  // REACTIVE EVENT BUS AUTO-LISTENERS
  // -------------------------------------------------------------------

  public startAutoListening(): void {
    this.stopAutoListening();

    // 1. KDS Item Ready
    const unsub1 = eventBus.on('KDS_ITEM_READY', (evt) => {
      this.announceItemReady({
        itemName: evt.payload.itemName,
        orderNumber: evt.payload.orderId,
        priority: 'normal',
      });
    });

    // 2. KDS Order Completed / All Ready
    const unsub2 = eventBus.on('KDS_ORDER_COMPLETED', (evt) => {
      this.announceOrderReady({
        orderNumber: evt.payload.orderId,
        priority: 'high',
      });
    });

    // 3. Third-party Delivery Order Received
    const unsub3 = eventBus.on('DELIVERY_ORDER_RECEIVED', (evt) => {
      const delOrder = evt.payload.deliveryOrder;
      this.announceDeliveryOrder({
        platform: delOrder.platform,
        orderNumber: delOrder.orderId || delOrder.id,
        shortCode: delOrder.platformOrderCode,
        itemCount: delOrder.items ? delOrder.items.length : 0,
        priority: 'urgent',
      });
    });

    // 4. Table Reserved
    const unsub4 = eventBus.on('TABLE_RESERVED', (evt) => {
      this.announceTableReserved({
        tableNumber: evt.payload.tableNumber,
        customerName: evt.payload.customerName,
        guestCount: evt.payload.guestCount,
        reservationTime: evt.payload.reservationTime,
        priority: 'high',
      });
    });

    // 5. Table Status Changed
    const unsub5 = eventBus.on('TABLE_STATUS_CHANGED', (evt) => {
      this.announceTableStatus({
        tableNumber: evt.payload.tableNumber,
        status: evt.payload.newStatus as TableStatus,
      });
    });

    // 6. Delayed Ticket Alert
    const unsub6 = eventBus.on('KDS_TICKET_DELAYED', (evt) => {
      this.announceUrgentTicket({
        orderNumber: evt.payload.orderNumber,
        tableNumber: evt.payload.tableNumber,
        elapsedMinutes: evt.payload.elapsedMinutes,
        station: evt.payload.station as KitchenStation,
      });
    });

    // 7. Generic KDS Audio Alert
    const unsub7 = eventBus.on('KDS_AUDIO_ALERT', (evt) => {
      if (evt.payload.soundType === 'new_order') {
        this.playChime('ding-dong');
      } else if (evt.payload.soundType === 'urgent_alert') {
        this.playChime('alert');
      } else {
        this.playChime('kitchen-bell');
      }
    });

    this.unsubscribeEvents.push(unsub1, unsub2, unsub3, unsub4, unsub5, unsub6, unsub7);
  }

  public stopAutoListening(): void {
    this.unsubscribeEvents.forEach((unsub) => unsub());
    this.unsubscribeEvents = [];
  }
}

// Global Singleton Instance
export const voiceAnnouncerService = new VoiceAnnouncerService();
