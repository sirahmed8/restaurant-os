import { describe, it, expect, beforeEach, vi } from 'vitest';
import { deliveryAggregatorService } from '../services/deliveryAggregatorService';
import { eventBus } from '../services/eventBus';
import { db } from '../db';
import { InventoryItem, MenuItem, Recipe, RecipeIngredient } from '../db/schema';
import { DeliveryPlatform } from '../types/delivery';

describe('Third-Party Delivery Aggregator Engine (Talabat, Hungerstation, Jahez, Deliveroo)', () => {
  beforeEach(async () => {
    await db.init();
    eventBus.clearHistory();
    deliveryAggregatorService.clearAll();
  });

  describe('1. Platform Webhook Normalization', () => {
    it('should correctly normalize Talabat webhook payload', () => {
      const rawTalabat = {
        order: {
          id: 'TALABAT-100234',
          short_code: 'TAL-8821',
          created_at: '2026-08-14T12:00:00Z',
          customer_name: 'سلطان القحطاني',
          customer: {
            name: 'سلطان القحطاني',
            mobile: '+966501234567',
          },
          delivery_address: {
            formatted: 'الرياض — حي النرجس — شارع أنس بن مالك',
            district: 'النرجس',
            city: 'الرياض',
            latitude: 24.8142,
            longitude: 46.6341,
          },
          products: [
            {
              id: 'item-mixed-grill-platter',
              name_ar: 'مشكل مشاوي السلطان المميز',
              name_en: 'Sultan Special Mixed Grill Platter',
              quantity: 2,
              unit_price: 145.0,
              special_instructions: 'زيادة ثوم وبقدونس',
              options: [
                { name_ar: 'صلصة حارة إضافية', price: 5.0, quantity: 1 },
              ],
            },
          ],
          subtotal: 290.0,
          delivery_charge: 12.0,
          discount: 10.0,
          payment_type: 'online',
          courier: {
            id: 'rider_tal_44',
            name: 'محمد كمال',
            phone: '+966559988776',
            vehicle_type: 'motorcycle',
            plate_number: 'ط ل ب 992',
            eta_minutes: 18,
          },
          notes: 'الرجاء عدم رن الجرس',
        },
      };

      const normalized = deliveryAggregatorService.normalizeTalabatPayload(rawTalabat);

      expect(normalized.platform).toBe('talabat');
      expect(normalized.externalOrderId).toBe('TALABAT-100234');
      expect(normalized.platformOrderCode).toBe('TAL-8821');
      expect(normalized.customer.name).toBe('سلطان القحطاني');
      expect(normalized.customer.phone).toBe('+966501234567');
      expect(normalized.customer.address).toBe('الرياض — حي النرجس — شارع أنس بن مالك');
      expect(normalized.items).toHaveLength(1);
      expect(normalized.items[0].nameAr).toBe('مشكل مشاوي السلطان المميز');
      expect(normalized.items[0].quantity).toBe(2);
      expect(normalized.items[0].unitPrice).toBe(145.0);
      expect(normalized.items[0].totalPrice).toBe(290.0);
      expect(normalized.subtotal).toBe(290.0);
      expect(normalized.deliveryFee).toBe(12.0);
      expect(normalized.taxAmount).toBe(43.5); // 15% of 290
      expect(normalized.discountAmount).toBe(10.0);
      expect(normalized.totalAmount).toBe(335.5); // 290 + 43.5 + 12 - 10
      expect(normalized.paymentMethod).toBe('prepaid_online');
      expect(normalized.isPaid).toBe(true);
      expect(normalized.driver?.name).toBe('محمد كمال');
      expect(normalized.driver?.etaMinutes).toBe(18);
    });

    it('should correctly normalize Hungerstation webhook payload', () => {
      const rawHungerstation = {
        data: {
          order_id: 'HNG-774921',
          display_number: 'HNG-4402',
          created_time: '2026-08-14T12:05:00Z',
          client: {
            name: 'فاطمة الشهري',
            phone: '+966567788990',
          },
          delivery_location: {
            address_line: 'الرياض — حي الملقا — فيلا 88',
            district: 'الملقا',
            city: 'الرياض',
            lat: 24.7925,
            lng: 46.5981,
          },
          cart_items: [
            {
              vendor_item_id: 'item-dynamite-shrimp',
              title_ar: 'داينمايت شرمب مقرمش',
              title_en: 'Crispy Dynamite Shrimp',
              quantity: 1,
              price: 58.0,
              instructions: 'صوص جانبي',
            },
          ],
          subtotal: 58.0,
          delivery_charge: 15.0,
          discount_amount: 0,
          is_prepaid: true,
          rider: {
            id: 'rider_hng_10',
            full_name: 'أحمد الغامدي',
            mobile_number: '+966501122334',
            transport_type: 'car',
            plate_info: 'هـ ن ق 104',
            eta: 14,
          },
          notes: 'تسليم عند الباب',
        },
      };

      const normalized = deliveryAggregatorService.normalizeHungerstationPayload(rawHungerstation);

      expect(normalized.platform).toBe('hungerstation');
      expect(normalized.externalOrderId).toBe('HNG-774921');
      expect(normalized.platformOrderCode).toBe('HNG-4402');
      expect(normalized.customer.name).toBe('فاطمة الشهري');
      expect(normalized.items).toHaveLength(1);
      expect(normalized.items[0].nameAr).toBe('داينمايت شرمب مقرمش');
      expect(normalized.subtotal).toBe(58.0);
      expect(normalized.taxAmount).toBe(8.7); // 15% of 58
      expect(normalized.deliveryFee).toBe(15.0);
      expect(normalized.totalAmount).toBe(81.7); // 58 + 8.7 + 15
      expect(normalized.driver?.name).toBe('أحمد الغامدي');
      expect(normalized.driver?.vehicleType).toBe('car');
    });

    it('should correctly normalize Jahez webhook payload', () => {
      const rawJahez = {
        jahez_order: {
          order_number: 'JHZ-990184',
          quick_code: 'JHZ-1092',
          order_date: '2026-08-14T12:10:00Z',
          customer_info: {
            customer_name: 'عبدالله الدوسري',
            customer_mobile: '+966541122334',
            delivery_address: 'الرياض — حي الياسمين — شارع العليا',
            district: 'الياسمين',
            latitude: 24.8211,
            longitude: 46.6612,
          },
          order_details: [
            {
              item_code: 'item-mixed-mezze',
              item_name_ar: 'تشكيلة المزة الشامية الملكية',
              item_name_en: 'Royal Levantine Mezze Platter',
              qty: 1,
              unit_cost: 68.0,
            },
          ],
          order_subtotal: 68.0,
          delivery_charge: 10.0,
          discount: 0,
          payment_mode: 'MADA',
          driver_details: {
            driver_id: 'dr_jhz_9',
            driver_name: 'كابتن جاهز سامي',
            driver_mobile: '+966549988771',
            vehicle_type: 'car',
            plate_number: 'ج هـ ز 881',
            pickup_eta_mins: 10,
          },
        },
      };

      const normalized = deliveryAggregatorService.normalizeJahezPayload(rawJahez);

      expect(normalized.platform).toBe('jahez');
      expect(normalized.externalOrderId).toBe('JHZ-990184');
      expect(normalized.platformOrderCode).toBe('JHZ-1092');
      expect(normalized.customer.name).toBe('عبدالله الدوسري');
      expect(normalized.items[0].nameAr).toBe('تشكيلة المزة الشامية الملكية');
      expect(normalized.subtotal).toBe(68.0);
      expect(normalized.paymentMethod).toBe('prepaid_online');
      expect(normalized.driver?.name).toBe('كابتن جاهز سامي');
    });

    it('should correctly normalize Deliveroo webhook payload with fractional pricing', () => {
      const rawDeliveroo = {
        deliveroo_order: {
          id: 'ROO-552199',
          display_id: 'ROO-3041',
          created_at: '2026-08-14T12:15:00Z',
          customer: {
            first_name: 'نوف',
            last_name: 'العتيبي',
            phone_number: '+966531122334',
          },
          delivery_address: {
            lines: ['حي السليمانية', 'شارع الأمير ممدوح'],
            latitude: 24.7136,
            longitude: 46.6753,
          },
          items: [
            {
              id: 'item-truffle-soup',
              name_ar: 'شوربة الفطر البري وزيت الكمأة',
              name: 'Wild Mushroom & Truffle Cream Soup',
              quantity: 2,
              price_fractional: 4500, // 45.00 SAR
            },
          ],
          subtotal_fractional: 9000, // 90.00 SAR
          discount_fractional: 0,
          rider: {
            id: 'rider_roo_7',
            name: 'طارق المصري',
            phone: '+966530011223',
            vehicle: 'motorcycle',
            license_plate: 'د ل ف 441',
            eta_to_restaurant: 12,
          },
        },
      };

      const normalized = deliveryAggregatorService.normalizeDeliverooPayload(rawDeliveroo);

      expect(normalized.platform).toBe('deliveroo');
      expect(normalized.externalOrderId).toBe('ROO-552199');
      expect(normalized.customer.name).toBe('نوف العتيبي');
      expect(normalized.items[0].unitPrice).toBe(45.0);
      expect(normalized.items[0].totalPrice).toBe(90.0);
      expect(normalized.subtotal).toBe(90.0);
      expect(normalized.taxAmount).toBe(13.5); // 15% of 90
      expect(normalized.driver?.name).toBe('طارق المصري');
    });
  });

  describe('2. Order Ingestion Pipeline (Database, KDS, & Inventory)', () => {
    it('should ingest order into DB, link OrderItems, deduct stock, and emit events', async () => {
      // Setup inventory item & recipe for testing
      const testBeef: InventoryItem = {
        id: 'inv-grill-beef-test',
        code: 'RAW-BEEF-GRILL',
        nameAr: 'لحم مشوي طازج',
        nameEn: 'Fresh Grill Beef',
        category: 'Meat',
        unit: 'kg',
        currentStock: 20.0,
        minStockAlert: 5.0,
        maxStock: 50.0,
        reorderQuantity: 15.0,
        averageCost: 40.0,
        lastPurchasePrice: 40.0,
        expiryTracking: false,
        yieldRatio: 1.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testMenuItem: MenuItem = {
        id: 'menu-grill-deliv-test',
        categoryId: 'cat-grills-mains',
        nameAr: 'مشاوي مشكلة دليفري',
        nameEn: 'Delivery Mixed Grill',
        descriptionAr: 'طبق مشاوي فاخر للتوصيل',
        descriptionEn: 'Prime mixed grill platter',
        price: 120.0,
        costPrice: 35.0,
        taxRate: 0.15,
        sku: 'DEL-GRILL-01',
        calories: 800,
        preparationTimeMinutes: 15,
        isAvailable: true,
        isFeatured: true,
        isRecommended: true,
        allergens: [],
        kitchenStation: 'grill',
        sortOrder: 1,
        soldCount: 10,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testRecipe: Recipe = {
        id: 'rec-grill-deliv-test',
        menuItemId: 'menu-grill-deliv-test',
        portionYield: 1,
        laborCostEstimate: 5.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testIngredient: RecipeIngredient = {
        id: 'ing-grill-deliv-test',
        recipeId: 'rec-grill-deliv-test',
        inventoryItemId: 'inv-grill-beef-test',
        quantity: 0.4, // 400g per plate
        unit: 'kg',
        wastePercentage: 0,
        costContribution: 16.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert('inventoryItems', testBeef);
      await db.insert('menuItems', testMenuItem);
      await db.insert('recipes', testRecipe);
      await db.insert('recipeIngredients', testIngredient);

      // Listen for event bus publications
      const receivedEvents: any[] = [];
      const orderCreatedEvents: any[] = [];
      const kdsTicketEvents: any[] = [];

      eventBus.on('DELIVERY_ORDER_RECEIVED', (evt) => { receivedEvents.push(evt.payload); });
      eventBus.on('ORDER_CREATED', (evt) => { orderCreatedEvents.push(evt.payload); });
      eventBus.on('KDS_NEW_TICKET', (evt) => { kdsTicketEvents.push(evt.payload); });

      // Talabat channel has autoAccept: true by default
      const orderPayload = {
        order: {
          id: 'TAL-AUTO-9901',
          short_code: 'TAL-9901',
          customer: { name: 'عمر التميمي', mobile: '+966551122448' },
          delivery_address: { formatted: 'الرياض — حي النخيل' },
          products: [
            {
              sku: 'DEL-GRILL-01',
              name_ar: 'مشاوي مشكلة دليفري',
              name_en: 'Delivery Mixed Grill',
              quantity: 2, // 2 plates -> 2 * 0.4kg = 0.8kg deducted
              unit_price: 120.0,
            },
          ],
          subtotal: 240.0,
          delivery_charge: 12.0,
          payment_type: 'online',
        },
      };

      const deliveryOrder = await deliveryAggregatorService.ingestOrder(orderPayload, 'talabat');

      // 1. Verify Aggregated Order
      expect(deliveryOrder.platform).toBe('talabat');
      expect(deliveryOrder.platformOrderCode).toBe('TAL-9901');
      expect(deliveryOrder.status).toBe('preparing'); // Auto-accepted
      expect(deliveryOrder.customer.name).toBe('عمر التميمي');
      expect(deliveryOrder.items).toHaveLength(1);
      expect(deliveryOrder.items[0].kitchenStation).toBe('grill');

      // 2. Verify Database Persistence
      const dbOrder = await db.getById('orders', deliveryOrder.orderId);
      expect(dbOrder).not.toBeNull();
      expect(dbOrder?.orderType).toBe('delivery');
      expect(dbOrder?.status).toBe('preparing');
      expect(dbOrder?.totalAmount).toBe(288.0); // 240 + 36 (VAT) + 12 (Delivery)

      const dbItems = await db.query('orderItems', { where: (i) => i.orderId === deliveryOrder.orderId });
      expect(dbItems).toHaveLength(1);
      expect(dbItems[0].menuItemId).toBe('menu-grill-deliv-test');
      expect(dbItems[0].kitchenStation).toBe('grill');

      // 3. Verify Automatic Stock Deduction
      const updatedStock = await db.getById('inventoryItems', 'inv-grill-beef-test');
      expect(updatedStock?.currentStock).toBe(19.2); // 20.0 - 0.8 kg

      // 4. Verify EventBus Broadcasts
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].deliveryOrder.platformOrderCode).toBe('TAL-9901');
      expect(orderCreatedEvents).toHaveLength(1);
      expect(kdsTicketEvents).toHaveLength(1);
    });

    it('should respect manual-acceptance channel setting (starts with status: incoming)', async () => {
      // Hungerstation by default has autoAccept: false
      const hngPayload = {
        data: {
          order_id: 'HNG-MANUAL-11',
          display_number: 'HNG-1100',
          client: { name: 'سارة خالد', phone: '+966560000000' },
          delivery_location: { address_line: 'الرياض — حي حطين' },
          cart_items: [
            {
              item_id: 'item-mixed-mezze',
              title_ar: 'تشكيلة المزة الشامية الملكية',
              quantity: 1,
              price: 68.0,
            },
          ],
          subtotal: 68.0,
          delivery_charge: 15.0,
          is_prepaid: true,
        },
      };

      const deliveryOrder = await deliveryAggregatorService.ingestOrder(hngPayload, 'hungerstation');

      expect(deliveryOrder.status).toBe('incoming');
      expect(deliveryOrder.autoAccepted).toBe(false);

      const dbOrder = await db.getById('orders', deliveryOrder.orderId);
      expect(dbOrder?.status).toBe('pending');
    });
  });

  describe('3. Order Lifecycle & Status Transitions', () => {
    it('should transition through full delivery workflow: incoming -> preparing -> ready -> picked_up -> delivered', async () => {
      // Ingest manual order
      deliveryAggregatorService.toggleAutoAccept('hungerstation', false);

      const hngPayload = {
        data: {
          order_id: 'HNG-FLOW-001',
          display_number: 'HNG-7788',
          client: { name: 'مهند السبيعي', phone: '+966541112233' },
          delivery_location: { address_line: 'الرياض — حي الصحافة' },
          cart_items: [{ title_ar: 'ستيك ريب آي', quantity: 1, price: 180.0 }],
          subtotal: 180.0,
          delivery_charge: 15.0,
        },
      };

      const order = await deliveryAggregatorService.ingestOrder(hngPayload, 'hungerstation');
      expect(order.status).toBe('incoming');

      // 1. Accept Order
      const accepted = await deliveryAggregatorService.acceptOrder(order.id);
      expect(accepted.status).toBe('preparing');
      expect(accepted.acceptedAt).toBeDefined();

      let dbOrder = await db.getById('orders', order.orderId);
      expect(dbOrder?.status).toBe('preparing');

      // 2. Mark Ready for Pickup
      const ready = await deliveryAggregatorService.markReadyForPickup(order.id);
      expect(ready.status).toBe('ready_for_pickup');
      expect(ready.readyAt).toBeDefined();
      expect(ready.driver?.status).toBe('at_store');

      dbOrder = await db.getById('orders', order.orderId);
      expect(dbOrder?.status).toBe('ready');

      // 3. Dispatch / Hand to Courier
      const dispatched = await deliveryAggregatorService.dispatchOrder(order.id);
      expect(dispatched.status).toBe('picked_up');
      expect(dispatched.pickedUpAt).toBeDefined();
      expect(dispatched.driver?.status).toBe('on_the_way');

      dbOrder = await db.getById('orders', order.orderId);
      expect(dbOrder?.status).toBe('served');

      // 4. Mark Delivered
      const delivered = await deliveryAggregatorService.markDelivered(order.id);
      expect(delivered.status).toBe('delivered');
      expect(delivered.deliveredAt).toBeDefined();
      expect(delivered.driver?.status).toBe('delivered');
      expect(delivered.driver?.etaMinutes).toBe(0);

      dbOrder = await db.getById('orders', order.orderId);
      expect(dbOrder?.status).toBe('completed');
      expect(dbOrder?.paymentStatus).toBe('paid');
    });

    it('should handle cancellation with recorded reason and update DB accordingly', async () => {
      const order = await deliveryAggregatorService.simulateIncomingOrder('jahez');

      const cancelledSpy = vi.fn();
      eventBus.on('ORDER_CANCELLED', cancelledSpy);

      const cancelled = await deliveryAggregatorService.cancelOrder(order.id, 'نفاد الكمية بالمطبخ');

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancellationReason).toBe('نفاد الكمية بالمطبخ');
      expect(cancelled.cancelledAt).toBeDefined();

      const dbOrder = await db.getById('orders', order.orderId);
      expect(dbOrder?.status).toBe('cancelled');
      expect(dbOrder?.cancellationReason).toBe('نفاد الكمية بالمطبخ');

      expect(cancelledSpy).toHaveBeenCalledTimes(1);
      expect(cancelledSpy.mock.calls[0][0].payload.orderId).toBe(order.orderId);
      expect(cancelledSpy.mock.calls[0][0].payload.reason).toBe('نفاد الكمية بالمطبخ');
    });
  });

  describe('4. Driver Assignment & Real-Time GPS Tracking', () => {
    it('should assign new driver and emit DELIVERY_DRIVER_ASSIGNED', async () => {
      const order = await deliveryAggregatorService.simulateIncomingOrder('talabat');

      const driverAssignedSpy = vi.fn();
      eventBus.on('DELIVERY_DRIVER_ASSIGNED', driverAssignedSpy);

      const newDriver = {
        id: 'courier_tal_vip',
        name: 'كابتن ريان العتيبي',
        phone: '+966558877665',
        vehicleType: 'car' as const,
        vehiclePlate: 'ر ي ن 777',
        etaMinutes: 12,
        status: 'arriving_to_store' as const,
        platform: 'talabat' as DeliveryPlatform,
        rating: 5.0,
      };

      const updated = await deliveryAggregatorService.assignDriver(order.id, newDriver);

      expect(updated.driver?.name).toBe('كابتن ريان العتيبي');
      expect(updated.driver?.vehiclePlate).toBe('ر ي ن 777');
      expect(driverAssignedSpy).toHaveBeenCalledTimes(1);
      expect(driverAssignedSpy.mock.calls[0][0].payload.driver.name).toBe('كابتن ريان العتيبي');
    });

    it('should update driver GPS coordinates and ETA', async () => {
      const order = await deliveryAggregatorService.simulateIncomingOrder('jahez');

      const locSpy = vi.fn();
      eventBus.on('DELIVERY_DRIVER_LOCATION_UPDATED', locSpy);

      const updated = await deliveryAggregatorService.updateDriverLocation(order.id, 24.815, 46.635, 8);

      expect(updated).toBeDefined();
      expect(updated?.driver?.currentLocation?.lat).toBe(24.815);
      expect(updated?.driver?.currentLocation?.lng).toBe(46.635);
      expect(updated?.driver?.etaMinutes).toBe(8);

      expect(locSpy).toHaveBeenCalledTimes(1);
      expect(locSpy.mock.calls[0][0].payload.lat).toBe(24.815);
      expect(locSpy.mock.calls[0][0].payload.etaMinutes).toBe(8);
    });
  });

  describe('5. Channel Control & Summary Analytics', () => {
    it('should toggle channel connection and auto-acceptance states', async () => {
      const chEventSpy = vi.fn();
      eventBus.on('DELIVERY_CHANNEL_STATUS_CHANGED', chEventSpy);

      const toggled = await deliveryAggregatorService.toggleChannelStatus('deliveroo', false);
      expect(toggled.isConnected).toBe(false);

      const autoToggled = await deliveryAggregatorService.toggleAutoAccept('deliveroo', true);
      expect(autoToggled.autoAccept).toBe(true);

      expect(chEventSpy).toHaveBeenCalledTimes(2);
    });

    it('should calculate accurate aggregated delivery summary stats', async () => {
      await deliveryAggregatorService.simulateIncomingOrder('talabat');
      await deliveryAggregatorService.simulateIncomingOrder('hungerstation');
      await deliveryAggregatorService.simulateIncomingOrder('jahez');

      const stats = deliveryAggregatorService.getSummaryStats();

      expect(stats.totalOrdersToday).toBe(3);
      expect(stats.activeOrdersCount).toBe(3);
      expect(stats.totalRevenueToday).toBeGreaterThan(0);
      expect(stats.channelBreakdown.talabat.ordersCount).toBe(1);
      expect(stats.channelBreakdown.hungerstation.ordersCount).toBe(1);
      expect(stats.channelBreakdown.jahez.ordersCount).toBe(1);
    });
  });
});
