import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
  MessageSquare,
  Sparkles,
  Zap,
  Gift,
  Award,
  Users,
  Send,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  CheckCheck,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  QrCode,
  Smartphone,
  Flame,
  Star,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Bot,
  UserCheck,
  ArrowUpRight,
  Filter,
  Play,
  RotateCcw,
  Sliders,
  FileText,
  Smile,
  ChevronRight,
  ChevronLeft,
  X,
  AlertTriangle,
  Receipt,
  HeartHandshake,
  Tag,
  Radio,
  Eye,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useMarketingStore, MarketingTab } from '../../stores/useMarketingStore';
import { getTranslation } from '../../i18n/translations';
import {
  RFMSegment,
  CustomerRFMProfile,
  MarketingCampaign,
  CampaignType,
  WhatsAppConversation,
  WhatsAppDigitalInvoiceData,
} from '../../types/marketing';
import { RFM_SEGMENT_META, whatsappBotService } from '../../services/whatsappBotService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const MarketingModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);

  const {
    activeTab,
    setActiveTab,
    profiles,
    campaigns,
    conversations,
    activeConversationId,
    setActiveConversationId,
    selectedSegmentFilter,
    setSelectedSegmentFilter,
    searchQuery,
    setSearchQuery,
    isDispatchingBroadcast,
    broadcastProgress,
    activeExecutingCampaignId,
    isBotTyping,
    isCampaignModalOpen,
    editingCampaign,
    openCreateCampaignModal,
    closeCampaignModal,
    saveCampaign,
    deleteCampaign,
    executeCampaign,
    isInvoiceModalOpen,
    activeInvoiceData,
    openInvoiceModal,
    closeInvoiceModal,
    sendDigitalInvoice,
    sendMessage,
    simulateCustomerIncomingMessage,
    toggleConversationBot,
    apiConfig,
    updateApiConfig,
    stats,
    resetDemoData,
  } = useMarketingStore();

  // Local state
  const [chatInputText, setChatInputText] = useState('');
  const [simulatorMode, setSimulatorMode] = useState<'customer' | 'agent'>('customer');
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);

  // Active conversation object
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];
  const activeProfile =
    profiles.find((p) => p.id === activeConversation?.customerId) || profiles[0];

  // Filtered customer profiles
  const filteredProfiles = profiles.filter((p) => {
    const matchesSegment =
      selectedSegmentFilter === 'all' || p.segment === selectedSegmentFilter;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.favoriteDishAr || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSegment && matchesSearch;
  });

  // Handle Chat Submit
  const handleSendChatMessage = () => {
    if (!chatInputText.trim() || !activeConversation) return;

    if (simulatorMode === 'customer') {
      sendMessage(activeConversation.id, chatInputText, 'customer', 'text');
    } else {
      sendMessage(activeConversation.id, chatInputText, 'agent', 'text');
    }
    setChatInputText('');
  };

  const handleQuickBotAction = (payload: string, labelAr: string) => {
    if (!activeConversation) return;
    playSound('tap');
    sendMessage(activeConversation.id, labelAr, 'customer', 'text');
    simulateCustomerIncomingMessage(activeConversation.id, labelAr, payload);
  };

  const handleCopyInvoiceText = (invoice: WhatsAppDigitalInvoiceData) => {
    const text = whatsappBotService.formatInvoiceForWhatsApp(invoice);
    navigator.clipboard.writeText(text);
    playSound('success');
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2500);
  };

  // -------------------------------------------------------------------------
  // RENDER TABS
  // -------------------------------------------------------------------------
  return (
    <div className="h-full flex flex-col overflow-hidden select-none bg-[#0a0c10]/95 text-slate-100">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-white/5 bg-slate-900/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-green-300 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">
                {language === 'ar' ? 'التسويق الذكي وروبوت الواتساب' : 'Smart Marketing & WhatsApp Bot'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {language === 'ar' ? 'Meta Cloud API متصل' : 'Meta API Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'تحليل شرائح العملاء RFM، حملات العروض التلقائية، الفواتير الرقمية ومحاكي المحادثات'
                : 'RFM segmentation engine, automated WhatsApp campaigns, digital invoices & live bot'}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Reset Demo Button */}
          <button
            onClick={() => {
              playSound('tap');
              resetDemoData();
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            title={language === 'ar' ? 'إعادة ضبط البيانات' : 'Reset Demo Data'}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{language === 'ar' ? 'بيانات تجريبية' : 'Demo Data'}</span>
          </button>

          {/* New Campaign Button */}
          <button
            onClick={() => openCreateCampaignModal()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>{language === 'ar' ? 'إنشاء حملة تسويقية' : 'New Campaign'}</span>
          </button>
        </div>
      </div>

      {/* Broadcast Progress Banner if active */}
      {isDispatchingBroadcast && (
        <div className="bg-gradient-to-r from-emerald-600/30 via-teal-600/20 to-emerald-600/30 border-b border-emerald-500/40 px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-xs font-bold text-emerald-200">
              {language === 'ar'
                ? `جاري إرسال الحملة التسويقية عبر WhatsApp Cloud API... (${broadcastProgress}%)`
                : `Dispatching WhatsApp Campaign Broadcast... (${broadcastProgress}%)`}
            </span>
          </div>
          <div className="w-48 bg-slate-900 rounded-full h-2 overflow-hidden border border-emerald-500/30">
            <div
              className="bg-emerald-400 h-full transition-all duration-150"
              style={{ width: `${broadcastProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 border-b border-white/5 overflow-x-auto custom-scrollbar bg-slate-950/40">
        {[
          {
            id: 'overview' as MarketingTab,
            labelAr: '📊 نظرة عامة ورادار العائد',
            labelEn: '📊 Overview & ROI',
          },
          {
            id: 'rfm_matrix' as MarketingTab,
            labelAr: '👥 مصفوفة شرائح RFM',
            labelEn: '👥 RFM Segments',
            badge: profiles.length.toString(),
          },
          {
            id: 'campaigns' as MarketingTab,
            labelAr: '🚀 منشئ وإدارة الحملات',
            labelEn: '🚀 Campaigns Studio',
            badge: campaigns.length.toString(),
          },
          {
            id: 'whatsapp_chat' as MarketingTab,
            labelAr: '💬 محاكي محادثات واتساب والروبوت',
            labelEn: '💬 Live WhatsApp Bot',
            badge: 'Live',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          },
          {
            id: 'invoices' as MarketingTab,
            labelAr: '🧾 الفواتير الرقمية السريعة',
            labelEn: '🧾 Digital Invoices',
          },
          {
            id: 'settings' as MarketingTab,
            labelAr: '⚙️ الربط وإعدادات الواتساب',
            labelEn: '⚙️ API & Settings',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span>{language === 'ar' ? tab.labelAr : tab.labelEn}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
                    tab.badgeColor || 'bg-white/10 text-slate-300 border-white/10'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab
              key="overview"
              stats={stats}
              campaigns={campaigns}
              profiles={profiles}
              language={language}
              onLaunchPreset={(type, segment) => openCreateCampaignModal(type, segment)}
              onExecuteCampaign={(id) => executeCampaign(id)}
              onOpenTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'rfm_matrix' && (
            <RFMMatrixTab
              key="rfm_matrix"
              profiles={filteredProfiles}
              allProfiles={profiles}
              selectedFilter={selectedSegmentFilter}
              onSelectFilter={(f) => setSelectedSegmentFilter(f)}
              searchQuery={searchQuery}
              onSearchChange={(q) => setSearchQuery(q)}
              language={language}
              onOpenChat={(customerId) => {
                const conv = conversations.find((c) => c.customerId === customerId);
                if (conv) setActiveConversationId(conv.id);
                setActiveTab('whatsapp_chat');
              }}
              onLaunchSegmentCampaign={(segment) => {
                const meta = RFM_SEGMENT_META[segment];
                openCreateCampaignModal(meta.recommendedCampaign, segment);
              }}
            />
          )}

          {activeTab === 'campaigns' && (
            <CampaignsTab
              key="campaigns"
              campaigns={campaigns}
              language={language}
              onNewCampaign={() => openCreateCampaignModal()}
              onExecuteCampaign={(id) => executeCampaign(id)}
              onDeleteCampaign={(id) => deleteCampaign(id)}
              isExecuting={isDispatchingBroadcast}
              activeExecutingId={activeExecutingCampaignId}
            />
          )}

          {activeTab === 'whatsapp_chat' && (
            <WhatsAppChatTab
              key="whatsapp_chat"
              conversations={conversations}
              activeConversation={activeConversation}
              activeProfile={activeProfile}
              onSelectConversation={(id) => setActiveConversationId(id)}
              chatInputText={chatInputText}
              setChatInputText={setChatInputText}
              onSendMessage={handleSendChatMessage}
              onQuickBotAction={handleQuickBotAction}
              simulatorMode={simulatorMode}
              setSimulatorMode={setSimulatorMode}
              isBotTyping={isBotTyping}
              onToggleBot={(id) => toggleConversationBot(id)}
              language={language}
            />
          )}

          {activeTab === 'invoices' && (
            <DigitalInvoicesTab
              key="invoices"
              profiles={profiles}
              language={language}
              onSendInvoice={(inv) => {
                sendDigitalInvoice(inv);
                setActiveTab('whatsapp_chat');
              }}
              onPreviewInvoice={(inv) => openInvoiceModal(inv)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              key="settings"
              config={apiConfig}
              onUpdateConfig={(updates) => updateApiConfig(updates)}
              language={language}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Campaign Builder Modal */}
      {isCampaignModalOpen && editingCampaign && (
        <CampaignBuilderModal
          campaign={editingCampaign}
          profiles={profiles}
          onClose={closeCampaignModal}
          onSave={saveCampaign}
          language={language}
        />
      )}

      {/* Invoice Details Modal */}
      {isInvoiceModalOpen && activeInvoiceData && (
        <InvoiceDetailsModal
          invoice={activeInvoiceData}
          onClose={closeInvoiceModal}
          onSend={(inv) => {
            sendDigitalInvoice(inv);
            setActiveTab('whatsapp_chat');
          }}
          language={language}
          copied={copiedInvoice}
          onCopy={() => handleCopyInvoiceText(activeInvoiceData)}
        />
      )}
    </div>
  );
};

// ===========================================================================
// SUB-TAB 1: OVERVIEW & ROI RADAR
// ===========================================================================

interface OverviewTabProps {
  stats: any;
  campaigns: MarketingCampaign[];
  profiles: CustomerRFMProfile[];
  language: string;
  onLaunchPreset: (type: CampaignType, segment: RFMSegment) => void;
  onExecuteCampaign: (id: string) => void;
  onOpenTab: (tab: MarketingTab) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  stats,
  campaigns,
  profiles,
  language,
  onLaunchPreset,
  onExecuteCampaign,
  onOpenTab,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* 4 Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: WhatsApp Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-slate-900/60 border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">
              {language === 'ar' ? 'إجمالي مبيعات الواتساب' : 'WhatsApp Attributed Sales'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">
              {stats.totalRevenueAttributedSar.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-400">ر.س</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+38.4% {language === 'ar' ? 'نمو مقارنة بالشهر السابق' : 'growth this month'}</span>
          </div>
        </div>

        {/* Card 2: ROI Multiplier */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-slate-900/60 border border-amber-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">
              {language === 'ar' ? 'العائد على الإنفاق (ROI)' : 'Marketing ROI Multiplier'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.overallRoi}x</span>
            <span className="text-xs font-bold text-amber-400">
              ({language === 'ar' ? 'أضعاف التكلفة' : 'Multiplier'})
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {language === 'ar'
                ? `تكلفة الرسائل: ${stats.totalMarketingCostSar} ر.س فقط`
                : `Total Cost: SAR ${stats.totalMarketingCostSar}`}
            </span>
          </div>
        </div>

        {/* Card 3: Open & Read Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 via-cyan-500/5 to-slate-900/60 border border-cyan-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400">
              {language === 'ar' ? 'نسبة القراءة والتفاعل' : 'Read & Conversion Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{stats.averageOpenRate}%</span>
            <span className="text-xs text-slate-400">/ {stats.conversionRate}% تحويل</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-cyan-300 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'أعلى 5 أضعاف من البريد الإلكتروني' : '5x higher than email'}</span>
          </div>
        </div>

        {/* Card 4: Active WhatsApp Subscribers */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-slate-900/60 border border-purple-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400">
              {language === 'ar' ? 'المشتركون المتاحون' : 'Active WhatsApp Audience'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{profiles.length}</span>
            <span className="text-xs font-bold text-purple-400">
              {language === 'ar' ? 'عميل مصنف' : 'RFM profiles'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-purple-300 font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>100% {language === 'ar' ? 'موافقون على استلام العروض' : 'Opted-in for WhatsApp'}</span>
          </div>
        </div>
      </div>

      {/* 1-Click Fast Campaign Launch Triggers */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{language === 'ar' ? 'إطلاق فوري بنقرة واحدة (1-Click Automated Triggers)' : '1-Click Instant Marketing Triggers'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {language === 'ar'
                ? 'حملات موجهة مسبقاً لأعلى الشرائح ربحية واستجابة فورية عبر واتساب'
                : 'Pre-configured high-converting campaigns targeting key customer segments'}
            </p>
          </div>
          <button
            onClick={() => onOpenTab('rfm_matrix')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'ar' ? 'استعراض مصفوفة RFM' : 'View RFM Matrix'}</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Preset 1: Win Back */}
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>{language === 'ar' ? 'استعادة المنقطعين' : 'Win-Back Churn'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold">
                  {profiles.filter((p) => p.segment === 'at_risk' || p.segment === 'dormant').length} {language === 'ar' ? 'عميل' : 'guests'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {language === 'ar'
                  ? 'إرسال كوبون ترحيبي 30 ريال للزبائن المنقطعين > 30 يوماً مع طبقهم المفضل'
                  : 'Send SAR 30 win-back coupon to guests inactive for >30 days'}
              </p>
            </div>
            <button
              onClick={() => onLaunchPreset('win_back', 'at_risk')}
              className="mt-4 w-full py-2 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-bold border border-orange-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إطلاق الحملة الآن' : 'Launch Win-Back'}</span>
            </button>
          </div>

          {/* Preset 2: Birthday */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 hover:border-rose-500/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  <span>{language === 'ar' ? 'مفاجأة أعياد الميلاد' : 'Birthday Celebration'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                  {profiles.filter((p) => p.birthday).length} {language === 'ar' ? 'هذا الشهر' : 'this month'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {language === 'ar'
                  ? 'تهنئة شخصية فاخرة مع كيكة تشيز كيك مجاناً أو خصم 25% للاحتفال'
                  : 'Automated birthday greetings with free cheesecake or 25% off'}
              </p>
            </div>
            <button
              onClick={() => onLaunchPreset('birthday', 'all')}
              className="mt-4 w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إطلاق حملة الميلاد' : 'Launch Birthday'}</span>
            </button>
          </div>

          {/* Preset 3: VIP Rewards */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>{language === 'ar' ? 'مكافآت VIP النخبة' : 'VIP Double Points'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                  {profiles.filter((p) => p.segment === 'champions' || p.segment === 'vip_high_spenders').length} {language === 'ar' ? 'VIP' : 'VIPs'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {language === 'ar'
                  ? 'دعوة خاصة لصالة النخبة وتذوق أطباق الشيف مع مضاعفة نقاط الولاء 2X'
                  : 'Exclusive tasting lounge invite with 2X loyalty points'}
              </p>
            </div>
            <button
              onClick={() => onLaunchPreset('vip_reward', 'champions')}
              className="mt-4 w-full py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إطلاق مكافآت VIP' : 'Launch VIP Blast'}</span>
            </button>
          </div>

          {/* Preset 4: Google Review Collector */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <Star className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تقييمات Google Maps' : '5-Star Reviews'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {language === 'ar' ? 'بعد الوجبة' : 'Post Dining'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                {language === 'ar'
                  ? 'طلب تقييم سريع 5 نجوم بعد الوجبة مع هدية موهيتو مجاني في الزيارة القادمة'
                  : 'Automated 5-star Google review request with free mocktail'}
              </p>
            </div>
            <button
              onClick={() => onLaunchPreset('feedback_review', 'all')}
              className="mt-4 w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إطلاق الاستبيان' : 'Launch Survey'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Performance Radar Table */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'أداء الحملات التسويقية المباشرة' : 'Live Campaign Performance Radar'}</span>
          </h3>
          <button
            onClick={() => onOpenTab('campaigns')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{language === 'ar' ? 'إدارة جميع الحملات' : 'Manage All'}</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 text-start font-bold">{language === 'ar' ? 'الحملة' : 'Campaign'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'المرسل' : 'Sent'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'نسبة القراءة' : 'Read Rate'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'الطلبات' : 'Orders'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'الإيراد المحقق' : 'Revenue'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'العائد (ROI)' : 'ROI'}</th>
                <th className="pb-3 text-end font-bold">{language === 'ar' ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {campaigns.map((camp: any) => {
                const readRate =
                  (camp.deliveredCount ?? 0) > 0
                    ? Math.round(((camp.readCount ?? 0) / (camp.deliveredCount || 1)) * 100)
                    : 0;

                return (
                  <tr key={camp.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 text-start">
                      <div className="font-bold text-white">
                        {language === 'ar' ? camp.titleAr : camp.titleEn}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {(camp.channel || 'WHATSAPP').toUpperCase()} • {camp.targetSegment}
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          camp.status === 'running'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : camp.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {camp.status === 'running'
                          ? language === 'ar' ? 'جارية' : 'Running'
                          : camp.status === 'completed'
                          ? language === 'ar' ? 'مكتملة' : 'Completed'
                          : language === 'ar' ? 'مجدولة' : 'Scheduled'}
                      </span>
                    </td>
                    <td className="py-3.5 text-center font-bold text-slate-200">
                      {camp.sentCount ?? 0}
                    </td>
                    <td className="py-3.5 text-center font-bold text-emerald-400">
                      {readRate}%
                    </td>
                    <td className="py-3.5 text-center font-bold text-cyan-300">
                      {camp.ordersGenerated ?? camp.convertedOrdersCount ?? 0}
                    </td>
                    <td className="py-3.5 text-center font-black text-amber-300">
                      {(camp.revenueGeneratedSar ?? camp.revenueGenerated ?? 0).toLocaleString()} ر.س
                    </td>
                    <td className="py-3.5 text-center font-black text-emerald-400">
                      {camp.roiMultiplier ?? camp.roiPercentage ?? 0}x
                    </td>
                    <td className="py-3.5 text-end">
                      {camp.status !== 'completed' ? (
                        <button
                          onClick={() => onExecuteCampaign(camp.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-all cursor-pointer"
                        >
                          {language === 'ar' ? 'إرسال الآن' : 'Run Now'}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {language === 'ar' ? 'تم التنفيذ' : 'Dispatched'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================================================
// SUB-TAB 2: RFM CUSTOMER SEGMENTATION MATRIX
// ===========================================================================

interface RFMMatrixTabProps {
  profiles: CustomerRFMProfile[];
  allProfiles: CustomerRFMProfile[];
  selectedFilter: RFMSegment | 'all';
  onSelectFilter: (f: RFMSegment | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  language: string;
  onOpenChat: (customerId: string) => void;
  onLaunchSegmentCampaign: (segment: RFMSegment) => void;
}

const RFMMatrixTab: React.FC<RFMMatrixTabProps> = ({
  profiles,
  allProfiles,
  selectedFilter,
  onSelectFilter,
  searchQuery,
  onSearchChange,
  language,
  onOpenChat,
  onLaunchSegmentCampaign,
}) => {
  const segmentsList: RFMSegment[] = [
    'champions',
    'vip_high_spenders',
    'loyal',
    'promising',
    'new_customers',
    'at_risk',
    'dormant',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* 7 Segment Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {segmentsList.map((seg) => {
          const meta = RFM_SEGMENT_META[seg];
          const segProfiles = allProfiles.filter((p) => p.segment === seg);
          const count = segProfiles.length;
          const totalSpend = segProfiles.reduce((s, p: any) => s + (p.monetary ?? p.totalSpent ?? 0), 0);
          const avgSpend = count > 0 ? Math.round(totalSpend / count) : 0;
          const isSelected = selectedFilter === seg;

          return (
            <div
              key={seg}
              onClick={() => onSelectFilter(isSelected ? 'all' : seg)}
              className={`p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between border ${
                isSelected
                  ? 'bg-slate-900 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-white/5 hover:border-white/15'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${meta.badgeBg}`}
                  >
                    {language === 'ar' ? meta.nameAr : meta.nameEn}
                  </span>
                  <span className="text-sm font-black text-white">{count}</span>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                  {language === 'ar' ? meta.descriptionAr : meta.descriptionEn}
                </p>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {language === 'ar' ? 'متوسط الإنفاق:' : 'Avg Spend:'}
                  </span>
                  <span className="font-black text-amber-300">{avgSpend.toLocaleString()} ر.س</span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLaunchSegmentCampaign(seg);
                }}
                className="mt-3 w-full py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-[11px] font-bold border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Megaphone className="w-3 h-3 text-emerald-400" />
                <span>{language === 'ar' ? 'إطلاق حملة للشريحة' : 'Target Segment'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute start-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'بحث باسم العميل، رقم الهاتف، أو الطبق المفضل...'
                : 'Search by guest name, phone, or favorite dish...'
            }
            className="w-full ps-10 pe-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => onSelectFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {language === 'ar' ? 'الكل' : 'All'} ({allProfiles.length})
          </button>
          {segmentsList.map((seg) => {
            const isSelected = selectedFilter === seg;
            const meta = RFM_SEGMENT_META[seg];
            return (
              <button
                key={seg}
                onClick={() => onSelectFilter(seg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {language === 'ar' ? meta.nameAr : meta.nameEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Customer RFM Table */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'سجل درجات العملاء RFM والتصنيف' : 'Customer RFM Scores & Profiles'}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {profiles.length} {language === 'ar' ? 'عميل مطابق للبحث' : 'matching guests'}
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-3 text-start font-bold">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'الشريحة' : 'RFM Segment'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'كود RFM' : 'RFM Code'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'الإنفاق (M)' : 'Monetary'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'التكرار (F)' : 'Frequency'}</th>
                <th className="pb-3 text-center font-bold">{language === 'ar' ? 'آخر زيارة (R)' : 'Recency'}</th>
                <th className="pb-3 text-start font-bold">{language === 'ar' ? 'الطبق المفضل' : 'Favorite Dish'}</th>
                <th className="pb-3 text-end font-bold">{language === 'ar' ? 'واتساب' : 'WhatsApp'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {profiles.map((p) => {
                const meta = RFM_SEGMENT_META[p.segment];
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-start">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <div className="font-bold text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${p.segmentBadgeBg}`}>
                        {language === 'ar' ? p.segmentNameAr : p.segmentNameEn}
                      </span>
                    </td>

                    <td className="py-3 text-center">
                      <div className="inline-flex items-center gap-1 font-mono font-bold">
                        <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">
                          {p.rScore}
                        </span>
                        <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">
                          {p.fScore}
                        </span>
                        <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">
                          {p.mScore}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 text-center font-black text-amber-300">
                      {(p.monetary ?? p.totalSpent ?? 0).toLocaleString()} ر.س
                    </td>

                    <td className="py-3 text-center font-bold text-cyan-300">
                      {p.frequency ?? p.orderCount ?? 0} {language === 'ar' ? 'طلبات' : 'orders'}
                    </td>

                    <td className="py-3 text-center font-bold text-slate-300">
                      {(p.recencyDays ?? p.daysSinceLastOrder) === 1
                        ? language === 'ar' ? 'أمس' : 'Yesterday'
                        : language === 'ar' ? `قبل ${p.recencyDays ?? p.daysSinceLastOrder ?? 0} يوم` : `${p.recencyDays ?? p.daysSinceLastOrder ?? 0}d ago`}
                    </td>

                    <td className="py-3 text-start">
                      <div className="font-bold text-slate-200 truncate max-w-[160px]">
                        {p.favoriteDishAr || p.favoriteItems?.[0] || 'طبق فاخر'}
                      </div>
                      <div className="text-[10px] text-purple-400 font-semibold">
                        {p.loyaltyPoints ?? 0} {language === 'ar' ? 'نقطة ولاء' : 'points'}
                      </div>
                    </td>

                    <td className="py-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenChat(p.id || p.customerId || '')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{language === 'ar' ? 'شات' : 'Chat'}</span>
                        </button>
                        <a
                          href={whatsappBotService.generateWhatsAppDeepLink(
                            p.phone,
                            `مرحباً بك يا ${p.name} في مطعم الرواق الفاخر! 🌟`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all"
                          title="Open in WhatsApp Web"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================================================
// SUB-TAB 3: CAMPAIGNS STUDIO & AUTOMATION
// ===========================================================================

interface CampaignsTabProps {
  campaigns: MarketingCampaign[];
  language: string;
  onNewCampaign: () => void;
  onExecuteCampaign: (id: string) => void;
  onDeleteCampaign: (id: string) => void;
  isExecuting: boolean;
  activeExecutingId: string | null;
}

const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  language,
  onNewCampaign,
  onExecuteCampaign,
  onDeleteCampaign,
  isExecuting,
  activeExecutingId,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'منشئ واستوديو الحملات التسويقية' : 'Marketing Campaigns Studio'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'إنشاء وجدولة وإطلاق حملات واتساب المخصصة مع تتبع العائد المالي الفوري'
              : 'Create, schedule, and automate targeted WhatsApp broadcasts with ROI tracking'}
          </p>
        </div>

        <button
          onClick={onNewCampaign}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>{language === 'ar' ? 'حملة جديدة' : 'Create Campaign'}</span>
        </button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((camp) => {
          const isThisExecuting = isExecuting && activeExecutingId === camp.id;
          const readRate =
            (camp.deliveredCount ?? 0) > 0
              ? Math.round(((camp.readCount ?? 0) / (camp.deliveredCount || 1)) * 100)
              : 0;
          const replyRate =
            (camp.readCount ?? 0) > 0 ? Math.round(((camp.repliedCount ?? 0) / (camp.readCount || 1)) * 100) : 0;

          return (
            <div
              key={camp.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        camp.status === 'running'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : camp.status === 'completed'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {camp.status === 'running'
                        ? language === 'ar' ? 'نشطة الآن' : 'Running'
                        : camp.status === 'completed'
                        ? language === 'ar' ? 'مكتملة' : 'Completed'
                        : language === 'ar' ? 'مجدولة' : 'Scheduled'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                      {(camp.targetSegment || camp.segment || 'ALL').toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-white mt-2">
                    {language === 'ar' ? camp.titleAr : camp.titleEn}
                  </h3>
                </div>

                <button
                  onClick={() => onDeleteCampaign(camp.id)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                  title="Delete Campaign"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Message snippet */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 text-xs text-slate-300 font-mono leading-relaxed line-clamp-3">
                {language === 'ar' ? camp.messageTemplateAr : camp.messageTemplateEn}
              </div>

              {/* Stats 4-box */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5 text-center">
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'المرسل' : 'Sent'}</span>
                  <span className="text-xs font-black text-white">{camp.sentCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'نسبة القراءة' : 'Read %'}</span>
                  <span className="text-xs font-black text-emerald-400">{readRate}%</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الطلبات' : 'Orders'}</span>
                  <span className="text-xs font-black text-cyan-300">{camp.ordersGenerated}</span>
                </div>
                <div className="p-2 rounded-xl bg-white/5">
                  <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الإيراد' : 'Revenue'}</span>
                  <span className="text-xs font-black text-amber-300">{camp.revenueGeneratedSar} ر.س</span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>ROI: {camp.roiMultiplier}x</span>
                </div>

                <button
                  disabled={isThisExecuting}
                  onClick={() => onExecuteCampaign(camp.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    isThisExecuting
                      ? 'bg-emerald-500/30 text-emerald-300'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                  }`}
                >
                  {isThisExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{language === 'ar' ? 'إطلاق الحملة الآن' : 'Launch Broadcast'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ===========================================================================
// SUB-TAB 4: INTERACTIVE LIVE WHATSAPP CHAT SIMULATOR & BOT HUB
// ===========================================================================

interface WhatsAppChatTabProps {
  conversations: WhatsAppConversation[];
  activeConversation?: WhatsAppConversation;
  activeProfile?: CustomerRFMProfile;
  onSelectConversation: (id: string) => void;
  chatInputText: string;
  setChatInputText: (t: string) => void;
  onSendMessage: () => void;
  onQuickBotAction: (payload: string, labelAr: string) => void;
  simulatorMode: 'customer' | 'agent';
  setSimulatorMode: (m: 'customer' | 'agent') => void;
  isBotTyping: boolean;
  onToggleBot: (id: string) => void;
  language: string;
}

const WhatsAppChatTab: React.FC<WhatsAppChatTabProps> = ({
  conversations,
  activeConversation,
  activeProfile,
  onSelectConversation,
  chatInputText,
  setChatInputText,
  onSendMessage,
  onQuickBotAction,
  simulatorMode,
  setSimulatorMode,
  isBotTyping,
  onToggleBot,
  language,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full flex flex-col md:flex-row gap-4 overflow-hidden"
    >
      {/* Left Chat List */}
      <div className="w-full md:w-80 flex flex-col rounded-3xl bg-slate-900/90 border border-white/10 overflow-hidden shrink-0">
        <div className="p-3.5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'محادثات واتساب الحية' : 'WhatsApp Chats'}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
              {conversations.length} {language === 'ar' ? 'نشطة' : 'Active'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
          {conversations.map((conv) => {
            const isActive = activeConversation?.id === conv.id;
            const meta = conv.segment ? (RFM_SEGMENT_META as any)[conv.segment] : null;

            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full p-3.5 text-start flex items-start gap-3 transition-colors cursor-pointer ${
                  isActive ? 'bg-emerald-500/10 border-s-4 border-emerald-400' : 'hover:bg-white/5'
                }`}
              >
                <div className="relative">
                  <img
                    src={conv.avatar}
                    alt={conv.customerName}
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                  />
                  {(conv.unreadCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate">{conv.customerName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{conv.lastMessageTime}</span>
                  </div>
                  <span
                    className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded-full font-bold border ${meta?.badgeBg || 'bg-white/10 text-slate-300'}`}
                  >
                    {meta?.nameAr || conv.segment}
                  </span>
                  <p className="text-[11px] text-slate-400 truncate mt-1">{conv.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Chat Screen Window (WhatsApp Simulator) */}
      <div className="flex-1 flex flex-col rounded-3xl bg-[#0b141a] border border-white/10 overflow-hidden relative shadow-2xl">
        {/* Chat Header */}
        <div className="p-3.5 bg-[#202c33] border-b border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={activeConversation?.avatar}
              alt={activeConversation?.customerName}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">{activeConversation?.customerName}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>{activeConversation?.customerPhone}</span>
                <span>•</span>
                <span className="text-amber-400">{activeProfile?.tier || 'Gold VIP'}</span>
                <span>•</span>
                <span className="text-emerald-400">{activeProfile?.loyaltyPoints || 0} pts</span>
              </div>
            </div>
          </div>

          {/* Bot Toggle Switch */}
          {activeConversation && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleBot(activeConversation.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  activeConversation.isBotActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                <Bot className={`w-3.5 h-3.5 ${activeConversation.isBotActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{activeConversation.isBotActive ? (language === 'ar' ? 'الروبوت نشط' : 'Bot Active') : (language === 'ar' ? 'الروبوت متوقف' : 'Bot Off')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Action Simulator Bot Triggers */}
        <div className="px-3 py-2 bg-[#111b21] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold shrink-0">
            {language === 'ar' ? 'أوامر الروبوت السريعة:' : 'Bot Flows:'}
          </span>
          {[
            { id: 'flow_menu', labelAr: '📖 استعراض المنيو', labelEn: 'Menu' },
            { id: 'flow_reserve', labelAr: '🍽️ حجز طاولة', labelEn: 'Book Table' },
            { id: 'track_order', labelAr: '🛵 تتبع الطلب', labelEn: 'Track Order' },
            { id: 'loyalty_pts', labelAr: '💳 رصيد النقاط', labelEn: 'Loyalty Points' },
            { id: 'view_deals', labelAr: '🎁 كود خصم 25%', labelEn: 'Discount 25%' },
            { id: 'rate_experience', labelAr: '⭐ تقييم 5 نجوم', labelEn: '5-Star Rate' },
          ].map((flow) => (
            <button
              key={flow.id}
              onClick={() => onQuickBotAction(flow.id, flow.labelAr)}
              className="px-2.5 py-1 rounded-lg bg-[#202c33] hover:bg-[#005c4b] text-slate-200 text-[10px] font-bold border border-white/10 transition-all shrink-0 cursor-pointer"
            >
              {language === 'ar' ? flow.labelAr : flow.labelEn}
            </button>
          ))}
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[#0b141a]">
          {activeConversation?.messages.map((msg: any) => {
            const isMe = msg.direction === 'outbound';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl relative shadow-md text-xs whitespace-pre-wrap leading-relaxed ${
                    isMe
                      ? 'bg-[#005c4b] text-white rounded-te-xs'
                      : 'bg-[#202c33] text-slate-100 rounded-ts-xs'
                  }`}
                >
                  {/* Sender indicator */}
                  {isMe && (
                    <div className="text-[9px] text-emerald-300 font-bold mb-1 flex items-center gap-1">
                      {msg.sender === 'bot' ? (
                        <>
                          <Bot className="w-3 h-3 text-emerald-400" />
                          <span>{language === 'ar' ? 'رد تلقائي بالذكاء الاصطناعي (Bot)' : 'AI Smart Bot'}</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3 text-amber-400" />
                          <span>{language === 'ar' ? 'الكاشير / المدير' : 'Agent Manual Reply'}</span>
                        </>
                      )}
                    </div>
                  )}

                  <p>{msg.body || msg.text}</p>

                  {/* Digital invoice preview card if attached */}
                  {msg.invoice && (
                    <div className="mt-2 p-2.5 rounded-xl bg-black/30 border border-emerald-500/30 text-start space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-emerald-300 font-bold">
                        <span>🧾 فاتورة رقم #{msg.invoice.orderNumber}</span>
                        <span className="font-mono-numbers">{msg.invoice.totalAmountSar} ر.س</span>
                      </div>
                      <div className="text-[9px] text-slate-300">
                        {msg.invoice.items?.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between">
                            <span>{it.quantity}x {it.name}</span>
                            <span>{it.total} ر.س</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Action Buttons if present */}
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-white/10 space-y-1.5">
                      {msg.buttons.map((btn: any) => (
                        <button
                          key={btn.id}
                          onClick={() => {
                            if (btn.url) window.open(btn.url, '_blank');
                            else onQuickBotAction(btn.payload, btn.titleAr);
                          }}
                          className="w-full py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>{language === 'ar' ? btn.titleAr : btn.titleEn}</span>
                          {btn.url && <ExternalLink className="w-3 h-3" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp & Delivery Ticks */}
                  <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                    <span>{msg.timestamp}</span>
                    {isMe && (
                      <CheckCheck
                        className={`w-3 h-3 ${msg.status === 'read' ? 'text-cyan-400' : 'text-slate-400'}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isBotTyping && (
            <div className="flex items-start">
              <div className="p-3 rounded-2xl bg-[#202c33] text-emerald-400 text-xs flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 animate-bounce" />
                <span>{language === 'ar' ? 'الروبوت يكتب الرد الآن...' : 'Bot is typing...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Simulator Mode Selector & Chat Input Bar */}
        <div className="p-3 bg-[#202c33] border-t border-white/5 space-y-2">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">{language === 'ar' ? 'وضع المحاكاة:' : 'Simulate as:'}</span>
              <button
                onClick={() => setSimulatorMode('customer')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  simulatorMode === 'customer'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {language === 'ar' ? 'العميل' : 'Customer'}
              </button>
              <button
                onClick={() => setSimulatorMode('agent')}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  simulatorMode === 'agent'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {language === 'ar' ? 'الكاشير / الموظف' : 'Cashier / Agent'}
              </button>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">
              {simulatorMode === 'customer' ? 'Incoming Test' : 'Direct Reply'}
            </span>
          </div>

          {/* Input Box */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSendMessage();
              }}
              placeholder={
                simulatorMode === 'customer'
                  ? language === 'ar'
                    ? 'اكتب رسالة كعميل (مثال: أبي أحجز طاولة لشخصين، أو وين طلبي؟)...'
                    : 'Type test customer message (e.g. Book table for 2, or Where is my order?)...'
                  : language === 'ar'
                  ? 'اكتب رد الكاشير المباشر للعميل...'
                  : 'Type cashier manual response...'
              }
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a3942] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />

            <button
              onClick={onSendMessage}
              disabled={!chatInputText.trim()}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================================================
// SUB-TAB 5: DIGITAL INVOICES DISPATCHER
// ===========================================================================

interface DigitalInvoicesTabProps {
  profiles: CustomerRFMProfile[];
  language: string;
  onSendInvoice: (inv: WhatsAppDigitalInvoiceData) => void;
  onPreviewInvoice: (inv: WhatsAppDigitalInvoiceData) => void;
}

const DigitalInvoicesTab: React.FC<DigitalInvoicesTabProps> = ({
  profiles,
  language,
  onSendInvoice,
  onPreviewInvoice,
}) => {
  // Sample live orders for invoice dispatch
  const sampleOrders: WhatsAppDigitalInvoiceData[] = [
    {
      orderId: 'ord-101',
      orderNumber: 'ORD-9021',
      customerName: 'سعادة عبد العزيز آل الشيخ',
      customerPhone: '+966505551122',
      items: [
        { name: 'ستيك ريب آي واغيو A5', quantity: 2, price: 185.0, total: 370.0 },
        { name: 'باستا ترافل بالكمأة', quantity: 1, price: 75.0, total: 75.0 },
        { name: 'موهيتو باشن فروت', quantity: 2, price: 35.0, total: 70.0 },
      ],
      subtotal: 447.83,
      taxSar: 67.17,
      discountSar: 0,
      grandTotal: 515.0,
      paymentMethod: 'Apple Pay',
      branchName: 'فرع السليمانية — الرياض',
      tableNumber: 'VIP-01',
      orderType: 'محلي (طاولة)',
      orderDate: '2026-08-14 20:30',
      cashierName: 'أحمد الشريف',
    },
    {
      orderId: 'ord-102',
      orderNumber: 'ORD-9022',
      customerName: 'د. ليلى السبيعي',
      customerPhone: '+966541122334',
      items: [
        { name: 'سلمون مشوي مع الأعشاب', quantity: 1, price: 125.0, total: 125.0 },
        { name: 'ديناميت شرمب مقرمش', quantity: 1, price: 58.0, total: 58.0 },
        { name: 'عصير برتقال طازج', quantity: 1, price: 25.0, total: 25.0 },
      ],
      subtotal: 180.87,
      taxSar: 27.13,
      discountSar: 25.0,
      grandTotal: 183.0,
      paymentMethod: 'مدى (Mada POS)',
      branchName: 'فرع السليمانية — الرياض',
      tableNumber: 'T-04',
      orderType: 'محلي (طاولة)',
      orderDate: '2026-08-14 19:45',
      cashierName: 'أحمد الشريف',
    },
    {
      orderId: 'ord-103',
      orderNumber: 'ORD-9023',
      customerName: 'سارة القحطاني',
      customerPhone: '+966589988776',
      items: [
        { name: 'بيتزا نابولي بالكمأة', quantity: 1, price: 95.0, total: 95.0 },
        { name: 'كيكة التمر بالكراميل', quantity: 1, price: 42.0, total: 42.0 },
      ],
      subtotal: 119.13,
      taxSar: 17.87,
      discountSar: 0,
      grandTotal: 137.0,
      paymentMethod: 'Apple Pay',
      branchName: 'فرع السليمانية — الرياض',
      orderType: 'توصيل (Delivery)',
      orderDate: '2026-08-14 18:20',
      cashierName: 'سارة العنزي',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'منظومة الفواتير الرقمية التفاعلية عبر واتساب' : 'Interactive WhatsApp E-Invoicing'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'إرسال الفاتورة الضريبية ZATCA المعتمدة للعميل بنقرة واحدة مع أزرار التقييم وإعادة الطلب'
              : 'Dispatch 1-click ZATCA-compliant digital receipts directly to customer WhatsApp'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sampleOrders.map((inv) => (
          <div
            key={inv.orderId}
            className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">
                  #{inv.orderNumber}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold">
                  {inv.orderType}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-black text-white">{inv.customerName}</h3>
                <span className="text-xs text-slate-400 font-mono">{inv.customerPhone}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 space-y-1 text-xs">
                {inv.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold">{item.total} ر.س</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-baseline">
                <span className="text-xs text-slate-400">
                  {language === 'ar' ? 'الإجمالي (شامل الضريبة 15%):' : 'Grand Total:'}
                </span>
                <span className="text-base font-black text-amber-300">
                  {(inv.grandTotal ?? inv.total ?? 0).toFixed(2)} ر.س
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <button
                onClick={() => onSendInvoice(inv)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5 text-slate-950" />
                <span>{language === 'ar' ? 'إرسال الفاتورة عبر واتساب' : 'Send WhatsApp Invoice'}</span>
              </button>

              <button
                onClick={() => onPreviewInvoice(inv)}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'ar' ? 'معاينة نص الفاتورة' : 'Preview Text'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ===========================================================================
// SUB-TAB 6: SETTINGS & QR INTEGRATION
// ===========================================================================

interface SettingsTabProps {
  config: any;
  onUpdateConfig: (u: any) => void;
  language: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ config, onUpdateConfig, language }) => {
  const [phoneId, setPhoneId] = useState(config.phoneNumberId);
  const [token, setToken] = useState(config.accessToken);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateConfig({ phoneNumberId: phoneId, accessToken: token });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl space-y-6"
    >
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{language === 'ar' ? 'إعدادات ربط Meta WhatsApp Cloud API' : 'Meta WhatsApp Cloud API Configuration'}</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-bold">
              {language === 'ar' ? 'معرف رقم الهاتف (Phone Number ID):' : 'Phone Number ID:'}
            </label>
            <input
              type="text"
              value={phoneId}
              onChange={(e) => setPhoneId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">
              {language === 'ar' ? 'رمز الوصول الدائم (Permanent Access Token):' : 'Access Token:'}
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-bold">
              {language === 'ar' ? 'رابط الويب هوك لاستقبال الرسائل (Webhook URL):' : 'Webhook URL:'}
            </label>
            <input
              type="text"
              readOnly
              value={config.webhookUrl}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-emerald-400 font-mono"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {language === 'ar' ? 'حفظ إعدادات الربط' : 'Save API Settings'}
            </button>
            {saved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>{language === 'ar' ? 'تم الحفظ وتأكيد الاتصال بنجاح!' : 'Connected successfully!'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* QR Web Session Scanner Simulator */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-amber-400" />
          <span>{language === 'ar' ? 'جلسة WhatsApp Web QR للربط السريع' : 'WhatsApp Web QR Session Link'}</span>
        </h3>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-950/60 border border-white/5">
          <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
            <QrCode className="w-28 h-28 text-slate-950" />
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400">
                {language === 'ar' ? 'الجلسة نشطة ومتصلة بهاتف المطعم الرئيسي' : 'Session Linked & Active'}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {language === 'ar'
                ? 'امسح الرمز من تطبيق واتساب للأعمال (الأجهزة المرتبطة) لإرسال الفواتير والحملات بدون انقطاع.'
                : 'Scan QR code from WhatsApp Business to link restaurant terminal for rapid broadcasts.'}
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Session Node ID: REST_OS_SA_NODE_770
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ===========================================================================
// MODAL: CAMPAIGN BUILDER
// ===========================================================================

interface CampaignBuilderModalProps {
  campaign: Partial<MarketingCampaign>;
  profiles: CustomerRFMProfile[];
  onClose: () => void;
  onSave: (c: Partial<MarketingCampaign>) => void;
  language: string;
}

const CampaignBuilderModal: React.FC<CampaignBuilderModalProps> = ({
  campaign,
  profiles,
  onClose,
  onSave,
  language,
}) => {
  const [titleAr, setTitleAr] = useState(campaign.titleAr || '');
  const [targetSegment, setTargetSegment] = useState<RFMSegment | 'all'>(campaign.targetSegment || 'all');
  const [templateAr, setTemplateAr] = useState(campaign.messageTemplateAr || '');
  const [discountCode, setDiscountCode] = useState(campaign.discountCouponCode || 'SPECIAL20');
  const [discountPct, setDiscountPct] = useState(campaign.discountPercentage || 20);

  const targetCount =
    targetSegment === 'all'
      ? profiles.length
      : profiles.filter((p) => p.segment === targetSegment).length;

  const handleInsertVar = (varCode: string) => {
    setTemplateAr((prev: string) => prev + ` ${varCode} `);
  };

  const handleSave = () => {
    onSave({
      ...campaign,
      titleAr,
      targetSegment,
      messageTemplateAr: templateAr,
      discountCouponCode: discountCode,
      discountPercentage: discountPct,
      targetAudienceCount: targetCount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-white text-sm">
            <Megaphone className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'منشئ حملات الواتساب الذكي' : 'WhatsApp Campaign Creator'}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              {language === 'ar' ? 'عنوان الحملة:' : 'Campaign Title:'}
            </label>
            <input
              type="text"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                {language === 'ar' ? 'الشريحة المستهدفة (RFM):' : 'Target Segment:'}
              </label>
              <select
                value={targetSegment}
                onChange={(e) => setTargetSegment(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white font-bold"
              >
                <option value="all">{language === 'ar' ? 'جميع العملاء' : 'All Guests'} ({profiles.length})</option>
                <option value="champions">{language === 'ar' ? 'الأبطال والنخبة (Champions)' : 'Champions'}</option>
                <option value="vip_high_spenders">{language === 'ar' ? 'كبار المنفقين (VIP)' : 'High Spenders'}</option>
                <option value="loyal">{language === 'ar' ? 'العملاء المخلصين (Loyal)' : 'Loyal'}</option>
                <option value="promising">{language === 'ar' ? 'العملاء الواعدين (Promising)' : 'Promising'}</option>
                <option value="new_customers">{language === 'ar' ? 'العملاء الجدد (New)' : 'New Customers'}</option>
                <option value="at_risk">{language === 'ar' ? 'المعرضين للمغادرة (At Risk)' : 'At Risk'}</option>
                <option value="dormant">{language === 'ar' ? 'الخاملين (Dormant)' : 'Dormant'}</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">
                {language === 'ar' ? 'كود الخصم المرفق:' : 'Promo Coupon Code:'}
              </label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-amber-300 font-mono font-bold"
              />
            </div>
          </div>

          {/* Variables inserter */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              {language === 'ar' ? 'نص رسالة واتساب (يدعم المتغيرات التلقائية):' : 'Message Body:'}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                { tag: '{{customer_name}}', label: 'اسم العميل' },
                { tag: '{{favorite_dish}}', label: 'الطبق المفضل' },
                { tag: '{{discount_code}}', label: 'كود الخصم' },
                { tag: '{{points_balance}}', label: 'رصيد النقاط' },
                { tag: '{{tier}}', label: 'الفئة' },
              ].map((chip) => (
                <button
                  key={chip.tag}
                  type="button"
                  onClick={() => handleInsertVar(chip.tag)}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 transition-all cursor-pointer"
                >
                  + {chip.label}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={templateAr}
              onChange={(e) => setTemplateAr(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-bold">
            {language === 'ar' ? 'الجمهور المستهدف:' : 'Audience:'} <span className="text-emerald-400">{targetCount} عميل</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              {language === 'ar' ? 'حفظ الحملة' : 'Save Campaign'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ===========================================================================
// MODAL: INVOICE DETAILS & PREVIEW
// ===========================================================================

interface InvoiceDetailsModalProps {
  invoice: WhatsAppDigitalInvoiceData;
  onClose: () => void;
  onSend: (inv: WhatsAppDigitalInvoiceData) => void;
  language: string;
  copied: boolean;
  onCopy: () => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  invoice,
  onClose,
  onSend,
  language,
  copied,
  onCopy,
}) => {
  const formattedText = whatsappBotService.formatInvoiceForWhatsApp(invoice);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <span className="font-black text-white text-xs flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>{language === 'ar' ? 'معاينة نص الفاتورة الرقمية' : 'WhatsApp Receipt Preview'}</span>
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar">
          <pre className="p-4 rounded-2xl bg-[#0b141a] text-emerald-300 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-white/10">
            {formattedText}
          </pre>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-between gap-2">
          <button
            onClick={onCopy}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ النص' : 'Copy Text')}</span>
          </button>

          <button
            onClick={() => onSend(invoice)}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4 text-slate-950" />
            <span>{language === 'ar' ? 'إرسال عبر واتساب الآن' : 'Send via WhatsApp'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
