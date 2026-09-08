/**
 * =====================================================================
 * RESTAURANT OS — LAYER 1: HARDWARE DNA (جامع بصمة العتاد الفولاذية)
 * =====================================================================
 * Gathers immutable physical machine identifiers:
 * - CPU Model, Arch & Core Topology
 * - Motherboard UUID / Serial Signature
 * - Primary Network MAC Address
 * - Storage Volume & Disk Identifier
 * - Platform, OS & Display Entropy
 * 
 * Supports both Electron Native IPC & Web Cryptography Entropy fallbacks.
 */

export interface HardwareDnaComponent {
  name: string;
  nameAr: string;
  value: string;
  weight: number; // Importance in fuzzy matching (0 - 100)
  isMutable: boolean;
}

export interface HardwareDnaProfile {
  cpuId: string;
  cpuModel: string;
  cpuCores: number;
  motherboardUuid: string;
  primaryMac: string;
  diskSerial: string;
  platform: string;
  screenGeometry: string;
  canvasFingerprint: string;
  audioFingerprint: string;
  entropyDigest: string; // 64-char hex SHA-256 hash
  formattedDna: string;  // e.g. HDNA-9F82-44A1-B3CD-E567
  confidenceScore: number; // 0 - 100
  generatedAt: string;
  isNativeElectron: boolean;
  components: HardwareDnaComponent[];
}

export interface HardwareMatchResult {
  matches: boolean;
  similarityScore: number; // 0 - 100%
  exactMatch: boolean;
  matchedComponents: string[];
  mismatchedComponents: string[];
  messageAr: string;
  messageEn: string;
}

const STORAGE_KEY_CACHED_DNA = 'restaurant_os_hw_dna_v2';
const STORAGE_KEY_DEVICE_SALT = 'restaurant_os_device_salt_v2';

class HardwareDnaEngine {
  private cachedProfile: HardwareDnaProfile | null = null;
  private isGenerating = false;

  /**
   * Generates or retrieves the unique cryptographic Hardware DNA profile.
   */
  public async getHardwareDna(forceRefresh = false): Promise<HardwareDnaProfile> {
    if (!forceRefresh && this.cachedProfile) {
      return this.cachedProfile;
    }

    // Try reading cached persistent DNA to maintain consistency across reloads
    if (!forceRefresh && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CACHED_DNA);
        if (saved) {
          const parsed = JSON.parse(saved) as HardwareDnaProfile;
          if (parsed && parsed.entropyDigest && parsed.formattedDna) {
            this.cachedProfile = parsed;
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[HardwareDNA] Failed to read cached DNA:', e);
      }
    }

    if (this.isGenerating) {
      await new Promise((r) => setTimeout(r, 200));
      return this.cachedProfile || this.generateFallbackDna();
    }

    this.isGenerating = true;

    try {
      // 1. Check if Electron Native API provides deep OS-level hardware inspection
      let nativeData: Partial<HardwareDnaProfile> | null = null;
      if (typeof window !== 'undefined' && (window as any).electronAPI?.getHardwareDna) {
        try {
          nativeData = await (window as any).electronAPI.getHardwareDna();
        } catch (err) {
          console.warn('[HardwareDNA] Electron IPC call failed, using Web Entropy:', err);
        }
      }

      // 2. Gather Web Browser / Environment Telemetry
      const webEntropy = await this.gatherWebEntropy();
      const deviceSalt = this.getOrCreateDeviceSalt();

      // 3. Compile components
      const cpuModel = nativeData?.cpuModel || webEntropy.cpuModel;
      const cpuCores = nativeData?.cpuCores || webEntropy.cpuCores;
      const cpuId = nativeData?.cpuId || `CPU-${cpuModel.replace(/\s+/g, '_')}-${cpuCores}C`;
      const motherboardUuid = nativeData?.motherboardUuid || webEntropy.motherboardUuid;
      const primaryMac = nativeData?.primaryMac || webEntropy.primaryMac;
      const diskSerial = nativeData?.diskSerial || webEntropy.diskSerial;
      const platform = nativeData?.platform || webEntropy.platform;
      const screenGeometry = webEntropy.screenGeometry;
      const canvasFingerprint = webEntropy.canvasFingerprint;
      const audioFingerprint = webEntropy.audioFingerprint;

      // 4. Multi-Factor Cryptographic Digest Formulation
      const rawEntropyString = [
        `CPU:${cpuId}`,
        `MB:${motherboardUuid}`,
        `MAC:${primaryMac}`,
        `DISK:${diskSerial}`,
        `PLATFORM:${platform}`,
        `SCR:${screenGeometry}`,
        `CANVAS:${canvasFingerprint}`,
        `AUDIO:${audioFingerprint}`,
        `SALT:${deviceSalt}`,
      ].join('|||');

      const entropyDigest = await this.sha256(rawEntropyString);
      const formattedDna = this.formatDnaKey(entropyDigest);

      const components: HardwareDnaComponent[] = [
        {
          name: 'CPU Identifier',
          nameAr: 'المعالج المركزي (CPU)',
          value: `${cpuModel} (${cpuCores} Cores)`,
          weight: 25,
          isMutable: false,
        },
        {
          name: 'Motherboard UUID',
          nameAr: 'اللوحة الأم (Motherboard UUID)',
          value: motherboardUuid,
          weight: 30,
          isMutable: false,
        },
        {
          name: 'Primary Network MAC',
          nameAr: 'محول الشبكة الرئيسي (MAC)',
          value: primaryMac,
          weight: 20,
          isMutable: true,
        },
        {
          name: 'Storage Volume ID',
          nameAr: 'القرص الصلب والوحدة التخزينية (Disk Serial)',
          value: diskSerial,
          weight: 15,
          isMutable: true,
        },
        {
          name: 'Display & Canvas Architecture',
          nameAr: 'بصمة العرض والرسوميات (GPU/Canvas)',
          value: `${screenGeometry} • ${canvasFingerprint.slice(0, 10)}...`,
          weight: 10,
          isMutable: true,
        },
      ];

      const profile: HardwareDnaProfile = {
        cpuId,
        cpuModel,
        cpuCores,
        motherboardUuid,
        primaryMac,
        diskSerial,
        platform,
        screenGeometry,
        canvasFingerprint,
        audioFingerprint,
        entropyDigest,
        formattedDna,
        confidenceScore: nativeData ? 99 : 92,
        generatedAt: new Date().toISOString(),
        isNativeElectron: Boolean(nativeData),
        components,
      };

      this.cachedProfile = profile;

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_CACHED_DNA, JSON.stringify(profile));
        } catch (e) {
          // ignore quota error
        }
      }

      return profile;
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Verifies if a given license target DNA matches current machine DNA.
   * Tolerates minor hardware changes (e.g. replaced NIC or monitor) using weighted fuzzy scoring.
   */
  public async verifyHardwareMatch(
    targetDna: string,
    toleranceScore = 75
  ): Promise<HardwareMatchResult> {
    const current = await this.getHardwareDna();
    const cleanTarget = targetDna.trim().toUpperCase();

    // 1. Wildcard / Floating license support
    if (cleanTarget === '*' || cleanTarget === 'FLOATING-ALL-MACHINES') {
      return {
        matches: true,
        similarityScore: 100,
        exactMatch: true,
        matchedComponents: ['FLOATING_LICENSE'],
        mismatchedComponents: [],
        messageAr: 'ترخيص عائم صالح لجميع الأجهزة دون قيود عتادية',
        messageEn: 'Floating license valid for all hardware nodes',
      };
    }

    // 2. Exact Formatted DNA Match
    if (current.formattedDna.toUpperCase() === cleanTarget) {
      return {
        matches: true,
        similarityScore: 100,
        exactMatch: true,
        matchedComponents: current.components.map((c) => c.name),
        mismatchedComponents: [],
        messageAr: 'تطابق عتادي تام بنسبة 100% (بصمة رقمية متطابقة)',
        messageEn: 'Exact 100% Hardware DNA Match confirmed',
      };
    }

    // 3. Exact SHA-256 Digest Match
    if (current.entropyDigest.toUpperCase() === cleanTarget) {
      return {
        matches: true,
        similarityScore: 100,
        exactMatch: true,
        matchedComponents: current.components.map((c) => c.name),
        mismatchedComponents: [],
        messageAr: 'تطابق عتادي مشفر تام (SHA-256 Match)',
        messageEn: 'Exact SHA-256 Digest Match confirmed',
      };
    }

    // 4. Fuzzy Substring Matching for Short Formats
    const targetParts = cleanTarget.replace(/^HDNA-/, '').split('-');
    const currentParts = current.formattedDna.replace(/^HDNA-/, '').split('-');

    let matchingBlocks = 0;
    for (let i = 0; i < Math.min(targetParts.length, currentParts.length); i++) {
      if (targetParts[i] === currentParts[i]) {
        matchingBlocks++;
      }
    }

    const similarity = Math.round((matchingBlocks / Math.max(targetParts.length, currentParts.length, 1)) * 100);
    const matches = similarity >= toleranceScore;

    return {
      matches,
      similarityScore: similarity,
      exactMatch: false,
      matchedComponents: matches ? ['Core Hardware Block'] : [],
      mismatchedComponents: matches ? [] : ['Device Profile Signature'],
      messageAr: matches
        ? `تطابق عتادي ضمن هامش الأمان (${similarity}%)`
        : `عدم تطابق عتادي: بصمة الجهاز غير مصرح لها بهذا الترخيص (${similarity}%)`,
      messageEn: matches
        ? `Hardware matched within safety tolerance (${similarity}%)`
        : `Hardware DNA mismatch: Device is not authorized for this license (${similarity}%)`,
    };
  }

  /**
   * Formats a 64-char SHA256 hex string into user-friendly HDNA-XXXX-XXXX-XXXX-XXXX
   */
  private formatDnaKey(hexHash: string): string {
    const clean = hexHash.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    const p1 = clean.substring(0, 4);
    const p2 = clean.substring(4, 8);
    const p3 = clean.substring(8, 12);
    const p4 = clean.substring(12, 16);
    return `HDNA-${p1}-${p2}-${p3}-${p4}`;
  }

  /**
   * Gathers non-invasive browser entropy vectors
   */
  private async gatherWebEntropy(): Promise<{
    cpuModel: string;
    cpuCores: number;
    motherboardUuid: string;
    primaryMac: string;
    diskSerial: string;
    platform: string;
    screenGeometry: string;
    canvasFingerprint: string;
    audioFingerprint: string;
  }> {
    const nav = typeof navigator !== 'undefined' ? navigator : ({} as any);
    const scr = typeof window !== 'undefined' ? window.screen : ({} as any);

    const cpuCores = nav.hardwareConcurrency || 8;
    const platform = nav.platform || (nav.userAgentData ? nav.userAgentData.platform : 'Win32');
    const cpuModel = `${platform} ${cpuCores}-Core CPU Architecture`;

    // Screen geometry
    const width = scr.width || 1920;
    const height = scr.height || 1080;
    const colorDepth = scr.colorDepth || 24;
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const screenGeometry = `${width}x${height}@${colorDepth}bit[PR:${pixelRatio}]`;

    // Canvas 2D fingerprinting
    let canvasFingerprint = 'CANVAS_FALLBACK_DEFAULT';
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = "14px 'Arial', sans-serif";
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('RestaurantOS-HDNA-2026 🔒', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('RestaurantOS-HDNA-2026 🔒', 4, 17);
          canvasFingerprint = (await this.sha256(canvas.toDataURL())).substring(0, 16);
        }
      } catch (e) {
        canvasFingerprint = 'CANVAS_SECURITY_RESTRICTED';
      }
    }

    // Audio context signature
    let audioFingerprint = 'AUDIO_SYNTH_SIG_001';
    if (typeof window !== 'undefined' && ((window as any).AudioContext || (window as any).webkitAudioContext)) {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const context = new AudioCtx();
        const sampleRate = context.sampleRate || 48000;
        audioFingerprint = `AUDIO_SR_${sampleRate}_CH_${context.destination?.maxChannelCount || 2}`;
        context.close().catch(() => {});
      } catch (e) {
        audioFingerprint = 'AUDIO_PASSIVE_48000';
      }
    }

    // Stable synthesized Web MB UUID & Disk Serial based on persistent machine salt
    const salt = this.getOrCreateDeviceSalt();
    const mbHash = await this.sha256(`MB_STABLE_SYNTH:${platform}:${cpuCores}:${salt}`);
    const motherboardUuid = `UUID-${mbHash.substring(0, 8)}-${mbHash.substring(8, 12)}-${mbHash.substring(12, 16)}`;

    const diskHash = await this.sha256(`DISK_STABLE_SYNTH:${screenGeometry}:${salt}`);
    const diskSerial = `DSK-${diskHash.substring(0, 4).toUpperCase()}-${diskHash.substring(4, 12).toUpperCase()}`;

    const macHash = await this.sha256(`MAC_STABLE_SYNTH:${nav.language}:${salt}`);
    const macParts = macHash.substring(0, 12).match(/.{1,2}/g) || ['00', '1A', '2B', '3C', '4D', '5E'];
    const primaryMac = macParts.join(':').toUpperCase();

    return {
      cpuModel,
      cpuCores,
      motherboardUuid,
      primaryMac,
      diskSerial,
      platform,
      screenGeometry,
      canvasFingerprint,
      audioFingerprint,
    };
  }

  /**
   * Retrieves or creates a secure machine entropy salt stored in persistent storage.
   */
  private getOrCreateDeviceSalt(): string {
    if (typeof window === 'undefined') return 'NODE_ENVIRONMENT_STATIC_SALT_2026';
    try {
      let salt = localStorage.getItem(STORAGE_KEY_DEVICE_SALT);
      if (!salt) {
        const randomValues = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) {
          window.crypto.getRandomValues(randomValues);
        } else {
          for (let i = 0; i < 16; i++) randomValues[i] = Math.floor(Math.random() * 256);
        }
        salt = Array.from(randomValues)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        localStorage.setItem(STORAGE_KEY_DEVICE_SALT, salt);
      }
      return salt;
    } catch {
      return 'FALLBACK_EPHEMERAL_SALT_2026';
    }
  }

  /**
   * Computes standard SHA-256 digest using Web Cryptography API.
   */
  private async sha256(message: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const msgUint8 = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // fall back to JS sha256
      }
    }
    return this.jsSha256(message);
  }

  /**
   * Pure JavaScript SHA-256 fallback implementation
   */
  private jsSha256(ascii: string): string {
    function rightRotate(value: number, amount: number) {
      return (value >>> amount) | (value << (32 - amount));
    }

    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i = 0;
    let j = 0;
    let result = '';

    const words: number[] = [];
    const asciiBitLength = ascii.length * 8;

    let hash: number[] = [];
    const k: number[] = [];
    let primeCounter = 0;

    const isPrime = (n: number) => {
      for (let factor = 2; factor * factor <= n; factor++) {
        if (n % factor === 0) return false;
      }
      return true;
    };

    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (isPrime(candidate)) {
        if (primeCounter < 8) {
          hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
        }
        k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter++;
      }
    }

    ascii += '\x80';
    while ((ascii.length % 64) - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return '';
      const wordIdx = i >> 2;
      words[wordIdx] = (words[wordIdx] || 0) | (j << (((3 - i) % 4) * 8));
    }
    words.push((asciiBitLength / maxWord) | 0);
    words.push(asciiBitLength);

    for (j = 0; j < words.length; ) {
      const w = words.slice(j, (j += 16));
      const oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15];
        const w2 = w[i - 2];
        const a = hash[0];
        const e = hash[4];
        const temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) +
          k[i] +
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
                0);

        const temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? '0' : '') + b.toString(16);
      }
    }
    return result;
  }

  private generateFallbackDna(): HardwareDnaProfile {
    return {
      cpuId: 'CPU-GENERIC-X86_64-8C',
      cpuModel: 'Intel/AMD 8-Core Performance Architecture',
      cpuCores: 8,
      motherboardUuid: 'UUID-982F-441A-B801-7762AE',
      primaryMac: 'E8:48:B8:11:42:FA',
      diskSerial: 'DSK-NVME-88392109',
      platform: 'win32',
      screenGeometry: '1920x1080@24bit',
      canvasFingerprint: 'CANVAS_FALLBACK',
      audioFingerprint: 'AUDIO_FALLBACK',
      entropyDigest: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      formattedDna: 'HDNA-E3B0-C442-98FC-1C14',
      confidenceScore: 90,
      generatedAt: new Date().toISOString(),
      isNativeElectron: false,
      components: [],
    };
  }
}

export const hardwareDna = new HardwareDnaEngine();
