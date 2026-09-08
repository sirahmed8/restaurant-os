/**
 * =====================================================================
 * RESTAURANT OS — ZATCA PHASE 2 (FATOORA) DATA TYPES & INTERFACES
 * =====================================================================
 * Specifications adhering to ZATCA Phase 2 (Integration Phase):
 * - UBL 2.1 XML Schemas & Namespaces
 * - Cryptographic Invoice Hash Chaining (SHA-256 & PIH)
 * - ECDSA Digital Signatures & X.509 CSID Certificates
 * - Phase 2 Extended TLV QR Code (Tags 1-8)
 * - Clearance (B2B) & Reporting (B2C) API Integration
 */

export type ZatcaInvoiceType = 'tax_invoice' | 'simplified_tax_invoice' | 'credit_note' | 'debit_note' | 'prepayment';

export type ZatcaInvoiceTypeCode = '388' | '381' | '383' | '386';

export type ZatcaInvoiceSubtype = 
  | '0100000' // Standard Tax Invoice (B2B / B2G) - Clearance required
  | '0200000' // Simplified Tax Invoice (B2C) - Reporting within 24h
  | '0110000' // Standard Export Invoice
  | '0210000' // Simplified Export Invoice
  | '0100100' // Standard Summary Invoice
  | '0200100'; // Simplified Summary Invoice

export type ZatcaEnvironment = 'sandbox' | 'simulation' | 'production';

export type ZatcaComplianceStatus = 
  | 'CLEARED'      // B2B Approved by ZATCA Clearance API
  | 'REPORTED'     // B2C Successfully reported to ZATCA
  | 'PENDING'      // Queued for clearance/reporting
  | 'WARNINGS'     // Cleared/Reported with non-fatal warnings
  | 'REJECTED'     // Rejected by ZATCA Schematron/Business rules
  | 'TAMPERED';    // Hash chain verification failed

export type ZatcaPaymentCode = 
  | '10'  // Cash
  | '30'  // Credit / Bank Transfer
  | '42'  // Payment to Bank Account
  | '48'  // Bank Card / POS / Mada / Visa / Master
  | '01'  // Instrument not defined / Other
  | 'ZZZ'; // Mutually defined / Split

export interface ZatcaPartyAddress {
  streetName: string;
  buildingNumber: string;
  additionalStreetName?: string;
  citySubdivisionName: string; // District / الحي
  cityName: string;
  postalZone: string; // 5 digits
  countrySubentity?: string; // Province / المنطقة
  countryCode: 'SA';
}

export interface ZatcaSupplierInfo {
  crn: string; // Commercial Registration No (10 digits)
  vatNumber: string; // 15 digits starting and ending with 3
  legalNameAr: string;
  legalNameEn: string;
  branchNameAr: string;
  branchNameEn: string;
  address: ZatcaPartyAddress;
  egsSerialNumber: string; // Solution Name | Model | Serial
}

export interface ZatcaCustomerInfo {
  buyerType: 'b2b' | 'b2c';
  vatNumber?: string; // Mandatory for B2B (15 digits)
  crnOrId?: string; // Commercial Registration or National ID
  idType?: 'CRN' | 'MOMRA' | 'MLSD' | '700' | 'NAT' | 'TIN';
  legalNameAr: string;
  legalNameEn?: string;
  address?: ZatcaPartyAddress;
  phone?: string;
  email?: string;
}

export interface ZatcaInvoiceLineItem {
  id: string; // 1, 2, 3...
  nameAr: string;
  nameEn?: string;
  quantity: number;
  unitCode: string; // 'PCE', 'KGM', 'LTR', etc.
  unitPrice: number; // Excluding VAT
  discountAmount: number; // Line discount
  taxRate: number; // e.g. 0.15
  taxAmount: number; // (quantity * unitPrice - discount) * taxRate
  subtotal: number; // (quantity * unitPrice - discount)
  totalWithTax: number; // subtotal + taxAmount
  taxCategory: 'S' | 'Z' | 'E' | 'O'; // Standard, Zero, Exempt, Out of scope
}

export interface ZatcaInvoiceDraft {
  invoiceId: string; // Human-friendly internal ID e.g. INV-2026-00100
  uuid: string; // RFC4122 v4 UUID
  invoiceType: ZatcaInvoiceType;
  invoiceTypeCode: ZatcaInvoiceTypeCode;
  invoiceSubtype: ZatcaInvoiceSubtype;
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  icv: number; // Invoice Counter Value (Sequential 1, 2, 3...)
  pih: string; // Previous Invoice Hash (Base64 SHA-256)
  paymentMeansCode: ZatcaPaymentCode;
  customer: ZatcaCustomerInfo;
  items: ZatcaInvoiceLineItem[];
  subtotal: number; // Tax exclusive
  discountTotal: number;
  taxTotal: number;
  totalWithTax: number;
  paidAmount?: number;
  prepaidAmount?: number;
  payableAmount: number;
  notes?: string;
  billingReferenceId?: string; // Required for Credit/Debit notes
  billingReferenceReason?: string; // Reason for Credit/Debit note
}

export interface ZatcaTlvTag {
  tag: number;
  tagTitleAr: string;
  tagTitleEn: string;
  value: string;
  rawBytesLength: number;
}

export interface ZatcaCsidInfo {
  csidType: 'compliance' | 'production';
  certificateBinary: string; // Base64 DER/PEM X.509
  certificatePem: string;
  privateKeyPem: string;
  publicKeyPem: string;
  issuerSerial: string;
  commonName: string;
  organizationUnit: string;
  organizationName: string;
  country: string;
  issuedAt: string;
  expiresAt: string;
  environment: ZatcaEnvironment;
  authSecret: string; // Basic auth secret token
  isValid: boolean;
}

export interface ZatcaValidationMessage {
  type: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  category: 'SCHEMATRON' | 'XSD' | 'BUSINESS_RULES' | 'CRYPTOGRAPHY';
  messageAr: string;
  messageEn: string;
  field?: string;
}

export interface ZatcaApiResponse {
  status: ZatcaComplianceStatus;
  invoiceUuid: string;
  invoiceNumber: string;
  validationResults: {
    infoMessages: ZatcaValidationMessage[];
    warningMessages: ZatcaValidationMessage[];
    errorMessages: ZatcaValidationMessage[];
    status: 'PASS' | 'WARNING' | 'ERROR';
  };
  clearedInvoiceXml?: string;
  reportingTimestamp: string;
  zatcaQrCodeBase64: string;
  invoiceHashHex: string;
  invoiceHashBase64: string;
  digitalSignature: string;
  responsePayloadRaw: Record<string, any>;
}

export interface ZatcaCompleteInvoiceRecord {
  id: string;
  uuid: string;
  invoiceNumber: string;
  icv: number;
  issueDate: string;
  issueTime: string;
  type: ZatcaInvoiceType;
  typeCode: ZatcaInvoiceTypeCode;
  subtype: ZatcaInvoiceSubtype;
  supplier: ZatcaSupplierInfo;
  customer: ZatcaCustomerInfo;
  items: ZatcaInvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  totalWithTax: number;
  pih: string; // Previous Invoice Hash
  invoiceHash: string; // Current Invoice SHA-256 Base64
  invoiceHashHex: string;
  digitalSignature: string; // ECDSA signature Base64
  publicKey: string;
  qrCodeTlvBase64: string;
  ublXml: string;
  status: ZatcaComplianceStatus;
  apiResponse?: ZatcaApiResponse;
  isChainValid: boolean;
  tamperDetected?: boolean;
  createdAt: string;
}

export interface ZatcaAuditFileExport {
  fafVersion: string;
  generatedAt: string;
  taxAuthority: string;
  supplier: ZatcaSupplierInfo;
  csidStatus: {
    environment: ZatcaEnvironment;
    certificateSerial: string;
    expiresAt: string;
  };
  chainSummary: {
    totalInvoices: number;
    startIcv: number;
    endIcv: number;
    genesisPih: string;
    latestInvoiceHash: string;
    isChainContinuous: boolean;
  };
  invoices: {
    icv: number;
    invoiceNumber: string;
    uuid: string;
    typeCode: string;
    subtype: string;
    issueDate: string;
    issueTime: string;
    customerVat?: string;
    taxExclusiveAmount: number;
    taxAmount: number;
    taxInclusiveAmount: number;
    pih: string;
    invoiceHash: string;
    status: ZatcaComplianceStatus;
  }[];
}
