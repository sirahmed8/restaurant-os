/**
 * =====================================================================
 * RESTAURANT OS — AI INTELLIGENCE & COPILOT STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import {
  aiRouter,
  ParsedVoiceOrderResult,
  BCGAnalysisResult,
  DynamicPricingSuggestion,
  InvoiceOCRResult,
} from '../services/aiRouter';
import { weatherService, WeatherData } from '../services/weatherService';
import { db } from '../db';
import { useMenuStore } from './useMenuStore';
import { useOrderStore } from './useOrderStore';

interface AIState {
  // Voice Assistant
  isListening: boolean;
  voiceTranscript: string;
  parsedVoiceOrder: ParsedVoiceOrderResult | null;
  isProcessingVoice: boolean;

  // Weather & Dynamic Suggestions
  weather: WeatherData | null;
  pricingSuggestions: DynamicPricingSuggestion[];
  bcgAnalysis: BCGAnalysisResult | null;

  // OCR
  isProcessingInvoice: boolean;
  lastInvoiceOCR: InvoiceOCRResult | null;

  // General AI Status
  activeProvider: string;
  isGenerating: boolean;

  // Actions
  startVoiceListening: () => void;
  stopVoiceListening: () => void;
  parseVoiceTranscript: (transcript: string) => Promise<ParsedVoiceOrderResult | null>;
  applyVoiceOrderToCart: () => void;

  fetchWeatherAndSuggestions: () => Promise<void>;
  generateBCGAnalysis: () => Promise<void>;
  processInvoiceImage: (imageBase64: string) => Promise<InvoiceOCRResult | null>;
}

let recognitionInstance: any = null;

export const useAIStore = create<AIState>((set, get) => ({
  isListening: false,
  voiceTranscript: '',
  parsedVoiceOrder: null,
  isProcessingVoice: false,
  weather: null,
  pricingSuggestions: [],
  bcgAnalysis: null,
  isProcessingInvoice: false,
  lastInvoiceOCR: null,
  activeProvider: aiRouter.getActiveProvider(),
  isGenerating: false,

  startVoiceListening: () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('المتصفح لا يدعم التعرف الصوتي المباشر. يمكنك كتابة النص وسيقوم الذكاء الاصطناعي بتحليله فوراً.');
      return;
    }

    try {
      if (recognitionInstance) {
        recognitionInstance.abort();
      }

      recognitionInstance = new SpeechRecognition();
      recognitionInstance.lang = 'ar-SA';
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;

      recognitionInstance.onstart = () => {
        set({ isListening: true, voiceTranscript: '' });
      };

      recognitionInstance.onresult = (event: any) => {
        let currentText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        set({ voiceTranscript: currentText });
      };

      recognitionInstance.onerror = (err: any) => {
        console.error('[AI Voice] Recognition error:', err);
        set({ isListening: false });
      };

      recognitionInstance.onend = () => {
        set({ isListening: false });
        const transcript = get().voiceTranscript;
        if (transcript.trim()) {
          get().parseVoiceTranscript(transcript);
        }
      };

      recognitionInstance.start();
    } catch (e) {
      console.error('[AI Voice] Start failed:', e);
      set({ isListening: false });
    }
  },

  stopVoiceListening: () => {
    if (recognitionInstance) {
      recognitionInstance.stop();
    }
    set({ isListening: false });
  },

  parseVoiceTranscript: async (transcript: string) => {
    set({ isProcessingVoice: true });
    try {
      const items = useMenuStore.getState().items;
      const result = await aiRouter.parseVoiceOrder(transcript, items);
      set({
        parsedVoiceOrder: result,
        isProcessingVoice: false,
        activeProvider: aiRouter.getActiveProvider(),
      });
      return result;
    } catch (err) {
      console.error('[useAIStore] Voice parse error:', err);
      set({ isProcessingVoice: false });
      return null;
    }
  },

  applyVoiceOrderToCart: () => {
    const { parsedVoiceOrder } = get();
    if (!parsedVoiceOrder) return;

    const menuItems = useMenuStore.getState().items;
    const orderStore = useOrderStore.getState();

    parsedVoiceOrder.items.forEach((item) => {
      const found = menuItems.find((m) => m.id === item.menuItemId || m.nameAr.includes(item.name));
      if (found) {
        orderStore.addItemToCart(found, [], item.notes, item.quantity);
      }
    });

    if (parsedVoiceOrder.customerNotes) {
      orderStore.setCustomerNotes(parsedVoiceOrder.customerNotes);
    }
  },

  fetchWeatherAndSuggestions: async () => {
    try {
      const weather = await weatherService.getCurrentWeather();
      const items = useMenuStore.getState().items;
      const suggestions = await aiRouter.suggestDynamicPricing(items, {
        temperature: weather.temperature,
        condition: weather.conditionAr,
        city: weather.city,
      });

      set({ weather, pricingSuggestions: suggestions });
    } catch (e) {
      console.error('[useAIStore] Weather suggestions error:', e);
    }
  },

  generateBCGAnalysis: async () => {
    set({ isGenerating: true });
    try {
      const items = useMenuStore.getState().items;
      const analysis = await aiRouter.analyzeBCGMatrix(items, {});
      set({ bcgAnalysis: analysis, isGenerating: false });
    } catch (e) {
      console.error('[useAIStore] BCG generation error:', e);
      set({ isGenerating: false });
    }
  },

  processInvoiceImage: async (imageBase64: string) => {
    set({ isProcessingInvoice: true });
    try {
      const inventory = await db.getAll('inventoryItems');
      const ocrResult = await aiRouter.parseSupplierInvoice(imageBase64, inventory);
      set({ lastInvoiceOCR: ocrResult, isProcessingInvoice: false });
      return ocrResult;
    } catch (e) {
      console.error('[useAIStore] Invoice OCR error:', e);
      set({ isProcessingInvoice: false });
      return null;
    }
  },
}));
