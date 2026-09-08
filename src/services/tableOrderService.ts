/**
 * =====================================================================
 * RESTAURANT OS — TABLESIDE GUEST PORTAL & LIVE ORDER TRACKER SERVICE
 * =====================================================================
 * Handles:
 * 1. QR Code token generation & URL parameter simulation
 * 2. Guest table session lifecycle & live state management
 * 3. Direct order routing to Kitchen KDS & EventBus broadcasting
 * 4. Real-time cooking stage tracker with live minutes countdown
 * 5. Waiter call bell & electronic bill settlement with ZATCA QR
 * 6. Dynamic allergen filtering, calorie budgeting & guest feedback
 */

import { db } from '../db';
import {
  DiningTable,
  Order,
  OrderItem,
  MenuItem,
  KitchenStation,
  OrderItemStatus,
  OrderStatus,
  TableStatus,
} from '../db/schema';
import { eventBus } from './eventBus';
import { printerService } from './printerService';
import {
  TableCookingStage,
  WaiterCallType,
  TablePaymentMethod,
  TableQrPayload,
  TableGuestSession,
  GuestCartItem,
  TableOrderProgress,
  WaiterCallRequest,
  BillRequestPayload,
  GuestFeedbackPayload,
  GuestPortalFilterState,
} from '../types/tablePortal';

export class TableOrderService {
  private activeSessions: Map<string, TableGuestSession> = new Map();
  private orderProgressMap: Map<string, TableOrderProgress> = new Map();
  private activeWaiterCalls: Map<string, WaiterCallRequest> = new Map();
  private simulatedWorkflows: Map<string, NodeJS.Timeout[]> = new Map();

  constructor() {
    this.initEventListeners();
  }

  /**
   * Listen to global neural eventBus to synchronize kitchen KDS changes with live guest tracker.
   */
  private initEventListeners() {
    // When KDS starts cooking an item
    eventBus.on('KDS_ITEM_COOKING', (event) => {
      const { orderId } = (event.payload as any) || {};
      if (orderId && this.orderProgressMap.has(orderId)) {
        const progress = this.orderProgressMap.get(orderId)!;
        if (progress.stage === 'received') {
          this.advanceOrderStage(orderId, 'preparing');
        }
      }
    });

    // When an item is marked ready in KDS
    eventBus.on('KDS_ITEM_READY', (event) => {
      const { orderId, itemId } = event.payload;
      if (orderId && this.orderProgressMap.has(orderId)) {
        const progress = this.orderProgressMap.get(orderId)!;
        // Update item status in tracker
        const item = progress.items.find((i) => i.id === itemId);
        if (item) {
          item.status = 'ready';
        }
        // If all or majority ready, advance to plating / ready
        const allReady = progress.items.every((i) => i.status === 'ready' || i.status === 'served');
        if (allReady && progress.stage !== 'served' && progress.stage !== 'billing' && progress.stage !== 'paid') {
          this.advanceOrderStage(orderId, 'plating');
        }
      }
    });

    // When entire KDS order is completed
    eventBus.on('KDS_ORDER_COMPLETED', (event) => {
      const { orderId } = event.payload;
      if (orderId && this.orderProgressMap.has(orderId)) {
        this.advanceOrderStage(orderId, 'served');
      }
    });

    // When order is paid
    eventBus.on('ORDER_PAID', (event) => {
      const { order } = event.payload;
      if (order && this.orderProgressMap.has(order.id)) {
        this.advanceOrderStage(order.id, 'paid');
      }
    });
  }

  // =========================================================================
  // 1. QR CODE SIMULATION & PARSING
  // =========================================================================

  /**
   * Generates a signed QR Code payload for a dining table.
   */
  public generateTableQr(tableNumber: string, tableId?: string, sectionName = 'الصالة الرئيسية'): TableQrPayload {
    const cleanNum = tableNumber.trim();
    const resolvedId = tableId || `tbl_${cleanNum.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const generatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    
    // Hash signature token
    const tokenRaw = `${resolvedId}:${cleanNum}:${Date.now()}:rest_os_2026`;
    let hash = 0;
    for (let i = 0; i < tokenRaw.length; i++) {
      hash = ((hash << 5) - hash) + tokenRaw.charCodeAt(i);
      hash |= 0;
    }
    const signature = 'qr_sig_' + Math.abs(hash).toString(16);
    const qrCodeToken = `QR-${cleanNum}-${signature.substring(0, 8).toUpperCase()}`;
    const url = `https://order.restaurant-os.cloud/table/${encodeURIComponent(cleanNum)}?token=${qrCodeToken}&sec=${encodeURIComponent(sectionName)}`;

    return {
      tableId: resolvedId,
      tableNumber: cleanNum,
      sectionName,
      branchName: 'فرع السليمانية — الرياض',
      qrCodeToken,
      url,
      generatedAt,
      expiresAt,
      signature,
    };
  }

  /**
   * Parses and validates a scanned QR string or Table URL.
   */
  public parseAndValidateQr(qrStringOrUrl: string): {
    valid: boolean;
    tableNumber: string;
    tableId: string;
    token?: string;
    error?: string;
  } {
    if (!qrStringOrUrl || typeof qrStringOrUrl !== 'string') {
      return { valid: false, tableNumber: '', tableId: '', error: 'رمز الـ QR فارغ أو غير صالح' };
    }

    const trimmed = qrStringOrUrl.trim();

    // Check if it's a URL format
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        const tableIndex = pathSegments.indexOf('table');
        let tableNumber = 'T-01';

        if (tableIndex !== -1 && pathSegments[tableIndex + 1]) {
          tableNumber = decodeURIComponent(pathSegments[tableIndex + 1]);
        } else if (pathSegments.length > 0) {
          tableNumber = decodeURIComponent(pathSegments[pathSegments.length - 1]);
        }

        const token = url.searchParams.get('token') || undefined;
        const tableId = `tbl_${tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        return {
          valid: true,
          tableNumber,
          tableId,
          token,
        };
      } catch {
        // Continue to fallback token parser
      }
    }

    // Direct token format (e.g. QR-T-04-A9B1C2 or T-04 or tbl_04)
    if (trimmed.startsWith('QR-')) {
      const parts = trimmed.split('-');
      const tableNumber = parts.length >= 2 ? `${parts[1]}` + (parts[2] && !parts[2].startsWith('A') && !parts[2].startsWith('B') && !parts[2].startsWith('C') ? `-${parts[2]}` : '') : 'T-01';
      return {
        valid: true,
        tableNumber: tableNumber.toUpperCase(),
        tableId: `tbl_${tableNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        token: trimmed,
      };
    }

    // Simple table number string (e.g. "T-04", "Table 5", "12")
    const cleanTable = trimmed.replace(/^table\s*/i, 'T-').toUpperCase();
    return {
      valid: true,
      tableNumber: cleanTable.startsWith('T-') ? cleanTable : `T-${cleanTable}`,
      tableId: `tbl_${cleanTable.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      token: `QR-${cleanTable}-DIRECT`,
    };
  }

  // =========================================================================
  // 2. GUEST TABLE SESSION
  // =========================================================================

  /**
   * Initializes or retrieves an active guest session for a dining table.
   */
  public async createOrGetGuestSession(
    tableNumber: string,
    guestCount = 2,
    guestName?: string,
    guestPhone?: string
  ): Promise<TableGuestSession> {
    const cleanNum = tableNumber.toUpperCase().trim();
    const sessionId = `sess_${cleanNum.toLowerCase()}_${Date.now().toString(36)}`;
    const tableId = `tbl_${cleanNum.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const existing = this.activeSessions.get(cleanNum);
    if (existing && existing.status !== 'completed') {
      if (guestName) existing.guestName = guestName;
      if (guestPhone) existing.guestPhone = guestPhone;
      if (guestCount) existing.guestCount = guestCount;
      return existing;
    }

    const session: TableGuestSession = {
      sessionId,
      tableId,
      tableNumber: cleanNum,
      guestCount: Math.max(1, guestCount),
      guestName: guestName || 'ضيف مميز',
      guestPhone: guestPhone || '',
      startedAt: new Date().toISOString(),
      status: 'browsing',
      waiterCallActive: false,
      loyaltyTier: 'gold',
      loyaltyPoints: 350,
    };

    this.activeSessions.set(cleanNum, session);
    return session;
  }

  /**
   * Returns current active session for table if exists.
   */
  public getSession(tableNumber: string): TableGuestSession | undefined {
    return this.activeSessions.get(tableNumber.toUpperCase().trim());
  }

  /**
   * Ends guest session on table checkout.
   */
  public endSession(tableNumber: string): boolean {
    const clean = tableNumber.toUpperCase().trim();
    const session = this.activeSessions.get(clean);
    if (session) {
      session.status = 'completed';
      this.activeSessions.delete(clean);
      return true;
    }
    return false;
  }

  // =========================================================================
  // 3. ORDER PLACEMENT & KDS DIRECT ROUTING
  // =========================================================================

  /**
   * Places an order directly from the guest portal into DB and dispatches to KDS stations.
   */
  public async placeGuestOrder(
    session: TableGuestSession,
    cartItems: GuestCartItem[],
    notes = ''
  ): Promise<{ order: Order; progress: TableOrderProgress }> {
    if (!cartItems || cartItems.length === 0) {
      throw new Error('السلة فارغة. يرجى اختيار صنف واحد على الأقل قبل تأكيد الطلب.');
    }

    const orderId = db.generateUUID();
    const now = new Date().toISOString();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${dateCode}-${randomSuffix}`;

    // Compute order finances
    let subtotal = 0;
    const itemsToCreate: OrderItem[] = [];
    let maxItemPrepMinutes = 5;

    for (const cItem of cartItems) {
      const dish = cItem.dish;
      const unitPrice = cItem.unitPrice || dish.price;
      const itemSubtotal = unitPrice * cItem.quantity;
      const taxRate = dish.taxRate || 0.15;
      const taxAmount = itemSubtotal * (taxRate / (1 + taxRate));
      subtotal += (itemSubtotal - taxAmount);

      const prepTime = (dish as any).preparationTimeMinutes || (dish as any).prepTimeMinutes || 10;
      if (prepTime > maxItemPrepMinutes) {
        maxItemPrepMinutes = prepTime;
      }

      const orderItemId = db.generateUUID();
      const station = dish.kitchenStation || (dish as any).station || 'main_kitchen';

      const orderItemRecord: OrderItem = {
        id: orderItemId,
        orderId,
        menuItemId: dish.id,
        nameAr: dish.nameAr || (dish as any).name || 'صنف فاخر',
        nameEn: dish.nameEn || 'Luxury Dish',
        quantity: cItem.quantity,
        unitPrice,
        costPrice: dish.costPrice || (dish as any).cost || (unitPrice * 0.4),
        subtotal: itemSubtotal - taxAmount,
        taxAmount,
        discountAmount: 0,
        totalAmount: itemSubtotal,
        selectedModifiers: Object.entries(cItem.selectedModifiers || {}).map(([key, val]) => ({
          groupId: key,
          optionId: val,
          nameAr: val,
          nameEn: val,
          price: 0,
          quantity: 1,
        })),
        notes: cItem.specialInstructions || '',
        status: 'pending',
        kitchenStation: station as KitchenStation,
        printedToKitchen: false,
        createdAt: now,
        updatedAt: now,
      };

      itemsToCreate.push(orderItemRecord);
    }

    const taxAmount = subtotal * 0.15;
    const totalAmount = subtotal + taxAmount;

    // Create Order Record in DB
    const orderRecord: Order = {
      id: orderId,
      orderNumber,
      dailySequence: randomSuffix,
      orderType: 'dine_in',
      status: 'sent_to_kitchen',
      paymentStatus: 'unpaid',
      tableId: session.tableNumber,
      customerId: undefined,
      guestCount: session.guestCount || 2,
      subtotal,
      taxAmount,
      discountAmount: 0,
      serviceCharge: 0,
      tipAmount: 0,
      deliveryFee: 0,
      totalAmount,
      paidAmount: 0,
      changeAmount: 0,
      customerNotes: notes || '',
      kitchenNotes: '',
      cashierId: 'guest_portal',
      waiterId: 'tableside_qr',
      syncStatus: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Insert into database
    await db.insert('orders', orderRecord);
    for (const itm of itemsToCreate) {
      await db.insert('orderItems', itm);
    }

    // 2. Update Table status in DB
    const tables = await db.getAll('tables');
    const matchingTable = tables.find(
      (t) => t.tableNumber.toUpperCase() === session.tableNumber.toUpperCase()
    );
    if (matchingTable) {
      await db.update('tables', matchingTable.id, {
        status: 'occupied',
        currentOrderId: orderId,
        lastOccupiedAt: now,
      });
    }

    // 3. Update active session
    session.activeOrderId = orderId;
    session.status = 'ordered';

    // 4. Initialize Order Progress Tracker
    const totalEstimatedMinutes = maxItemPrepMinutes + 2; // prep + plating margin
    const targetCompletionAt = new Date(Date.now() + totalEstimatedMinutes * 60000).toISOString();

    const progress: TableOrderProgress = {
      orderId,
      orderNumber,
      tableId: session.tableId,
      tableNumber: session.tableNumber,
      stage: 'received',
      stageIndex: 0,
      progressPercentage: 10,
      estimatedTotalMinutes: totalEstimatedMinutes,
      elapsedMinutes: 0,
      remainingMinutes: totalEstimatedMinutes,
      startedAt: now,
      targetCompletionAt,
      stageTimestamps: {
        received: now,
      },
      items: itemsToCreate.map((i) => ({
        id: i.id,
        nameAr: i.nameAr,
        nameEn: i.nameEn,
        quantity: i.quantity,
        station: i.kitchenStation,
        status: i.status,
        prepTimeMinutes: maxItemPrepMinutes,
      })),
    };

    this.orderProgressMap.set(orderId, progress);

    // 5. Fire Unified EventBus Triggers
    await eventBus.publish('ORDER_CREATED', {
      order: orderRecord,
      items: itemsToCreate,
    }, 'table_portal');

    await eventBus.publish('KDS_NEW_TICKET', {
      orderId,
      tableNumber: session.tableNumber,
      items: itemsToCreate,
    }, 'table_portal');

    await eventBus.publish('TABLE_STATUS_CHANGED', {
      tableId: session.tableId,
      tableNumber: session.tableNumber,
      previousStatus: 'available',
      newStatus: 'occupied',
      orderId,
    }, 'table_portal');

    await eventBus.publish('TABLE_GUEST_ORDER_PLACED', {
      order: orderRecord,
      items: itemsToCreate,
      tableNumber: session.tableNumber,
      guestCount: session.guestCount,
      guestName: session.guestName,
    }, 'table_portal');

    await eventBus.publish('TABLE_ORDER_STAGE_CHANGED', {
      orderId,
      tableNumber: session.tableNumber,
      stage: 'received',
      progressPercentage: 10,
      estimatedMinutesRemaining: totalEstimatedMinutes,
    }, 'table_portal');

    return { order: orderRecord, progress };
  }

  // =========================================================================
  // 4. LIVE COOKING STAGE TRACKER
  // =========================================================================

  /**
   * Retrieves active progress tracker for an order.
   */
  public getOrderProgress(orderId: string): TableOrderProgress | null {
    const progress = this.orderProgressMap.get(orderId);
    if (!progress) return null;

    // Recalculate dynamic elapsed & remaining minutes
    const startedMs = new Date(progress.startedAt).getTime();
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - startedMs) / 60000));
    const remainingMinutes = Math.max(0, progress.estimatedTotalMinutes - elapsedMinutes);

    return {
      ...progress,
      elapsedMinutes,
      remainingMinutes: progress.stage === 'served' || progress.stage === 'paid' ? 0 : remainingMinutes,
    };
  }

  /**
   * Advances the order to a new cooking stage and recalculates progress metrics.
   */
  public async advanceOrderStage(
    orderId: string,
    newStage: TableCookingStage
  ): Promise<TableOrderProgress | null> {
    const progress = this.orderProgressMap.get(orderId);
    if (!progress) return null;

    const now = new Date().toISOString();
    const stageMap: Record<TableCookingStage, { index: number; pct: number }> = {
      received: { index: 0, pct: 15 },
      preparing: { index: 1, pct: 45 },
      plating: { index: 2, pct: 80 },
      served: { index: 3, pct: 100 },
      billing: { index: 4, pct: 100 },
      paid: { index: 5, pct: 100 },
    };

    const target = stageMap[newStage] || stageMap.received;
    progress.stage = newStage;
    progress.stageIndex = target.index;
    progress.progressPercentage = target.pct;
    progress.stageTimestamps[newStage] = now;

    // Sync item statuses accordingly
    if (newStage === 'preparing') {
      progress.items.forEach((i) => {
        if (i.status === 'pending') i.status = 'cooking';
      });
      await db.update('orders', orderId, { status: 'preparing' as OrderStatus });
    } else if (newStage === 'plating' || newStage === 'served') {
      progress.items.forEach((i) => {
        i.status = newStage === 'served' ? 'served' : 'ready';
      });
      await db.update('orders', orderId, {
        status: (newStage === 'served' ? 'served' : 'ready') as OrderStatus,
      });
    }

    // Publish stage changed event
    await eventBus.publish('TABLE_ORDER_STAGE_CHANGED', {
      orderId,
      tableNumber: progress.tableNumber,
      stage: newStage,
      progressPercentage: target.pct,
      estimatedMinutesRemaining: newStage === 'served' || newStage === 'paid' ? 0 : progress.remainingMinutes,
    }, 'table_portal');

    return this.getOrderProgress(orderId);
  }

  /**
   * Simulates full kitchen workflow progression over time (for live interactive testing/demo).
   */
  public async simulateKitchenWorkflow(orderId: string, stepDurationMs = 2500): Promise<void> {
    // Clear any previous running simulation for this order
    const existing = this.simulatedWorkflows.get(orderId);
    if (existing) {
      existing.forEach((t) => clearTimeout(t));
    }

    const timer1 = setTimeout(() => {
      this.advanceOrderStage(orderId, 'preparing');
    }, stepDurationMs);

    const timer2 = setTimeout(() => {
      this.advanceOrderStage(orderId, 'plating');
    }, stepDurationMs * 2);

    const timer3 = setTimeout(() => {
      this.advanceOrderStage(orderId, 'served');
    }, stepDurationMs * 3);

    this.simulatedWorkflows.set(orderId, [timer1, timer2, timer3]);
  }

  // =========================================================================
  // 5. WAITER CALLING & SERVICE BELL
  // =========================================================================

  /**
   * Sends an instant tableside waiter call bell notification.
   */
  public async callWaiter(
    tableNumber: string,
    callType: WaiterCallType = 'general_waiter',
    notes = ''
  ): Promise<WaiterCallRequest> {
    const cleanNum = tableNumber.toUpperCase().trim();
    const tableId = `tbl_${cleanNum.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const requestId = `call_${cleanNum.toLowerCase()}_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const request: WaiterCallRequest = {
      id: requestId,
      tableNumber: cleanNum,
      tableId,
      callType,
      notes,
      requestedAt: now,
      isResolved: false,
    };

    this.activeWaiterCalls.set(cleanNum, request);

    // Update active session state
    const session = this.activeSessions.get(cleanNum);
    if (session) {
      session.waiterCallActive = true;
      session.lastWaiterCallType = callType;
      session.lastWaiterCallTime = now;
    }

    // Publish event for Intercom, Waiter App & Sound Engine
    await eventBus.publish('TABLE_WAITER_CALLED', {
      tableId,
      tableNumber: cleanNum,
      callType,
      notes,
      requestedAt: now,
    }, 'table_portal');

    // Trigger voice announcer alert if critical
    const callNamesAr: Record<WaiterCallType, string> = {
      general_waiter: 'استدعاء الويتر',
      water_refill: 'طلب ماء وضيافة',
      cutlery_napkins: 'أدوات طعام ومناديل',
      clean_table: 'تنظيف الطاولة',
      custom_request: 'طلب خاص',
    };

    await eventBus.publish('VOICE_ANNOUNCEMENT_TRIGGERED', {
      id: `voice_${requestId}`,
      text: `تنبيه خدمة: طاولة ${cleanNum} تطلب ${callNamesAr[callType]}`,
      language: 'ar',
      priority: 'high',
      station: 'all',
    }, 'table_portal');

    return request;
  }

  /**
   * Resolves/dismisses an active waiter call bell.
   */
  public async resolveWaiterCall(tableNumber: string, resolvedBy = 'الويتر المناوب'): Promise<boolean> {
    const cleanNum = tableNumber.toUpperCase().trim();
    const request = this.activeWaiterCalls.get(cleanNum);
    if (!request) return false;

    request.isResolved = true;
    request.resolvedAt = new Date().toISOString();
    request.resolvedBy = resolvedBy;
    this.activeWaiterCalls.delete(cleanNum);

    const session = this.activeSessions.get(cleanNum);
    if (session) {
      session.waiterCallActive = false;
    }

    await eventBus.publish('TABLE_ASSISTANCE_RESOLVED', {
      tableId: request.tableId,
      tableNumber: cleanNum,
      resolvedBy,
      resolvedAt: request.resolvedAt,
    }, 'table_portal');

    return true;
  }

  /**
   * Returns active waiter call status for a table.
   */
  public getActiveWaiterCall(tableNumber: string): WaiterCallRequest | undefined {
    return this.activeWaiterCalls.get(tableNumber.toUpperCase().trim());
  }

  // =========================================================================
  // 6. ELECTRONIC BILL, INSTANT CHECKOUT & ZATCA QR
  // =========================================================================

  /**
   * Requests the electronic bill calculation with optional tip and split-bill.
   */
  public async requestElectronicBill(
    orderId: string,
    paymentMethod: TablePaymentMethod = 'apple_pay',
    tipPercentage = 0,
    splitCount = 1
  ): Promise<BillRequestPayload> {
    const order = await db.getById('orders', orderId);
    if (!order) {
      throw new Error(`الطلب برقم ${orderId} غير موجود.`);
    }

    const subtotal = order.subtotal;
    const taxAmount = order.taxAmount;
    const discountAmount = order.discountAmount || 0;
    const baseTotal = subtotal + taxAmount - discountAmount;
    const tipAmount = +(baseTotal * (tipPercentage / 100)).toFixed(2);
    const grandTotal = +(baseTotal + tipAmount).toFixed(2);
    const validSplit = Math.max(1, splitCount);
    const amountPerPerson = +(grandTotal / validSplit).toFixed(2);

    // Generate ZATCA Phase 2 compliant TLV Base64 QR code
    const zatcaPayload = {
      sellerName: 'مطعم ومقهى السليمانية الفاخر',
      vatNumber: '300987654300003',
      timestamp: new Date().toISOString(),
      totalWithVat: grandTotal,
      vatTotal: taxAmount,
    };
    const zatcaQrCode = printerService.generateZatcaTlvBase64(zatcaPayload);

    const billPayload: BillRequestPayload = {
      orderId,
      tableNumber: order.tableId || 'T-01',
      tableId: `tbl_${(order.tableId || 'T-01').toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      subtotal,
      taxAmount,
      discountAmount,
      tipPercentage,
      tipAmount,
      grandTotal,
      paymentMethod,
      splitCount: validSplit,
      amountPerPerson,
      zatcaQrCode,
      isSettled: false,
      requestedAt: new Date().toISOString(),
    };

    // Update table status to billing in DB
    const tables = await db.getAll('tables');
    const tableObj = tables.find((t) => t.tableNumber.toUpperCase() === billPayload.tableNumber.toUpperCase());
    if (tableObj) {
      await db.update('tables', tableObj.id, { status: 'billing' as TableStatus });
    }

    // Publish event
    await eventBus.publish('TABLE_BILL_REQUESTED', {
      tableId: billPayload.tableId,
      tableNumber: billPayload.tableNumber,
      orderId,
      totalAmount: grandTotal,
      paymentMethod,
      splitCount: validSplit,
      requestedAt: billPayload.requestedAt,
    }, 'table_portal');

    return billPayload;
  }

  /**
   * Settles table payment electronically or marks as paid by waiter/cashier.
   */
  public async settleTableBill(
    orderId: string,
    paymentMethod: TablePaymentMethod = 'apple_pay',
    tipAmount = 0
  ): Promise<{ success: boolean; zatcaInvoice: any }> {
    const order = await db.getById('orders', orderId);
    if (!order) {
      throw new Error(`الطلب برقم ${orderId} غير موجود.`);
    }

    const now = new Date().toISOString();
    const finalAmount = order.totalAmount + tipAmount;

    // Update order in DB
    await db.update('orders', orderId, {
      status: 'completed' as OrderStatus,
      paymentStatus: 'paid',
      paidAmount: finalAmount,
      paymentMethod: paymentMethod === 'apple_pay' || paymentMethod === 'mada_card' ? 'card' : 'cash',
      updatedAt: now,
    });

    // Update table in DB to cleaning
    const tables = await db.getAll('tables');
    const tableObj = tables.find((t) => t.tableNumber.toUpperCase() === (order.tableId || '').toUpperCase());
    if (tableObj) {
      await db.update('tables', tableObj.id, {
        status: 'cleaning' as TableStatus,
        currentOrderId: undefined,
      });
    }

    // Advance progress tracker to paid
    await this.advanceOrderStage(orderId, 'paid');

    // End active session
    if (order.tableId) {
      const session = this.activeSessions.get(order.tableId.toUpperCase().trim());
      if (session) {
        session.status = 'completed';
      }
    }

    // Fire EventBus ORDER_PAID
    await eventBus.publish('ORDER_PAID', {
      order,
      paymentMethod,
      amount: finalAmount,
    }, 'table_portal');

    return {
      success: true,
      zatcaInvoice: {
        orderNumber: order.orderNumber,
        tableNumber: order.tableId,
        paidAmount: finalAmount,
        paymentMethod,
        timestamp: now,
        vatNumber: '300987654300003',
      },
    };
  }

  // =========================================================================
  // 7. GUEST FEEDBACK & RATINGS
  // =========================================================================

  /**
   * Submits tableside guest feedback & rating.
   */
  public async submitGuestFeedback(feedback: GuestFeedbackPayload): Promise<boolean> {
    const cleanFeedback: GuestFeedbackPayload = {
      ...feedback,
      rating: Math.min(5, Math.max(1, feedback.rating)),
      submittedAt: feedback.submittedAt || new Date().toISOString(),
    };

    await eventBus.publish('TABLE_GUEST_FEEDBACK_SUBMITTED', {
      tableNumber: cleanFeedback.tableNumber,
      orderId: cleanFeedback.orderId,
      rating: cleanFeedback.rating,
      tags: cleanFeedback.tags,
      comment: cleanFeedback.comment,
      submittedAt: cleanFeedback.submittedAt,
    }, 'table_portal');

    return true;
  }

  // =========================================================================
  // 8. MENU FILTERING, ALLERGEN RADAR & CALORIES
  // =========================================================================

  /**
   * Filters and sorts menu items based on allergen exclusion, category, calories, and search term.
   */
  public filterMenu(
    items: MenuItem[],
    filters: Partial<GuestPortalFilterState>
  ): MenuItem[] {
    const {
      category = 'all',
      searchQuery = '',
      allergensToExclude = [],
      maxCalories = 0,
      sortBy = 'recommended',
      onlyAvailable = true,
    } = filters;

    return items
      .filter((item) => {
        // 1. Availability filter
        if (onlyAvailable) {
          if (item.isAvailable === false || (item as any).available === false) {
            return false;
          }
        }

        // 2. Category filter
        if (category !== 'all' && item.categoryId !== category && (item as any).category !== category) {
          return false;
        }

        // 3. Search query (Arabic & English)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameAr = (item.nameAr || (item as any).name || '').toLowerCase();
          const nameEn = (item.nameEn || '').toLowerCase();
          const descAr = (item.descriptionAr || '').toLowerCase();
          const matches = nameAr.includes(q) || nameEn.includes(q) || descAr.includes(q);
          if (!matches) return false;
        }

        // 4. Allergen Safety Radar exclusion
        if (allergensToExclude && allergensToExclude.length > 0) {
          const itemAllergens = (item.allergens || []).map((a) => a.toLowerCase().trim());
          const hasExcludedAllergen = allergensToExclude.some((ex) =>
            itemAllergens.includes(ex.toLowerCase().trim())
          );
          if (hasExcludedAllergen) return false;
        }

        // 5. Calorie bounds
        if (maxCalories > 0 && item.calories && item.calories > maxCalories) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'fastest_prep') {
          const prepA = a.preparationTimeMinutes || (a as any).prepTimeMinutes || 15;
          const prepB = b.preparationTimeMinutes || (b as any).prepTimeMinutes || 15;
          return prepA - prepB;
        }
        if (sortBy === 'calories_low') return (a.calories || 9999) - (b.calories || 9999);
        // Default recommended / sortOrder
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }
}

// Global Singleton Instance
export const tableOrderService = new TableOrderService();
