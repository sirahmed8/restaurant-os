import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  Send,
  Mic,
  MicOff,
  X,
  Plus,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Receipt,
  Store,
  ChefHat,
  CreditCard,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  TableProperties,
  Utensils,
  Search,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { usePosStore } from '../../stores/usePosStore';
import { useOrderStore } from '../../stores/useOrderStore';
import { useTableStore } from '../../stores/useTableStore';
import { useShiftStore } from '../../stores/useShiftStore';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { aiRouter } from '../../services/aiRouter';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionTaken?: {
    type: 'add_to_cart' | 'apply_discount' | 'check_sales' | 'check_stock' | 'table_assigned';
    description: string;
  };
}

export const GlobalAIChatbot: React.FC = () => {
  const {
    language,
    playSound,
    activeUser,
    theme,
    isRegistered,
    appMode,
    isAiAssistantPaid,
  } = useAppStore();

  const { items, addToCart, cart, clearCart } = usePosStore();
  const { activeOrders } = useOrderStore();
  const { currentShift } = useShiftStore();
  const { items: inventoryItems } = useInventoryStore();

  // RULE 1: Never render on the Welcome Landing Screen before login
  if (!isRegistered) {
    return null;
  }

  // RULE 2: If the business owner has NOT paid for the AI assistant, it must NOT appear
  if (!isAiAssistantPaid) {
    return null;
  }

  // Automatic Persona Detection based on logged in user role & appMode (NO MANUAL TABS!)
  const isCustomer = appMode === 'customer' || activeUser?.role === 'customer';
  const isCashier = appMode === 'cashier' || activeUser?.role === 'cashier' || (activeUser?.role as any) === 'senior_cashier';
  const isAdminOrOwner = appMode === 'owner' || activeUser?.role === 'admin' || (activeUser?.role as any) === 'owner';

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Dynamic automatic greeting based on who is logged in
  const getInitialGreeting = () => {
    if (isCustomer) {
      return language === 'ar'
        ? 'أهلاً بك يا فنان! 🍔 أنا المساعد الذكي لمطعمك. اطلب أي وجبة صوتياً أو كتابياً وسأضيفها فوراً لسلتك!'
        : 'Welcome! 🍔 I am your Food AI Assistant. Speak or type what you crave, and I will prepare your order!';
    }
    if (isCashier) {
      return language === 'ar'
        ? 'مرحباً كاشير! 🧑‍💼 أنا مساعد نقطة البيع السريعة. املي عليّ أصناف الزبون وسأقوم بإدراجها في شاشة الكاشير فوراً.'
        : 'Hello Cashier! 🧑‍💼 I am your POS Speed Assistant. Dictate orders and I will add items to the cart instantly.';
    }
    return language === 'ar'
      ? 'مرحباً بك يا مدير! 👑 أنا المساعد الذكي لإدارة المطعم. جاهز لفحص المبيعات، مراقبة المخزون والنواقص، وتقديم التوصيات المالية.'
      : 'Welcome Manager! 👑 I am your Executive AI Copilot. Ready to audit sales, monitor inventory levels, and give revenue insights.';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: getInitialGreeting(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Voice Recognition Handler (Speech-to-Text)
  const toggleVoiceListening = () => {
    if (isListening) {
      setIsListening(false);
      playSound('pop');
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(language === 'ar' ? 'التعرف الصوتي غير مدعوم في هذا المتصفح' : 'Speech recognition not supported in this browser');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        playSound('kitchen-bell');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        playSound('pop');
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Process User Input through Natural Language Actions
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    playSound('tap');
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Analyze text and execute contextual restaurant action
    setTimeout(async () => {
      let replyText = '';
      let actionTaken: ChatMessage['actionTaken'];

      const lower = text.toLowerCase();

      // 1. Sales & Revenue Query (for staff / admins)
      if ((lower.includes('مبيعات') || lower.includes('ارباح') || lower.includes('sales') || lower.includes('revenue')) && !isCustomer) {
        const totalSales = currentShift?.salesSummary?.grossSales || 0;
        const ordersCount = currentShift?.salesSummary?.ordersCount || 0;
        replyText = language === 'ar'
          ? `إجمالي مبيعات الوردية الحالية: ${totalSales.toFixed(2)} ج.م عبر ${ordersCount} طلبات.`
          : `Current shift gross sales: ${totalSales.toFixed(2)} EGP across ${ordersCount} orders.`;
        actionTaken = { type: 'check_sales', description: 'كشف مبيعات الوردية الحالية' };
      }
      // 2. Inventory Low Stock Query
      else if ((lower.includes('مخزن') || lower.includes('نواقص') || lower.includes('stock') || lower.includes('inventory')) && !isCustomer) {
        const lowItems = inventoryItems.filter((i) => i.currentStock <= i.minStockAlert);
        if (lowItems.length > 0) {
          replyText = language === 'ar'
            ? `⚠️ تم رصد ${lowItems.length} أصناف وصلت لحد إعادة الطلب: ${lowItems.map((i) => i.nameAr).join('، ')}.`
            : `⚠️ Detected ${lowItems.length} items reaching reorder threshold.`;
        } else {
          replyText = language === 'ar' ? '✅ حالة المخزون ممتازة ولا توجد أصناف تحت حد النواقص.' : '✅ Inventory levels are healthy.';
        }
        actionTaken = { type: 'check_stock', description: 'تدقيق أرصدة المخزون' };
      }
      // 3. Clear Cart
      else if (lower.includes('تفريغ') || lower.includes('امسح السلة') || lower.includes('clear cart')) {
        clearCart();
        replyText = language === 'ar' ? 'تم تفريغ السلة بالكامل بنجاح.' : 'Cart cleared successfully.';
      }
      // 4. Order Item Execution
      else {
        // Find matching item in menu
        const foundItem = items.find((i) =>
          text.includes(i.name) || text.includes(i.nameEn) || (i.category && text.includes(i.category))
        );

        if (foundItem) {
          let qty = 1;
          const matchQty = text.match(/\b(\d+)\b/);
          if (matchQty) qty = parseInt(matchQty[1], 10);
          if (text.includes('واحد') || text.includes('1')) qty = 1;
          if (text.includes('اتنين') || text.includes('2') || text.includes('زوج')) qty = 2;

          addToCart(foundItem, qty);
          playSound('success');

          replyText = isCustomer
            ? (language === 'ar'
                ? `✅ تم إضافة ${qty}x ${foundItem.name} إلى سلة مشترياتك! السعر: ${(foundItem.price * qty).toFixed(2)} ج.م.`
                : `✅ Added ${qty}x ${foundItem.nameEn} to your food cart!`)
            : (language === 'ar'
                ? `✅ تم إضافة ${qty}x ${foundItem.name} إلى سلة الكاشير مباشرة بسعر ${(foundItem.price * qty).toFixed(2)} ج.م.`
                : `✅ Added ${qty}x ${foundItem.nameEn} to POS cart.`);

          actionTaken = {
            type: 'add_to_cart',
            description: `إضافة ${qty}x ${foundItem.name} إلى السلة`,
          };
        } else {
          // General AI completion with fallback
          try {
            const aiResponse = await aiRouter.generateCompletion(
              isCustomer
                ? 'You are a warm food assistant for a gourmet restaurant. Suggest delicious dishes and help customer order.'
                : isCashier
                ? 'You are a POS fast assistant for the cashier. Be concise and fast.'
                : 'You are an AI Restaurant Management Assistant. Answer concisely with actionable restaurant operations advice.',
              text,
              { jsonMode: false }
            );
            replyText = typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse);
          } catch (e) {
            replyText = isCustomer
              ? (language === 'ar' ? 'أهلاً بك! يمكنك إخباري بطلبك مثل: "أضف برجر أنجوس" أو "اقترح لي أطباق اليوم".' : 'Tell me what dish you would like to order.')
              : (language === 'ar' ? 'جاهز للمساعدة! قل اسم الصنف لإضافته للكاشير أو اطلب كشف المبيعات.' : 'Ready to help! Name an item or ask for sales.');
          }
        }
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_ai_' + Date.now(),
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionTaken,
        },
      ]);
    }, 400);
  };

  return (
    <>
      {/* Floating AI Button (Visible ONLY when registered and paid) */}
      <div className="fixed bottom-6 end-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playSound('pop');
            setIsOpen(!isOpen);
          }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 text-white shadow-2xl flex items-center justify-center cursor-pointer border-2 border-white/20"
          title={isCustomer ? 'مساعد طلب الوجبات الذكي' : isCashier ? 'مساعد الكاشير الذكي' : 'مساعد الإدارة الذكي'}
        >
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -end-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
        </motion.button>
      </div>

      {/* Floating Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 end-6 z-50 w-full max-w-sm sm:max-w-md h-[560px] bg-white dark:bg-[#0c0f17] border border-slate-200 dark:border-purple-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Header (Tailored automatically to current role) */}
            <div className="p-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-xs font-black">
                    {isCustomer
                      ? 'مساعد طلب الطعام الذكي 🍔'
                      : isCashier
                      ? 'مساعد الكاشير الصوتي 🧑‍💼'
                      : 'مساعد إدارة المطعم الذكي 👑'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-200">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span>Google Gemini 2.5 Real-time</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Context Action Chips (Auto-loaded based on role) */}
            <div className="p-2.5 bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10 flex gap-2 overflow-x-auto no-scrollbar text-[10px]">
              {isCustomer ? (
                <>
                  <button
                    onClick={() => handleSendMessage(language === 'ar' ? 'اقترح لي وجبة فاخرة مشويات' : 'Recommend a grill meal')}
                    className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 hover:bg-amber-500/20 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    🥩 وجبة مشويات
                  </button>
                  <button
                    onClick={() => handleSendMessage(language === 'ar' ? 'ايه عروض اليوم المتوفرة؟' : 'What offers are available?')}
                    className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 hover:bg-amber-500/20 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    🔥 عروض اليوم
                  </button>
                </>
              ) : isCashier ? (
                <>
                  <button
                    onClick={() => handleSendMessage(language === 'ar' ? 'أضف 2 برجر أنجوس وبطاطس' : 'Add 2 Angus burgers')}
                    className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 hover:bg-emerald-500/20 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    🍔 تسجيل طلب سريع
                  </button>
                  <button
                    onClick={() => handleSendMessage(language === 'ar' ? 'تفريغ السلة' : 'Clear cart')}
                    className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 hover:bg-rose-500/20 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    🗑️ تفريغ السلة
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSendMessage(language === 'ar' ? 'كم إجمالي مبيعات اليوم؟' : 'Today sales summary')}
                    className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 hover:bg-amber-500/20 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    📊 كشف المبيعات
                  </button>
                  <button
                    onClick={() => handleSendMessage(language === 'ar' ? 'فحص نواقص المخزون' : 'Check low stock')}
                    className="px-3 py-1 rounded-full bg-slate-200 dark:bg-white/5 hover:bg-amber-500/20 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all cursor-pointer"
                  >
                    📦 نواقص المخزن
                  </button>
                </>
              )}
            </div>

            {/* Chat Messages List */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      m.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {m.text}

                    {m.actionTaken && (
                      <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{m.actionTaken.description}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.04] w-20">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input & Voice Bar */}
            <div className="p-3 bg-white dark:bg-[#07090f] border-t border-slate-200 dark:border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceListening}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                    : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
                title="تحدث بالصوت / Voice Input"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isCustomer
                    ? (language === 'ar' ? 'اطلب وجبتك أو اسأل عن المنيو...' : 'Order food or ask for dishes...')
                    : isCashier
                    ? (language === 'ar' ? 'اكتب الطلب أو استخدم المايك...' : 'Type order or use mic...')
                    : (language === 'ar' ? 'اسأل عن المبيعات أو المخزون...' : 'Query sales or inventory...')
                }
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
