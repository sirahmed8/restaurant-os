/**
 * =====================================================================
 * RESTAURANT OS — LAYER 4: CANARY TOKENS & FORENSIC STEGANOGRAPHY
 * =====================================================================
 * Plants cryptographic and zero-width invisible watermarks inside:
 * - Thermal POS receipts & Invoices
 * - Daily financial & audit reports
 * - UI footer disclaimers & exported database backups
 * 
 * Enables immediate legal identification and prosecution of code/data thieves.
 */

import { hardwareDna } from './hardwareDna';

export interface CanaryMetadata {
  licenseeId: string;
  licenseeName: string;
  hardwareDna: string;
  timestamp: string;
  buildId: string;
  branchName: string;
  integrityHash: string;
}

export interface CanaryExtractionResult {
  hasWatermark: boolean;
  metadata: CanaryMetadata | null;
  rawPayload: string | null;
  isValidSignature: boolean;
  forensicReportAr: string;
  forensicReportEn: string;
  confidenceScore: number;
}

export interface CanaryHoneypotBeacon {
  id: string;
  trapType: 'fake_db_credential' | 'vip_customer_trap' | 'webhook_beacon';
  token: string;
  injectedAt: string;
  triggerCount: number;
  lastTriggeredIp?: string;
}

// Zero-width steganography dictionary
const ZW_HEADER = '\uFEFF';    // Zero-Width No-Break Space (Start marker)
const ZW_ZERO = '\u200B';      // Zero-Width Space (Bit 0)
const ZW_ONE = '\u200C';       // Zero-Width Non-Joiner (Bit 1)
const ZW_DELIM = '\u200D';     // Zero-Width Joiner (Field separator)
const ZW_FOOTER = '\u2060';    // Word Joiner (End marker)

const CANARY_SECRET_KEY = 'REST_OS_CANARY_SECRET_LEGAL_2026_MASTER_SIG';

class CanaryTokenEngine {
  private activeHoneypots: CanaryHoneypotBeacon[] = [];

  constructor() {
    this.initDefaultBeacons();
  }

  /**
   * Injects an invisible, courtroom-verifiable zero-width cryptographic watermark into text.
   */
  public async injectWatermark(
    plainText: string,
    overrideMeta?: Partial<CanaryMetadata>
  ): Promise<string> {
    const dnaProfile = await hardwareDna.getHardwareDna();

    const meta: CanaryMetadata = {
      licenseeId: overrideMeta?.licenseeId || 'LIC-AL-SULAIMANIYAH-2026-VIP',
      licenseeName: overrideMeta?.licenseeName || 'مطاعم السليمانية الفاخرة المحدودة',
      hardwareDna: overrideMeta?.hardwareDna || dnaProfile.formattedDna,
      timestamp: overrideMeta?.timestamp || new Date().toISOString(),
      buildId: overrideMeta?.buildId || 'ROS-2026.4.19-PROD',
      branchName: overrideMeta?.branchName || 'Riyadh Flagship Branch',
      integrityHash: '',
    };

    // Calculate integrity hash
    const signatureSource = `${meta.licenseeId}|${meta.licenseeName}|${meta.hardwareDna}|${meta.timestamp}|${meta.buildId}`;
    meta.integrityHash = await this.simpleHash(`${signatureSource}|${CANARY_SECRET_KEY}`);

    const serialized = JSON.stringify(meta);
    const encodedZw = this.textToZeroWidth(serialized);

    // Inject stealthily at the midpoint or end of the text
    if (plainText.includes('\n')) {
      const lines = plainText.split('\n');
      const insertLine = Math.floor(lines.length / 2);
      lines[insertLine] = lines[insertLine] + encodedZw;
      return lines.join('\n');
    }

    return plainText + encodedZw;
  }

  /**
   * Scans any text, invoice, or exported log for forensic zero-width watermarks.
   */
  public async extractWatermark(watermarkedText: string): Promise<CanaryExtractionResult> {
    if (!watermarkedText) {
      return this.emptyResult();
    }

    // Search for ZW_HEADER and ZW_FOOTER bounds
    const startIndex = watermarkedText.indexOf(ZW_HEADER);
    const endIndex = watermarkedText.indexOf(ZW_FOOTER, startIndex);

    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
      return this.emptyResult();
    }

    const zwBlock = watermarkedText.substring(startIndex + 1, endIndex);
    const jsonString = this.zeroWidthToText(zwBlock);

    if (!jsonString) {
      return this.emptyResult();
    }

    try {
      const meta: CanaryMetadata = JSON.parse(jsonString);
      const signatureSource = `${meta.licenseeId}|${meta.licenseeName}|${meta.hardwareDna}|${meta.timestamp}|${meta.buildId}`;
      const expectedHash = await this.simpleHash(`${signatureSource}|${CANARY_SECRET_KEY}`);
      const isValid = meta.integrityHash === expectedHash;

      const reportAr = `
══════════════════════════════════════════════════════════
  تقرير التحقيق الجنائي والأدلة الرقمية (Digital Forensics)
══════════════════════════════════════════════════════════
• حالة التوثيق: ${isValid ? 'شفرة مائية أصلية وموثقة قانونياً' : 'شفرة تالفة أو معدلة'}
• المالك المرخص له: ${meta.licenseeName} (${meta.licenseeId})
• بصمة العتاد المصدرة: ${meta.hardwareDna}
• توقيت التسريب / التصدير: ${new Date(meta.timestamp).toLocaleString('ar-SA')}
• الفرع المصدر: ${meta.branchName}
• معرف النسخة البرمجية: ${meta.buildId}
• الرمز المشفر للنزاهة: ${meta.integrityHash.substring(0, 16)}...
══════════════════════════════════════════════════════════`;

      const reportEn = `
==========================================================
  FORENSIC CHAIN-OF-CUSTODY & WATERMARK INVESTIGATION
==========================================================
• Signature Status: ${isValid ? 'Cryptographically Valid & Verified' : 'Corrupted / Tampered'}
• Registered Licensee: ${meta.licenseeName} (${meta.licenseeId})
• Source Hardware DNA: ${meta.hardwareDna}
• Exfiltration Timestamp: ${new Date(meta.timestamp).toUTCString()}
• Source Branch: ${meta.branchName}
• Software Build: ${meta.buildId}
• Proof-of-Origin HMAC: ${meta.integrityHash.substring(0, 16)}...
==========================================================`;

      return {
        hasWatermark: true,
        metadata: meta,
        rawPayload: jsonString,
        isValidSignature: isValid,
        forensicReportAr: reportAr.trim(),
        forensicReportEn: reportEn.trim(),
        confidenceScore: isValid ? 100 : 60,
      };
    } catch {
      return this.emptyResult();
    }
  }

  /**
   * Generates a honeypot decoy beacon to catch unauthorized database queries or scrapers.
   */
  public generateHoneypotBeacon(trapType: CanaryHoneypotBeacon['trapType']): CanaryHoneypotBeacon {
    const randomHex = Math.random().toString(36).substring(2, 12).toUpperCase();
    const token = `CANARY-TRAP-${trapType.toUpperCase()}-${randomHex}`;
    const beacon: CanaryHoneypotBeacon = {
      id: `trap_${Date.now()}_${randomHex.substring(0, 4)}`,
      trapType,
      token,
      injectedAt: new Date().toISOString(),
      triggerCount: 0,
    };
    this.activeHoneypots.push(beacon);
    return beacon;
  }

  /**
   * Retrieves all active decoy honeypots.
   */
  public getActiveHoneypots(): CanaryHoneypotBeacon[] {
    return [...this.activeHoneypots];
  }

  /**
   * Converts standard string into invisible zero-width character stream.
   */
  private textToZeroWidth(text: string): string {
    let result = ZW_HEADER;
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const binary = charCode.toString(2).padStart(16, '0');
      for (let b = 0; b < binary.length; b++) {
        result += binary[b] === '1' ? ZW_ONE : ZW_ZERO;
      }
      result += ZW_DELIM;
    }
    result += ZW_FOOTER;
    return result;
  }

  /**
   * Decodes zero-width character stream back into standard text.
   */
  private zeroWidthToText(zwString: string): string | null {
    try {
      const charBlocks = zwString.split(ZW_DELIM);
      let output = '';

      for (const block of charBlocks) {
        if (!block) continue;
        let binaryStr = '';
        for (let i = 0; i < block.length; i++) {
          const char = block[i];
          if (char === ZW_ONE) binaryStr += '1';
          else if (char === ZW_ZERO) binaryStr += '0';
        }
        if (binaryStr.length === 16) {
          const charCode = parseInt(binaryStr, 2);
          output += String.fromCharCode(charCode);
        }
      }

      return output;
    } catch {
      return null;
    }
  }

  private async simpleHash(str: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        return Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {}
    }

    // Fallback hash
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  private emptyResult(): CanaryExtractionResult {
    return {
      hasWatermark: false,
      metadata: null,
      rawPayload: null,
      isValidSignature: false,
      forensicReportAr: 'لم يتم العثور على أي شفرات مائية خفية في هذا النص.',
      forensicReportEn: 'No zero-width forensic watermarks detected in this content.',
      confidenceScore: 0,
    };
  }

  private initDefaultBeacons(): void {
    this.activeHoneypots = [
      {
        id: 'trap_seed_vip',
        trapType: 'vip_customer_trap',
        token: 'CANARY-TRAP-VIP-CUSTOMER-HONEYPOT-8891',
        injectedAt: new Date().toISOString(),
        triggerCount: 0,
      },
      {
        id: 'trap_seed_cred',
        trapType: 'fake_db_credential',
        token: 'CANARY-TRAP-DB-INTERNAL-SECRET-7721',
        injectedAt: new Date().toISOString(),
        triggerCount: 0,
      },
    ];
  }
}

export const canaryToken = new CanaryTokenEngine();
