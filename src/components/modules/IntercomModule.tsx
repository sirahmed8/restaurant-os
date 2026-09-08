import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Send,
  Bell,
  AlertTriangle,
  Flame,
  Users,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Droplet,
  CheckCircle2,
  Clock,
  ThumbsUp,
  Heart,
  Smile,
  X,
  PhoneCall,
  UserCheck,
  Zap,
  Coffee,
  Check
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useStaffStore } from '../../stores/useStaffStore';
import { useTableStore } from '../../stores/useTableStore';
import { IntercomMessage } from '../../types';
import { getTranslation } from '../../i18n/translations';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

export const IntercomModule: React.FC = () => {
  const { language, playSound, activeUser } = useAppStore();
  const t = getTranslation(language);
  const tables = useTableStore((s) => s.tables);

  // Channels
  type ChannelId = 'all' | 'kitchen' | 'floor' | 'cashier' | 'management';
  const [activeChannel, setActiveChannel] = useState<ChannelId>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent'>('all');

  // Composer state
  const [messageText, setMessageText] = useState('');
  const [messagePriority, setMessagePriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [attachedTable, setAttachedTable] = useState<string>('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedQuickAction, setSelectedQuickAction] = useState<string | null>(null);
  const [quickActionTable, setQuickActionTable] = useState<string>('T-01');

  // Messages list state
  const [messages, setMessages] = useState<IntercomMessage[]>([
    {
      id: 'msg-1',
      senderId: 'emp-chef-1',
      senderName: 'الشيف جان مارك',
      senderRole: 'chef',
      senderAvatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80',
      channel: 'kitchen',
      content: 'طلب #ORD-4022 (ستيك واغيو + بوراتا) جاهز بالكامل للتسليم في نافذة المطبخ!',
      priority: 'urgent',
      tableNumber: 'T-04',
      orderNumber: '#ORD-4022',
      timestamp: new Date(Date.now() - 2 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPreset: true,
      acknowledgedBy: ['emp-waiter-1'],
    },
    {
      id: 'msg-2',
      senderId: 'emp-waiter-1',
      senderName: 'خالد الغامدي (ويتر)',
      senderRole: 'waiter',
      senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      channel: 'floor',
      content: 'طاولة TR-02 تطلب ماء بارد وضيافة قهوة إضافية للضيوف.',
      priority: 'normal',
      tableNumber: 'TR-02',
      timestamp: new Date(Date.now() - 6 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      acknowledgedBy: [],
    },
    {
      id: 'msg-3',
      senderId: 'emp-cashier-1',
      senderName: 'أحمد الشريف (كاشير)',
      senderRole: 'cashier',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      channel: 'management',
      content: 'مطلوب موافقة مدير الصالة على تطبيق خصم 15% لعميل VIP في جناح 1.',
      priority: 'important',
      tableNumber: 'VIP-01',
      timestamp: new Date(Date.now() - 12 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      acknowledgedBy: ['emp-manager'],
    },
    {
      id: 'msg-4',
      senderId: 'emp-manager',
      senderName: 'سارة العنزي (مدير الصالة)',
      senderRole: 'manager',
      senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      channel: 'all',
      content: 'تنبيه لجميع الطاقم: تم حجز صالة العائلات VIP لوفد سياحي الساعة 8:30 مساءً. يرجى التأكد من جاهزية المحطات.',
      priority: 'important',
      timestamp: new Date(Date.now() - 25 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voiceDurationSeconds: 14,
      acknowledgedBy: ['emp-chef-1', 'emp-waiter-1', 'emp-cashier-1'],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice recording timer simulation
  useEffect(() => {
    let timer: any;
    if (isVoiceRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isVoiceRecording]);

  const channels: { id: ChannelId; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'all', label: language === 'ar' ? 'البث العام (الكل)' : 'All Broadcast', icon: Radio, color: 'text-amber-400' },
    { id: 'kitchen', label: language === 'ar' ? 'المطبخ والشيف' : 'Kitchen Line', icon: Flame, color: 'text-rose-400' },
    { id: 'floor', label: language === 'ar' ? 'الصالة والويترز' : 'Floor & Waiters', icon: Users, color: 'text-sky-400' },
    { id: 'cashier', label: language === 'ar' ? 'الكاشير والمحاسبة' : 'Cashier Desk', icon: Bell, color: 'text-emerald-400' },
    { id: 'management', label: language === 'ar' ? 'الإدارة والمشرفين' : 'Management', icon: ShieldAlert, color: 'text-purple-400' },
  ];

  // Quick Preset Dispatch Actions
  const presetAlerts = [
    { id: 'water', label: 'طاولة تطلب ماء وضيافة 💧', channel: 'floor' as ChannelId, priority: 'normal' as const, template: 'طاولة [TABLE] تطلب ماء وضيافة فورية.' },
    { id: 'discount', label: 'موافقة مدير على خصم ⚠️', channel: 'management' as ChannelId, priority: 'important' as const, template: 'مطلوب موافقة مدير الصالة على تطبيق خصم خاص لطاولة [TABLE].' },
    { id: 'ready', label: 'الطلب جاهز للاستلام 🍲', channel: 'floor' as ChannelId, priority: 'urgent' as const, template: 'طلب طاولة [TABLE] جاهز في نافذة المطبخ للاستلام والتسليم!' },
    { id: 'clean', label: 'طاولة تحتاج تنظيف 🧹', channel: 'floor' as ChannelId, priority: 'normal' as const, template: 'طاولة [TABLE] غادر العميل وتحتاج تنظيف وتجهيز سريع.' },
    { id: 'rush', label: 'ضغط عالي في الشواية 🔥', channel: 'kitchen' as ChannelId, priority: 'urgent' as const, template: 'تنبيه: ضغط عالي في محطة الشواية - يرجى توجيه الطلبات للباستا والبيتزا.' },
    { id: 'bar', label: 'نفاد الثلج في البار 🧊', channel: 'all' as ChannelId, priority: 'important' as const, template: 'طلب عاجل: نفاد الثلج في بار المشروبات - يرجى تزويد البار فوراً.' },
  ];

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    playSound('pop');

    const newMsg: IntercomMessage = {
      id: 'msg-' + Date.now(),
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: activeUser.role as any,
      senderAvatar: activeUser.avatar,
      channel: activeChannel,
      content: messageText.trim(),
      priority: messagePriority,
      tableNumber: attachedTable || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      acknowledgedBy: [],
    };

    setMessages((prev) => [...prev, newMsg]);
    setMessageText('');
    setAttachedTable('');
    setMessagePriority('normal');
  };

  const handleSendVoiceNote = () => {
    playSound('kitchen-bell');
    setIsVoiceRecording(false);

    const newMsg: IntercomMessage = {
      id: 'msg-' + Date.now(),
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: activeUser.role as any,
      senderAvatar: activeUser.avatar,
      channel: activeChannel,
      content: language === 'ar' ? 'رسالة صوتية مسجلة 🎙️' : 'Recorded Voice Note 🎙️',
      priority: 'important',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      voiceDurationSeconds: Math.max(3, recordingSeconds),
      acknowledgedBy: [],
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  const handleDispatchPresetAlert = (preset: typeof presetAlerts[0]) => {
    playSound('alert');
    const content = preset.template.replace('[TABLE]', quickActionTable);

    const newMsg: IntercomMessage = {
      id: 'msg-' + Date.now(),
      senderId: activeUser.id,
      senderName: activeUser.name,
      senderRole: activeUser.role as any,
      senderAvatar: activeUser.avatar,
      channel: preset.channel,
      content,
      priority: preset.priority,
      tableNumber: quickActionTable,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPreset: true,
      acknowledgedBy: [],
    };

    setMessages((prev) => [...prev, newMsg]);
    setSelectedQuickAction(null);
  };

  const handleAcknowledge = (msgId: string) => {
    playSound('tap');
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          const ack = msg.acknowledgedBy || [];
          if (!ack.includes(activeUser.id)) {
            return { ...msg, acknowledgedBy: [...ack, activeUser.id] };
          }
        }
        return msg;
      })
    );
  };

  // Filter messages
  const filteredMessages = messages.filter((msg) => {
    const matchesChannel = activeChannel === 'all' || msg.channel === activeChannel || msg.channel === 'all';
    const matchesPriority = priorityFilter === 'all' || msg.priority === 'urgent';
    return matchesChannel && matchesPriority;
  });

  // Active roster
  const staffRoster = [
    { id: 'emp-1', name: 'الشيف جان مارك', role: 'رئيس الطهاة', status: 'kitchen', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150&auto=format&fit=crop&q=80' },
    { id: 'emp-2', name: 'أحمد الشريف', role: 'كاشير رئيسي', status: 'active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'emp-3', name: 'خالد الغامدي', role: 'ويتر الصالة الرئيسية', status: 'active', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 'emp-4', name: 'نورة القحطاني', role: 'ويتر التراس والـ VIP', status: 'break', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 'emp-5', name: 'سارة العنزي', role: 'مدير الصالة والعمليات', status: 'active', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden select-none">
      {/* Header Bar */}
      <div className="p-3 border-b border-white/5 flex items-center justify-between gap-3 bg-surface/50 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>{language === 'ar' ? 'مركز التواصل الداخلي للطاقم (Staff Intercom)' : 'Staff Intercom & Alerts'}</span>
              <Badge variant="emerald" size="sm" dot>
                {language === 'ar' ? 'متصل ومباشر' : 'Live Online'}
              </Badge>
            </h2>
            <div className="text-[10px] text-slate-400">
              {language === 'ar' ? 'تنسيق فوري بين الكاشير، الشيف في المطبخ، والويتر بالصالة' : 'Live Walkie-Talkie & Instant Dispatch'}
            </div>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('tap');
              setPriorityFilter((p) => (p === 'all' ? 'urgent' : 'all'));
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              priorityFilter === 'urgent'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'العواجل فقط' : 'Urgent Only'}</span>
          </button>
        </div>
      </div>

      {/* Preset 1-Tap Quick Action Dispatch Carousel */}
      <div className="p-2.5 border-b border-white/5 bg-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 shrink-0 ps-1">
          <Zap className="w-3.5 h-3.5" />
          {language === 'ar' ? 'إرسال سريع:' : 'Quick Dispatch:'}
        </span>
        {presetAlerts.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              playSound('tap');
              setSelectedQuickAction(preset.id);
            }}
            className="px-3 py-1.5 rounded-xl bg-surface/70 hover:bg-surface border border-white/10 hover:border-amber-500/40 text-xs font-bold text-slate-200 whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
          >
            <span>{preset.label}</span>
          </button>
        ))}
      </div>

      {/* Main Split Body: Channels & Chat on Left/Center, On-Duty Staff on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Channel Selector & Live Stream */}
        <div className="flex-1 flex flex-col overflow-hidden border-e border-white/5">
          {/* Channel Tabs */}
          <div className="p-2.5 border-b border-white/5 flex items-center gap-1.5 overflow-x-auto custom-scrollbar bg-surface/30">
            {channels.map((ch) => {
              const Icon = ch.icon;
              const isSelected = activeChannel === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    playSound('tap');
                    setActiveChannel(ch.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : ch.color}`} />
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar bg-background/40">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                {language === 'ar' ? 'لا توجد رسائل في هذه القناة حتى الآن' : 'No messages in this channel yet'}
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isUrgent = msg.priority === 'urgent';
                const isImportant = msg.priority === 'important';
                const hasAcknowledged = msg.acknowledgedBy?.includes(activeUser.id);

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3.5 rounded-2xl border text-start space-y-2 transition-all ${
                      isUrgent
                        ? 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-500/5'
                        : isImportant
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : 'bg-surface/70 border-white/5'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-7 h-7 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <div className="text-xs font-black text-white flex items-center gap-1.5">
                            <span>{msg.senderName}</span>
                            {msg.tableNumber && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold">
                                طاولة {msg.tableNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isUrgent && (
                          <Badge variant="rose" size="sm" dot>
                            {language === 'ar' ? 'عاجل فوري' : 'Urgent'}
                          </Badge>
                        )}
                        {isImportant && (
                          <Badge variant="amber" size="sm">
                            {language === 'ar' ? 'تنبيه هام' : 'Important'}
                          </Badge>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Content / Voice Note Player */}
                    {msg.voiceDurationSeconds ? (
                      <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                        <button
                          onClick={() => playSound('pop')}
                          className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold hover:scale-105 transition-transform"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                        <div className="flex-1 flex items-center gap-1">
                          {/* Animated sound wave bars */}
                          {[16, 28, 12, 32, 20, 36, 14, 24, 18, 30, 22, 16].map((h, i) => (
                            <span
                              key={i}
                              style={{ height: `${h}px` }}
                              className="w-1 rounded-full bg-amber-400/70 animate-pulse"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          0:{msg.voiceDurationSeconds < 10 ? `0${msg.voiceDurationSeconds}` : msg.voiceDurationSeconds}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-200 leading-relaxed font-medium">
                        {msg.content}
                      </div>
                    )}

                    {/* Footer Actions / Reactions */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px]">
                      <button
                        onClick={() => handleAcknowledge(msg.id)}
                        className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                          hasAcknowledged
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{hasAcknowledged ? (language === 'ar' ? 'تم التنفيذ والتأكيد' : 'Acknowledged') : (language === 'ar' ? 'تأكيد الاستلام' : 'Acknowledge')}</span>
                      </button>

                      {msg.acknowledgedBy && msg.acknowledgedBy.length > 0 && (
                        <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>تم التأكيد ({msg.acknowledgedBy.length})</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer Bar */}
          <div className="p-3 border-t border-white/5 bg-surface/80 backdrop-blur-xl space-y-2">
            {/* Priority & Table Attachment Selector */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">{language === 'ar' ? 'الأولوية:' : 'Priority:'}</span>
                <button
                  onClick={() => setMessagePriority('normal')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    messagePriority === 'normal' ? 'bg-sky-500 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {language === 'ar' ? 'عادي' : 'Normal'}
                </button>
                <button
                  onClick={() => setMessagePriority('important')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    messagePriority === 'important' ? 'bg-amber-500 text-slate-950' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {language === 'ar' ? 'هام' : 'Important'}
                </button>
                <button
                  onClick={() => setMessagePriority('urgent')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    messagePriority === 'urgent' ? 'bg-rose-500 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {language === 'ar' ? 'عاجل' : 'Urgent'}
                </button>
              </div>

              {/* Table Selector */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">{language === 'ar' ? 'إرفاق طاولة:' : 'Table:'}</span>
                <select
                  value={attachedTable}
                  onChange={(e) => setAttachedTable(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                >
                  <option value="" className="bg-slate-900">بدون</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.tableNumber} className="bg-slate-900">
                      {t.tableNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input & Voice Recording Controls */}
            <div className="flex items-center gap-2">
              {isVoiceRecording ? (
                <div className="flex-1 px-4 py-2 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-black">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span>جاري التسجيل الصوتي... ({recordingSeconds} ثانية)</span>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleSendVoiceNote}
                    className="rounded-xl text-xs font-black"
                  >
                    إرسال التسجيل
                  </Button>
                </div>
              ) : (
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    language === 'ar'
                      ? `اكتب تنبيهاً أو رسالة لقناة [${channels.find((c) => c.id === activeChannel)?.label}]...`
                      : 'Type a broadcast message...'
                  }
                  className="flex-1 rounded-2xl px-4 py-2.5 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500/50"
                />
              )}

              {/* Mic Record Button */}
              <button
                onClick={() => {
                  playSound('tap');
                  setIsVoiceRecording(!isVoiceRecording);
                }}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isVoiceRecording
                    ? 'bg-rose-500 text-white border-rose-400'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                }`}
                title="تسجيل رسالة صوتية سريعة"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send Button */}
              {!isVoiceRecording && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="rounded-2xl gap-1.5 font-black text-xs shadow-lg shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'ar' ? 'إرسال' : 'Send'}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Active Roster & Direct Staff Pings */}
        <div className="hidden lg:flex w-72 flex-col overflow-hidden bg-surface/30">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'طاقم العمل المناوب' : 'Staff on Duty'}</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono font-bold">5 متصل</span>
          </div>

          {/* Staff Roster List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {staffRoster.map((staff) => (
              <div
                key={staff.id}
                className="p-2.5 rounded-2xl bg-surface/60 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                    />
                    <span
                      className={`absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                        staff.status === 'active' || staff.status === 'kitchen'
                          ? 'bg-emerald-400'
                          : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="text-start truncate">
                    <div className="text-xs font-black text-white truncate">
                      {staff.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {staff.role}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('tap');
                    setMessageText(`@${staff.name} `);
                  }}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300"
                  title="نداء مباشر"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Table Picker Modal */}
      {selectedQuickAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setSelectedQuickAction(null)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-3xl glass-panel-elevated p-5 shadow-2xl z-10 border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white">
                {language === 'ar' ? 'حدد رقم الطاولة للتنبيه' : 'Select Target Table'}
              </h3>
              <button onClick={() => setSelectedQuickAction(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-start">
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {tables.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setQuickActionTable(t.tableNumber)}
                    className={`p-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      quickActionTable === t.tableNumber
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {t.tableNumber}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                const preset = presetAlerts.find((p) => p.id === selectedQuickAction);
                if (preset) handleDispatchPresetAlert(preset);
              }}
              className="w-full rounded-2xl font-black text-xs"
            >
              {language === 'ar' ? `إرسال التنبيه لطاولة (${quickActionTable})` : 'Dispatch Alert'}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
