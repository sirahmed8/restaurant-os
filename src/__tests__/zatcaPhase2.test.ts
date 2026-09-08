import { describe, it, expect, beforeEach } from 'vitest';
import { zatcaPhase2Service, sha256Sync, ZATCA_GENESIS_PIH } from '../services/zatcaPhase2Service';
import { ZatcaInvoiceDraft } from '../types/zatca';

describe('ZATCA Phase 2 (FATOORA Integration) Engine Suite', () => {
  beforeEach(() => {
    zatcaPhase2Service.resetLedgerForTesting();
  });

  describe('1. Pure TypeScript SHA-256 & Cryptographic Hashing', () => {
    it('should compute exact deterministic SHA-256 hashes', () => {
      const hash1 = sha256Sync('Hello ZATCA Phase 2');
      const hash2 = sha256Sync('Hello ZATCA Phase 2');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should have correct ZATCA Genesis PIH constant', () => {
      expect(ZATCA_GENESIS_PIH).toBeDefined();
      expect(typeof ZATCA_GENESIS_PIH).toBe('string');
    });
  });

  describe('2. UBL 2.1 XML Generation & Canonicalization', () => {
    it('should generate valid UBL 2.1 XML with all required tags', () => {
      const draft: ZatcaInvoiceDraft = {
        invoiceId: 'INV-2026-00001',
        uuid: '00000000-0000-4000-8000-000000000001',
        issueDate: '2026-08-16',
        issueTime: '12:00:00',
        invoiceType: 'tax_invoice',
        invoiceTypeCode: '388',
        invoiceSubtype: '0100000',
        paymentMeansCode: '10',
        icv: 1,
        pih: ZATCA_GENESIS_PIH,
        customer: {
          buyerType: 'b2b',
          legalNameAr: 'شركة اليمامة للمقاولات',
          legalNameEn: 'Al-Yamamah Contracting Co.',
          vatNumber: '300000000000003',
        },
        items: [
          {
            id: 'item-1',
            nameAr: 'وجبة غداء فاخرة',
            nameEn: 'Luxury Lunch Meal',
            quantity: 2,
            unitCode: 'PCE',
            unitPrice: 100,
            discountAmount: 0,
            taxRate: 0.15,
            taxAmount: 30,
            subtotal: 200,
            totalWithTax: 230,
            taxCategory: 'S',
          },
        ],
        subtotal: 200,
        taxTotal: 30,
        discountTotal: 0,
        totalWithTax: 230,
        payableAmount: 230,
      };

      const supplier = zatcaPhase2Service.getSupplierProfile();
      const xml = zatcaPhase2Service.generateUbl21Xml(draft, supplier);

      expect(xml).toContain('<Invoice');
      expect(xml).toContain('<cbc:ID>INV-2026-00001</cbc:ID>');
      expect(xml).toContain('<cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>');
      expect(xml).toContain(supplier.vatNumber);
      expect(xml).toContain('<cbc:TaxInclusiveAmount currencyID="SAR">230.00</cbc:TaxInclusiveAmount>');
    });
  });

  describe('3. Cryptographic Hash Chaining & Blockchain Integrity', () => {
    it('should chain invoices sequentially using Previous Invoice Hash (PIH)', async () => {
      const draft1 = {
        invoiceId: 'INV-2026-001',
        issueDate: '2026-08-16',
        issueTime: '10:00:00',
        invoiceType: 'simplified_tax_invoice' as const,
        invoiceTypeCode: '388' as const,
        invoiceSubtype: '0200000' as const,
        paymentMeansCode: '10' as const,
        items: [
          {
            id: 'it-1',
            nameAr: 'برجر كلاسيك',
            nameEn: 'Classic Burger',
            quantity: 1,
            unitCode: 'PCE',
            unitPrice: 40,
            discountAmount: 0,
            taxRate: 0.15,
            taxAmount: 6,
            subtotal: 40,
            totalWithTax: 46,
            taxCategory: 'S' as const,
          },
        ],
        subtotal: 40,
        taxTotal: 6,
        discountTotal: 0,
        totalWithTax: 46,
        payableAmount: 46,
      };

      const inv1 = await zatcaPhase2Service.createAndProcessInvoice(draft1);
      expect(inv1.icv).toBe(1);
      expect(inv1.pih).toBe(ZATCA_GENESIS_PIH);

      const draft2 = {
        ...draft1,
        invoiceId: 'INV-2026-002',
      };

      const inv2 = await zatcaPhase2Service.createAndProcessInvoice(draft2);
      expect(inv2.icv).toBe(2);
      expect(inv2.pih).toBe(inv1.invoiceHash);

      // Verify chain integrity
      const audit = zatcaPhase2Service.verifyChainIntegrity();
      expect(audit.isValid).toBe(true);
      expect(audit.totalInvoices).toBe(2);
    });
  });

  describe('4. Extended Phase 2 TLV QR Code Generation', () => {
    it('should encode Phase 2 Tags 1 through 8 into valid Base64 string', () => {
      const qrBase64 = zatcaPhase2Service.generatePhase2TlvBase64({
        sellerName: 'مطعم القصر الفاخر',
        vatNumber: '310123456700003',
        timestamp: '2026-08-16T12:00:00Z',
        totalWithVat: 230.0,
        vatTotal: 30.0,
        invoiceHashBase64: 'sampleHashBase64==',
        digitalSignatureBase64: 'sampleSignatureBase64==',
        publicKeyBase64: 'samplePublicKeyBase64==',
      });

      expect(qrBase64).toBeDefined();
      expect(typeof qrBase64).toBe('string');
      expect(qrBase64.length).toBeGreaterThan(50);
    });
  });

  describe('5. CSID Management & FAF Export', () => {
    it('should request production CSID with valid OTP', async () => {
      const res = await zatcaPhase2Service.onboardWithOtp({
        otp: '123456',
        commonName: 'REST-OS-EGS-01',
        organizationUnit: 'Main Branch',
        organizationName: 'Golden Sultan Rest',
        environment: 'production',
      });
      expect(res.success).toBe(true);
      expect(res.csid?.csidType).toBe('production');
      expect(res.csid?.certificateBinary).toBeDefined();
    });

    it('should export valid FAF JSON file', () => {
      const fafExport = zatcaPhase2Service.generateFafExport();
      expect(fafExport.fafVersion).toBe('2.0-ZATCA-KSA');
      expect(Array.isArray(fafExport.invoices)).toBe(true);
    });
  });
});
