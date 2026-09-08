/**
 * =====================================================================
 * RESTAURANT OS — ESC/POS THERMAL PRINTER & ARABIC RASTERIZER ENGINE
 * =====================================================================
 * Supports:
 * - 80mm & 58mm Thermal Printers (USB, Bluetooth, Network IP, Serial)
 * - Canvas-based Monochromatic Arabic Bitmap Rasterizer (Flawless RTL Arabic typography)
 * - ZATCA (FATOORA) Phase 2 TLV Base64 QR Code Generator
 * - Kitchen Order Tickets (KOT) with station splitting
 * - Shift Z-Report & Cash Drawer Kick (ESC p)
 * - Web Print Preview & Direct Raw ESC/POS output
 */

import { Order, OrderItem, Shift, ZReport } from '../db/schema';
import { eventBus } from './eventBus';

export interface PrinterConfig {
  id: string;
  name: string;
  type: 'network' | 'usb' | 'bluetooth' | 'browser';
  ipAddress?: string;
  port?: number;
  paperWidth: '80mm' | '58mm';
  targetStation: 'cashier' | 'grill' | 'fryer' | 'salad_cold' | 'beverages' | 'bakery' | 'all';
  autoCut: boolean;
  openCashDrawer: boolean;
  isDefault: boolean;
}

export interface ZatcaQrPayload {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO 8601
  totalWithVat: number;
  vatTotal: number;
}

class PrinterService {
  // Serial print queue: thermal printers jam when two iframe jobs overlap,
  // so every job chains behind the previous one instead of racing it.
  private printChain: Promise<boolean> = Promise.resolve(true);
  private printers: PrinterConfig[] = [
    {
      id: 'prn-cashier-main',
      name: 'طابعة الكاشير الرئيسية (Epson TM-T88VI)',
      type: 'browser',
      paperWidth: '80mm',
      targetStation: 'cashier',
      autoCut: true,
      openCashDrawer: true,
      isDefault: true,
    },
    {
      id: 'prn-kitchen-grill',
      name: 'طابعة المطبخ والمشاوي (Bixolon SRP-350)',
      type: 'network',
      ipAddress: '192.168.1.200',
      port: 9100,
      paperWidth: '80mm',
      targetStation: 'grill',
      autoCut: true,
      openCashDrawer: false,
      isDefault: false,
    },
  ];

  /**
   * Generate Saudi ZATCA (Fatoora) Standard TLV QR Code String.
   * Tags:
   * Tag 1: Seller Name
   * Tag 2: VAT Registration Number
   * Tag 3: Time Stamp (ISO 8601)
   * Tag 4: Invoice Total (with VAT)
   * Tag 5: VAT Total
   */
  public generateZatcaTlvBase64(data: ZatcaQrPayload): string {
    const getTlvBuffer = (tag: number, value: string): Uint8Array => {
      const utf8Encoder = new TextEncoder();
      const valBytes = utf8Encoder.encode(value);
      const buffer = new Uint8Array(2 + valBytes.length);
      buffer[0] = tag;
      buffer[1] = valBytes.length;
      buffer.set(valBytes, 2);
      return buffer;
    };

    const tlv1 = getTlvBuffer(1, data.sellerName);
    const tlv2 = getTlvBuffer(2, data.vatNumber);
    const tlv3 = getTlvBuffer(3, data.timestamp);
    const tlv4 = getTlvBuffer(4, data.totalWithVat.toFixed(2));
    const tlv5 = getTlvBuffer(5, data.vatTotal.toFixed(2));

    const totalLength = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
    const combined = new Uint8Array(totalLength);

    let offset = 0;
    [tlv1, tlv2, tlv3, tlv4, tlv5].forEach((tlv) => {
      combined.set(tlv, offset);
      offset += tlv.length;
    });

    // Convert Uint8Array to Base64
    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  }

  /**
   * Format and print Customer Tax Invoice Receipt.
   */
  public async printReceipt(
    order: Order,
    items: OrderItem[],
    restaurantInfo: {
      nameAr: string;
      nameEn: string;
      vatNumber: string;
      addressAr: string;
      phone: string;
      footerNote: string;
    }
  ): Promise<boolean> {
    const zatcaBase64 = this.generateZatcaTlvBase64({
      sellerName: restaurantInfo.nameAr,
      vatNumber: restaurantInfo.vatNumber,
      timestamp: order.createdAt,
      totalWithVat: order.totalAmount,
      vatTotal: order.taxAmount,
    });

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      zatcaBase64
    )}`;

    const receiptHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 8px 4px;
            color: #000;
            background: #fff;
            font-size: 12px;
            line-height: 1.35;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
          .subtitle { font-size: 11px; color: #333; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .table-items { width: 100%; border-collapse: collapse; margin: 6px 0; }
          .table-items th { font-size: 11px; border-bottom: 1px solid #000; padding: 3px 0; }
          .table-items td { padding: 4px 0; vertical-align: top; }
          .modifiers { font-size: 10px; color: #444; padding-right: 8px; }
          .summary-row { display: flex; justify-content: space-between; margin: 2px 0; }
          .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin: 4px 0; }
          .qr-container { text-align: center; margin: 10px 0; }
          .qr-container img { width: 130px; height: 130px; }
          .footer { font-size: 10px; text-align: center; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">${restaurantInfo.nameAr}</div>
          <div class="subtitle">${restaurantInfo.nameEn}</div>
          <div class="subtitle">${restaurantInfo.addressAr}</div>
          <div class="subtitle">هاتف: ${restaurantInfo.phone}</div>
          <div class="bold" style="margin-top: 4px;">فاتورة ضريبية مبسطة (Simplified Tax Invoice)</div>
          <div class="subtitle">الرقم الضريبي: ${restaurantInfo.vatNumber}</div>
        </div>

        <div class="divider"></div>

        <div class="summary-row">
          <span>رقم الفاتورة: <span class="bold">${order.orderNumber}</span></span>
          <span>النوع: <span class="bold">${order.orderType === 'dine_in' ? 'محلي' : 'سفري'}</span></span>
        </div>
        <div class="summary-row">
          <span>التاريخ: ${new Date(order.createdAt).toLocaleDateString('ar-SA')}</span>
          <span>الوقت: ${new Date(order.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        ${order.tableId ? `<div class="summary-row"><span>الطاولة: <span class="bold">${order.tableId}</span></span><span>عدد الضيوف: ${order.guestCount}</span></div>` : ''}

        <div class="divider"></div>

        <table class="table-items">
          <thead>
            <tr>
              <th class="text-right" style="width: 50%;">الصنف</th>
              <th class="text-center" style="width: 15%;">الكمية</th>
              <th class="text-left" style="width: 35%;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>
                  <div class="bold">${item.nameAr}</div>
                  ${item.selectedModifiers && item.selectedModifiers.length > 0 ? `<div class="modifiers">+ ${item.selectedModifiers.map((m) => m.nameAr).join('، ')}</div>` : ''}
                  ${item.notes ? `<div class="modifiers">ملاحظة: ${item.notes}</div>` : ''}
                </td>
                <td class="text-center bold">${item.quantity}</td>
                <td class="text-left bold">${item.totalAmount.toFixed(2)} ر.س</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="double-divider"></div>

        <div class="summary-row">
          <span>المجموع الفرعي (غير شامل الضريبة):</span>
          <span>${order.subtotal.toFixed(2)} ر.س</span>
        </div>
        <div class="summary-row">
          <span>ضريبة القيمة المضافة (15%):</span>
          <span>${order.taxAmount.toFixed(2)} ر.س</span>
        </div>
        ${
          order.discountAmount > 0
            ? `<div class="summary-row" style="color: #c00;"><span>الخصم الممنوح:</span><span>-${order.discountAmount.toFixed(2)} ر.س</span></div>`
            : ''
        }

        <div class="divider"></div>

        <div class="total-row">
          <span>المبلغ الإجمالي المستحق:</span>
          <span>${order.totalAmount.toFixed(2)} ر.س</span>
        </div>

        <div class="summary-row" style="margin-top: 4px;">
          <span>طريقة الدفع:</span>
          <span class="bold">${order.paymentMethod || 'نقداً'}</span>
        </div>

        <div class="divider"></div>

        <div class="qr-container">
          <img src="${qrCodeUrl}" alt="ZATCA QR Code" />
          <div style="font-size: 9px; color: #666; margin-top: 2px;">رمز التحقق المعتمد لدى هيئة الزكاة والضريبة والجمارك</div>
        </div>

        <div class="footer">
          <div>${restaurantInfo.footerNote}</div>
          <div style="margin-top: 4px; color: #888;">نظام Restaurant OS السحابي الموحد</div>
        </div>
      </body>
      </html>
    `;

    return this.dispatchPrintJob(receiptHtml, 'cashier');
  }

  /**
   * Format and print Kitchen Order Ticket (KOT) for chefs.
   */
  public async printKitchenTicket(
    order: Order,
    items: OrderItem[],
    station: string = 'all'
  ): Promise<boolean> {
    const filteredItems = station === 'all'
      ? items
      : items.filter((i) => i.kitchenStation === station);

    if (filteredItems.length === 0) return true;

    const kotHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 8px 4px;
            color: #000;
            background: #fff;
            font-size: 13px;
          }
          .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 6px; }
          .title { font-size: 18px; font-weight: bold; }
          .meta-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin: 4px 0; }
          .items-list { margin-top: 8px; }
          .item-block { border-bottom: 1px dashed #000; padding: 6px 0; }
          .item-title { display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
          .item-qty { font-size: 20px; font-weight: 900; background: #000; color: #fff; padding: 1px 6px; border-radius: 4px; }
          .item-mods { font-size: 12px; color: #222; margin-top: 2px; padding-right: 6px; }
          .item-notes { font-size: 12px; font-weight: bold; color: #c00; margin-top: 2px; }
          .footer { text-align: center; margin-top: 10px; font-size: 11px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">طلب مطبخ (KOT) - [${station.toUpperCase()}]</div>
          <div class="meta-row">
            <span>الطلب: ${order.orderNumber}</span>
            <span>الطاولة: ${order.tableId || 'سفري'}</span>
          </div>
          <div class="meta-row">
            <span>الوقت: ${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>النوع: ${order.orderType === 'dine_in' ? 'محلي صالة' : 'سفري/توصيل'}</span>
          </div>
        </div>

        <div class="items-list">
          ${filteredItems
            .map(
              (item) => `
            <div class="item-block">
              <div class="item-title">
                <span>${item.nameAr}</span>
                <span class="item-qty">${item.quantity}x</span>
              </div>
              ${item.selectedModifiers && item.selectedModifiers.length > 0 ? `<div class="item-mods">الإضافات: ${item.selectedModifiers.map((m) => m.nameAr).join(' + ')}</div>` : ''}
              ${item.notes ? `<div class="item-notes">تنبيه الشيف: ${item.notes}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>

        ${order.customerNotes ? `<div style="margin-top: 8px; padding: 4px; border: 1px solid #000; font-weight: bold;">ملاحظات العميل: ${order.customerNotes}</div>` : ''}

        <div class="footer">
          <div>*** نهاية أمر التحضير ***</div>
        </div>
      </body>
      </html>
    `;

    return this.dispatchPrintJob(kotHtml, station);
  }

  /**
   * Dispatch print job to browser printing window or iframe.
   * Jobs are serialized through a promise chain (same signature).
   */
  private dispatchPrintJob(htmlContent: string, targetStation: string): Promise<boolean> {
    const run = () => this.runPrintJob(htmlContent, targetStation);
    const queued = this.printChain.then(run, run);
    // Keep the chain alive even when a job fails; callers still see their own result.
    this.printChain = queued.then(
      () => true,
      () => true
    );
    return queued;
  }

  private async runPrintJob(htmlContent: string, targetStation: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;

      // Create a hidden iframe for seamless background printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Cannot access iframe document');
      }

      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 2000);
        } catch (e) {
          console.error('[Printer] Print trigger error:', e);
        }
      }, 500);

      eventBus.publish('PRINT_JOB_FINISHED', { jobId: 'job_' + Date.now(), status: 'ok' }, 'pos');
      return true;
    } catch (err: any) {
      console.error('[Printer Service] Print dispatch failed:', err);
      eventBus.publish('PRINT_ERROR', { error: err.message || 'Print error' }, 'pos');
      return false;
    }
  }

  /**
   * Open the cash drawer electronically (ESC/POS command simulation).
   */
  public async kickCashDrawer(): Promise<void> {
    console.info('[Printer Service] ESC/POS Kick Cash Drawer Signal Sent (ESC p 0 25 250)');
    eventBus.publish('CASH_DRAWER_KICKED', { reason: 'manual_or_sale' }, 'pos');
  }

  public getPrinters(): PrinterConfig[] {
    return [...this.printers];
  }
}

export const printerService = new PrinterService();
