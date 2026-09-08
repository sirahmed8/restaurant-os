import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { visionScannerService } from '../services/visionScannerService';
import { aiRouter } from '../services/aiRouter';
import { eventBus } from '../services/eventBus';
import { db } from '../db';
import { MenuItem, InventoryItem } from '../db/schema';

describe('AI Multimodal Vision Scanner & Plate Waste Engine', () => {
  const originalFetch = globalThis.fetch;

  const mockMenuItem: MenuItem = {
    id: 'item-ribeye-test',
    categoryId: 'cat-grills-mains',
    nameAr: 'ستيك ريب آي مع بطاطس',
    nameEn: 'Ribeye Steak with Fries',
    descriptionAr: '',
    descriptionEn: '',
    price: 165,
    costPrice: 52,
    taxRate: 0.15,
    preparationTimeMinutes: 18,
    isAvailable: true,
    isFeatured: true,
    isRecommended: true,
    allergens: [],
    kitchenStation: 'grill',
    sortOrder: 1,
    soldCount: 80,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockInventoryItem: InventoryItem = {
    id: 'raw-dairy-milk-01',
    code: 'RAW-MILK-01',
    nameAr: 'حليب المراعي كامل الدسم',
    nameEn: 'Almarai Full Cream Milk',
    category: 'الألبان والأجبان',
    unit: 'piece',
    currentStock: 10,
    minStockAlert: 5,
    maxStock: 50,
    reorderQuantity: 20,
    averageCost: 6.5,
    lastPurchasePrice: 6.5,
    expiryTracking: true,
    yieldRatio: 1.0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    eventBus.clearHistory();
    // Hermetic fake key: fetch is mocked per-test, so no real network or
    // secret is needed — the router only gates on "key is non-empty".
    aiRouter.updateConfig({
      primaryProvider: 'google-ai',
      autoFallback: true,
      googleApiKey: 'test-key-not-a-secret',
      openRouterApiKey: 'test-key-not-a-secret',
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. Plate Waste Estimator Visual Analysis', () => {
    it('should successfully analyze plate waste using Gemini 2.5 Flash Vision output', async () => {
      const mockVisionOutput = {
        dishNameAr: 'ستيك ريب آي مع بطاطس ودجز',
        dishNameEn: 'Ribeye Steak with Potato Wedges',
        matchedMenuItemId: 'item-ribeye-test',
        totalWastePercentage: 35,
        totalWasteGrams: 180,
        totalFinancialLossSar: 18.2,
        originalPlateCostSar: 52,
        originalPlatePriceSar: 165,
        components: [
          {
            nameAr: 'بطاطس ودجز',
            nameEn: 'Potato Wedges',
            category: 'carbs',
            initialEstimatePercent: 40,
            wastedPercent: 60,
            wastedGrams: 120,
            wasteCostSar: 6.5,
          },
          {
            nameAr: 'لحم ستيك مشوي',
            nameEn: 'Grilled Steak',
            category: 'protein',
            initialEstimatePercent: 50,
            wastedPercent: 10,
            wastedGrams: 30,
            wasteCostSar: 9.5,
          },
          {
            nameAr: 'صلصة الفلفل',
            nameEn: 'Pepper Sauce',
            category: 'sauce',
            initialEstimatePercent: 10,
            wastedPercent: 70,
            wastedGrams: 30,
            wasteCostSar: 2.2,
          },
        ],
        primaryWasteReason: 'excessive_side_items',
        reasonAr: 'ترك أكثر من نصف كمية البطاطس والصلصة مع استهلاك معظم اللحم',
        reasonEn: 'Left over half of wedges and sauce while consuming most meat',
        portionRecommendationAr: 'تقليص كمية البطاطس بنسبة 25% وتقديم الصلصة جانبياً',
        portionRecommendationEn: 'Reduce wedges by 25% and serve sauce on the side',
        suggestedPortionReductionPercent: 25,
        projectedMonthlySavingsSar: 3850,
        confidence: 0.95,
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockVisionOutput) }],
              },
            },
          ],
        }),
      } as any);

      const result = await visionScannerService.analyzePlateWaste('data:image/jpeg;base64,mockImageData', {
        knownDishes: [mockMenuItem],
        tableNumber: 'T-05',
      });

      expect(result).toBeDefined();
      expect(result.dishNameAr).toBe('ستيك ريب آي مع بطاطس ودجز');
      expect(result.totalWastePercentage).toBe(35);
      expect(result.totalFinancialLossSar).toBe(18.2);
      expect(result.components).toHaveLength(3);
      expect(result.suggestedPortionReductionPercent).toBe(25);
      expect(result.projectedMonthlySavingsSar).toBe(3850);

      // Verify event was fired on EventBus
      const events = eventBus.getEventHistory('AI_VISION_PLATE_WASTE_ANALYZED');
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].payload.wasteData.dishNameAr).toBe('ستيك ريب آي مع بطاطس ودجز');
    });

    it('should fallback to resilient offline heuristic plate analysis when AI endpoint fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const fallbackResult = await visionScannerService.analyzePlateWaste('data:image/jpeg;base64,offlineImage', {
        knownDishes: [mockMenuItem],
        tableNumber: 'T-08',
      });

      expect(fallbackResult).toBeDefined();
      expect(fallbackResult.dishNameAr).toContain('ستيك');
      expect(fallbackResult.totalWastePercentage).toBeGreaterThan(0);
      expect(fallbackResult.components.length).toBeGreaterThan(0);
      expect(fallbackResult.aiModelUsed).toContain('Offline Heuristic');
    });
  });

  describe('2. Visual Inventory Scanner & Expiry Label OCR', () => {
    it('should scan warehouse items, extract expiration dates and match catalog', async () => {
      const mockInventoryAIResponse = {
        category: 'ثلاجة الألبان',
        totalItemsDetected: 2,
        criticalAlertsCount: 1,
        summaryAr: 'تم مسح عبوات الحليب والجبن؛ يوجد تنبيه صلاحية حرج',
        summaryEn: 'Scanned milk and cheese; critical expiry alert',
        confidence: 0.96,
        items: [
          {
            detectedNameAr: 'حليب المراعي كامل الدسم',
            detectedNameEn: 'Almarai Full Cream Milk',
            matchedInventoryItemId: 'raw-dairy-milk-01',
            barcode: '6281007010214',
            batchNumber: 'LOT-AUG-99',
            expiryDate: '2026-08-16',
            daysUntilExpiry: 2,
            expiryStatus: 'critical',
            quantityDetected: 18,
            unit: 'piece',
            storageCondition: 'chilled',
            packagingCondition: 'intact',
            confidence: 0.98,
            notes: 'تنتهي الصلاحية بعد يومين',
          },
        ],
      };

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockInventoryAIResponse) }],
              },
            },
          ],
        }),
      } as any);

      const result = await visionScannerService.scanInventoryVisual('data:image/jpeg;base64,mockCrateData', [
        mockInventoryItem,
      ]);

      expect(result).toBeDefined();
      expect(result.totalItemsDetected).toBe(2);
      expect(result.criticalAlertsCount).toBe(1);
      expect(result.items[0].detectedNameAr).toBe('حليب المراعي كامل الدسم');
      expect(result.items[0].expiryStatus).toBe('critical');
      expect(result.items[0].daysUntilExpiry).toBe(2);
      expect(result.items[0].quantityDetected).toBe(18);

      // Verify eventBus
      const events = eventBus.getEventHistory('AI_VISION_INVENTORY_SCANNED');
      expect(events.length).toBeGreaterThan(0);
    });

    it('should synchronize scanned visual quantities with database and create stock movements', async () => {
      // Mock db.getById, db.update, db.insert
      const getByIdSpy = vi.spyOn(db, 'getById').mockResolvedValue({
        ...mockInventoryItem,
        currentStock: 10,
      } as any);
      const updateSpy = vi.spyOn(db, 'update').mockResolvedValue({} as any);
      const insertSpy = vi.spyOn(db, 'insert').mockResolvedValue({} as any);

      const scanResult = {
        id: 'vis_test_01',
        timestamp: new Date().toISOString(),
        category: 'الألبان',
        totalItemsDetected: 1,
        criticalAlertsCount: 0,
        summaryAr: 'تم مسح المخزون',
        summaryEn: 'Scanned',
        confidence: 0.95,
        aiModelUsed: 'Gemini 2.5 Flash Vision',
        items: [
          {
            id: 'item_1',
            detectedNameAr: 'حليب المراعي',
            detectedNameEn: 'Milk',
            matchedInventoryItemId: 'raw-dairy-milk-01',
            expiryStatus: 'safe' as const,
            quantityDetected: 25,
            unit: 'piece',
            packagingCondition: 'intact' as const,
            confidence: 0.95,
          },
        ],
      };

      const syncRes = await visionScannerService.syncScannedInventoryWithStock(scanResult);

      expect(syncRes.updatedCount).toBe(1);
      expect(getByIdSpy).toHaveBeenCalledWith('inventoryItems', 'raw-dairy-milk-01');
      expect(updateSpy).toHaveBeenCalledWith('inventoryItems', 'raw-dairy-milk-01', expect.objectContaining({
        currentStock: 25,
      }));
      expect(insertSpy).toHaveBeenCalledWith('stockMovements', expect.objectContaining({
        type: 'count_reconciliation',
        quantity: 15, // 25 - 10
      }));
    });
  });

  describe('3. History & Statistics Radar Calculation', () => {
    it('should calculate vision stats accurately including annual projected savings', () => {
      const stats = visionScannerService.getVisionStats();

      expect(stats).toBeDefined();
      expect(stats.totalPlatesScanned).toBeGreaterThanOrEqual(0);
      expect(stats.averageWastePercentage).toBeGreaterThanOrEqual(0);
      expect(stats.projectedAnnualSavingsSar).toBeGreaterThan(0);
      expect(stats.topWastedItems).toBeInstanceOf(Array);
      expect(stats.topWastedItems.length).toBeGreaterThan(0);
    });

    it('should provide pre-configured demonstration presets for instant testing', () => {
      const presets = visionScannerService.getSamplePresets();

      expect(presets).toBeInstanceOf(Array);
      expect(presets.length).toBeGreaterThanOrEqual(3);

      const platePreset = presets.find((p) => p.mode === 'plate_waste');
      expect(platePreset).toBeDefined();
      expect(platePreset?.presetData).toBeDefined();

      const invPreset = presets.find((p) => p.mode === 'inventory_scan');
      expect(invPreset).toBeDefined();
      expect(invPreset?.presetData).toBeDefined();
    });
  });
});
