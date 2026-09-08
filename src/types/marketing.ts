/**
 * =====================================================================
 * RESTAURANT OS — MARKETING & WHATSAPP CAMPAIGNS TYPES
 * =====================================================================
 */

import { CustomerTier } from '../db/schema';

export type CustomerSegmentType =
  | 'all'
  | 'vip'
  | 'loyal'
  | 'at_risk'
  | 'inactive'
  | 'new';

export type RFMSegment =
  | 'champions'
  | 'loyal'
  | 'potential_loyalist'
  | 'new_customers'
  | 'promising'
  | 'need_attention'
  | 'about_to_sleep'
  | 'at_risk'
  | 'cant_lose'
  | 'hibernating'
  | 'lost'
  | 'vip_high_spenders'
  | 'dormant'
  | string;

export type RFMScore = 
  | string
  | {
      recency?: number;
      frequency?: number;
      monetary?: number;
      totalScore?: number;
    };

export interface CustomerRFMProfile {
  id?: string;
  customerId?: string;
  name: string;
  nameEn?: string;
  phone: string;
  tier: CustomerTier | 'Black VIP' | 'Gold' | 'Silver' | 'Bronze';
  totalSpent?: number;
  orderCount?: number;
  averageOrderValue?: number;
  lastOrderDate?: string;
  daysSinceLastOrder?: number;
  rfmScore?: RFMScore;
  segment: RFMSegment;
  segmentNameAr?: string;
  segmentNameEn?: string;
  favoriteItems?: string[];
  favoriteDishAr?: string;
  loyaltyPoints?: number;
  customNotes?: string;
  whatsappActive?: boolean;
  marketingOptIn?: boolean;
  frequency?: number;
  monetary?: number;
  recency?: number;
  recencyDays?: number;
  rScore?: number;
  fScore?: number;
  mScore?: number;
  [key: string]: any;
}

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'running'
  | 'completed'
  | 'cancelled'
  | string;

export type CampaignType =
  | 'vip_loyalty'
  | 'vip_reward'
  | 'win_back'
  | 'birthday_anniversary'
  | 'birthday'
  | 'flash_discount'
  | 'flash_deal'
  | 'new_menu_launch'
  | 'weekend_special'
  | 'cart_recovery'
  | 'feedback_review'
  | string;

export interface WhatsAppInteractiveButton {
  id: string;
  type?: 'reply' | 'url' | 'call' | 'quick_reply' | string;
  titleAr: string;
  titleEn?: string;
  payload?: string;
  url?: string;
}

export interface MarketingCampaign {
  id: string;
  titleAr: string;
  titleEn?: string;
  type?: CampaignType;
  targetSegment?: RFMSegment | 'all' | string;
  segment?: any;
  messageTextAr?: string;
  messageTextEn?: string;
  messageTemplateAr?: string;
  messageTemplateEn?: string;
  buttons?: WhatsAppInteractiveButton[];
  couponCode?: string;
  discountCouponCode?: string;
  discountPercentage?: number;
  ctaButtonAction?: string;
  status: CampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  targetAudienceCount?: number;
  targetCount?: number;
  sentCount?: number;
  deliveredCount?: number;
  readCount?: number;
  clickedCount?: number;
  repliedCount?: number;
  ordersGenerated?: number;
  convertedOrdersCount?: number;
  revenueGenerated?: number;
  revenueGeneratedSar?: number;
  costEstimate?: number;
  costSar?: number;
  roiMultiplier?: number;
  roiPercentage?: number;
  channel?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export type WhatsAppCampaign = MarketingCampaign;

export interface WhatsAppChatMessage {
  id: string;
  conversationId?: string;
  sender?: 'customer' | 'bot' | 'agent';
  direction?: 'inbound' | 'outbound';
  text?: string;
  body?: string;
  timestamp?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed' | string;
  type?: string;
  buttons?: WhatsAppInteractiveButton[];
  couponData?: any;
  invoice?: any;
  invoiceData?: any;
  attachments?: {
    type: 'invoice' | 'image' | 'location';
    url?: string;
    data?: any;
  }[];
  [key: string]: any;
}

export interface WhatsAppConversation {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isBotActive?: boolean;
  assignedAgent?: string;
  status?: 'open' | 'resolved' | 'pending' | string;
  segment?: RFMSegment | string;
  stage?: string;
  messages: WhatsAppChatMessage[];
  [key: string]: any;
}

export interface WhatsAppDigitalInvoiceData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  date?: string;
  orderDate?: string;
  orderType?: string;
  tableNumber?: string | number;
  cashierName?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal?: number;
  subtotalSar?: number;
  tax?: number;
  taxSar?: number;
  discount?: number;
  discountSar?: number;
  total?: number;
  grandTotal?: number;
  totalAmountSar?: number;
  paymentMethod?: string;
  zatcaQrBase64?: string;
  restaurantName?: string;
  branchName?: string;
  [key: string]: any;
}

export interface WhatsAppApiConfig {
  phoneNumberId?: string;
  businessAccountId?: string;
  accessToken?: string;
  webhookSecret?: string;
  webhookVerifyToken?: string;
  webhookUrl?: string;
  isSimulated?: boolean;
  dailyMessageLimit?: number;
  messagesSentToday?: number;
  senderDisplayName?: string;
  [key: string]: any;
}

export interface MarketingOverviewStats {
  totalCustomers?: number;
  activeSubscribers?: number;
  activeCampaigns?: number;
  totalMessagesSent?: number;
  totalCampaignsSent?: number;
  averageDeliveryRate?: number;
  averageReadRate?: number;
  averageConversionRate?: number;
  totalRevenueGenerated?: number;
  totalMarketingCost?: number;
  overallRoi?: number;
  atRiskCustomerCount?: number;
  vipCustomerCount?: number;
  [key: string]: any;
}

export interface CustomerTarget {
  id: string;
  name: string;
  phone: string;
  tier: CustomerTier | 'Black VIP' | 'Gold' | 'Silver' | 'Bronze';
  totalSpent: number;
  totalOrders: number;
  loyaltyPoints: number;
  favoriteDish: string;
  lastVisitDaysAgo: number;
  segment: CustomerSegmentType;
}

export interface WhatsAppTemplate {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'promo' | 'loyalty' | 're_engagement' | 'event' | 'vip_invite';
  contentAr: string;
  contentEn: string;
  variables: string[];
  samplePreviewAr: string;
}

export interface SegmentStats {
  segment: CustomerSegmentType;
  nameAr: string;
  nameEn: string;
  count: number;
  percentage: number;
  averageSpend: number;
  averageVisits: number;
  descriptionAr: string;
  descriptionEn: string;
}

export interface MarketingCampaignPerformance {
  campaignId: string;
  conversionRate: number;
  deliveryRate: number;
  readRate: number;
  costPerConversion: number;
  revenuePerMessage: number;
  roi: number;
}
