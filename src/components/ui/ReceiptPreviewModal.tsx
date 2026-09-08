import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  Download,
  Share2,
  X,
  CheckCircle2,
  QrCode,
  Sparkles,
  Maximize2,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Receipt,
  Building2,
  CreditCard,
  Banknote,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { printerService, ZatcaQrPayload } from '../../services/printerService';
import { Order, OrderItem } from '../../db/schema';
import { Button } from './Button';
import { Badge } from './Badge';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  items?: OrderItem[] | any[];
  restaurantInfo?: {
    nameAr: string;
    nameEn: string;
    vatNumber: string;
    addressAr: string;
    phone: string;
    crNumber?: string;
    footerNote: string;
  };
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  isOpen,
  onClose,
  order,
  items,
  restaurantInfo = {
    nameAr: 'مطعم السلطان الفاخر للمأكولات الملكية',
    nameEn: 'Sultan Royal Fine Dining Restaurant',
    vatNumber: '300987654300003',
    crNumber: '1010897654',
    addressAr: 'الرياض — طريق الملك فهد — برج المملكة',
    phone: '+966 11 400 9988',
    footerNote: 'نشكركم على زيارتكم الكريمة — أهلاً بكم دائماً',
  },
}) => {
  const { language, playSound } = useAppStore();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  // Fallback realistic sample order if none provided
  const displayOrder: Order = order || {
    id: 'ord-sample-demo',
    orderNumber: '#ORD-20260814-884',
    dailySequence: 42,
    orderType: 'dine_in',
    tableId: 'T-04',
    customerId: 'cust-vip-1',
    waiterId: 'emp-waiter-1',
    cashierId: 'emp-cashier-1',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    subtotal: 212.17,
    taxAmount: 31.83,
    discountAmount: 0,
    serviceCharge: 0,
    tipAmount: 0,
    deliveryFee: 0,
    totalAmount: 244.0,
    paidAmount: 244.0,
    changeAmount: 0,
    guestCount: 3,
    customerNotes: 'جلسة عائلية مميزة',
    syncStatus: 'synced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const displayItems: OrderItem[] = items && items.length > 0
    ? items
    : [
        {
          id: 'item-1',
          orderId: displayOrder.id,
          menuItemId: 'm1',
          nameAr: 'برجر ترافل أنجوس الفاخر',
          nameEn: 'Truffle Angus Burger',
          quantity: 2,
          unitPrice: 68.0,
          costPrice: 22.0,
          subtotal: 118.26,
          taxAmount: 17.74,
          discountAmount: 0,
          totalAmount: 136.0,
          selectedModifiers: [
            { optionId: 'doneness-1', groupId: 'doneness', nameAr: 'متوسط الاستواء (Medium)', nameEn: 'Medium', price: 0, quantity: 1 },
            { optionId: 'cheese-1', groupId: 'cheese', nameAr: 'جبن شيدر مدخن مضاعف', nameEn: 'Double Smoked Cheddar', price: 6, quantity: 1 }
          ],
          notes: 'بدون بصل مكرمل',
          kitchenStation: 'grill',
          status: 'ready',
          printedToKitchen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'item-2',
          orderId: displayOrder.id,
          menuItemId: 'm6',
          nameAr: 'بطاطس بالبارميزان وزيت الكمأة',
          nameEn: 'Parmesan Truffle Fries',
          quantity: 1,
          unitPrice: 34.0,
          costPrice: 8.0,
          subtotal: 29.57,
          taxAmount: 4.43,
          discountAmount: 0,
          totalAmount: 34.0,
          selectedModifiers: [],
          kitchenStation: 'fryer',
          status: 'ready',
          printedToKitchen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'item-3',
          orderId: displayOrder.id,
          menuItemId: 'm7',
          nameAr: 'موهيتو باشن فروت وريحان',
          nameEn: 'Passion Fruit Basil Mojito',
          quantity: 2,
          unitPrice: 28.0,
          costPrice: 5.0,
          subtotal: 48.70,
          taxAmount: 7.30,
          discountAmount: 0,
          totalAmount: 56.0,
          selectedModifiers: [],
          kitchenStation: 'beverages',
          status: 'ready',
          printedToKitchen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'item-4',
          orderId: displayOrder.id,
          menuItemId: 'm9',
          nameAr: 'كيكة التمر بالكراميل المملح',
          nameEn: 'Salted Caramel Date Pudding',
          quantity: 1,
          unitPrice: 44.0,
          costPrice: 11.0,
          subtotal: 38.26,
          taxAmount: 5.74,
          discountAmount: 0,
          totalAmount: 44.0,
          selectedModifiers: [],
          kitchenStation: 'bakery',
          status: 'ready',
          printedToKitchen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

  // Calculate actual totals if needed
  const grossTotal = displayItems.reduce((s, i) => s + (i.totalAmount || (i.unitPrice * i.quantity)), 0);
  const discount = displayOrder.discountAmount || 0;
  const netTotal = Math.max(0, grossTotal - discount);
  const subtotalBeforeVat = Number((netTotal / 1.15).toFixed(2));
  const vatAmount = Number((netTotal - subtotalBeforeVat).toFixed(2));
  const grandTotal = Number(netTotal.toFixed(2));

  // ZATCA Phase 2 QR generation
  const zatcaPayload: ZatcaQrPayload = {
    sellerName: restaurantInfo.nameAr,
    vatNumber: restaurantInfo.vatNumber,
    timestamp: displayOrder.createdAt,
    totalWithVat: grandTotal,
    vatTotal: vatAmount,
  };

  const zatcaBase64 = printerService.generateZatcaTlvBase64(zatcaPayload);
  const zatcaQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(
    zatcaBase64
  )}`;

  const handlePrint = async () => {
    playSound('kitchen-bell');
    setIsPrinting(true);
    try {
      await printerService.printReceipt(displayOrder, displayItems, restaurantInfo);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShareWhatsApp = () => {
    playSound('pop');
    const orderLines = displayItems
      .map((i) => `• ${i.quantity}x ${i.nameAr} = ${i.totalAmount.toFixed(2)} ر.س`)
      .join('%0A');

    const msg = `*${restaurantInfo.nameAr}*%0A` +
      `فاتورة ضريبية مبسطة رقم: *${displayOrder.orderNumber}*%0A` +
      `التاريخ: ${new Date(displayOrder.createdAt).toLocaleDateString('ar-SA')}%0A` +
      `----------------------------------%0A` +
      `${orderLines}%0A` +
      `----------------------------------%0A` +
      `المجموع قبل الضريبة: ${subtotalBeforeVat} ر.س%0A` +
      `ضريبة القيمة المضافة (15%): ${vatAmount} ر.س%0A` +
      `*الإجمالي النهائي: ${grandTotal} ر.س*%0A` +
      `طريقة الدفع: ${displayOrder.paymentMethod === 'card' ? 'بطاقة مدى / ائتمانية' : 'نقداً'}%0A` +
      `الرقم الضريبي: ${restaurantInfo.vatNumber}%0A%0A` +
      `${restaurantInfo.footerNote}`;

    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const handleCopyZatca = () => {
    playSound('click');
    navigator.clipboard.writeText(zatcaBase64);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 cursor-pointer"
      />

      {/* Main Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="relative z-50 w-full max-w-4xl max-h-[92vh] flex flex-col md:flex-row gap-4 glass-panel-elevated rounded-3xl p-4 sm:p-6 border border-white/15 shadow-2xl overflow-hidden"
      >
        {/* Left / Top Controls & Metadata Panel */}
        <div className="w-full md:w-80 flex flex-col justify-between border-b md:border-b-0 md:border-e border-white/10 pb-4 md:pb-0 md:pe-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {language === 'ar' ? 'معاينة الفاتورة الحرارية' : 'Thermal Receipt Preview'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ar' ? 'معتمدة ومطابقة لهيئة ZATCA' : 'ZATCA Phase 2 Compliant'}
                  </p>
                </div>
              </div>

              {/* Close Button on Mobile */}
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Paper Width Selector */}
            <div className="mt-5 p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <label className="text-[11px] font-bold text-slate-300 block">
                {language === 'ar' ? 'عرض ورق الطابعة' : 'Paper Roll Width'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    playSound('tap');
                    setPaperWidth('80mm');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    paperWidth === '80mm'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  80mm (Standard POS)
                </button>
                <button
                  onClick={() => {
                    playSound('tap');
                    setPaperWidth('58mm');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    paperWidth === '58mm'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  58mm (Mobile POS)
                </button>
              </div>
            </div>

            {/* ZATCA Phase 2 Compliance Badge */}
            <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="text-start">
                <div className="text-xs font-bold text-emerald-300">
                  {language === 'ar' ? 'باركود ZATCA TLV مشفّر' : 'ZATCA TLV Standard'}
                </div>
                <div className="text-[10px] text-emerald-400/80">
                  Tag 1-5 Base64 Encoded Hash
                </div>
              </div>
            </div>

            {/* Invoice Quick Summary */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>{language === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span>
                <span className="font-mono font-bold text-slate-200">{displayOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{language === 'ar' ? 'الطاولة:' : 'Table:'}</span>
                <span className="font-bold text-slate-200">{displayOrder.tableId || 'سفري'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{language === 'ar' ? 'طريقة الدفع:' : 'Payment:'}</span>
                <Badge variant={displayOrder.paymentMethod === 'cash' ? 'emerald' : 'blue'} size="sm">
                  {displayOrder.paymentMethod === 'cash' ? 'نقداً' : 'مدى / بطاقة'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePrint}
              disabled={isPrinting}
              className="w-full rounded-2xl shadow-lg shadow-amber-500/20 font-black gap-2 text-sm"
            >
              <Printer className="w-5 h-5" />
              <span>
                {isPrinting
                  ? (language === 'ar' ? 'جاري إرسال أمر الطباعة...' : 'Printing...')
                  : (language === 'ar' ? 'طباعة الفاتورة الفورية' : 'Print Receipt Now')}
              </span>
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShareWhatsApp}
                className="rounded-xl gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border-emerald-500/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyZatca}
                className="rounded-xl gap-1.5 text-xs font-bold text-slate-300"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <QrCode className="w-3.5 h-3.5" />}
                <span>{isCopied ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'رمز TLV' : 'Copy TLV')}</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full rounded-xl text-xs text-slate-400 hover:text-white"
            >
              {language === 'ar' ? 'إغلاق المعاينة' : 'Close Preview'}
            </Button>
          </div>
        </div>

        {/* Right Thermal Receipt Paper Simulator */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar p-2 sm:p-4 bg-black/40 rounded-2xl border border-white/5">
          {/* Zoom controls */}
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-400 px-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {language === 'ar' ? 'محاكاة الطابعة الحرارية الفعلية' : 'Live Thermal ESC/POS Emulation'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, Number((z - 0.1).toFixed(1))))}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.3, Number((z + 0.1).toFixed(1))))}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* The Thermal Paper Sheet Container */}
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              width: paperWidth === '80mm' ? '320px' : '250px',
              transition: 'width 0.3s ease, transform 0.2s ease',
            }}
            className="relative bg-[#faf8f5] text-slate-900 shadow-2xl p-5 select-text rounded-sm my-2 text-start font-sans leading-relaxed border-t-4 border-amber-500"
          >
            {/* Serrated Top Edge Cut Visual simulation */}
            <div
              className="absolute -top-2 left-0 right-0 h-2 bg-repeat-x pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 4px 0px, transparent 4px, #faf8f5 4.5px)',
                backgroundSize: '8px 8px',
              }}
            />

            {/* Header / Logo */}
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-950 text-amber-400 flex items-center justify-center font-black text-xl mb-1 shadow-md">
                👑
              </div>
              <h2 className="text-sm font-black tracking-tight text-slate-950 uppercase leading-snug">
                {restaurantInfo.nameAr}
              </h2>
              <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">
                {restaurantInfo.nameEn}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {restaurantInfo.addressAr}
              </div>
              <div className="text-[10px] text-slate-500">
                هاتف: {restaurantInfo.phone}
              </div>

              {/* Tax Invoice Badge */}
              <div className="mt-2 py-1 px-2 rounded bg-slate-200 text-[11px] font-black text-slate-900 inline-block border border-slate-300">
                فاتورة ضريبية مبسطة
                <div className="text-[9px] font-normal text-slate-700">Simplified Tax Invoice</div>
              </div>

              <div className="text-[10px] font-mono text-slate-700 mt-1 font-bold">
                الرقم الضريبي: {restaurantInfo.vatNumber}
              </div>
            </div>

            {/* Order Meta Info */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] font-mono space-y-1">
              <div className="flex justify-between">
                <span>رقم الفاتورة:</span>
                <span className="font-bold font-mono">{displayOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>التاريخ والوقت:</span>
                <span>{new Date(displayOrder.createdAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex justify-between">
                <span>النوع / الصالة:</span>
                <span className="font-bold">
                  {displayOrder.orderType === 'dine_in' ? `محلي — طاولة (${displayOrder.tableId || 'T-01'})` : 'سفري / استلام'}
                </span>
              </div>
              {displayOrder.guestCount && (
                <div className="flex justify-between">
                  <span>عدد الضيوف:</span>
                  <span>{displayOrder.guestCount} أشخاص</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>الكاشير:</span>
                <span>أحمد الشريف (EMP-003)</span>
              </div>
            </div>

            {/* Items Table Header */}
            <div className="py-2 border-b-2 border-slate-900 text-[11px] font-black grid grid-cols-12 gap-1 text-slate-900">
              <div className="col-span-6 text-start">الصنف</div>
              <div className="col-span-2 text-center">الكمية</div>
              <div className="col-span-4 text-end">الإجمالي</div>
            </div>

            {/* Items Rows */}
            <div className="py-1 space-y-2 border-b-2 border-slate-900 text-[11px]">
              {displayItems.map((item, idx) => (
                <div key={item.id || idx} className="py-1 border-b border-dotted border-slate-300 last:border-0">
                  <div className="grid grid-cols-12 gap-1 font-bold text-slate-950 items-start">
                    <div className="col-span-6 text-start leading-snug">
                      {item.nameAr}
                    </div>
                    <div className="col-span-2 text-center font-mono font-bold">
                      {item.quantity}x
                    </div>
                    <div className="col-span-4 text-end font-mono font-bold">
                      {(item.totalAmount || (item.unitPrice * item.quantity)).toFixed(2)} ر.س
                    </div>
                  </div>

                  {/* Modifiers & Extras */}
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="text-[10px] text-slate-600 pe-2 ps-1 mt-0.5 space-y-0.5">
                      {item.selectedModifiers.map((m: any, mIdx: number) => (
                        <div key={mIdx} className="flex justify-between">
                          <span>+ {m.nameAr}</span>
                          {m.price > 0 && <span>+{m.price.toFixed(2)}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Chef Notes */}
                  {item.notes && (
                    <div className="text-[10px] text-rose-700 italic ps-1 mt-0.5">
                      * ملاحظة: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="py-2 space-y-1.5 text-[11px] font-mono border-b-2 border-dashed border-slate-400">
              <div className="flex justify-between text-slate-700">
                <span>المجموع الخاضع للضريبة:</span>
                <span className="font-bold">{subtotalBeforeVat.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-bold">{vatAmount.toFixed(2)} ر.س</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>الخصم الممنوح:</span>
                  <span>-{discount.toFixed(2)} ر.س</span>
                </div>
              )}

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black text-slate-950">
                <span>الإجمالي النهائي المستحق:</span>
                <span className="text-base font-black font-mono">{grandTotal.toFixed(2)} ر.س</span>
              </div>
            </div>

            {/* Payment Method Details */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[11px] font-mono space-y-1">
              <div className="flex justify-between font-bold">
                <span>طريقة الدفع:</span>
                <span>{displayOrder.paymentMethod === 'card' ? 'شبكة / مدى (Mada Debit)' : 'نقداً (Cash)'}</span>
              </div>
              <div className="flex justify-between">
                <span>المبلغ المستلم:</span>
                <span>{grandTotal.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span>المتبقي للعميل:</span>
                <span>0.00 ر.س</span>
              </div>
            </div>

            {/* ZATCA Phase 2 Official QR Code Stamp */}
            <div className="py-4 text-center flex flex-col items-center justify-center">
              <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs inline-block">
                <img
                  src={zatcaQrUrl}
                  alt="ZATCA Phase 2 QR Code"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <div className="text-[9px] font-bold text-slate-600 mt-1.5">
                امسح الرمز للتحقق عبر تطبيق زاتكا (ZATCA App)
              </div>
              <div className="text-[8px] font-mono text-slate-400 mt-0.5">
                Hash: {zatcaBase64.substring(0, 24)}...
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[10px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">{restaurantInfo.footerNote}</div>
              <div className="text-[9px] text-slate-400">
                نظام Restaurant OS السحابي — الفاتورة إلكترونية معتمدة
              </div>
            </div>

            {/* Serrated Bottom Edge Cut Visual simulation */}
            <div
              className="absolute -bottom-2 left-0 right-0 h-2 bg-repeat-x pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 4px 8px, transparent 4px, #faf8f5 4.5px)',
                backgroundSize: '8px 8px',
              }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
