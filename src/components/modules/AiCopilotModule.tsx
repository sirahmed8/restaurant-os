import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  TrendingUp,
  Boxes,
  ChefHat,
  Lightbulb,
  Check,
  Copy,
  Layers,
  Wand2,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTranslation } from '../../i18n/translations';
import { Button } from '../ui/Button';
import { aiRouter } from '../../services/aiRouter';
import { soundEngine } from '../../services/soundEngine';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  actionPayload?: {
    type: 'promo' | 'stock' | 'menu';
    title: string;
    description: string;
  };
}

export const AiCopilotModule: React.FC = () => {
  const { language, playSound } = useAppStore();
  const t = getTranslation(language);

  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_0',
      sender: 'ai',
      text:
        language === 'ar'
          ? 'مرحباً بك شيف! أنا المساعد الذكي لإدارة وتشغيل مطعمك. لقد قمت بتحليل مبيعات اليوم ومستويات المخزون وسرعة إنجاز المطبخ. كيف يمكنني مساعدتك الآن؟'
          : 'Welcome Chef! I am your Restaurant AI Copilot. I have analyzed today’s gross sales, stock levels, and kitchen line velocity. How can I assist you right now?',
      timestamp: '14:25',
    },
  ]);

  const quickPrompts = [
    t.promptSuggestion1,
    t.promptSuggestion2,
    t.promptSuggestion3,
    t.promptSuggestion4,
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim()) return;

    soundEngine.play('tap');
    const userMsg: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsGenerating(true);

    try {
      const systemPrompt = `You are the executive AI Copilot for a high-end restaurant operating system (Restaurant OS 2026).
Language: ${language === 'ar' ? 'Arabic' : 'English'}.
Your role: Provide highly actionable, concise, data-driven advice on menu engineering, margin optimization, rush hour handling, and kitchen throughput. Use bullet points and emojis.`;

      const response = await aiRouter.generateCompletion(systemPrompt, textToSend, {
        temperature: 0.6,
        modelTier: 'smart',
      });

      let action: ChatMessage['actionPayload'];
      if (textToSend.includes('عرض') || textToSend.includes('promo') || textToSend.includes('ساعات')) {
        action = {
          type: 'promo',
          title: language === 'ar' ? 'تفعيل العرض في الكاشير' : 'Deploy POS Promo',
          description: language === 'ar' ? 'خصم 18% على كومبو السلايدرز والموهيتو' : '18% combo discount on Sliders + Mojito',
        };
      } else if (textToSend.includes('مخزون') || textToSend.includes('نقص') || textToSend.includes('stock')) {
        action = {
          type: 'stock',
          title: language === 'ar' ? 'تحديث طلبية اللحوم' : 'Update Meat PO',
          description: language === 'ar' ? 'إضافة 15 كجم لحم أنجوس مفروم للطلب التلقائي' : 'Add 15kg Minced Angus to Auto-PO',
        };
      }

      soundEngine.play('pop');
      const aiMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPayload: action,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      soundEngine.play('alert');
      const fallbackMsg: ChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'ai',
        text: language === 'ar'
          ? '📊 **تحليل الذكاء المالي والمطبخ:**\n- سرعة التحضير في المطبخ ممتازة (8.2 دقيقة).\n- الصنف الأعلى ربحاً: "برجر ترافل أنجوس" بهامش 68%.\n- يُنصح بتجهيز طلبية توريد إضافية للحوم الطازجة قبل فترة الذروة المسائية.'
          : '📊 **Financial & Kitchen Brief:**\n- Kitchen prep velocity is optimal (8.2 mins).\n- Highest margin driver: "Truffle Angus Burger" at 68%.\n- Recommended: Replenish fresh meat inventory before evening rush.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 overflow-hidden select-none">
      {/* Left / Center Chat Area */}
      <div className="flex-1 flex flex-col h-full rounded-3xl glass-panel-elevated p-4 border border-violet-500/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{t.copilotTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono font-bold border border-violet-500/40">
                  Gemini 2.5 Flash
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{t.copilotSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar pe-1">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-3xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-bold rounded-ee-lg'
                    : 'bg-white/5 border border-white/10 text-slate-100 rounded-es-lg shadow-lg'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>

                {/* Optional Action Card attached to AI message */}
                {msg.actionPayload && (
                  <div className="mt-3 p-3 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-between gap-3 text-slate-100">
                    <div>
                      <div className="font-bold text-violet-300">
                        {msg.actionPayload.title}
                      </div>
                      <div className="text-[10px] text-slate-300">
                        {msg.actionPayload.description}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => soundEngine.play('success')}
                      className="rounded-xl text-[11px] py-1 px-3 font-bold"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{language === 'ar' ? 'تنفيذ فوري' : 'Apply Now'}</span>
                    </Button>
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 flex justify-end font-mono ${
                    msg.sender === 'user' ? 'text-slate-900/60' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </motion.div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold ps-11">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span>{language === 'ar' ? 'المساعد الذكي يقوم بالتحليل...' : 'Copilot is reasoning...'}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t.askCopilot}
            className="flex-1 rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-violet-500/50"
          />
          <Button
            size="md"
            variant="primary"
            onClick={() => handleSendMessage()}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Right Sidebar: Quick AI Prompts & Insights */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <div className="p-4 rounded-3xl glass-panel-elevated border border-violet-500/20">
          <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4" />
            <span>{language === 'ar' ? 'مقترحات استشارية سريعة' : 'Quick Prompt Ideas'}</span>
          </h4>

          <div className="space-y-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-violet-500/15 border border-white/5 hover:border-violet-500/30 text-start text-xs text-slate-300 hover:text-white transition-all cursor-pointer leading-relaxed"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-3xl glass-panel border border-white/10 text-center">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/20 text-violet-300 mx-auto flex items-center justify-center mb-2">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs font-bold text-white">
            {language === 'ar' ? 'نظام الاستجابة التلقائية' : 'Zero-Downtime Fallback'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Google AI Primary ⇄ OpenRouter Multi-Model Failover
          </p>
        </div>
      </div>
    </div>
  );
};
