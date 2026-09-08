import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { aiRouter } from '../services/aiRouter';
import { eventBus } from '../services/eventBus';
import { MenuItem } from '../db/schema';

describe('AI Router — Multi-LLM Orchestration & Automatic Fallback', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    aiRouter.updateConfig({
      primaryProvider: 'google-ai',
      fallbackProvider: 'openrouter',
      googleApiKey: 'test-google-key',
      openRouterApiKey: 'test-openrouter-key',
      autoFallback: true,
    });
    // Reset active provider
    (aiRouter as any).activeProvider = 'google-ai';
    eventBus.clearHistory();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. Primary Google AI Successful Completion', () => {
    it('should query Google AI endpoint and return response when primary succeeds', async () => {
      const mockGoogleResponse = {
        candidates: [
          {
            content: {
              parts: [{ text: '{"message": "Hello from Google AI"}' }],
            },
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      } as any);

      const result = await aiRouter.generateCompletion('System Prompt', 'User Prompt');

      expect(result).toBe('{"message": "Hello from Google AI"}');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      const callUrl = (globalThis.fetch as any).mock.calls[0][0];
      expect(callUrl).toContain('generativelanguage.googleapis.com');
      expect(aiRouter.getActiveProvider()).toBe('google-ai');
    });
  });

  describe('2. Seamless Fallback from Google AI to OpenRouter', () => {
    it('should switch to OpenRouter when Google AI fails (e.g. 503 or 429)', async () => {
      const mockOpenRouterResponse = {
        choices: [
          {
            message: {
              content: '{"message": "Hello from OpenRouter Fallback"}',
            },
          },
        ],
      };

      // First call (Google AI) fails, second call (OpenRouter) succeeds
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => 'Service Unavailable (Rate Limit / Outage)',
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOpenRouterResponse,
        } as any);

      const result = await aiRouter.generateCompletion('System', 'User Prompt');

      expect(result).toBe('{"message": "Hello from OpenRouter Fallback"}');
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);

      // First call was to Google AI
      const firstCallUrl = (globalThis.fetch as any).mock.calls[0][0];
      expect(firstCallUrl).toContain('generativelanguage.googleapis.com');

      // Second call was to OpenRouter
      const secondCallUrl = (globalThis.fetch as any).mock.calls[1][0];
      expect(secondCallUrl).toContain('openrouter.ai');

      // Active provider switched to openrouter
      expect(aiRouter.getActiveProvider()).toBe('openrouter');
    });

    it('should throw combined error when BOTH primary and fallback providers fail', async () => {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => 'Google AI internal error',
        } as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => 'OpenRouter unauthorized',
        } as any);

      await expect(aiRouter.generateCompletion('System', 'Prompt')).rejects.toThrow(
        /All AI Providers failed/i
      );
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw immediately without fallback if autoFallback is set to false', async () => {
      aiRouter.updateConfig({ autoFallback: false });

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests',
      } as any);

      await expect(aiRouter.generateCompletion('System', 'Prompt')).rejects.toThrow(
        /Google AI HTTP 429/i
      );
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('3. Specialized AI Features with Local Fallback Resiliency', () => {
    const mockMenuItems: MenuItem[] = [
      {
        id: 'item-wagyu',
        categoryId: 'cat-grill',
        nameAr: 'ستيك واغيو',
        nameEn: 'Wagyu Steak',
        descriptionAr: '',
        descriptionEn: '',
        price: 320,
        costPrice: 120,
        taxRate: 0.15,
        preparationTimeMinutes: 15,
        isAvailable: true,
        isFeatured: true,
        isRecommended: true,
        allergens: [],
        kitchenStation: 'grill',
        sortOrder: 1,
        soldCount: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'item-mojito',
        categoryId: 'cat-bev',
        nameAr: 'موهيتو باشن',
        nameEn: 'Passion Mojito',
        descriptionAr: '',
        descriptionEn: '',
        price: 34,
        costPrice: 6,
        taxRate: 0.15,
        preparationTimeMinutes: 5,
        isAvailable: true,
        isFeatured: true,
        isRecommended: true,
        allergens: [],
        kitchenStation: 'beverages',
        sortOrder: 2,
        soldCount: 400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    it('should parse voice order with AI when available', async () => {
      const mockVoiceResult = {
        orderType: 'dine_in',
        tableNumber: 'T-01',
        guestCount: 2,
        items: [
          {
            menuItemId: 'item-wagyu',
            name: 'ستيك واغيو',
            quantity: 2,
            confidence: 0.95,
          },
        ],
        rawTranscript: 'اثنين ستيك واغيو طاولة واحد',
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockVoiceResult) }],
              },
            },
          ],
        }),
      } as any);

      const parsed = await aiRouter.parseVoiceOrder('اثنين ستيك واغيو طاولة واحد', mockMenuItems);

      expect(parsed.orderType).toBe('dine_in');
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].menuItemId).toBe('item-wagyu');
      expect(parsed.items[0].quantity).toBe(2);
    });

    it('should fallback to local heuristic voice parser if all AI requests fail', async () => {
      // Mock network failure for all fetches
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const parsed = await aiRouter.parseVoiceOrder('طلب واحد ستيك واغيو وسفري', mockMenuItems);

      expect(parsed).toBeDefined();
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].menuItemId).toBe('item-wagyu');
      expect(parsed.items[0].confidence).toBe(0.8);
    });

    it('should fallback to local statistical BCG Matrix calculation if AI fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('AI Quota exceeded'));

      const salesVolume = {
        'item-wagyu': 50, // high profit margin ((320-120)/320 = 62.5%), low sales -> Question Mark
        'item-mojito': 500, // high profit margin ((34-6)/34 = 82%), high sales -> Star
      };

      const bcgResult = await aiRouter.analyzeBCGMatrix(mockMenuItems, salesVolume);

      expect(bcgResult).toBeDefined();
      const totalCategorized =
        bcgResult.stars.length +
        bcgResult.cashCows.length +
        bcgResult.questionMarks.length +
        bcgResult.dogs.length;
      expect(totalCategorized).toBe(2);
      expect(bcgResult.overallSummary).toContain('تم تصنيف الأصناف');
    });

    it('should fallback to default dynamic pricing rules if AI fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('AI Timeout'));

      const suggestions = await aiRouter.suggestDynamicPricing(mockMenuItems, {
        temperature: 42,
        condition: 'Hot Summer Noon',
        city: 'Riyadh',
      });

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].menuItemId).toBeDefined();
      expect(suggestions[0].suggestedPrice).toBeGreaterThan(0);
    });
  });
});
