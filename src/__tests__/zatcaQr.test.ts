import { describe, it, expect } from 'vitest';
import { printerService, ZatcaQrPayload } from '../services/printerService';

/**
 * Utility helper to decode ZATCA TLV Base64 payload into parsed tags.
 */
function parseZatcaTlv(base64Str: string): Map<number, string> {
  const binaryString = atob(base64Str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const utf8Decoder = new TextDecoder('utf-8');
  const tagsMap = new Map<number, string>();

  let offset = 0;
  while (offset < bytes.length) {
    const tag = bytes[offset];
    const length = bytes[offset + 1];
    const valueBytes = bytes.slice(offset + 2, offset + 2 + length);
    const valueStr = utf8Decoder.decode(valueBytes);

    tagsMap.set(tag, valueStr);
    offset += 2 + length;
  }

  return tagsMap;
}

describe('ZATCA (FATOORA) Phase 2 TLV QR Code Generator', () => {
  it('should generate valid Base64 encoded TLV string for Phase 2 Simplified Tax Invoice', () => {
    const payload: ZatcaQrPayload = {
      sellerName: 'مطعم السلطان الفاخر للمأكولات الملكية',
      vatNumber: '300987654300003',
      timestamp: '2026-08-14T13:00:00Z',
      totalWithVat: 460.0,
      vatTotal: 60.0,
    };

    const base64 = printerService.generateZatcaTlvBase64(payload);
    expect(base64).toBeDefined();
    expect(typeof base64).toBe('string');
    expect(base64.length).toBeGreaterThan(20);

    // Parse back TLV
    const parsed = parseZatcaTlv(base64);

    expect(parsed.size).toBe(5);
    expect(parsed.get(1)).toBe('مطعم السلطان الفاخر للمأكولات الملكية');
    expect(parsed.get(2)).toBe('300987654300003');
    expect(parsed.get(3)).toBe('2026-08-14T13:00:00Z');
    expect(parsed.get(4)).toBe('460.00');
    expect(parsed.get(5)).toBe('60.00');
  });

  it('should accurately encode multi-byte Arabic UTF-8 strings where byte length > char length', () => {
    const arabicSeller = 'شركة مطاعم الذواقة المحدودة — فرع الرياض';
    const payload: ZatcaQrPayload = {
      sellerName: arabicSeller,
      vatNumber: '310123456700003',
      timestamp: '2026-08-14T12:30:45Z',
      totalWithVat: 115.5,
      vatTotal: 15.06,
    };

    const base64 = printerService.generateZatcaTlvBase64(payload);
    const parsed = parseZatcaTlv(base64);

    // Verify tag 1 exact match
    expect(parsed.get(1)).toBe(arabicSeller);

    // Verify tag length corresponds to UTF-8 byte length
    const encoder = new TextEncoder();
    const expectedByteLength = encoder.encode(arabicSeller).length;

    // Check byte length vs character count (Arabic characters are 2 bytes each in UTF-8)
    expect(expectedByteLength).toBeGreaterThan(arabicSeller.length);
  });

  it('should format totalWithVat and vatTotal strictly to 2 decimal places', () => {
    const payload: ZatcaQrPayload = {
      sellerName: 'POS Cafe',
      vatNumber: '300000000000003',
      timestamp: '2026-08-14T10:00:00Z',
      totalWithVat: 100, // whole integer
      vatTotal: 13.043478, // floating number
    };

    const base64 = printerService.generateZatcaTlvBase64(payload);
    const parsed = parseZatcaTlv(base64);

    expect(parsed.get(4)).toBe('100.00');
    expect(parsed.get(5)).toBe('13.04');
  });

  it('should handle zero tax scenarios correctly', () => {
    const payload: ZatcaQrPayload = {
      sellerName: 'Zero Tax Entity',
      vatNumber: '300111222300003',
      timestamp: '2026-08-14T09:00:00Z',
      totalWithVat: 50.0,
      vatTotal: 0.0,
    };

    const base64 = printerService.generateZatcaTlvBase64(payload);
    const parsed = parseZatcaTlv(base64);

    expect(parsed.get(4)).toBe('50.00');
    expect(parsed.get(5)).toBe('0.00');
  });

  it('should handle high revenue orders without corruption', () => {
    const payload: ZatcaQrPayload = {
      sellerName: 'Royal Catering & VIP Banquets',
      vatNumber: '300999888700003',
      timestamp: '2026-08-14T18:00:00Z',
      totalWithVat: 145890.75,
      vatTotal: 19029.23,
    };

    const base64 = printerService.generateZatcaTlvBase64(payload);
    const parsed = parseZatcaTlv(base64);

    expect(parsed.get(4)).toBe('145890.75');
    expect(parsed.get(5)).toBe('19029.23');
  });
});
