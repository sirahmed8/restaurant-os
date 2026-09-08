/**
 * =====================================================================
 * RESTAURANT OS — UNIFIED THIRD-PARTY DELIVERY AGGREGATOR ENGINE
 * =====================================================================
 * Handles:
 * 1. Ingestion & normalization of webhooks from Talabat, Hungerstation, Jahez, Deliveroo.
 * 2. Instant insertion into Database (`orders`, `orderItems`), KDS ticket dispatch,
 *    and automated inventory deduction via RecipeService.
 * 3. Interactive audio chime / sound effect triggers.
 * 4. Courier / Driver assignment, live GPS location tracking, and dynamic ETA estimation.
 * 5. Platform channel health checks, automated acceptance rules, and live order simulation.
 */

import { db } from '../db';
import { Order, OrderItem, MenuItem, KitchenStation } from '../db/schema';
import { recipeService } from './recipeService';
import { eventBus } from './eventBus';
import { soundEngine } from './soundEngine';
import {
  DeliveryPlatform,
  DeliveryOrderStatus,
  DriverStatus,
  DeliveryDriver,
  AggregatedDeliveryOrder,
  PlatformChannelConfig,
  DeliveryWebhookPayload,
  DeliveryOrderItemPayload,
  DeliveryCustomerPayload,
  DeliverySummaryStats,
} from '../types/delivery';

type DeliveryStateSubscriber = (orders: AggregatedDeliveryOrder[]) => void;

// Pre-configured delivery platform channels
export const INITIAL_DELIVERY_CHANNELS: Record<DeliveryPlatform, PlatformChannelConfig> = {
  talabat: {
    platform: 'talabat',
    displayNameAr: 'طلبات',
    displayNameEn: 'Talabat',
    brandColor: '#FF5A00',
    bgColor: 'bg-orange-500/10',
    textColor: 'text-orange-500',
    logo: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=100&auto=format&fit=crop&q=80',
    isConnected: true,
    autoAccept: true,
    estimatedDefaultPrepTime: 15,
    commissionRate: 0.18,
    activeOrdersCount: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    avgRating: 4.8,
    webhookEndpoint: 'https://api.restaurantos.io/v1/webhooks/talabat',
    apiKeyMasked: 'tlb_live_99a8****************31b0',
    lastPingAt: new Date().toISOString(),
  },
  hungerstation: {
    platform: 'hungerstation',
    displayNameAr: 'هنقرستيشن',
    displayNameEn: 'Hungerstation',
    brandColor: '#FFC107',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&auto=format&fit=crop&q=80',
    isConnected: true,
    autoAccept: false,
    estimatedDefaultPrepTime: 18,
    commissionRate: 0.20,
    activeOrdersCount: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    avgRating: 4.7,
    webhookEndpoint: 'https://api.restaurantos.io/v1/webhooks/hungerstation',
    apiKeyMasked: 'hng_live_44f1****************88c4',
    lastPingAt: new Date().toISOString(),
  },
  jahez: {
    platform: 'jahez',
    displayNameAr: 'جاهز',
    displayNameEn: 'Jahez',
    brandColor: '#E50914',
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-500',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&auto=format&fit=crop&q=80',
    isConnected: true,
    autoAccept: true,
    estimatedDefaultPrepTime: 12,
    commissionRate: 0.17,
    activeOrdersCount: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    avgRating: 4.9,
    webhookEndpoint: 'https://api.restaurantos.io/v1/webhooks/jahez',
    apiKeyMasked: 'jhz_live_77e2****************55a9',
    lastPingAt: new Date().toISOString(),
  },
  deliveroo: {
    platform: 'deliveroo',
    displayNameAr: 'ديليفرو',
    displayNameEn: 'Deliveroo',
    brandColor: '#00CDBC',
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&auto=format&fit=crop&q=80',
    isConnected: true,
    autoAccept: false,
    estimatedDefaultPrepTime: 15,
    commissionRate: 0.19,
    activeOrdersCount: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    avgRating: 4.6,
    webhookEndpoint: 'https://api.restaurantos.io/v1/webhooks/deliveroo',
    apiKeyMasked: 'roo_live_33c9****************11d8',
    lastPingAt: new Date().toISOString(),
  },
  mrsool: {
    platform: 'mrsool',
    displayNameAr: 'مرسول',
    displayNameEn: 'Mrsool',
    brandColor: '#00A650',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    logo: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=100&auto=format&fit=crop&q=80',
    isConnected: false,
    autoAccept: false,
    estimatedDefaultPrepTime: 20,
    commissionRate: 0.15,
    activeOrdersCount: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    avgRating: 4.5,
    webhookEndpoint: 'https://api.restaurantos.io/v1/webhooks/mrsool',
    apiKeyMasked: 'mrs_live_12a3****************99b1',
    lastPingAt: new Date().toISOString(),
  },
  careem: {
    platform: 'careem',
    displayNameAr: 'كريم ناو',
    displayNameEn: 'Careem NOW',
    brandColor: '#37B44E',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-500',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=100&auto=format&fit=crop&q=80',
    isConnected: false,
    autoAccept: false,
    estimatedDefaultPrepTime: 16,
    commissionRate: 0.18,
    activeOrdersCount: 0,
    todayOrdersCount: 0,
    todayRevenue: 0,
    avgRating: 4.6,
    webhookEndpoint: 'https://api.restaurantos.io/v1/webhooks/careem',
    apiKeyMasked: 'crm_live_88d4****************22f7',
    lastPingAt: new Date().toISOString(),
  },
};

export class DeliveryAggregatorService {
  private deliveryOrders: Map<string, AggregatedDeliveryOrder> = new Map();
  private channels: Map<DeliveryPlatform, PlatformChannelConfig> = new Map();
  private subscribers: Set<DeliveryStateSubscriber> = new Set();
  private simulationTimer: ReturnType<typeof setInterval> | null = null;
  private dailySequenceCounter: number = 100;

  constructor() {
    // Initialize default channels
    Object.values(INITIAL_DELIVERY_CHANNELS).forEach((c) => {
      this.channels.set(c.platform, { ...c });
    });
  }

  /**
   * Subscribe to live delivery orders state updates
   */
  public subscribe(fn: DeliveryStateSubscriber): () => void {
    this.subscribers.add(fn);
    fn(this.getAllOrders());
    return () => {
      this.subscribers.delete(fn);
    };
  }

  private notifySubscribers() {
    const list = this.getAllOrders();
    this.recalculateChannelStats();
    this.subscribers.forEach((fn) => {
      try {
        fn(list);
      } catch (err) {
        console.error('[DeliveryAggregator] Subscriber notification error:', err);
      }
    });
  }

  /**
   * Get all active & historical aggregated delivery orders
   */
  public getAllOrders(): AggregatedDeliveryOrder[] {
    return Array.from(this.deliveryOrders.values()).sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }

  /**
   * Get delivery order by internal aggregator ID
   */
  public getOrderById(id: string): AggregatedDeliveryOrder | undefined {
    return this.deliveryOrders.get(id);
  }

  /**
   * Get delivery order by linked DB Order ID
   */
  public getOrderByDbOrderId(orderId: string): AggregatedDeliveryOrder | undefined {
    return Array.from(this.deliveryOrders.values()).find((o) => o.orderId === orderId);
  }

  /**
   * Get all platform channels configuration and statistics
   */
  public getChannels(): PlatformChannelConfig[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get single channel configuration
   */
  public getChannel(platform: DeliveryPlatform): PlatformChannelConfig | undefined {
    return this.channels.get(platform);
  }

  /**
   * Toggle platform channel connection status (online / offline)
   */
  public async toggleChannelStatus(platform: DeliveryPlatform, isConnected: boolean): Promise<PlatformChannelConfig> {
    const ch = this.channels.get(platform);
    if (!ch) throw new Error(`Platform ${platform} not found`);

    ch.isConnected = isConnected;
    ch.lastPingAt = new Date().toISOString();
    this.channels.set(platform, { ...ch });

    await eventBus.publish('DELIVERY_CHANNEL_STATUS_CHANGED', {
      platform,
      isConnected,
      autoAccept: ch.autoAccept,
    }, 'delivery');

    this.notifySubscribers();
    return ch;
  }

  /**
   * Toggle auto-acceptance of orders for a specific platform
   */
  public async toggleAutoAccept(platform: DeliveryPlatform, autoAccept: boolean): Promise<PlatformChannelConfig> {
    const ch = this.channels.get(platform);
    if (!ch) throw new Error(`Platform ${platform} not found`);

    ch.autoAccept = autoAccept;
    this.channels.set(platform, { ...ch });

    await eventBus.publish('DELIVERY_CHANNEL_STATUS_CHANGED', {
      platform,
      isConnected: ch.isConnected,
      autoAccept,
    }, 'delivery');

    this.notifySubscribers();
    return ch;
  }

  /**
   * Recalculate summary counts & revenue for each channel
   */
  private recalculateChannelStats() {
    const orders = Array.from(this.deliveryOrders.values());
    const channelMap = new Map<DeliveryPlatform, { active: number; todayCount: number; todayRev: number }>();

    this.channels.forEach((_, key) => {
      channelMap.set(key, { active: 0, todayCount: 0, todayRev: 0 });
    });

    const now = new Date();
    const todayDateStr = now.toISOString().slice(0, 10);

    orders.forEach((o) => {
      const isToday = o.receivedAt.slice(0, 10) === todayDateStr;
      const stats = channelMap.get(o.platform) || { active: 0, todayCount: 0, todayRev: 0 };

      if (['incoming', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.status)) {
        stats.active += 1;
      }
      if (isToday && o.status !== 'cancelled') {
        stats.todayCount += 1;
        stats.todayRev += o.totalAmount;
      }
      channelMap.set(o.platform, stats);
    });

    channelMap.forEach((stats, platform) => {
      const ch = this.channels.get(platform);
      if (ch) {
        ch.activeOrdersCount = stats.active;
        ch.todayOrdersCount = stats.todayCount;
        ch.todayRevenue = Number(stats.todayRev.toFixed(2));
        this.channels.set(platform, { ...ch });
      }
    });
  }

  /**
   * Compute aggregated summary KPIs for the delivery dashboard
   */
  public getSummaryStats(): DeliverySummaryStats {
    const orders = this.getAllOrders();
    const now = new Date();
    const todayDateStr = now.toISOString().slice(0, 10);

    const todayOrders = orders.filter((o) => o.receivedAt.slice(0, 10) === todayDateStr);
    const completedToday = todayOrders.filter((o) => o.status === 'delivered');
    const cancelledToday = todayOrders.filter((o) => o.status === 'cancelled');
    const activeOrders = orders.filter((o) =>
      ['incoming', 'accepted', 'preparing', 'ready_for_pickup', 'picked_up'].includes(o.status)
    );

    const totalRevenueToday = todayOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalValidCount = todayOrders.filter((o) => o.status !== 'cancelled').length;
    const fulfillmentRate =
      todayOrders.length > 0
        ? Number(((completedToday.length / (todayOrders.length - cancelledToday.length || 1)) * 100).toFixed(1))
        : 100;

    const channelBreakdown = {} as DeliverySummaryStats['channelBreakdown'];
    Array.from(this.channels.keys()).forEach((p) => {
      const pOrders = todayOrders.filter((o) => o.platform === p && o.status !== 'cancelled');
      const pRev = pOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      channelBreakdown[p] = {
        ordersCount: pOrders.length,
        revenue: Number(pRev.toFixed(2)),
        sharePercent: totalRevenueToday > 0 ? Number(((pRev / totalRevenueToday) * 100).toFixed(1)) : 0,
      };
    });

    return {
      totalOrdersToday: todayOrders.length,
      activeOrdersCount: activeOrders.length,
      totalRevenueToday: Number(totalRevenueToday.toFixed(2)),
      avgPrepTimeMinutes: 14,
      avgDeliveryTimeMinutes: 28,
      fulfillmentRate: Math.min(100, Math.max(0, fulfillmentRate)),
      channelBreakdown,
    };
  }

  // =========================================================================
  // WEBHOOK PAYLOAD NORMALIZATION
  // =========================================================================

  /**
   * Normalizes incoming raw payloads from Talabat webhook format
   */
  public normalizeTalabatPayload(raw: any): DeliveryWebhookPayload {
    const orderData = raw.order || raw;
    const items: DeliveryOrderItemPayload[] = (orderData.products || orderData.items || []).map(
      (item: any, idx: number) => ({
        externalItemId: item.remote_code || item.id || `tal_item_${idx}`,
        nameAr: item.name_ar || item.name || 'صنف طلبات',
        nameEn: item.name_en || item.name || 'Talabat Item',
        sku: item.sku || item.item_code,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unit_price || item.price || 0),
        totalPrice: Number((Number(item.unit_price || item.price || 0) * Number(item.quantity || 1)).toFixed(2)),
        notes: item.special_instructions || item.notes,
        modifiers: (item.options || item.modifiers || []).map((m: any) => ({
          nameAr: m.name_ar || m.name || 'إضافة',
          nameEn: m.name_en || m.name,
          price: Number(m.price || 0),
          quantity: Number(m.quantity || 1),
        })),
      })
    );

    const subtotal = Number(
      orderData.subtotal ||
      items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)
    );
    const deliveryFee = Number(orderData.delivery_charge || orderData.delivery_fee || 12.0);
    const taxAmount = Number((subtotal * 0.15).toFixed(2));
    const discountAmount = Number(orderData.discount || 0);
    const totalAmount = Number((subtotal + taxAmount + deliveryFee - discountAmount).toFixed(2));

    const driverInfo: Partial<DeliveryDriver> | undefined = orderData.courier
      ? {
          id: orderData.courier.id || 'courier_tal_' + Math.random().toString(36).slice(2, 6),
          name: orderData.courier.name || 'مندوب طلبات',
          phone: orderData.courier.phone || '+966500001111',
          vehicleType: orderData.courier.vehicle_type || 'motorcycle',
          vehiclePlate: orderData.courier.plate_number || 'ط ل ب 101',
          etaMinutes: Number(orderData.courier.eta_minutes || 15),
          status: 'assigned',
          platform: 'talabat',
          rating: 4.8,
        }
      : undefined;

    return {
      platform: 'talabat',
      externalOrderId: String(orderData.id || orderData.order_id || 'TLB-' + Date.now().toString(36).toUpperCase()),
      platformOrderCode: String(orderData.short_code || orderData.code || 'TAL-' + Math.floor(1000 + Math.random() * 9000)),
      customer: {
        name: orderData.customer?.name || orderData.customer_name || 'عميل طلبات',
        phone: orderData.customer?.mobile || orderData.customer?.phone || '+966551234567',
        address: orderData.delivery_address?.street || orderData.delivery_address?.formatted || 'الرياض — حي النرجس',
        district: orderData.delivery_address?.district || 'النرجس',
        city: orderData.delivery_address?.city || 'الرياض',
        notes: orderData.delivery_instructions || orderData.notes,
        coordinates: orderData.delivery_address?.latitude
          ? { lat: orderData.delivery_address.latitude, lng: orderData.delivery_address.longitude }
          : { lat: 24.8142, lng: 46.6341 },
      },
      items,
      subtotal,
      deliveryFee,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: orderData.payment_type === 'cash' ? 'cash_on_delivery' : 'prepaid_online',
      isPaid: orderData.payment_type !== 'cash',
      driver: driverInfo,
      placedAt: orderData.created_at || new Date().toISOString(),
      estimatedPrepMinutes: Number(orderData.preparation_time || 15),
      estimatedDeliveryMinutes: Number(orderData.delivery_time || 30),
      notes: orderData.notes || orderData.special_instructions,
    };
  }

  /**
   * Normalizes incoming raw payloads from Hungerstation webhook format
   */
  public normalizeHungerstationPayload(raw: any): DeliveryWebhookPayload {
    const data = raw.data || raw;
    const items: DeliveryOrderItemPayload[] = (data.cart_items || data.items || []).map(
      (item: any, idx: number) => ({
        externalItemId: item.vendor_item_id || item.item_id || `hng_item_${idx}`,
        nameAr: item.title_ar || item.title || 'صنف هنقرستيشن',
        nameEn: item.title_en || item.title || 'Hungerstation Item',
        sku: item.sku,
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.price || 0),
        totalPrice: Number((Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)),
        notes: item.instructions,
        modifiers: (item.options || []).map((opt: any) => ({
          nameAr: opt.name_ar || opt.name || 'إضافة',
          nameEn: opt.name_en || opt.name,
          price: Number(opt.price || 0),
          quantity: 1,
        })),
      })
    );

    const subtotal = Number(data.subtotal || items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
    const deliveryFee = Number(data.delivery_charge || 15.0);
    const taxAmount = Number((subtotal * 0.15).toFixed(2));
    const discountAmount = Number(data.discount_amount || 0);
    const totalAmount = Number((subtotal + taxAmount + deliveryFee - discountAmount).toFixed(2));

    const driverInfo: Partial<DeliveryDriver> | undefined = data.rider
      ? {
          id: String(data.rider.id || 'rider_hng_' + Math.random().toString(36).slice(2, 6)),
          name: data.rider.full_name || 'سائق هنقرستيشن',
          phone: data.rider.mobile_number || '+966501112233',
          vehicleType: data.rider.transport_type || 'car',
          vehiclePlate: data.rider.plate_info || 'هـ ن ق 421',
          etaMinutes: Number(data.rider.eta || 20),
          status: 'assigned',
          platform: 'hungerstation',
          rating: 4.7,
        }
      : undefined;

    return {
      platform: 'hungerstation',
      externalOrderId: String(data.order_id || 'HNG-' + Date.now().toString(36).toUpperCase()),
      platformOrderCode: String(data.display_number || 'HNG-' + Math.floor(1000 + Math.random() * 9000)),
      customer: {
        name: data.client?.name || data.customer_name || 'عميل هنقرستيشن',
        phone: data.client?.phone || '+966561112233',
        address: data.delivery_location?.address_line || 'الرياض — حي الملقا — شارع أنس بن مالك',
        district: data.delivery_location?.district || 'الملقا',
        city: data.delivery_location?.city || 'الرياض',
        notes: data.delivery_location?.building_notes,
        coordinates: data.delivery_location?.lat
          ? { lat: data.delivery_location.lat, lng: data.delivery_location.lng }
          : { lat: 24.7925, lng: 46.5981 },
      },
      items,
      subtotal,
      deliveryFee,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: data.is_prepaid ? 'prepaid_online' : 'cash_on_delivery',
      isPaid: Boolean(data.is_prepaid),
      driver: driverInfo,
      placedAt: data.created_time || new Date().toISOString(),
      estimatedPrepMinutes: Number(data.prep_time_minutes || 18),
      estimatedDeliveryMinutes: Number(data.estimated_delivery_time || 35),
      notes: data.notes,
    };
  }

  /**
   * Normalizes incoming raw payloads from Jahez webhook format
   */
  public normalizeJahezPayload(raw: any): DeliveryWebhookPayload {
    const jhz = raw.jahez_order || raw;
    const items: DeliveryOrderItemPayload[] = (jhz.order_details || jhz.items || []).map(
      (item: any, idx: number) => ({
        externalItemId: item.item_code || item.id || `jhz_item_${idx}`,
        nameAr: item.item_name_ar || item.item_name || 'صنف جاهز',
        nameEn: item.item_name_en || item.item_name || 'Jahez Item',
        sku: item.sku,
        quantity: Number(item.qty || item.quantity || 1),
        unitPrice: Number(item.unit_cost || item.price || 0),
        totalPrice: Number((Number(item.unit_cost || item.price || 0) * Number(item.qty || item.quantity || 1)).toFixed(2)),
        notes: item.customer_note,
        modifiers: (item.customizations || []).map((c: any) => ({
          nameAr: c.name_ar || c.name || 'إضافة',
          nameEn: c.name_en || c.name,
          price: Number(c.cost || 0),
          quantity: 1,
        })),
      })
    );

    const subtotal = Number(jhz.order_subtotal || items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
    const deliveryFee = Number(jhz.delivery_charge || 10.0);
    const taxAmount = Number((subtotal * 0.15).toFixed(2));
    const discountAmount = Number(jhz.discount || 0);
    const totalAmount = Number((subtotal + taxAmount + deliveryFee - discountAmount).toFixed(2));

    const driverInfo: Partial<DeliveryDriver> | undefined = jhz.driver_details
      ? {
          id: String(jhz.driver_details.driver_id || 'driver_jhz_' + Math.random().toString(36).slice(2, 6)),
          name: jhz.driver_details.driver_name || 'كابتن جاهز',
          phone: jhz.driver_details.driver_mobile || '+966540003322',
          vehicleType: jhz.driver_details.vehicle_type || 'car',
          vehiclePlate: jhz.driver_details.plate_number || 'ج هـ ز 990',
          etaMinutes: Number(jhz.driver_details.pickup_eta_mins || 12),
          status: 'assigned',
          platform: 'jahez',
          rating: 4.9,
        }
      : undefined;

    return {
      platform: 'jahez',
      externalOrderId: String(jhz.order_number || 'JHZ-' + Date.now().toString(36).toUpperCase()),
      platformOrderCode: String(jhz.quick_code || 'JHZ-' + Math.floor(1000 + Math.random() * 9000)),
      customer: {
        name: jhz.customer_info?.customer_name || 'عميل جاهز VIP',
        phone: jhz.customer_info?.customer_mobile || '+966541234567',
        address: jhz.customer_info?.delivery_address || 'الرياض — حي الياسمين — فيلا 18',
        district: jhz.customer_info?.district || 'الياسمين',
        city: 'الرياض',
        notes: jhz.customer_info?.gate_code ? `رمز البوابة: ${jhz.customer_info.gate_code}` : undefined,
        coordinates: jhz.customer_info?.latitude
          ? { lat: jhz.customer_info.latitude, lng: jhz.customer_info.longitude }
          : { lat: 24.8211, lng: 46.6612 },
      },
      items,
      subtotal,
      deliveryFee,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: jhz.payment_mode === 'MADA' || jhz.payment_mode === 'ONLINE' ? 'prepaid_online' : 'cash_on_delivery',
      isPaid: jhz.payment_mode !== 'CASH',
      driver: driverInfo,
      placedAt: jhz.order_date || new Date().toISOString(),
      estimatedPrepMinutes: Number(jhz.kitchen_prep_target || 12),
      estimatedDeliveryMinutes: Number(jhz.total_eta_mins || 25),
      notes: jhz.kitchen_notes,
    };
  }

  /**
   * Normalizes incoming raw payloads from Deliveroo webhook format
   */
  public normalizeDeliverooPayload(raw: any): DeliveryWebhookPayload {
    const body = raw.deliveroo_order || raw;
    const items: DeliveryOrderItemPayload[] = (body.items || []).map((item: any, idx: number) => ({
      externalItemId: item.pos_item_id || item.id || `roo_item_${idx}`,
      nameAr: item.name_ar || item.name || 'صنف ديليفرو',
      nameEn: item.name || 'Deliveroo Item',
      sku: item.sku,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.price_fractional ? item.price_fractional / 100 : item.price || 0),
      totalPrice: Number(
        (Number(item.price_fractional ? item.price_fractional / 100 : item.price || 0) *
          Number(item.quantity || 1)).toFixed(2)
      ),
      notes: item.notes,
      modifiers: (item.modifiers || []).map((m: any) => ({
        nameAr: m.name_ar || m.name || 'إضافة',
        nameEn: m.name,
        price: Number(m.price_fractional ? m.price_fractional / 100 : m.price || 0),
        quantity: 1,
      })),
    }));

    const subtotal = Number(
      body.subtotal_fractional ? body.subtotal_fractional / 100 : body.subtotal || items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)
    );
    const deliveryFee = 14.0;
    const taxAmount = Number((subtotal * 0.15).toFixed(2));
    const discountAmount = Number(body.discount_fractional ? body.discount_fractional / 100 : 0);
    const totalAmount = Number((subtotal + taxAmount + deliveryFee - discountAmount).toFixed(2));

    const driverInfo: Partial<DeliveryDriver> | undefined = body.rider
      ? {
          id: String(body.rider.id || 'rider_roo_' + Math.random().toString(36).slice(2, 6)),
          name: body.rider.name || 'كابتن ديليفرو',
          phone: body.rider.phone || '+966530008899',
          vehicleType: body.rider.vehicle || 'motorcycle',
          vehiclePlate: body.rider.license_plate || 'د ل ف 772',
          etaMinutes: Number(body.rider.eta_to_restaurant || 15),
          status: 'assigned',
          platform: 'deliveroo',
          rating: 4.6,
        }
      : undefined;

    return {
      platform: 'deliveroo',
      externalOrderId: String(body.id || body.display_id || 'ROO-' + Date.now().toString(36).toUpperCase()),
      platformOrderCode: String(body.display_id || 'ROO-' + Math.floor(1000 + Math.random() * 9000)),
      customer: {
        name: body.customer?.first_name ? `${body.customer.first_name} ${body.customer.last_name || ''}`.trim() : 'عميل ديليفرو',
        phone: body.customer?.phone_number || '+966531234567',
        address: body.delivery_address?.lines?.join(', ') || 'الرياض — حي السليمانية — شارع ممدوح',
        district: 'السليمانية',
        city: 'الرياض',
        notes: body.delivery_notes,
        coordinates: body.delivery_address?.latitude
          ? { lat: body.delivery_address.latitude, lng: body.delivery_address.longitude }
          : { lat: 24.7136, lng: 46.6753 },
      },
      items,
      subtotal,
      deliveryFee,
      taxAmount,
      discountAmount,
      totalAmount,
      paymentMethod: 'prepaid_online',
      isPaid: true,
      driver: driverInfo,
      placedAt: body.created_at || new Date().toISOString(),
      estimatedPrepMinutes: Number(body.prep_time || 15),
      estimatedDeliveryMinutes: Number(body.target_delivery_time_mins || 30),
      notes: body.notes,
    };
  }

  /**
   * Universal Webhook Dispatcher: normalizes raw payload based on platform identifier
   */
  public normalizeWebhook(rawPayload: any, platform?: DeliveryPlatform): DeliveryWebhookPayload {
    const targetPlatform = platform || rawPayload.platform || 'talabat';

    switch (targetPlatform) {
      case 'talabat':
        return this.normalizeTalabatPayload(rawPayload);
      case 'hungerstation':
        return this.normalizeHungerstationPayload(rawPayload);
      case 'jahez':
        return this.normalizeJahezPayload(rawPayload);
      case 'deliveroo':
        return this.normalizeDeliverooPayload(rawPayload);
      default: {
        // Generic fallback normalizer
        const items = (rawPayload.items || []).map((i: any, idx: number) => ({
          externalItemId: i.id || `item_${idx}`,
          nameAr: i.nameAr || i.name || 'صنف دليفري',
          nameEn: i.nameEn || i.name || 'Delivery Item',
          sku: i.sku,
          quantity: Number(i.quantity || 1),
          unitPrice: Number(i.unitPrice || i.price || 0),
          totalPrice: Number((Number(i.unitPrice || i.price || 0) * Number(i.quantity || 1)).toFixed(2)),
          notes: i.notes,
          modifiers: i.modifiers || [],
        }));

        const subtotal = Number(rawPayload.subtotal || items.reduce((s: number, i: any) => s + i.totalPrice, 0).toFixed(2));
        const deliveryFee = Number(rawPayload.deliveryFee || 12.0);
        const taxAmount = Number((subtotal * 0.15).toFixed(2));
        const totalAmount = Number((subtotal + taxAmount + deliveryFee - (rawPayload.discountAmount || 0)).toFixed(2));

        return {
          platform: targetPlatform,
          externalOrderId: rawPayload.externalOrderId || `EXT-${Date.now().toString(36).toUpperCase()}`,
          platformOrderCode: rawPayload.platformOrderCode || `${targetPlatform.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
          customer: {
            name: rawPayload.customer?.name || 'عميل توصيل',
            phone: rawPayload.customer?.phone || '+966500000000',
            address: rawPayload.customer?.address || 'الرياض — السعودية',
            district: rawPayload.customer?.district || 'الرياض',
            city: rawPayload.customer?.city || 'الرياض',
            notes: rawPayload.customer?.notes,
            coordinates: rawPayload.customer?.coordinates || { lat: 24.7136, lng: 46.6753 },
          },
          items,
          subtotal,
          deliveryFee,
          taxAmount,
          discountAmount: rawPayload.discountAmount || 0,
          totalAmount,
          paymentMethod: rawPayload.paymentMethod || 'prepaid_online',
          isPaid: rawPayload.isPaid !== undefined ? rawPayload.isPaid : true,
          driver: rawPayload.driver,
          placedAt: rawPayload.placedAt || new Date().toISOString(),
          estimatedPrepMinutes: rawPayload.estimatedPrepMinutes || 15,
          estimatedDeliveryMinutes: rawPayload.estimatedDeliveryMinutes || 30,
          notes: rawPayload.notes,
        };
      }
    }
  }

  // =========================================================================
  // CORE INGESTION PIPELINE: DB + KDS + INVENTORY + SOUND
  // =========================================================================

  /**
   * Ingest an incoming delivery order webhook payload into the OS:
   * 1. Normalizes the payload
   * 2. Matches items with local MenuItems in DB
   * 3. Inserts unified Order & OrderItems into DB
   * 4. Deducts raw inventory items automatically via RecipeService
   * 5. Emits KDS ticket and audio notification chime
   * 6. Applies auto-acceptance rules if enabled
   */
  public async ingestOrder(rawPayload: any, platform?: DeliveryPlatform): Promise<AggregatedDeliveryOrder> {
    await db.init();

    // 1. Normalize
    const normalized = this.normalizeWebhook(rawPayload, platform);
    const channel = this.channels.get(normalized.platform) || INITIAL_DELIVERY_CHANNELS[normalized.platform];

    if (!channel.isConnected) {
      console.warn(`[DeliveryAggregator] Received order from offline channel: ${normalized.platform}`);
    }

    this.dailySequenceCounter += 1;
    const dailySequence = this.dailySequenceCounter;
    const nowIso = new Date().toISOString();
    const internalDbOrderId = db.generateUUID();
    const aggregatorOrderId = 'agg_del_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    // 2. Match local MenuItems
    const allMenuItems = await db.getAll('menuItems');
    const enrichedItems: DeliveryOrderItemPayload[] = [];
    const dbOrderItems: OrderItem[] = [];

    for (const item of normalized.items) {
      // Find matching local MenuItem
      let matched = allMenuItems.find((m) => m.sku && item.sku && m.sku.toLowerCase() === item.sku.toLowerCase());
      if (!matched) {
        matched = allMenuItems.find((m) => m.id === item.externalItemId);
      }
      if (!matched) {
        const itemClean = item.nameAr.toLowerCase().trim();
        matched = allMenuItems.find((m) => m.nameAr.toLowerCase().includes(itemClean) || itemClean.includes(m.nameAr.toLowerCase()));
      }
      if (!matched && item.nameEn) {
        const itemEnClean = item.nameEn.toLowerCase().trim();
        matched = allMenuItems.find((m) => m.nameEn.toLowerCase().includes(itemEnClean) || itemEnClean.includes(m.nameEn.toLowerCase()));
      }

      const menuItemId = matched ? matched.id : allMenuItems[0]?.id || 'fallback-dish';
      const kitchenStation: KitchenStation = matched
        ? (matched.kitchenStation as KitchenStation)
        : (item.kitchenStation as KitchenStation) || 'main_kitchen';

      const unitPrice = item.unitPrice || (matched ? matched.price : 45);
      const subtotal = Number((unitPrice * item.quantity).toFixed(2));
      const taxAmount = Number((subtotal * 0.15).toFixed(2));
      const totalAmount = Number((subtotal + taxAmount).toFixed(2));

      enrichedItems.push({
        ...item,
        menuItemId,
        kitchenStation,
        unitPrice,
        totalPrice: Number((unitPrice * item.quantity).toFixed(2)),
      });

      const orderItemId = db.generateUUID();
      dbOrderItems.push({
        id: orderItemId,
        orderId: internalDbOrderId,
        menuItemId,
        nameAr: item.nameAr || (matched ? matched.nameAr : 'صنف دليفري'),
        nameEn: item.nameEn || (matched ? matched.nameEn : 'Delivery Item'),
        quantity: item.quantity,
        unitPrice,
        costPrice: matched ? matched.costPrice : unitPrice * 0.35,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        selectedModifiers: (item.modifiers || []).map((m, idx) => ({
          optionId: `mod_${idx}`,
          groupId: 'grp_delivery',
          nameAr: m.nameAr,
          nameEn: m.nameEn || m.nameAr,
          price: m.price || 0,
          quantity: m.quantity || 1,
        })),
        notes: item.notes,
        kitchenStation,
        status: channel.autoAccept ? 'cooking' : 'pending',
        printedToKitchen: true,
        firedAt: nowIso,
        cookingStartedAt: channel.autoAccept ? nowIso : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    // 3. Create & Insert DB Order
    const dbOrder: Order = {
      id: internalDbOrderId,
      orderNumber: `${normalized.platformOrderCode}`,
      dailySequence,
      orderType: 'delivery',
      status: channel.autoAccept ? 'preparing' : 'pending',
      paymentStatus: normalized.isPaid ? 'paid' : 'unpaid',
      subtotal: normalized.subtotal,
      taxAmount: normalized.taxAmount,
      discountAmount: normalized.discountAmount || 0,
      discountType: normalized.discountAmount ? 'percentage' : undefined,
      serviceCharge: 0,
      tipAmount: 0,
      deliveryFee: normalized.deliveryFee,
      totalAmount: normalized.totalAmount,
      paidAmount: normalized.isPaid ? normalized.totalAmount : 0,
      changeAmount: 0,
      paymentMethod: normalized.paymentMethod === 'prepaid_online' ? 'online' : 'cash',
      guestCount: 1,
      customerNotes: `[${channel.displayNameAr}] ${normalized.customer.address} | هاتف: ${normalized.customer.phone}${normalized.notes ? ` | ملاحظات: ${normalized.notes}` : ''}`,
      kitchenNotes: normalized.notes || `طلب دليفري خارجي عبر تطبيق ${channel.displayNameAr}`,
      syncStatus: 'synced',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.insert('orders', dbOrder);
    for (const oi of dbOrderItems) {
      await db.insert('orderItems', oi);
    }

    // 4. Automatic Stock Deduction via Recipe Engine
    try {
      await recipeService.deductInventoryForOrder(dbOrder, dbOrderItems, `aggregator_${normalized.platform}`);
    } catch (invErr) {
      console.warn('[DeliveryAggregator] Inventory auto-deduction error:', invErr);
    }

    // 5. Build Aggregated Delivery Order Model
    const initialStatus: DeliveryOrderStatus = channel.autoAccept ? 'preparing' : 'incoming';
    
    // Assign driver if payload includes courier or synthesize default courier
    const courier: DeliveryDriver = normalized.driver
      ? {
          id: normalized.driver.id || `courier_${normalized.platform}_${Math.random().toString(36).slice(2, 6)}`,
          name: normalized.driver.name || `مندوب ${channel.displayNameAr}`,
          phone: normalized.driver.phone || '+966500000000',
          avatar:
            normalized.driver.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          vehicleType: normalized.driver.vehicleType || 'motorcycle',
          vehiclePlate: normalized.driver.vehiclePlate || 'س ع د 1234',
          etaMinutes: normalized.driver.etaMinutes || 15,
          status: 'assigned',
          platform: normalized.platform,
          rating: normalized.driver.rating || 4.8,
          assignedAt: nowIso,
          currentLocation: {
            lat: 24.7136 + (Math.random() - 0.5) * 0.04,
            lng: 46.6753 + (Math.random() - 0.5) * 0.04,
            updatedAt: nowIso,
          },
        }
      : {
          id: `courier_${normalized.platform}_${Math.random().toString(36).slice(2, 6)}`,
          name: `مندوب ${channel.displayNameAr} (${normalized.platformOrderCode})`,
          phone: '+96655' + Math.floor(1000000 + Math.random() * 9000000),
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
          vehicleType: normalized.platform === 'hungerstation' ? 'car' : 'motorcycle',
          vehiclePlate: `${['أ', 'ب', 'ج', 'د', 'ر', 'س'][Math.floor(Math.random() * 6)]} ${['ل', 'م', 'ن', 'هـ'][Math.floor(Math.random() * 4)]} ${['ق', 'ط', 'ف'][Math.floor(Math.random() * 3)]} ${Math.floor(1000 + Math.random() * 9000)}`,
          etaMinutes: normalized.estimatedPrepMinutes ? normalized.estimatedPrepMinutes + 5 : 18,
          status: 'assigned',
          platform: normalized.platform,
          rating: 4.8,
          assignedAt: nowIso,
          currentLocation: {
            lat: 24.7136 + (Math.random() - 0.5) * 0.04,
            lng: 46.6753 + (Math.random() - 0.5) * 0.04,
            updatedAt: nowIso,
          },
        };

    const aggregatedOrder: AggregatedDeliveryOrder = {
      id: aggregatorOrderId,
      orderId: internalDbOrderId,
      dailySequence,
      platform: normalized.platform,
      platformOrderCode: normalized.platformOrderCode,
      status: initialStatus,
      customer: normalized.customer,
      items: enrichedItems,
      subtotal: normalized.subtotal,
      taxAmount: normalized.taxAmount,
      deliveryFee: normalized.deliveryFee,
      discountAmount: normalized.discountAmount || 0,
      totalAmount: normalized.totalAmount,
      paymentMethod: normalized.paymentMethod,
      isPaid: normalized.isPaid,
      driver: courier,
      receivedAt: nowIso,
      acceptedAt: channel.autoAccept ? nowIso : undefined,
      cookingStartedAt: channel.autoAccept ? nowIso : undefined,
      estimatedPrepMinutes: normalized.estimatedPrepMinutes || channel.estimatedDefaultPrepTime,
      estimatedDeliveryMinutes: normalized.estimatedDeliveryMinutes || 30,
      specialInstructions: normalized.notes,
      autoAccepted: channel.autoAccept,
      timeline: [
        {
          timestamp: nowIso,
          status: 'incoming',
          descriptionAr: `تم استلام الطلب من منصة ${channel.displayNameAr}`,
          descriptionEn: `Order received from ${channel.displayNameEn}`,
        },
        ...(channel.autoAccept
          ? [
              {
                timestamp: nowIso,
                status: 'preparing' as DeliveryOrderStatus,
                descriptionAr: 'تم القبول التلقائي وتوجيه الأصناف للمطبخ (KDS)',
                descriptionEn: 'Auto-accepted and sent to KDS stations',
              },
            ]
          : []),
      ],
    };

    this.deliveryOrders.set(aggregatorOrderId, aggregatedOrder);

    // 6. Sound Alert & EventBus Triggers
    try {
      soundEngine.play('kitchen-bell');
    } catch {
      // Audio context might be restricted
    }

    await eventBus.publish('DELIVERY_ORDER_RECEIVED', {
      deliveryOrder: aggregatedOrder,
      order: dbOrder,
      items: dbOrderItems,
    }, 'delivery');

    await eventBus.publish('ORDER_CREATED', {
      order: dbOrder,
      items: dbOrderItems,
    }, 'delivery');

    if (channel.autoAccept) {
      await eventBus.publish('KDS_NEW_TICKET', {
        orderId: dbOrder.id,
        tableNumber: `توصيل (${channel.displayNameAr})`,
        items: dbOrderItems,
      }, 'delivery');

      await eventBus.publish('KDS_AUDIO_ALERT', { soundType: 'new_order' }, 'delivery');
    }

    this.notifySubscribers();
    return aggregatedOrder;
  }

  // =========================================================================
  // STATUS TRANSITIONS & DRIVER DISPATCH
  // =========================================================================

  /**
   * Accept an incoming delivery order and transmit to kitchen
   */
  public async acceptOrder(deliveryOrderId: string): Promise<AggregatedDeliveryOrder> {
    const order = this.deliveryOrders.get(deliveryOrderId);
    if (!order) throw new Error(`Order ${deliveryOrderId} not found`);

    const nowIso = new Date().toISOString();
    order.status = 'preparing';
    order.acceptedAt = nowIso;
    order.cookingStartedAt = nowIso;
    order.timeline.push({
      timestamp: nowIso,
      status: 'preparing',
      descriptionAr: 'تم قبول الطلب وبدء التحضير بالمطبخ',
      descriptionEn: 'Order accepted and sent to kitchen for cooking',
    });

    // Update DB Order
    await db.update('orders', order.orderId, { status: 'preparing' });
    const orderItems = await db.query('orderItems', { where: (i) => i.orderId === order.orderId });
    for (const item of orderItems) {
      await db.update('orderItems', item.id, {
        status: 'cooking',
        cookingStartedAt: nowIso,
      });
    }

    await eventBus.publish('DELIVERY_ORDER_ACCEPTED', {
      deliveryOrderId: order.id,
      orderId: order.orderId,
      platform: order.platform,
    }, 'delivery');

    await eventBus.publish('DELIVERY_ORDER_STATUS_CHANGED', {
      deliveryOrderId: order.id,
      orderId: order.orderId,
      previousStatus: 'incoming',
      newStatus: 'preparing',
      platform: order.platform,
    }, 'delivery');

    await eventBus.publish('KDS_NEW_TICKET', {
      orderId: order.orderId,
      tableNumber: `توصيل (${order.platform})`,
      items: orderItems,
    }, 'delivery');

    try {
      soundEngine.play('pop');
    } catch {}

    this.notifySubscribers();
    return order;
  }

  /**
   * Mark delivery order as ready for pickup (food packaged, waiting for courier)
   */
  public async markReadyForPickup(deliveryOrderId: string): Promise<AggregatedDeliveryOrder> {
    const order = this.deliveryOrders.get(deliveryOrderId);
    if (!order) throw new Error(`Order ${deliveryOrderId} not found`);

    const prevStatus = order.status;
    const nowIso = new Date().toISOString();
    order.status = 'ready_for_pickup';
    order.readyAt = nowIso;

    if (order.driver) {
      order.driver.status = 'at_store';
    }

    order.timeline.push({
      timestamp: nowIso,
      status: 'ready_for_pickup',
      descriptionAr: 'اكتمل التحضير والتغليف — بانتظار استلام السائق',
      descriptionEn: 'Order cooked and packed — awaiting driver pickup',
    });

    await db.update('orders', order.orderId, { status: 'ready' });
    const orderItems = await db.query('orderItems', { where: (i) => i.orderId === order.orderId });
    for (const item of orderItems) {
      await db.update('orderItems', item.id, {
        status: 'ready',
        readyAt: nowIso,
      });
    }

    await eventBus.publish('DELIVERY_ORDER_STATUS_CHANGED', {
      deliveryOrderId: order.id,
      orderId: order.orderId,
      previousStatus: prevStatus,
      newStatus: 'ready_for_pickup',
      platform: order.platform,
    }, 'delivery');

    try {
      soundEngine.play('kitchen-bell');
    } catch {}

    this.notifySubscribers();
    return order;
  }

  /**
   * Dispatch / Handover order to courier
   */
  public async dispatchOrder(deliveryOrderId: string, driver?: DeliveryDriver): Promise<AggregatedDeliveryOrder> {
    const order = this.deliveryOrders.get(deliveryOrderId);
    if (!order) throw new Error(`Order ${deliveryOrderId} not found`);

    const prevStatus = order.status;
    const nowIso = new Date().toISOString();
    order.status = 'picked_up';
    order.pickedUpAt = nowIso;

    if (driver) {
      order.driver = driver;
    }
    if (order.driver) {
      order.driver.status = 'on_the_way';
    }

    order.timeline.push({
      timestamp: nowIso,
      status: 'picked_up',
      descriptionAr: `تم تسليم الطلب للمندوب (${order.driver?.name || 'سائق'}) وهو في الطريق للعميل`,
      descriptionEn: `Order handed over to courier (${order.driver?.name || 'Driver'}) — on route to customer`,
    });

    await db.update('orders', order.orderId, { status: 'served' });

    await eventBus.publish('DELIVERY_ORDER_STATUS_CHANGED', {
      deliveryOrderId: order.id,
      orderId: order.orderId,
      previousStatus: prevStatus,
      newStatus: 'picked_up',
      platform: order.platform,
    }, 'delivery');

    try {
      soundEngine.play('whoosh');
    } catch {}

    this.notifySubscribers();
    return order;
  }

  /**
   * Complete delivery (delivered to customer)
   */
  public async markDelivered(deliveryOrderId: string): Promise<AggregatedDeliveryOrder> {
    const order = this.deliveryOrders.get(deliveryOrderId);
    if (!order) throw new Error(`Order ${deliveryOrderId} not found`);

    const prevStatus = order.status;
    const nowIso = new Date().toISOString();
    order.status = 'delivered';
    order.deliveredAt = nowIso;

    if (order.driver) {
      order.driver.status = 'delivered';
      order.driver.etaMinutes = 0;
    }

    order.timeline.push({
      timestamp: nowIso,
      status: 'delivered',
      descriptionAr: 'تم تسليم الطلب للعميل بنجاح واكتمال الفاتورة',
      descriptionEn: 'Order delivered successfully to customer',
    });

    await db.update('orders', order.orderId, {
      status: 'completed',
      closedAt: nowIso,
      paymentStatus: 'paid',
    });

    await eventBus.publish('DELIVERY_ORDER_STATUS_CHANGED', {
      deliveryOrderId: order.id,
      orderId: order.orderId,
      previousStatus: prevStatus,
      newStatus: 'delivered',
      platform: order.platform,
    }, 'delivery');

    try {
      soundEngine.play('success');
    } catch {}

    this.notifySubscribers();
    return order;
  }

  /**
   * Cancel delivery order
   */
  public async cancelOrder(deliveryOrderId: string, reason: string = 'إلغاء من قبل المتجر'): Promise<AggregatedDeliveryOrder> {
    const order = this.deliveryOrders.get(deliveryOrderId);
    if (!order) throw new Error(`Order ${deliveryOrderId} not found`);

    const prevStatus = order.status;
    const nowIso = new Date().toISOString();
    order.status = 'cancelled';
    order.cancelledAt = nowIso;
    order.cancellationReason = reason;

    order.timeline.push({
      timestamp: nowIso,
      status: 'cancelled',
      descriptionAr: `تم إلغاء الطلب: ${reason}`,
      descriptionEn: `Order cancelled: ${reason}`,
    });

    await db.update('orders', order.orderId, {
      status: 'cancelled',
      cancellationReason: reason,
      closedAt: nowIso,
    });

    const orderItems = await db.query('orderItems', { where: (i) => i.orderId === order.orderId });
    for (const item of orderItems) {
      await db.update('orderItems', item.id, {
        status: 'cancelled',
        voidReason: reason,
      });
    }

    await eventBus.publish('DELIVERY_ORDER_STATUS_CHANGED', {
      deliveryOrderId: order.id,
      orderId: order.orderId,
      previousStatus: prevStatus,
      newStatus: 'cancelled',
      platform: order.platform,
    }, 'delivery');

    await eventBus.publish('ORDER_CANCELLED', {
      orderId: order.orderId,
      reason,
    }, 'delivery');

    try {
      soundEngine.play('delete');
    } catch {}

    this.notifySubscribers();
    return order;
  }

  /**
   * Assign or update driver info for an active delivery order
   */
  public async assignDriver(deliveryOrderId: string, driver: DeliveryDriver): Promise<AggregatedDeliveryOrder> {
    const order = this.deliveryOrders.get(deliveryOrderId);
    if (!order) throw new Error(`Order ${deliveryOrderId} not found`);

    order.driver = driver;
    order.timeline.push({
      timestamp: new Date().toISOString(),
      status: order.status,
      descriptionAr: `تم تعيين السائق: ${driver.name} (${driver.phone})`,
      descriptionEn: `Courier assigned: ${driver.name} (${driver.phone})`,
    });

    await eventBus.publish('DELIVERY_DRIVER_ASSIGNED', {
      deliveryOrderId: order.id,
      driver,
    }, 'delivery');

    this.notifySubscribers();
    return order;
  }

  /**
   * Update courier live GPS coordinates & ETA
   */
  public async updateDriverLocation(
    deliveryOrderId: string,
    lat: number,
    lng: number,
    etaMinutes?: number
  ): Promise<AggregatedDeliveryOrder | undefined> {
    const order = this.deliveryOrders.get(deliveryOrderId);
    if (!order || !order.driver) return undefined;

    const nowIso = new Date().toISOString();
    order.driver.currentLocation = {
      lat,
      lng,
      updatedAt: nowIso,
    };
    if (etaMinutes !== undefined) {
      order.driver.etaMinutes = etaMinutes;
    }

    await eventBus.publish('DELIVERY_DRIVER_LOCATION_UPDATED', {
      deliveryOrderId: order.id,
      driverId: order.driver.id,
      lat,
      lng,
      etaMinutes,
    }, 'delivery');

    this.notifySubscribers();
    return order;
  }

  // =========================================================================
  // SIMULATION & TEST ORDER INJECTION
  // =========================================================================

  /**
   * Generates and injects a realistic Saudi/MENA mock order from any aggregator platform
   */
  public async simulateIncomingOrder(
    platform: DeliveryPlatform = 'talabat',
    customOverrides?: Partial<DeliveryWebhookPayload>
  ): Promise<AggregatedDeliveryOrder> {
    const SAUDI_CUSTOMERS = [
      { name: 'فيصل العتيبي', phone: '+966551849201', address: 'الرياض — حي النرجس — شارع أنس بن مالك', district: 'النرجس' },
      { name: 'نورة السبيعي', phone: '+966504938217', address: 'الرياض — حي الملقا — فيلا 34', district: 'الملقا' },
      { name: 'سعود الدوسري', phone: '+966542109843', address: 'الرياض — حي الياسمين — شارع العليا', district: 'الياسمين' },
      { name: 'ريم الشمري', phone: '+966567812345', address: 'الرياض — حي السليمانية — شارع ممدوح', district: 'السليمانية' },
      { name: 'محمد القحطاني', phone: '+966531987654', address: 'الرياض — حي حطين — مجمع بوليفارد', district: 'حطين' },
      { name: 'سارة المنصور', phone: '+966589012345', address: 'الرياض — حي الرمال — شارع النجاح', district: 'الرمال' },
    ];

    const MOCK_DISH_COMBOS = [
      [
        { nameAr: 'مشكل مشاوي السلطان المميز', nameEn: 'Sultan Special Mixed Grill Platter', price: 145, quantity: 1, kitchenStation: 'grill' as const },
        { nameAr: 'داينمايت شرمب مقرمش', nameEn: 'Crispy Dynamite Shrimp', price: 58, quantity: 1, kitchenStation: 'fryer' as const },
        { nameAr: 'عصير موهيتو التوت البري', nameEn: 'Wild Berry Mojito', price: 28, quantity: 2, kitchenStation: 'beverage' as const },
      ],
      [
        { nameAr: 'تشكيلة المزة الشامية الملكية', nameEn: 'Royal Levantine Mezze Platter', price: 68, quantity: 1, kitchenStation: 'salad_cold' as const },
        { nameAr: 'شوربة الفطر البري وزيت الكمأة', nameEn: 'Wild Mushroom & Truffle Cream Soup', price: 45, quantity: 2, kitchenStation: 'main_kitchen' as const },
      ],
      [
        { nameAr: 'مشكل مشاوي السلطان المميز', nameEn: 'Sultan Special Mixed Grill Platter', price: 145, quantity: 2, kitchenStation: 'grill' as const },
        { nameAr: 'تشكيلة المزة الشامية الملكية', nameEn: 'Royal Levantine Mezze Platter', price: 68, quantity: 1, kitchenStation: 'salad_cold' as const },
      ],
      [
        { nameAr: 'داينمايت شرمب مقرمش', nameEn: 'Crispy Dynamite Shrimp', price: 58, quantity: 2, kitchenStation: 'fryer' as const },
        { nameAr: 'عصير موهيتو التوت البري', nameEn: 'Wild Berry Mojito', price: 28, quantity: 3, kitchenStation: 'beverage' as const },
      ],
    ];

    const customer = SAUDI_CUSTOMERS[Math.floor(Math.random() * SAUDI_CUSTOMERS.length)];
    const dishCombo = MOCK_DISH_COMBOS[Math.floor(Math.random() * MOCK_DISH_COMBOS.length)];

    const items: DeliveryOrderItemPayload[] = dishCombo.map((dish, idx) => ({
      externalItemId: `sim_item_${idx}_${Date.now()}`,
      nameAr: dish.nameAr,
      nameEn: dish.nameEn,
      quantity: dish.quantity,
      unitPrice: dish.price,
      totalPrice: Number((dish.price * dish.quantity).toFixed(2)),
      kitchenStation: dish.kitchenStation,
      notes: idx === 0 ? 'بدون بصل حار من فضلكم' : undefined,
      modifiers: [
        { nameAr: 'صلصة ثوم إضافية', nameEn: 'Extra Garlic Sauce', price: 5, quantity: 1 },
      ],
    }));

    const subtotal = Number(items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
    const deliveryFee = 12.0;
    const taxAmount = Number((subtotal * 0.15).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount + deliveryFee).toFixed(2));

    const shortCodes: Record<DeliveryPlatform, string> = {
      talabat: 'TAL-',
      hungerstation: 'HNG-',
      jahez: 'JHZ-',
      deliveroo: 'ROO-',
      mrsool: 'MRS-',
      careem: 'CRM-',
    };

    const mockPayload: DeliveryWebhookPayload = {
      platform,
      externalOrderId: `SIM-${platform.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      platformOrderCode: `${shortCodes[platform]}${Math.floor(1000 + Math.random() * 9000)}`,
      customer: {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        district: customer.district,
        city: 'الرياض',
        coordinates: {
          lat: 24.7136 + (Math.random() - 0.5) * 0.05,
          lng: 46.6753 + (Math.random() - 0.5) * 0.05,
        },
      },
      items,
      subtotal,
      deliveryFee,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      paymentMethod: Math.random() > 0.3 ? 'prepaid_online' : 'cash_on_delivery',
      isPaid: true,
      driver: {
        id: `courier_${platform}_${Math.floor(100 + Math.random() * 900)}`,
        name: `كابتن ${customer.name.split(' ')[0]} التوصيل`,
        phone: '+96655' + Math.floor(1000000 + Math.random() * 9000000),
        vehicleType: platform === 'hungerstation' ? 'car' : 'motorcycle',
        vehiclePlate: `أ ب ج ${Math.floor(1000 + Math.random() * 9000)}`,
        etaMinutes: Math.floor(10 + Math.random() * 15),
        status: 'assigned',
        platform,
        rating: 4.9,
      },
      estimatedPrepMinutes: 15,
      estimatedDeliveryMinutes: 30,
      notes: 'الرجاء عدم رن الجرس، الاتصال عند الوصول',
      ...customOverrides,
    };

    return await this.ingestOrder(mockPayload, platform);
  }

  /**
   * Start live automated order generator stream (e.g. every X seconds for demos)
   */
  public startLiveSimulation(intervalMs: number = 30000) {
    if (this.simulationTimer) return;
    const platforms: DeliveryPlatform[] = ['talabat', 'hungerstation', 'jahez', 'deliveroo'];

    this.simulationTimer = setInterval(async () => {
      try {
        const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
        const ch = this.channels.get(randomPlatform);
        if (ch && ch.isConnected) {
          await this.simulateIncomingOrder(randomPlatform);
        }
      } catch (err) {
        console.error('[DeliveryAggregator] Simulation tick error:', err);
      }
    }, intervalMs);
  }

  /**
   * Stop live automated simulation
   */
  public stopLiveSimulation() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  public isSimulating(): boolean {
    return this.simulationTimer !== null;
  }

  /**
   * Clear all delivery orders (useful for unit testing or resets)
   */
  public clearAll() {
    this.deliveryOrders.clear();
    this.dailySequenceCounter = 100;
    this.recalculateChannelStats();
    this.notifySubscribers();
  }
}

// Global Singleton Instance
export const deliveryAggregatorService = new DeliveryAggregatorService();
