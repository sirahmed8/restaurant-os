import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sliders,
  Square,
  TrendingUp,
  Truck,
  User,
  Utensils,
  Volume2,
  VolumeX,
  XCircle,
  AlertCircle,
  Package,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';

import { useAppStore } from '../../stores/useAppStore';
import { deliveryAggregatorService } from '../../services/deliveryAggregatorService';
import { soundEngine } from '../../services/soundEngine';
import {
  AggregatedDeliveryOrder,
  DeliveryPlatform,
  DeliveryOrderStatus,
  PlatformChannelConfig,
  DeliveryDriver,
  DeliverySummaryStats,
} from '../../types/delivery';

export const DeliveryHubModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const isAr = language === 'ar';

  const [orders, setOrders] = useState<AggregatedDeliveryOrder[]>([]);
  const [channels, setChannels] = useState<PlatformChannelConfig[]>([]);
  const [stats, setStats] = useState<DeliverySummaryStats | null>(null);

  // Tabs: 'orders' | 'drivers' | 'simulator' | 'analytics'
  const [activeTab, setActiveTab] = useState<'orders' | 'drivers' | 'simulator' | 'analytics'>('orders');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected order for detailed modal / driver tracking
  const [selectedOrder, setSelectedOrder] = useState<AggregatedDeliveryOrder | null>(null);

  // Custom Simulator Form Modal
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [simPlatform, setSimPlatform] = useState<DeliveryPlatform>('talabat');
  const [simCustomerName, setSimCustomerName] = useState<string>('سعود الدوسري');
  const [simPhone, setSimPhone] = useState<string>('+966551849201');
  const [simAddress, setSimAddress] = useState<string>('الرياض — حي النرجس — شارع أنس بن مالك');
  const [simNotes, setSimNotes] = useState<string>('الرجاء عدم رن الجرس، الاتصال عند الوصول');
  const [simIsSimulating, setSimIsSimulating] = useState<boolean>(false);

  // JSON Webhook inspector modal
  const [showPayloadModal, setShowPayloadModal] = useState<boolean>(false);
  const [rawPayloadText, setRawPayloadText] = useState<string>('');

  useEffect(() => {
    // Subscribe to delivery aggregator live updates
    const unsubscribe = deliveryAggregatorService.subscribe((updatedOrders) => {
      setOrders([...updatedOrders]);
      setChannels([...deliveryAggregatorService.getChannels()]);
      setStats(deliveryAggregatorService.getSummaryStats());
      setSimIsSimulating(deliveryAggregatorService.isSimulating());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (platformFilter !== 'all' && order.platform !== platformFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = order.customer.name.toLowerCase().includes(q);
      const matchPhone = order.customer.phone.includes(q);
      const matchCode = order.platformOrderCode.toLowerCase().includes(q);
      const matchAddress = order.customer.address.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCode && !matchAddress) return false;
    }
    return true;
  });

  // Channel toggle actions
  const handleToggleChannel = (platform: DeliveryPlatform, currentStatus: boolean) => {
    deliveryAggregatorService.toggleChannelStatus(platform, !currentStatus);
    playSound('tap');
  };

  const handleToggleAutoAccept = (platform: DeliveryPlatform, currentAutoAccept: boolean) => {
    deliveryAggregatorService.toggleAutoAccept(platform, !currentAutoAccept);
    playSound('tap');
  };

  // Quick 1-click order simulation
  const handleQuickSimulate = async (platform: DeliveryPlatform) => {
    playSound('kitchen-bell');
    await deliveryAggregatorService.simulateIncomingOrder(platform);
  };

  // Automated simulator toggle
  const handleToggleSimulationInterval = () => {
    if (simIsSimulating) {
      deliveryAggregatorService.stopLiveSimulation();
      setSimIsSimulating(false);
      playSound('pop');
    } else {
      deliveryAggregatorService.startLiveSimulation(15000); // every 15s
      setSimIsSimulating(true);
      playSound('success');
    }
  };

  // Order transition actions
  const handleAccept = async (orderId: string) => {
    await deliveryAggregatorService.acceptOrder(orderId);
  };

  const handleReady = async (orderId: string) => {
    await deliveryAggregatorService.markReadyForPickup(orderId);
  };

  const handleDispatch = async (orderId: string) => {
    await deliveryAggregatorService.dispatchOrder(orderId);
  };

  const handleDeliver = async (orderId: string) => {
    await deliveryAggregatorService.markDelivered(orderId);
  };

  const handleCancel = async (orderId: string) => {
    const reason = prompt(isAr ? 'سبب إلغاء طلب الدليفري:' : 'Delivery cancellation reason:') || 'طلب العميل';
    await deliveryAggregatorService.cancelOrder(orderId, reason);
  };

  // Submit custom simulator modal
  const handleCustomSimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await deliveryAggregatorService.simulateIncomingOrder(simPlatform, {
      customer: {
        name: simCustomerName,
        phone: simPhone,
        address: simAddress,
      },
      notes: simNotes,
    });
    setShowSimModal(false);
    playSound('kitchen-bell');
  };

  const getPlatformBadge = (platform: DeliveryPlatform) => {
    switch (platform) {
      case 'talabat':
        return {
          nameAr: 'طلبات',
          nameEn: 'Talabat',
          bg: 'bg-orange-500/15 border-orange-500/30 text-orange-400',
          dot: 'bg-orange-500',
          border: 'border-orange-500/40',
        };
      case 'hungerstation':
        return {
          nameAr: 'هنقرستيشن',
          nameEn: 'Hungerstation',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
          border: 'border-amber-500/40',
        };
      case 'jahez':
        return {
          nameAr: 'جاهز',
          nameEn: 'Jahez',
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-500',
          border: 'border-rose-500/40',
        };
      case 'deliveroo':
        return {
          nameAr: 'ديليفرو',
          nameEn: 'Deliveroo',
          bg: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
          dot: 'bg-teal-400',
          border: 'border-teal-500/40',
        };
      default:
        return {
          nameAr: platform,
          nameEn: platform,
          bg: 'bg-slate-500/15 border-slate-500/30 text-slate-400',
          dot: 'bg-slate-400',
          border: 'border-slate-500/40',
        };
    }
  };

  const getStatusBadge = (status: DeliveryOrderStatus) => {
    switch (status) {
      case 'incoming':
        return {
          labelAr: 'طلب جديد (وارد)',
          labelEn: 'Incoming',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40 animate-pulse',
        };
      case 'accepted':
      case 'preparing':
        return {
          labelAr: 'قيد الطهي بالمطبخ',
          labelEn: 'Cooking in KDS',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        };
      case 'ready_for_pickup':
        return {
          labelAr: 'جاهز بانتظار السائق',
          labelEn: 'Ready for Pickup',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        };
      case 'picked_up':
        return {
          labelAr: 'في الطريق مع السائق',
          labelEn: 'Out for Delivery',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        };
      case 'delivered':
        return {
          labelAr: 'تم التسليم بنجاح',
          labelEn: 'Delivered',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        };
      case 'cancelled':
        return {
          labelAr: 'ملغي',
          labelEn: 'Cancelled',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        };
    }
  };

  return (
    <div className="h-full w-full flex flex-col gap-4 overflow-hidden select-none" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. TOP HEADER & KPI RADAR */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Truck className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-white tracking-tight">
                {isAr ? 'مجمع تطبيقات التوصيل المتكامل' : 'Delivery Aggregator Hub'}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-sm">
                4-in-1 OmniChannel
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'استقبال مباشر لطلبات Talabat و Hungerstation و Jahez و Deliveroo مع المطبخ والمخزون'
                : 'Unified API Gateway & KDS Ingestion for Talabat, Hungerstation, Jahez & Deliveroo'}
            </p>
          </div>
        </div>

        {/* Global Action Tools */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
          {/* Live Auto-Simulation Stream Button */}
          <button
            onClick={handleToggleSimulationInterval}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer shadow-md ${
              simIsSimulating
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-emerald-500/30 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
          >
            <Zap className={`w-4 h-4 ${simIsSimulating ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>
              {simIsSimulating
                ? isAr
                  ? 'المحاكي الآلي نشط (توليد كل 15 ث)'
                  : 'Auto-Simulator Live (Every 15s)'
                : isAr
                ? 'تشغيل المحاكي الآلي'
                : 'Start Auto Simulator'}
            </span>
          </button>

          {/* Custom Webhook / Mock Order Injection Modal Button */}
          <button
            onClick={() => setShowSimModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'حقن طلب مخصص' : 'Inject Custom Order'}</span>
          </button>
        </div>
      </div>

      {/* 2. PLATFORM CHANNEL CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {channels.slice(0, 4).map((channel) => {
          const badge = getPlatformBadge(channel.platform);
          return (
            <div
              key={channel.platform}
              className={`relative overflow-hidden rounded-2xl border p-3.5 backdrop-blur-xl transition-all duration-200 ${
                channel.isConnected
                  ? 'bg-slate-900/80 border-white/10 shadow-lg'
                  : 'bg-slate-950/40 border-white/5 opacity-60'
              }`}
            >
              {/* Top Row: Brand & Status Toggle */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: channel.brandColor }}
                  />
                  <span className="text-sm font-black text-white">
                    {isAr ? channel.displayNameAr : channel.displayNameEn}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      channel.isConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {channel.isConnected ? (isAr ? 'متصل' : 'Online') : isAr ? 'معطل' : 'Offline'}
                  </span>
                </div>

                {/* Quick Simulation trigger icon */}
                <button
                  onClick={() => handleQuickSimulate(channel.platform)}
                  title={isAr ? `توليد طلب تجريبي فوري من ${channel.displayNameAr}` : `Trigger mock order from ${channel.displayNameEn}`}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-slate-950 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Middle Row: Active Orders & Revenue */}
              <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-white/5">
                <div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'الطلبات النشطة' : 'Active Orders'}</div>
                  <div className="text-base font-black text-amber-400">{channel.activeOrdersCount}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">{isAr ? 'مبيعات اليوم' : "Today's Sales"}</div>
                  <div className="text-base font-black text-white">
                    {channel.todayRevenue.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{isAr ? 'ر.س' : 'SAR'}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Controls (Channel Switch & Auto-Accept Switch) */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {/* Auto Accept Switch */}
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                  <input
                    type="checkbox"
                    checked={channel.autoAccept}
                    onChange={() => handleToggleAutoAccept(channel.platform, channel.autoAccept)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>{isAr ? 'قبول تلقائي' : 'Auto Accept'}</span>
                </label>

                {/* Channel Online/Offline Toggle */}
                <button
                  onClick={() => handleToggleChannel(channel.platform, channel.isConnected)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-bold cursor-pointer transition-colors ${
                    channel.isConnected
                      ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  }`}
                >
                  {channel.isConnected ? (isAr ? 'إيقاف مؤقت' : 'Disable') : isAr ? 'تفعيل القناة' : 'Enable'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. WORKSPACE TABS & FILTER BAR */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-slate-900/40 border border-white/5 rounded-2xl p-2.5 backdrop-blur-xl shrink-0">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 custom-scrollbar">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isAr ? 'لوحة الطلبات الحية' : 'Live Orders Board'}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'orders' ? 'bg-slate-950 text-amber-400' : 'bg-white/10 text-slate-300'
              }`}
            >
              {orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'drivers'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>{isAr ? 'رادار تتبع السائقين والأسطول' : 'Driver GPS Radar'}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isAr ? 'تحليلات المنصات والعمولات' : 'Channel Analytics'}</span>
          </button>
        </div>

        {/* Search & Platform Filter Pills (Visible in Orders tab) */}
        {activeTab === 'orders' && (
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1 lg:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث برقم الطلب، العميل، العنوان...' : 'Search by code, customer, address...'}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl ps-9 pe-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Platform Selector */}
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع المنصات' : 'All Platforms'}</option>
              <option value="talabat">طلبات (Talabat)</option>
              <option value="hungerstation">هنقرستيشن (Hungerstation)</option>
              <option value="jahez">جاهز (Jahez)</option>
              <option value="deliveroo">ديليفرو (Deliveroo)</option>
            </select>

            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/70 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="incoming">{isAr ? 'جديدة واردة' : 'Incoming'}</option>
              <option value="preparing">{isAr ? 'قيد الطهي' : 'Cooking'}</option>
              <option value="ready_for_pickup">{isAr ? 'جاهزة بانتظار السائق' : 'Ready for Pickup'}</option>
              <option value="picked_up">{isAr ? 'مع السائق في الطريق' : 'Out for Delivery'}</option>
              <option value="delivered">{isAr ? 'مكتملة ومسلّمة' : 'Delivered'}</option>
              <option value="cancelled">{isAr ? 'ملغية' : 'Cancelled'}</option>
            </select>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT VIEWPORT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* =========================================================================
            TAB 1: LIVE ORDERS CARDS / KANBAN
        ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="h-full">
            {filteredOrders.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-slate-900/20 border border-white/5 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-3">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-300">
                  {isAr ? 'لا توجد طلبات توصيل مطابقة' : 'No Delivery Orders Found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                  {isAr
                    ? 'يمكنك توليد طلب تجريبي فوري بنقرة واحدة لاختبار دورة حياة الطلبات'
                    : 'You can generate instant mock orders with one click to test the full order lifecycle.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 justify-center">
                  <button
                    onClick={() => handleQuickSimulate('talabat')}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold hover:bg-orange-500/30 cursor-pointer"
                  >
                    + {isAr ? 'طلب طلبات' : 'Talabat Order'}
                  </button>
                  <button
                    onClick={() => handleQuickSimulate('hungerstation')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 cursor-pointer"
                  >
                    + {isAr ? 'طلب هنقرستيشن' : 'Hungerstation Order'}
                  </button>
                  <button
                    onClick={() => handleQuickSimulate('jahez')}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold hover:bg-rose-500/30 cursor-pointer"
                  >
                    + {isAr ? 'طلب جاهز' : 'Jahez Order'}
                  </button>
                  <button
                    onClick={() => handleQuickSimulate('deliveroo')}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold hover:bg-teal-500/30 cursor-pointer"
                  >
                    + {isAr ? 'طلب ديليفرو' : 'Deliveroo Order'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5 pb-4">
                <AnimatePresence>
                  {filteredOrders.map((order) => {
                    const platformBadge = getPlatformBadge(order.platform);
                    const statusBadge = getStatusBadge(order.status);
                    const isIncoming = order.status === 'incoming';
                    const isPreparing = order.status === 'preparing' || order.status === 'accepted';
                    const isReady = order.status === 'ready_for_pickup';
                    const isPickedUp = order.status === 'picked_up';
                    const isDelivered = order.status === 'delivered';
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={{ duration: 0.15 }}
                        className={`rounded-2xl border p-4 backdrop-blur-xl flex flex-col justify-between transition-all shadow-md ${
                          isIncoming
                            ? 'bg-gradient-to-b from-purple-950/30 to-slate-900/90 border-purple-500/40 shadow-purple-500/10 ring-1 ring-purple-500/30'
                            : isPreparing
                            ? 'bg-slate-900/90 border-blue-500/30'
                            : isReady
                            ? 'bg-slate-900/90 border-amber-500/30'
                            : isPickedUp
                            ? 'bg-slate-900/90 border-cyan-500/30'
                            : 'bg-slate-900/60 border-white/5 opacity-80'
                        }`}
                      >
                        {/* Card Header: Platform badge, Code, Status & Timer */}
                        <div>
                          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                            {/* Platform Pill */}
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${platformBadge.bg}`}>
                                <span className={`w-2 h-2 rounded-full ${platformBadge.dot}`} />
                                <span>{order.platformOrderCode}</span>
                              </span>
                              <span className="text-xs font-bold text-white">
                                {isAr ? platformBadge.nameAr : platformBadge.nameEn}
                              </span>
                            </div>

                            {/* Status Tag */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                              {isAr ? statusBadge.labelAr : statusBadge.labelEn}
                            </span>
                          </div>

                          {/* Customer & Location Details */}
                          <div className="py-2.5 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {order.customer.name}
                              </span>
                              <a
                                href={`tel:${order.customer.phone}`}
                                className="text-amber-400 font-mono flex items-center gap-1 hover:underline text-[11px]"
                              >
                                <Phone className="w-3 h-3" />
                                {order.customer.phone}
                              </a>
                            </div>

                            <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span className="truncate">{order.customer.address}</span>
                            </div>

                            {order.specialInstructions && (
                              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5 mt-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                                <span className="truncate">{order.specialInstructions}</span>
                              </div>
                            )}
                          </div>

                          {/* Items List */}
                          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-white/5 space-y-1.5 my-1">
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
                              <span>{isAr ? 'الأصناف المطلوبة' : 'Items'}</span>
                              <span className="text-slate-500">{order.items.length} {isAr ? 'أصناف' : 'items'}</span>
                            </div>
                            <div className="max-h-28 overflow-y-auto space-y-1.5 pe-1 custom-scrollbar">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-start justify-between text-xs gap-2">
                                  <div className="flex items-start gap-1.5 overflow-hidden">
                                    <span className="font-black text-amber-400 min-w-4 text-center">
                                      {item.quantity}x
                                    </span>
                                    <span className="text-slate-200 truncate">
                                      {isAr ? item.nameAr : item.nameEn}
                                    </span>
                                  </div>
                                  <span className="text-slate-400 shrink-0 font-mono text-[11px]">
                                    {item.totalPrice} {isAr ? 'ر.س' : 'SAR'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Courier / Driver Info Box */}
                          {order.driver && (
                            <div className="bg-white/5 rounded-xl p-2 border border-white/5 flex items-center justify-between gap-2 my-2">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                                  {order.driver.vehicleType === 'car' ? (
                                    <Car className="w-4 h-4" />
                                  ) : (
                                    <Bike className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <div className="text-[11px] font-bold text-white truncate">
                                    {order.driver.name}
                                  </div>
                                  <div className="text-[9px] text-slate-400 truncate">
                                    {order.driver.vehiclePlate || order.driver.phone}
                                  </div>
                                </div>
                              </div>

                              <div className="text-end shrink-0">
                                <div className="text-[10px] text-slate-400">{isAr ? 'الوصول المتوقع' : 'ETA'}</div>
                                <div className="text-xs font-black text-amber-400 font-mono">
                                  {order.driver.etaMinutes} {isAr ? 'د' : 'min'}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Financial Totals */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                            <div className="text-slate-400">
                              <span>{isAr ? 'طريقة الدفع: ' : 'Payment: '}</span>
                              <span className="font-bold text-slate-200">
                                {order.paymentMethod === 'prepaid_online'
                                  ? isAr ? 'مدفوع إلكترونياً' : 'Prepaid Online'
                                  : isAr ? 'دفع عند الاستلام' : 'Cash on Delivery'}
                              </span>
                            </div>
                            <div className="text-sm font-black text-amber-400 font-mono">
                              {order.totalAmount} <span className="text-[10px] text-slate-400 font-normal">{isAr ? 'ر.س' : 'SAR'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="pt-3 flex flex-wrap items-center gap-1.5 mt-2 border-t border-white/5">
                          {isIncoming && (
                            <button
                              onClick={() => handleAccept(order.id)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'قبول وإرسال للمطبخ' : 'Accept & Send to KDS'}</span>
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              onClick={() => handleReady(order.id)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
                            >
                              <Utensils className="w-3.5 h-3.5" />
                              <span>{isAr ? 'جاهز للتسليم للسائق' : 'Mark Ready for Pickup'}</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => handleDispatch(order.id)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
                            >
                              <Bike className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تسليم للمندوب' : 'Hand to Courier'}</span>
                            </button>
                          )}

                          {isPickedUp && (
                            <button
                              onClick={() => handleDeliver(order.id)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'تأكيد التسليم واكتمال الطلب' : 'Mark Delivered'}</span>
                            </button>
                          )}

                          {!isDelivered && !isCancelled && (
                            <button
                              onClick={() => handleCancel(order.id)}
                              className="py-1.5 px-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
                              title={isAr ? 'إلغاء الطلب' : 'Cancel Order'}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Quick Track Driver / Details Modal button */}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="py-1.5 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold cursor-pointer"
                            title={isAr ? 'عرض التفاصيل والخط الزمني' : 'View Timeline & Details'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: DRIVER GPS RADAR
        ========================================================================= */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Live Couriers List */}
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bike className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'سائقي التوصيل النشطين' : 'Active Couriers'}</span>
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {orders.filter((o) => o.driver && o.status !== 'delivered' && o.status !== 'cancelled').length}
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-scrollbar pe-1">
                  {orders
                    .filter((o) => o.driver && o.status !== 'delivered' && o.status !== 'cancelled')
                    .map((order) => {
                      const driver = order.driver!;
                      const badge = getPlatformBadge(order.platform);
                      return (
                        <div
                          key={order.id}
                          className="bg-slate-950/70 border border-white/5 rounded-xl p-3 space-y-2 hover:border-amber-500/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.bg}`}>
                                {order.platformOrderCode}
                              </span>
                              <span className="text-xs font-bold text-white">{driver.name}</span>
                            </div>
                            <span className="text-[10px] text-amber-400 font-mono font-bold">
                              ETA {driver.etaMinutes} {isAr ? 'د' : 'min'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center justify-between">
                            <span>{driver.vehiclePlate}</span>
                            <a
                              href={`tel:${driver.phone}`}
                              className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[10px]"
                            >
                              <Phone className="w-3 h-3" />
                              {driver.phone}
                            </a>
                          </div>

                          {/* Progress ETA Bar */}
                          <div className="space-y-1 pt-1">
                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(15, 100 - driver.etaMinutes * 4)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Visual Simulated GPS Map */}
              <div className="lg:col-span-2 bg-slate-950 border border-white/10 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden min-h-[450px]">
                {/* Visual Map Grid Lines */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px), radial-gradient(#3b82f6 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 0, 20px 20px',
                  }}
                />

                {/* Top Overlay Badge */}
                <div className="relative z-10 flex items-center justify-between bg-slate-900/80 border border-white/10 rounded-xl p-2.5 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-white">
                      {isAr ? 'خريطة التتبع المباشر — فرع الرياض' : 'Live GPS Radar — Riyadh Flagship'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">24.7136° N, 46.6753° E</span>
                </div>

                {/* Central Restaurant Hub Marker */}
                <div className="relative z-10 flex items-center justify-center my-12">
                  <div className="relative flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-amber-500/10 animate-ping absolute" />
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30 text-slate-950 font-black">
                      <Flame className="w-8 h-8 text-slate-950 animate-bounce" />
                    </div>
                  </div>
                </div>

                {/* Bottom Stats Banner */}
                <div className="relative z-10 grid grid-cols-3 gap-2 text-center bg-slate-900/80 border border-white/10 rounded-xl p-2.5 backdrop-blur-md">
                  <div>
                    <div className="text-[10px] text-slate-400">{isAr ? 'متوسط وقت التوصيل' : 'Avg Delivery Time'}</div>
                    <div className="text-sm font-black text-amber-400 font-mono">24 {isAr ? 'دقيقة' : 'mins'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">{isAr ? 'كفاءة السائقين' : 'Driver Rating'}</div>
                    <div className="text-sm font-black text-emerald-400 font-mono">4.9 ★</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">{isAr ? 'الطلبات المسلّمة' : 'Delivered Today'}</div>
                    <div className="text-sm font-black text-white font-mono">
                      {orders.filter((o) => o.status === 'delivered').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CHANNEL ANALYTICS & COMMISSIONS
        ========================================================================= */}
        {activeTab === 'analytics' && stats && (
          <div className="space-y-4">
            {/* Top KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                <div className="text-xs text-slate-400">{isAr ? 'إجمالي مبيعات الدليفري اليوم' : "Today's Delivery Revenue"}</div>
                <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
                  {stats.totalRevenueToday.toLocaleString()} <span className="text-xs font-normal text-slate-400">{isAr ? 'ر.س' : 'SAR'}</span>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                <div className="text-xs text-slate-400">{isAr ? 'إجمالي الطلبات اليوم' : "Today's Total Orders"}</div>
                <div className="text-2xl font-black text-white mt-1 font-mono">{stats.totalOrdersToday}</div>
              </div>

              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                <div className="text-xs text-slate-400">{isAr ? 'نسبة اكتمال التوصيل' : 'Fulfillment Rate'}</div>
                <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{stats.fulfillmentRate}%</div>
              </div>

              <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                <div className="text-xs text-slate-400">{isAr ? 'متوسط سرعة التحضير (KDS)' : 'Avg KDS Prep Time'}</div>
                <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">14 {isAr ? 'دقيقة' : 'mins'}</div>
              </div>
            </div>

            {/* Platform Comparison Table */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 backdrop-blur-xl space-y-3">
              <h3 className="text-sm font-bold text-white">{isAr ? 'مقارنة المنصات والعمولات المقتطعة' : 'Platform Share & Commission Breakdown'}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 font-bold">
                      <th className="py-2.5 px-3 text-start">{isAr ? 'المنصة' : 'Platform'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'عدد الطلبات' : 'Orders'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'إجمالي المبيعات' : 'Gross Sales'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'نسبة العمولة' : 'Commission %'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'صافي العائد للمطعم' : 'Net Payout'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {channels.slice(0, 4).map((ch) => {
                      const commission = Number((ch.todayRevenue * ch.commissionRate).toFixed(2));
                      const net = Number((ch.todayRevenue - commission).toFixed(2));
                      return (
                        <tr key={ch.platform} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.brandColor }} />
                            {isAr ? ch.displayNameAr : ch.displayNameEn}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ch.isConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {ch.isConnected ? (isAr ? 'متصل' : 'Connected') : isAr ? 'معطل' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono text-white">{ch.todayOrdersCount}</td>
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">
                            {ch.todayRevenue} {isAr ? 'ر.س' : 'SAR'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-300">{(ch.commissionRate * 100).toFixed(0)}%</td>
                          <td className="py-3 px-3 font-mono font-black text-emerald-400">
                            {net} {isAr ? 'ر.س' : 'SAR'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CUSTOM ORDER SIMULATOR INJECTION
      ========================================================================= */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-white">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>{isAr ? 'حقن وتوليد طلب دليفري تجريبي مخصص' : 'Inject Custom Delivery Mock Order'}</span>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomSimSubmit} className="p-4 space-y-3.5 text-xs">
              {/* Platform Selector */}
              <div>
                <label className="block text-slate-400 mb-1">{isAr ? 'تطبيق التوصيل' : 'Delivery Platform'}</label>
                <select
                  value={simPlatform}
                  onChange={(e) => setSimPlatform(e.target.value as DeliveryPlatform)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none cursor-pointer"
                >
                  <option value="talabat">طلبات (Talabat)</option>
                  <option value="hungerstation">هنقرستيشن (Hungerstation)</option>
                  <option value="jahez">جاهز (Jahez)</option>
                  <option value="deliveroo">ديليفرو (Deliveroo)</option>
                </select>
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-slate-400 mb-1">{isAr ? 'اسم العميل' : 'Customer Name'}</label>
                <input
                  type="text"
                  value={simCustomerName}
                  onChange={(e) => setSimCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="block text-slate-400 mb-1">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none font-mono"
                  required
                />
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-slate-400 mb-1">{isAr ? 'عنوان التوصيل' : 'Delivery Address'}</label>
                <input
                  type="text"
                  value={simAddress}
                  onChange={(e) => setSimAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-slate-400 mb-1">{isAr ? 'ملاحظات العميل' : 'Customer Notes'}</label>
                <input
                  type="text"
                  value={simNotes}
                  onChange={(e) => setSimNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isAr ? 'إرسال الويب هوك وتوليد الطلب' : 'Ingest & Trigger Order'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: ORDER TIMELINE & DETAILS MODAL
      ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-white text-sm">
                  {isAr ? 'تفاصيل الطلب والخط الزمني' : 'Order Lifecycle & Timeline'}
                </h3>
                <p className="text-xs text-slate-400">{selectedOrder.platformOrderCode}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              {/* Order Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  {isAr ? 'سجل الأحداث والخط الزمني' : 'Audit Timeline'}
                </h4>
                <div className="space-y-2 border-s-2 border-amber-500/30 ms-2 ps-3">
                  {selectedOrder.timeline.map((entry, idx) => (
                    <div key={idx} className="relative">
                      <div className="w-2 h-2 rounded-full bg-amber-400 absolute -start-[17px] top-1.5" />
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(entry.timestamp).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US')}
                      </div>
                      <div className="text-xs text-slate-200 font-medium">
                        {isAr ? entry.descriptionAr : entry.descriptionEn}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
