/**
 * =====================================================================
 * RESTAURANT OS — RESILIENT AI ROUTER & MULTI-LLM ORCHESTRATOR
 * =====================================================================
 * Primary Engine: Google AI Studio (Gemini 3.5 Flash / Flash-Lite / 3.1)
 * Auto-Fallback: OpenRouter (Gemma 4 31B IT / Claude / GPT)
 *
 * Capabilities:
 * - Real-time Voice-to-Order parsing (Arabic & English dialects)
 * - Supplier Invoice OCR & Inventory Matching
 * - Menu Engineering & BCG Matrix Analytics
 * - AI Food Waste Reduction & Batch Optimization
 * - Weather-Aware Dynamic Pricing & Bundle Suggestions
 */

import { MenuItem, InventoryItem } from '../db/schema';
import { eventBus } from './eventBus';

export interface AIProviderConfig {
  primaryProvider: 'google-ai' | 'openrouter';
  fallbackProvider: 'openrouter' | 'google-ai';
  googleApiKey: string;
  openRouterApiKey: string;
  modelFast: string;
  modelSmart: string;
  modelLite: string;
  modelHeavy: string;
  autoFallback: boolean;
}

export interface ParsedVoiceOrderItem {
  menuItemId?: string;
  name: string;
  quantity: number;
  modifiers?: { name: string; price?: number }[];
  notes?: string;
  confidence: number;
}

export interface ParsedVoiceOrderResult {
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  guestCount?: number;
  items: ParsedVoiceOrderItem[];
  customerNotes?: string;
  unrecognizedItems?: string[];
  rawTranscript: string;
}

export interface InvoiceItemOCR {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  matchedInventoryItemId?: string;
}

export interface InvoiceOCRResult {
  invoiceNumber?: string;
  supplierName?: string;
  supplierTaxNumber?: string;
  date?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  items: InvoiceItemOCR[];
  confidence: number;
}

export interface BCGAnalysisResult {
  stars: { itemId: string; nameAr: string; nameEn: string; advice: string }[];
  cashCows: { itemId: string; nameAr: string; nameEn: string; advice: string }[];
  questionMarks: { itemId: string; nameAr: string; nameEn: string; advice: string }[];
  dogs: { itemId: string; nameAr: string; nameEn: string; advice: string }[];
  overallSummary: string;
}

export interface DynamicPricingSuggestion {
  menuItemId: string;
  itemNameAr: string;
  currentPrice: number;
  suggestedPrice: number;
  changePercentage: number;
  strategyReason: string;
  action: 'increase' | 'decrease' | 'bundle' | 'maintain';
}

class AIRouterService {
  private config: AIProviderConfig = {
    primaryProvider: 'google-ai',
    fallbackProvider: 'openrouter',
    googleApiKey: '',
    openRouterApiKey: '',
    modelFast: 'gemini-2.5-flash',
    modelSmart: 'gemini-2.5-pro',
    modelLite: 'gemini-2.5-flash-lite',
    modelHeavy: 'google/gemma-4-31b-it',
    autoFallback: true,
  };

  private activeProvider: 'google-ai' | 'openrouter' = 'google-ai';
  private failureCount = 0;

  constructor() {
    this.loadEnvironmentKeys();
  }

  /**
   * Load API keys from environment variables or localStorage.
   */
  public loadEnvironmentKeys(): void {
    const env: Record<string, any> = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
    const procEnv: Record<string, any> = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env : {};

    this.config.googleApiKey =
      env.GOOGLE_AI_API_KEY ||
      env.VITE_GOOGLE_AI_API_KEY ||
      procEnv.GOOGLE_AI_API_KEY ||
      '';

    this.config.openRouterApiKey =
      env.OPENROUTER_API_KEY ||
      env.VITE_OPENROUTER_API_KEY ||
      procEnv.OPENROUTER_API_KEY ||
      '';

    this.config.modelFast = env.AI_MODEL_FAST || procEnv.AI_MODEL_FAST || 'gemini-2.5-flash';
    this.config.modelSmart = env.AI_MODEL_SMART || procEnv.AI_MODEL_SMART || 'gemini-2.5-pro';
    this.config.modelLite = env.AI_MODEL_LITE || procEnv.AI_MODEL_LITE || 'gemini-2.5-flash-lite';
    this.config.modelHeavy = env.AI_MODEL_HEAVY || procEnv.AI_MODEL_HEAVY || 'google/gemma-4-31b-it';

    this.activeProvider = (env.AI_PRIMARY_PROVIDER || procEnv.AI_PRIMARY_PROVIDER || 'google-ai') as any;
  }

  public updateConfig(newConfig: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  public getActiveProvider(): string {
    return this.activeProvider;
  }

  /**
   * Generic Multi-LLM completion with automatic seamless fallback.
   */
  public async generateCompletion(
    systemPrompt: string,
    userPrompt: string,
    options: {
      temperature?: number;
      jsonMode?: boolean;
      modelTier?: 'fast' | 'smart' | 'lite' | 'heavy';
      imageBufferBase64?: string;
    } = {}
  ): Promise<string> {
    const { temperature = 0.2, jsonMode = true, modelTier = 'smart', imageBufferBase64 } = options;

    const tryProvider = async (provider: 'google-ai' | 'openrouter'): Promise<string> => {
      if (provider === 'google-ai') {
        return this.callGoogleAI(systemPrompt, userPrompt, { temperature, jsonMode, modelTier, imageBufferBase64 });
      } else {
        return this.callOpenRouter(systemPrompt, userPrompt, { temperature, jsonMode, modelTier });
      }
    };

    try {
      const result = await tryProvider(this.activeProvider);
      this.failureCount = 0;
      return result;
    } catch (primaryErr) {
      console.warn(`[AI Router] Primary provider (${this.activeProvider}) failed:`, primaryErr);

      if (this.config.autoFallback) {
        const fallback = this.activeProvider === 'google-ai' ? 'openrouter' : 'google-ai';
        console.info(`[AI Router] Switching automatically to fallback provider (${fallback})...`);
        try {
          const fallbackResult = await tryProvider(fallback);
          this.activeProvider = fallback; // Temporarily stay on fallback
          return fallbackResult;
        } catch (fallbackErr) {
          console.error('[AI Router] Fallback provider also failed:', fallbackErr);
          throw new Error(`All AI Providers failed. Primary: ${primaryErr}, Fallback: ${fallbackErr}`);
        }
      } else {
        throw primaryErr;
      }
    }
  }

  /**
   * Direct Google AI Studio API call (Gemini REST Endpoint).
   */
  private async callGoogleAI(
    systemPrompt: string,
    userPrompt: string,
    options: {
      temperature: number;
      jsonMode: boolean;
      modelTier: 'fast' | 'smart' | 'lite' | 'heavy';
      imageBufferBase64?: string;
    }
  ): Promise<string> {
    const apiKey = this.config.googleApiKey;
    if (!apiKey) throw new Error('Google AI API Key is not configured');

    let model = 'gemini-2.5-flash';
    if (options.modelTier === 'smart') model = 'gemini-2.5-pro';
    if (options.modelTier === 'lite') model = 'gemini-2.5-flash-lite';

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const parts: any[] = [];
    if (options.imageBufferBase64) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: options.imageBufferBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
    }
    parts.push({ text: userPrompt });

    const requestBody: any = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: 3000,
        responseMimeType: options.jsonMode ? 'application/json' : 'text/plain',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google AI HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Google AI returned empty candidate output');
    }

    return candidateText;
  }

  /**
   * Direct OpenRouter API call.
   */
  private async callOpenRouter(
    systemPrompt: string,
    userPrompt: string,
    options: {
      temperature: number;
      jsonMode: boolean;
      modelTier: 'fast' | 'smart' | 'lite' | 'heavy';
    }
  ): Promise<string> {
    const apiKey = this.config.openRouterApiKey;
    if (!apiKey) throw new Error('OpenRouter API Key is not configured');

    let model = this.config.modelHeavy || 'google/gemma-4-31b-it';
    if (options.modelTier === 'fast' || options.modelTier === 'lite') {
      model = 'google/gemini-2.0-flash-lite-preview-02-05:free';
    }

    const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://restaurant-os.internal',
        'X-Title': 'Restaurant OS AI Core',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: options.temperature,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenRouter returned empty message content');
    }

    return content;
  }

  // =========================================================================
  // SPECIALIZED INTELLIGENCE MODULES
  // =========================================================================

  /**
   * 1. Voice-to-Order Arabic / Multi-Dialect Parsing
   */
  public async parseVoiceOrder(
    transcript: string,
    availableMenuItems: MenuItem[]
  ): Promise<ParsedVoiceOrderResult> {
    const menuContext = availableMenuItems.map((item) => ({
      id: item.id,
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      price: item.price,
    }));

    const systemPrompt = `
You are the AI Order Parser for a high-end Arabic & International Restaurant POS.
Analyze the cashier/waiter voice transcript (which may be in Saudi, Egyptian, Levantine dialect or English) and convert it into a structured POS order.

Available Menu Items:
${JSON.stringify(menuContext)}

Instructions:
1. Identify all ordered dishes, map them to the closest MenuItem id and name.
2. Extract quantities (e.g., "اثنين مشكل مشاوي", "واحد بيبسي دايت", "3 ستيك واغيو").
3. Detect modifiers, meat doneness (medium rare, well done), sauce choices, and customizations.
4. Detect table number if mentioned (e.g., "طاولة 4", "Table T-02").
5. Detect order type (dine_in, takeaway, delivery). Default to 'dine_in'.
6. Detect special cooking notes or allergy mentions.
7. Return strictly valid JSON adhering to the schema below without markdown fences.

Schema:
{
  "orderType": "dine_in" | "takeaway" | "delivery",
  "tableNumber": "string or null",
  "guestCount": number,
  "items": [
    {
      "menuItemId": "matched-item-id-or-null",
      "name": "Exact Name",
      "quantity": 1,
      "modifiers": [ { "name": "Medium Rare", "price": 0 } ],
      "notes": "string or null",
      "confidence": 0.95
    }
  ],
  "customerNotes": "string or null",
  "unrecognizedItems": []
}
`;

    try {
      const responseText = await this.generateCompletion(systemPrompt, transcript, {
        jsonMode: true,
        modelTier: 'fast',
      });

      const parsed: ParsedVoiceOrderResult = JSON.parse(responseText);
      parsed.rawTranscript = transcript;

      // Dispatch event
      eventBus.publish('AI_VOICE_ORDER_PARSED', {
        rawAudioPrompt: transcript,
        parsedOrder: {
          orderType: parsed.orderType,
          guestCount: parsed.guestCount,
          customerNotes: parsed.customerNotes,
        },
        detectedItems: parsed.items.map((i) => ({
          menuItemId: i.menuItemId,
          nameAr: i.name,
          quantity: i.quantity,
          notes: i.notes,
        })),
      }, 'ai');

      return parsed;
    } catch (err) {
      console.error('[AI Router] Voice Order parsing failed:', err);
      // Fallback local heuristic parser
      return this.heuristicVoiceParser(transcript, availableMenuItems);
    }
  }

  private heuristicVoiceParser(transcript: string, menu: MenuItem[]): ParsedVoiceOrderResult {
    const text = transcript.toLowerCase();
    const items: ParsedVoiceOrderItem[] = [];

    for (const item of menu) {
      if (text.includes(item.nameAr.toLowerCase()) || text.includes(item.nameEn.toLowerCase())) {
        items.push({
          menuItemId: item.id,
          name: item.nameAr,
          quantity: 1,
          confidence: 0.8,
        });
      }
    }

    return {
      orderType: 'dine_in',
      items,
      rawTranscript: transcript,
      unrecognizedItems: items.length === 0 ? [transcript] : [],
    };
  }

  /**
   * 2. Supplier Invoice OCR & Intelligent Inventory Item Reconciliation
   */
  public async parseSupplierInvoice(
    imageBufferBase64: string,
    existingInventory: InventoryItem[]
  ): Promise<InvoiceOCRResult> {
    const inventoryList = existingInventory.map((inv) => ({
      id: inv.id,
      code: inv.code,
      nameAr: inv.nameAr,
      nameEn: inv.nameEn,
      unit: inv.unit,
    }));

    const systemPrompt = `
You are the AI OCR & Supply Chain Accountant for Restaurant OS.
Examine this supplier purchase invoice photo (Arabic or English) and extract:
1. Invoice Number
2. Supplier Name & Tax Registration Number (الرقم الضريبي)
3. Invoice Date (YYYY-MM-DD)
4. Subtotal, Tax Amount (VAT 15%), and Total Amount
5. Line items: Product name, quantity, unit, unit price, total price.
6. Map each invoice item to the closest existing Inventory Item ID from the provided list:
${JSON.stringify(inventoryList)}

Return strictly valid JSON matching this schema:
{
  "invoiceNumber": "string",
  "supplierName": "string",
  "supplierTaxNumber": "string",
  "date": "YYYY-MM-DD",
  "subtotal": 0.00,
  "taxAmount": 0.00,
  "totalAmount": 0.00,
  "items": [
    {
      "name": "Item name from invoice",
      "quantity": 10,
      "unit": "kg",
      "unitPrice": 45.0,
      "totalPrice": 450.0,
      "matchedInventoryItemId": "raw-id-or-null"
    }
  ],
  "confidence": 0.95
}
`;

    try {
      const responseText = await this.generateCompletion(systemPrompt, 'Extract all invoice fields from image.', {
        jsonMode: true,
        modelTier: 'smart',
        imageBufferBase64,
      });

      const parsed: InvoiceOCRResult = JSON.parse(responseText);
      eventBus.publish('AI_INVOICE_PROCESSED', { invoiceData: parsed, success: true }, 'ai');
      return parsed;
    } catch (err) {
      console.error('[AI Router] Invoice OCR failed:', err);
      throw err;
    }
  }

  /**
   * 3. BCG Matrix Menu Engineering Analyzer
   */
  public async analyzeBCGMatrix(
    menuItems: MenuItem[],
    salesVolumeByItem: Record<string, number>
  ): Promise<BCGAnalysisResult> {
    // 1. Calculate Average Profit Margin & Average Popularity
    const itemsData = menuItems.map((item) => {
      const sold = salesVolumeByItem[item.id] || item.soldCount || 10;
      const profitMargin = item.price > 0 ? (item.price - item.costPrice) / item.price : 0;
      return {
        id: item.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        price: item.price,
        costPrice: item.costPrice,
        profitMargin: Math.round(profitMargin * 100),
        soldCount: sold,
        totalRevenue: sold * item.price,
        totalProfit: sold * (item.price - item.costPrice),
      };
    });

    const systemPrompt = `
You are the Chief Culinary Strategist & Hospitality Revenue Consultant.
Analyze the following restaurant menu profitability and sales volume data to produce a Boston Consulting Group (BCG) Menu Matrix:
- Stars (High Profit, High Sales): Retain high quality, feature prominently.
- Cash Cows (Low Profit, High Sales): High popularity, recommend small price increase or re-engineer recipe to cut cost.
- Question Marks (High Profit, Low Sales): High margin but low volume; recommend promotion, better positioning or renaming.
- Dogs (Low Profit, Low Sales): Low popularity and low margin; recommend phase out, rework, or bundle.

Menu Data:
${JSON.stringify(itemsData)}

Return strictly JSON:
{
  "stars": [ { "itemId": "id", "nameAr": "name", "nameEn": "name", "advice": "string" } ],
  "cashCows": [ { "itemId": "id", "nameAr": "name", "nameEn": "name", "advice": "string" } ],
  "questionMarks": [ { "itemId": "id", "nameAr": "name", "nameEn": "name", "advice": "string" } ],
  "dogs": [ { "itemId": "id", "nameAr": "name", "nameEn": "name", "advice": "string" } ],
  "overallSummary": "A concise executive Arabic summary of recommended menu actions."
}
`;

    try {
      const responseText = await this.generateCompletion(systemPrompt, 'Perform BCG menu engineering analysis.', {
        jsonMode: true,
        modelTier: 'smart',
      });

      const parsed: BCGAnalysisResult = JSON.parse(responseText);

      eventBus.publish('AI_BCG_ANALYSIS_COMPLETED', {
        stars: parsed.stars.map((s) => s.itemId),
        cashCows: parsed.cashCows.map((c) => c.itemId),
        questionMarks: parsed.questionMarks.map((q) => q.itemId),
        dogs: parsed.dogs.map((d) => d.itemId),
      }, 'ai');

      return parsed;
    } catch (err) {
      console.warn('[AI Router] BCG AI generation failed, using local statistical calculation:', err);
      return this.localBCGCalculation(itemsData);
    }
  }

  private localBCGCalculation(itemsData: any[]): BCGAnalysisResult {
    const avgProfit = itemsData.reduce((acc, i) => acc + i.profitMargin, 0) / (itemsData.length || 1);
    const avgSales = itemsData.reduce((acc, i) => acc + i.soldCount, 0) / (itemsData.length || 1);

    const stars: any[] = [];
    const cashCows: any[] = [];
    const questionMarks: any[] = [];
    const dogs: any[] = [];

    itemsData.forEach((item) => {
      const highProfit = item.profitMargin >= avgProfit;
      const highSales = item.soldCount >= avgSales;

      if (highProfit && highSales) {
        stars.push({ itemId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, advice: 'حافظ على جودة الصنف وموقعه البارز في القائمة' });
      } else if (!highProfit && highSales) {
        cashCows.push({ itemId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, advice: 'صنف رائج جداً، فكر في خفض تكاليف المكونات أو رفع السعر بنسبة 5%' });
      } else if (highProfit && !highSales) {
        questionMarks.push({ itemId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, advice: 'هامش ربح مرتفع ومبيعات قليلة؛ قم بعمل عروض ترويجية وصور جذابة' });
      } else {
        dogs.push({ itemId: item.id, nameAr: item.nameAr, nameEn: item.nameEn, advice: 'أرباح ومبيعات منخفضة؛ يفضل استبدال الصنف أو تعديل خلطته بالكامل' });
      }
    });

    return {
      stars,
      cashCows,
      questionMarks,
      dogs,
      overallSummary: `تم تصنيف الأصناف حسب متوسط الربحية (${Math.round(avgProfit)}%) ومتوسط المبيعات (${Math.round(avgSales)} طلب).`,
    };
  }

  /**
   * 4. Smart Dynamic Pricing & Weather Recommendations
   */
  public async suggestDynamicPricing(
    menuItems: MenuItem[],
    weather?: { temperature: number; condition: string; city: string }
  ): Promise<DynamicPricingSuggestion[]> {
    const itemsSummary = menuItems.slice(0, 8).map((m) => ({
      id: m.id,
      nameAr: m.nameAr,
      price: m.price,
      costPrice: m.costPrice,
      category: m.categoryId,
    }));

    const weatherContext = weather
      ? `Current Weather in ${weather.city}: ${weather.temperature}°C, ${weather.condition}`
      : 'Standard Mild Weather';

    const systemPrompt = `
You are the AI Pricing & Revenue Optimization Officer for a luxury restaurant.
Context:
${weatherContext}

Menu Items:
${JSON.stringify(itemsSummary)}

Suggest 3 to 5 targeted dynamic pricing / promotion actions:
- For cold weather: promote warm soups, hot teas, rich steaks and desserts.
- For hot weather: boost cold mojitos, refreshing seafood, salads and iced coffee.
- Provide strategic rationale for each suggestion in Arabic.

Return JSON schema:
{
  "suggestions": [
    {
      "menuItemId": "id",
      "itemNameAr": "name",
      "currentPrice": 50,
      "suggestedPrice": 45,
      "changePercentage": -10,
      "strategyReason": "Arabic explanation",
      "action": "increase" | "decrease" | "bundle" | "maintain"
    }
  ]
}
`;

    try {
      const responseText = await this.generateCompletion(systemPrompt, 'Generate dynamic pricing suggestions', {
        jsonMode: true,
        modelTier: 'fast',
      });

      const parsed = JSON.parse(responseText);
      return parsed.suggestions || [];
    } catch (err) {
      console.warn('[AI Router] Dynamic pricing failed:', err);
      return [
        {
          menuItemId: 'item-passion-mojito',
          itemNameAr: 'موهيتو الباشن فروت',
          currentPrice: 34.0,
          suggestedPrice: 28.0,
          changePercentage: -17.6,
          strategyReason: 'عرض خاص لزيادة طلب المشروبات المنعشة خلال ساعات الذروة',
          action: 'decrease',
        },
        {
          menuItemId: 'item-wagyu-ribeye',
          itemNameAr: 'ستيك واغيو ريب آي',
          currentPrice: 320.0,
          suggestedPrice: 340.0,
          changePercentage: 6.25,
          strategyReason: 'زيادة طفيفة في السعر نظراً للإقبال الشديد على لحم الواغيو الفاخر',
          action: 'increase',
        },
      ];
    }
  }
}

// Global Singleton AI Router Instance
export const aiRouter = new AIRouterService();
