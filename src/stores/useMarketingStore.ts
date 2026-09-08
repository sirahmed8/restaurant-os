/**
 * =====================================================================
 * RESTAURANT OS — SMART MARKETING & WHATSAPP HUB STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import {
  CustomerRFMProfile,
  RFMSegment,
  MarketingCampaign,
  WhatsAppConversation,
  WhatsAppChatMessage,
  WhatsAppDigitalInvoiceData,
  WhatsAppApiConfig,
  MarketingOverviewStats,
  CampaignType,
} from '../types/marketing';
import {
  whatsappBotService,
  DEFAULT_MARKETING_CAMPAIGNS,
  DEFAULT_WHATSAPP_CONVERSATIONS,
} from '../services/whatsappBotService';
import { soundEngine } from '../services/soundEngine';

export type MarketingTab =
  | 'overview'
  | 'rfm_matrix'
  | 'campaigns'
  | 'whatsapp_chat'
  | 'invoices'
  | 'settings';

interface MarketingState {
  // State
  activeTab: MarketingTab;
  profiles: CustomerRFMProfile[];
  campaigns: MarketingCampaign[];
  conversations: WhatsAppConversation[];
  activeConversationId: string;
  selectedSegmentFilter: RFMSegment | 'all';
  searchQuery: string;

  // Broadcast execution status
  isDispatchingBroadcast: boolean;
  broadcastProgress: number;
  activeExecutingCampaignId: string | null;

  // Chat simulator state
  isBotTyping: boolean;

  // Modals
  isCampaignModalOpen: boolean;
  editingCampaign: Partial<MarketingCampaign> | null;
  isInvoiceModalOpen: boolean;
  activeInvoiceData: WhatsAppDigitalInvoiceData | null;

  // WhatsApp API & QR Configuration
  apiConfig: WhatsAppApiConfig;

  // Stats
  stats: MarketingOverviewStats;

  // Actions
  setActiveTab: (tab: MarketingTab) => void;
  setSelectedSegmentFilter: (seg: RFMSegment | 'all') => void;
  setSearchQuery: (q: string) => void;
  setActiveConversationId: (id: string) => void;

  // Conversation & Chatbot Actions
  sendMessage: (
    conversationId: string,
    text: string,
    sender?: 'agent' | 'bot' | 'customer',
    type?: WhatsAppChatMessage['type'],
    extra?: Partial<WhatsAppChatMessage>
  ) => void;
  simulateCustomerIncomingMessage: (
    conversationId: string,
    customerText: string,
    buttonPayload?: string
  ) => Promise<void>;
  toggleConversationBot: (conversationId: string) => void;

  // Campaign Actions
  openCreateCampaignModal: (presetType?: CampaignType, targetSegment?: RFMSegment) => void;
  closeCampaignModal: () => void;
  saveCampaign: (campaign: Partial<MarketingCampaign>) => void;
  deleteCampaign: (campaignId: string) => void;
  executeCampaign: (campaignId: string) => Promise<void>;

  // Digital Invoices Actions
  openInvoiceModal: (invoice: WhatsAppDigitalInvoiceData) => void;
  closeInvoiceModal: () => void;
  sendDigitalInvoice: (invoice: WhatsAppDigitalInvoiceData) => void;

  // Settings & QR
  updateApiConfig: (updates: Partial<WhatsAppApiConfig>) => void;
  refreshStats: () => void;
  resetDemoData: () => void;
}

const DEFAULT_API_CONFIG: WhatsAppApiConfig = {
  phoneNumberId: '109845728392019',
  businessAccountId: '394829104857281',
  accessToken: 'EAAG9...restaurantos_meta_valid_token_2026',
  webhookVerifyToken: 'rest_os_wh_verify_secret_2026',
  webhookUrl: 'https://api.restaurantos.sa/webhook/whatsapp',
  senderDisplayName: 'مطعم الرواق الفاخر (Verified ✅)',
  isConnected: true,
  connectionType: 'cloud_api',
  qrSessionCode: 'QR_ACTIVE_SESSION_REST_OS_NODE_44',
  autoReplyEnabled: true,
  businessHours: {
    start: '12:00',
    end: '02:00',
    enabled: true,
  },
  aiAgentTone: 'warm_saudi',
};

export const useMarketingStore = create<MarketingState>((set, get) => {
  const initialProfiles = whatsappBotService.calculateRFMSegments();
  const initialCampaigns = [...DEFAULT_MARKETING_CAMPAIGNS];
  const initialConversations = [...DEFAULT_WHATSAPP_CONVERSATIONS];
  const initialStats = whatsappBotService.getOverviewStats(initialProfiles, initialCampaigns);

  return {
    activeTab: 'overview',
    profiles: initialProfiles,
    campaigns: initialCampaigns,
    conversations: initialConversations,
    activeConversationId: initialConversations[0]?.id || 'conv-01',
    selectedSegmentFilter: 'all',
    searchQuery: '',

    isDispatchingBroadcast: false,
    broadcastProgress: 0,
    activeExecutingCampaignId: null,
    isBotTyping: false,

    isCampaignModalOpen: false,
    editingCampaign: null,
    isInvoiceModalOpen: false,
    activeInvoiceData: null,

    apiConfig: DEFAULT_API_CONFIG,
    stats: initialStats,

    setActiveTab: (tab) => {
      soundEngine.play('slide');
      set({ activeTab: tab });
    },

    setSelectedSegmentFilter: (seg) => {
      soundEngine.play('tap');
      set({ selectedSegmentFilter: seg });
    },

    setSearchQuery: (q) => set({ searchQuery: q }),

    setActiveConversationId: (id) => {
      soundEngine.play('pop');
      set((state) => {
        // Mark conversation as read
        const convs = state.conversations.map((c) =>
          c.id === id ? { ...c, unreadCount: 0 } : c
        );
        return { activeConversationId: id, conversations: convs };
      });
    },

    // -----------------------------------------------------------------------
    // Chat & Messaging
    // -----------------------------------------------------------------------
    sendMessage: (conversationId, text, sender = 'agent', type = 'text', extra = {}) => {
      const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      const newMsg: WhatsAppChatMessage = {
        id: msgId,
        conversationId,
        sender,
        direction: sender === 'customer' ? 'inbound' : 'outbound',
        type,
        text,
        timestamp: timeStr,
        status: 'delivered',
        ...extra,
      };

      set((state) => {
        const convs = state.conversations.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              lastMessage: text.slice(0, 50),
              lastMessageTime: timeStr,
              messages: [...c.messages, newMsg],
            };
          }
          return c;
        });
        return { conversations: convs };
      });

      soundEngine.play('success');

      // If customer sent message and bot is active, trigger bot simulation
      const currentConv = get().conversations.find((c) => c.id === conversationId);
      if (sender === 'customer' && currentConv?.isBotActive) {
        get().simulateCustomerIncomingMessage(conversationId, text);
      }
    },

    simulateCustomerIncomingMessage: async (conversationId, customerText, buttonPayload) => {
      const conv = get().conversations.find((c) => c.id === conversationId);
      if (!conv) return;

      const profile = get().profiles.find((p) => p.id === conv.customerId) || {
        id: conv.customerId,
        name: conv.customerName,
        phone: conv.customerPhone,
        tier: 'Gold',
        loyaltyPoints: 450,
        frequency: 8,
        monetary: 2200,
        segment: conv.segment,
      } as CustomerRFMProfile;

      // Show typing indicator
      set({ isBotTyping: true });

      await new Promise((resolve) => setTimeout(resolve, 900));

      const botReply = whatsappBotService.processCustomerBotMessage(
        customerText,
        profile,
        buttonPayload
      );

      set({ isBotTyping: false });

      get().sendMessage(conversationId, botReply.replyText, 'bot', botReply.type, {
        buttons: botReply.buttons,
        couponData: botReply.couponData,
      });
    },

    toggleConversationBot: (conversationId) => {
      soundEngine.play('tap');
      set((state) => {
        const convs = state.conversations.map((c) =>
          c.id === conversationId ? { ...c, isBotActive: !c.isBotActive } : c
        );
        return { conversations: convs };
      });
    },

    // -----------------------------------------------------------------------
    // Campaigns Studio
    // -----------------------------------------------------------------------
    openCreateCampaignModal: (presetType = 'win_back', targetSegment = 'at_risk') => {
      soundEngine.play('pop');
      const meta = whatsappBotService;
      set({
        isCampaignModalOpen: true,
        editingCampaign: {
          id: 'camp-' + Date.now(),
          titleAr: 'حملة تسويقية جديدة عبر واتساب',
          titleEn: 'New WhatsApp Marketing Campaign',
          type: presetType,
          targetSegment: targetSegment,
          status: 'draft',
          channel: 'whatsapp',
          messageTemplateAr:
            'مرحباً بك يا {{customer_name}} 🌟\nاستمتع بخصم فوري 20% على طلبك المفضل ({{favorite_dish}}) باستخدام الكود: *{{discount_code}}*',
          messageTemplateEn:
            'Hello {{customer_name}} 🌟\nEnjoy an instant 20% OFF on your favorite ({{favorite_dish}}) with code: *{{discount_code}}*',
          discountCouponCode: 'PROMO20',
          discountPercentage: 20,
          targetAudienceCount: 75,
          sentCount: 0,
          deliveredCount: 0,
          readCount: 0,
          repliedCount: 0,
          ordersGenerated: 0,
          revenueGeneratedSar: 0,
          costSar: 150,
          roiMultiplier: 0,
          autoTrigger: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    },

    closeCampaignModal: () => set({ isCampaignModalOpen: false, editingCampaign: null }),

    saveCampaign: (campaignData) => {
      soundEngine.play('success');
      set((state) => {
        const exists = state.campaigns.some((c) => c.id === campaignData.id);
        let updatedCampaigns: MarketingCampaign[];

        if (exists) {
          updatedCampaigns = state.campaigns.map((c) =>
            c.id === campaignData.id ? ({ ...c, ...campaignData, updatedAt: new Date().toISOString() } as MarketingCampaign) : c
          );
        } else {
          updatedCampaigns = [
            campaignData as MarketingCampaign,
            ...state.campaigns,
          ];
        }

        const newStats = whatsappBotService.getOverviewStats(state.profiles, updatedCampaigns);
        return {
          campaigns: updatedCampaigns,
          stats: newStats,
          isCampaignModalOpen: false,
          editingCampaign: null,
        };
      });
    },

    deleteCampaign: (campaignId) => {
      soundEngine.play('delete');
      set((state) => {
        const updated = state.campaigns.filter((c) => c.id !== campaignId);
        const newStats = whatsappBotService.getOverviewStats(state.profiles, updated);
        return { campaigns: updated, stats: newStats };
      });
    },

    executeCampaign: async (campaignId) => {
      const campaign = get().campaigns.find((c) => c.id === campaignId);
      if (!campaign) return;

      soundEngine.play('kitchen-bell');
      set({
        isDispatchingBroadcast: true,
        broadcastProgress: 0,
        activeExecutingCampaignId: campaignId,
      });

      const targets =
        campaign.targetSegment === 'all'
          ? get().profiles
          : get().profiles.filter((p) => p.segment === campaign.targetSegment);

      const result = await whatsappBotService.dispatchCampaignSimulation(
        campaign,
        targets,
        (prog) => set({ broadcastProgress: prog })
      );

      set((state) => {
        const updatedCampaigns = state.campaigns.map((c) => {
          if (c.id === campaignId) {
            return {
              ...c,
              status: 'completed' as const,
              sentCount: result.sent,
              deliveredCount: result.delivered,
              readCount: result.read,
              repliedCount: result.replied,
              ordersGenerated: result.orders,
              revenueGeneratedSar: result.revenue,
              roiMultiplier: result.roi,
              executedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });

        const newStats = whatsappBotService.getOverviewStats(state.profiles, updatedCampaigns);
        return {
          campaigns: updatedCampaigns,
          stats: newStats,
          isDispatchingBroadcast: false,
          broadcastProgress: 100,
          activeExecutingCampaignId: null,
        };
      });

      soundEngine.play('success');
    },

    // -----------------------------------------------------------------------
    // Digital Invoices
    // -----------------------------------------------------------------------
    openInvoiceModal: (invoice) => {
      soundEngine.play('pop');
      set({ isInvoiceModalOpen: true, activeInvoiceData: invoice });
    },

    closeInvoiceModal: () => set({ isInvoiceModalOpen: false, activeInvoiceData: null }),

    sendDigitalInvoice: (invoice) => {
      soundEngine.play('cash-register');
      const invoiceText = whatsappBotService.formatInvoiceForWhatsApp(invoice);

      // Check if conversation exists or create one
      let targetConv = get().conversations.find((c) => c.customerPhone === invoice.customerPhone);

      if (!targetConv) {
        const newConvId = 'conv-' + Date.now();
        const newConv: WhatsAppConversation = {
          id: newConvId,
          customerId: invoice.customerName || 'cust-direct',
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone,
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          segment: 'new_customers',
          lastMessage: `فاتورة رقم #${invoice.orderNumber}`,
          lastMessageTime: 'الآن',
          unreadCount: 0,
          isBotActive: true,
          stage: 'idle',
          messages: [],
        };
        set((state) => ({ conversations: [newConv, ...state.conversations] }));
        targetConv = newConv;
      }

      get().sendMessage(targetConv.id, invoiceText, 'bot', 'invoice_receipt', {
        invoiceData: invoice,
        buttons: [
          { id: 'b_inv1', titleAr: '⭐ قيّم تجربتك', titleEn: 'Rate Experience', payload: 'rate_experience', type: 'quick_reply' },
          { id: 'b_inv2', titleAr: '🔁 إعادة الطلب', titleEn: 'Reorder', payload: 'reorder_last', type: 'quick_reply' },
        ],
      });

      set({ isInvoiceModalOpen: false });
    },

    // -----------------------------------------------------------------------
    // Settings & Resets
    // -----------------------------------------------------------------------
    updateApiConfig: (updates) => {
      soundEngine.play('tap');
      set((state) => ({ apiConfig: { ...state.apiConfig, ...updates } }));
    },

    refreshStats: () => {
      const stats = whatsappBotService.getOverviewStats(get().profiles, get().campaigns);
      set({ stats });
    },

    resetDemoData: () => {
      soundEngine.play('kitchen-bell');
      const profiles = whatsappBotService.calculateRFMSegments();
      const campaigns = [...DEFAULT_MARKETING_CAMPAIGNS];
      const convs = [...DEFAULT_WHATSAPP_CONVERSATIONS];
      const stats = whatsappBotService.getOverviewStats(profiles, campaigns);

      set({
        profiles,
        campaigns,
        conversations: convs,
        activeConversationId: convs[0].id,
        stats,
        apiConfig: DEFAULT_API_CONFIG,
      });
    },
  };
});
