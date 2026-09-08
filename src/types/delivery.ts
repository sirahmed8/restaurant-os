/**
 * =====================================================================
 * RESTAURANT OS — DELIVERY HUB & THIRD-PARTY AGGREGATOR TYPES
 * =====================================================================
 * Covers Talabat, Hungerstation, Jahez, Deliveroo and external delivery networks.
 */

export type DeliveryPlatform = 
  | 'talabat' 
  | 'hungerstation' 
  | 'jahez' 
  | 'deliveroo' 
  | 'mrsool' 
  | 'careem';

export type DeliveryOrderStatus = 
  | 'incoming'          // New order from aggregator, pending store acceptance
  | 'accepted'          // Accepted by store / auto-accepted
  | 'preparing'         // Transmitted to KDS & kitchen stations
  | 'ready_for_pickup'  // Food cooked & packaged, waiting for driver
  | 'picked_up'         // Driver picked up order, on the way
  | 'delivered'         // Delivered successfully to customer
  | 'cancelled';        // Cancelled by store, customer, or aggregator

export type DriverStatus = 
  | 'assigned'              // Courier assigned to the order
  | 'arriving_to_store'     // Driver heading towards restaurant
  | 'at_store'              // Driver arrived at restaurant pickup area
  | 'picked_up'             // Order handed over to driver
  | 'on_the_way'            // Driver on route to delivery address
  | 'arrived_to_customer'   // Driver at customer location
  | 'delivered';            // Driver marked order completed

export interface DeliveryDriverLocation {
  lat: number;
  lng: number;
  updatedAt: string;
  heading?: number;
  speedKmh?: number;
}

export interface DeliveryDriver {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  vehicleType: 'car' | 'motorcycle' | 'bicycle' | 'van';
  vehiclePlate?: string;
  currentLocation?: DeliveryDriverLocation;
  etaMinutes: number;
  status: DriverStatus;
  rating?: number;
  assignedAt?: string;
  platform: DeliveryPlatform;
}

export interface DeliveryItemModifier {
  id?: string;
  nameAr: string;
  nameEn?: string;
  price: number;
  quantity?: number;
}

import { KitchenStation } from '../db/schema';

export interface DeliveryOrderItemPayload {
  externalItemId: string;
  menuItemId?: string;      // Matched local MenuItem ID
  nameAr: string;
  nameEn: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  kitchenStation?: KitchenStation | 'assembly' | 'beverage';
  modifiers?: DeliveryItemModifier[];
  notes?: string;
}

export interface DeliveryCustomerPayload {
  name: string;
  phone: string;
  address: string;
  buildingOrApartment?: string;
  district?: string;
  city?: string;
  notes?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface AggregatedDeliveryOrder {
  id: string;                      // Internal Aggregator Order ID (UUID)
  orderId: string;                  // Linked internal Database Order ID
  dailySequence: number;            // Daily sequence number
  platform: DeliveryPlatform;       // talabat | hungerstation | jahez | deliveroo
  platformOrderCode: string;        // External short code e.g. "TAL-9942", "JHZ-1049"
  status: DeliveryOrderStatus;
  customer: DeliveryCustomerPayload;
  items: DeliveryOrderItemPayload[];
  
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  
  paymentMethod: 'prepaid_online' | 'cash_on_delivery' | 'card_on_delivery';
  isPaid: boolean;
  
  driver?: DeliveryDriver;
  
  receivedAt: string;
  acceptedAt?: string;
  cookingStartedAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  
  estimatedPrepMinutes: number;
  estimatedDeliveryMinutes: number;
  specialInstructions?: string;
  autoAccepted: boolean;
  
  timeline: {
    timestamp: string;
    status: DeliveryOrderStatus;
    descriptionAr: string;
    descriptionEn: string;
  }[];
}

export interface PlatformChannelConfig {
  platform: DeliveryPlatform;
  displayNameAr: string;
  displayNameEn: string;
  brandColor: string;
  bgColor: string;
  textColor: string;
  logo: string;
  isConnected: boolean;
  autoAccept: boolean;
  estimatedDefaultPrepTime: number; // in minutes
  commissionRate: number;           // e.g. 0.18 for 18%
  activeOrdersCount: number;
  todayOrdersCount: number;
  todayRevenue: number;
  avgRating: number;
  webhookEndpoint: string;
  apiKeyMasked: string;
  lastPingAt?: string;
}

export interface DeliveryWebhookPayload {
  platform: DeliveryPlatform;
  externalOrderId: string;
  platformOrderCode: string;
  customer: DeliveryCustomerPayload;
  items: DeliveryOrderItemPayload[];
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  discountAmount?: number;
  totalAmount: number;
  paymentMethod: 'prepaid_online' | 'cash_on_delivery' | 'card_on_delivery';
  isPaid: boolean;
  driver?: Partial<DeliveryDriver>;
  placedAt?: string;
  estimatedPrepMinutes?: number;
  estimatedDeliveryMinutes?: number;
  notes?: string;
}

export interface DeliverySummaryStats {
  totalOrdersToday: number;
  activeOrdersCount: number;
  totalRevenueToday: number;
  avgPrepTimeMinutes: number;
  avgDeliveryTimeMinutes: number;
  fulfillmentRate: number; // 0-100%
  channelBreakdown: Record<DeliveryPlatform, {
    ordersCount: number;
    revenue: number;
    sharePercent: number;
  }>;
}
