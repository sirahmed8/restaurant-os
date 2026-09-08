import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recipeService } from '../services/recipeService';
import { eventBus } from '../services/eventBus';
import { db } from '../db';
import {
  Recipe,
  RecipeIngredient,
  InventoryItem,
  Order,
  OrderItem,
  Coupon,
} from '../db/schema';

describe('Order Calculations & Recipe Inventory Deduction Engine', () => {
  beforeEach(async () => {
    await db.init();
    eventBus.clearHistory();
  });

  describe('1. Cart & POS Financial Calculations', () => {
    it('should compute gross, net, 15% VAT, and line items with modifiers correctly', () => {
      // Item: Wagyu Ribeye (320 SAR) + Peppercorn sauce (8 SAR) + Extra Truffle butter (15 SAR)
      const basePrice = 320;
      const modifiers = [
        { price: 8, quantity: 1 },
        { price: 15, quantity: 2 }, // 30 SAR
      ];
      const modifierSum = modifiers.reduce((sum, m) => sum + m.price * m.quantity, 0); // 38 SAR
      const unitPrice = basePrice + modifierSum; // 358 SAR
      const quantity = 2;
      const grossTotal = unitPrice * quantity; // 716 SAR

      // Saudi standard inclusive 15% VAT
      const subtotal = Number((grossTotal / 1.15).toFixed(2)); // 622.61
      const taxAmount = Number((grossTotal - subtotal).toFixed(2)); // 93.39

      expect(unitPrice).toBe(358);
      expect(grossTotal).toBe(716);
      expect(subtotal + taxAmount).toBeCloseTo(grossTotal, 2);
      expect(taxAmount).toBe(93.39);
    });

    it('should calculate coupon discounts with maxDiscount cap correctly', () => {
      const grossTotal = 500;

      // 20% coupon capped at 50 SAR
      const percentageCoupon: Coupon = {
        id: 'cp-20',
        code: 'SAVE20',
        descriptionAr: 'خصم 20% بحد أقصى 50 ريال',
        descriptionEn: '20% off capped at 50 SAR',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 100,
        maxDiscount: 50,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        usageLimit: 1000,
        currentUsageCount: 12,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 20% of 500 = 100, but cap is 50
      let discountAmount = (grossTotal * percentageCoupon.discountValue) / 100;
      if (percentageCoupon.maxDiscount && discountAmount > percentageCoupon.maxDiscount) {
        discountAmount = percentageCoupon.maxDiscount;
      }
      expect(discountAmount).toBe(50);

      const netAfterDiscount = grossTotal - discountAmount; // 450
      const subtotal = Number((netAfterDiscount / 1.15).toFixed(2)); // 391.30
      const taxAmount = Number((netAfterDiscount - subtotal).toFixed(2)); // 58.70

      expect(netAfterDiscount).toBe(450);
      expect(subtotal + taxAmount).toBeCloseTo(450, 2);
    });

    it('should calculate fixed coupon discount correctly', () => {
      const grossTotal = 300;
      const fixedCoupon: Coupon = {
        id: 'cp-fixed-50',
        code: 'ROYAL50',
        descriptionAr: 'خصم 50 ريال',
        descriptionEn: '50 SAR Flat discount',
        discountType: 'fixed',
        discountValue: 50,
        minOrderValue: 200,
        validFrom: '2026-01-01',
        validUntil: '2026-12-31',
        usageLimit: 500,
        currentUsageCount: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const discountAmount = Math.min(grossTotal, fixedCoupon.discountValue);
      const netTotal = grossTotal - discountAmount;

      expect(discountAmount).toBe(50);
      expect(netTotal).toBe(250);
    });
  });

  describe('2. Recipe Costing & Food Cost Calculations', () => {
    it('should calculate accurate recipe costing breakdown including waste factor', () => {
      const mockRecipe: Recipe = {
        id: 'rec-test-steak',
        menuItemId: 'item-wagyu-ribeye',
        portionYield: 1,
        laborCostEstimate: 12.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockIngredients: RecipeIngredient[] = [
        {
          id: 'ing-1',
          recipeId: 'rec-test-steak',
          inventoryItemId: 'raw-wagyu-beef',
          quantity: 0.32, // 320g
          unit: 'kg',
          wastePercentage: 6.0, // 6% trim waste
          costContribution: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'ing-2',
          recipeId: 'rec-test-steak',
          inventoryItemId: 'raw-truffle-oil',
          quantity: 0.015, // 15ml
          unit: 'liter',
          wastePercentage: 2.0,
          costContribution: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockInventoryItems: InventoryItem[] = [
        {
          id: 'raw-wagyu-beef',
          code: 'RAW-BEEF-01',
          nameAr: 'لحم واغيو ياباني A5',
          nameEn: 'Wagyu Beef A5',
          category: 'Meat',
          unit: 'kg',
          currentStock: 15.0,
          minStockAlert: 5.0,
          maxStock: 30.0,
          reorderQuantity: 10.0,
          averageCost: 380.0, // 380 SAR/kg
          lastPurchasePrice: 390.0,
          expiryTracking: true,
          yieldRatio: 0.94,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'raw-truffle-oil',
          code: 'RAW-OIL-01',
          nameAr: 'زيت الكمأة السوداء',
          nameEn: 'Truffle Oil',
          category: 'Oils',
          unit: 'liter',
          currentStock: 5.0,
          minStockAlert: 2.0,
          maxStock: 10.0,
          reorderQuantity: 5.0,
          averageCost: 180.0, // 180 SAR/liter
          lastPurchasePrice: 180.0,
          expiryTracking: false,
          yieldRatio: 1.0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const sellingPrice = 320.0;
      const breakdown = recipeService.calculateRecipeCost(
        mockRecipe,
        mockIngredients,
        mockInventoryItems,
        sellingPrice
      );

      // Wagyu cost: 0.32 * 1.06 * 380 = 128.896 SAR
      // Truffle oil cost: 0.015 * 1.02 * 180 = 2.754 SAR
      // Total ingredients: 131.65 SAR
      // Total recipe cost: 131.65 + 12 (labor) = 143.65 SAR
      expect(breakdown.recipeId).toBe('rec-test-steak');
      expect(breakdown.ingredients).toHaveLength(2);
      expect(breakdown.totalIngredientsCost).toBeCloseTo(131.65, 1);
      expect(breakdown.totalRecipeCost).toBeCloseTo(143.65, 1);
      expect(breakdown.costPerPortion).toBeCloseTo(143.65, 1);

      // Food cost percentage: (143.65 / 320) * 100 = ~44.89%
      expect(breakdown.foodCostPercentage).toBeDefined();
      expect(breakdown.foodCostPercentage!).toBeCloseTo(44.89, 1);
      expect(breakdown.suggestedSellingPrice).toBeCloseTo(143.65 / 0.3, 1);
    });

    it('should handle multi-portion yield recipes', () => {
      const batchRecipe: Recipe = {
        id: 'rec-soup-batch',
        menuItemId: 'item-lentil-soup',
        portionYield: 10, // 10 portions per pot
        laborCostEstimate: 20.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ingredients: RecipeIngredient[] = [
        {
          id: 'ing-lentil',
          recipeId: 'rec-soup-batch',
          inventoryItemId: 'raw-lentil',
          quantity: 2.0, // 2kg for 10 bowls
          unit: 'kg',
          wastePercentage: 0,
          costContribution: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const inv: InventoryItem[] = [
        {
          id: 'raw-lentil',
          code: 'RAW-LENTIL',
          nameAr: 'عدس أحمر',
          nameEn: 'Red Lentils',
          category: 'Grains',
          unit: 'kg',
          currentStock: 50.0,
          minStockAlert: 10.0,
          maxStock: 100.0,
          reorderQuantity: 20.0,
          averageCost: 15.0, // 15 SAR/kg
          lastPurchasePrice: 15.0,
          expiryTracking: false,
          yieldRatio: 1.0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const breakdown = recipeService.calculateRecipeCost(batchRecipe, ingredients, inv, 35.0);

      // Ingredients cost: 2 * 15 = 30 SAR
      // Total cost: 30 + 20 (labor) = 50 SAR for 10 portions
      // Cost per portion: 50 / 10 = 5.0 SAR
      expect(breakdown.totalRecipeCost).toBe(50.0);
      expect(breakdown.costPerPortion).toBe(5.0);
      expect(breakdown.foodCostPercentage).toBeCloseTo((5.0 / 35.0) * 100, 2);
    });
  });

  describe('3. Automatic Inventory Deduction on Order', () => {
    it('should deduct ingredients from database, log stock movements, and emit events', async () => {
      // Setup initial inventory in db
      const initialWagyu: InventoryItem = {
        id: 'raw-test-wagyu',
        code: 'RAW-TEST-01',
        nameAr: 'لحم واغيو للتجربة',
        nameEn: 'Test Wagyu',
        category: 'Meat',
        unit: 'kg',
        currentStock: 10.0,
        minStockAlert: 3.0,
        maxStock: 20.0,
        reorderQuantity: 10.0,
        averageCost: 300.0,
        lastPurchasePrice: 300.0,
        expiryTracking: true,
        yieldRatio: 1.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testRecipe: Recipe = {
        id: 'rec-test-01',
        menuItemId: 'menu-test-steak',
        portionYield: 1,
        laborCostEstimate: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const testIngredient: RecipeIngredient = {
        id: 'ing-test-01',
        recipeId: 'rec-test-01',
        inventoryItemId: 'raw-test-wagyu',
        quantity: 0.5, // 500g per steak
        unit: 'kg',
        wastePercentage: 10, // 10% waste -> 0.5 * 1.10 = 0.55 kg per portion
        costContribution: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert('inventoryItems', initialWagyu);
      await db.insert('recipes', testRecipe);
      await db.insert('recipeIngredients', testIngredient);

      const deductedEvents: any[] = [];
      eventBus.on('INVENTORY_STOCK_DEDUCTED', (evt) => {
        deductedEvents.push(evt.payload);
      });

      const mockOrder: Order = {
        id: 'ord-deduct-test',
        orderNumber: 'ORD-TEST-100',
        dailySequence: 1,
        orderType: 'dine_in',
        status: 'sent_to_kitchen',
        paymentStatus: 'unpaid',
        subtotal: 300,
        taxAmount: 45,
        discountAmount: 0,
        serviceCharge: 0,
        tipAmount: 0,
        deliveryFee: 0,
        totalAmount: 345,
        paidAmount: 0,
        changeAmount: 0,
        guestCount: 2,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockItems: OrderItem[] = [
        {
          id: 'item-deduct-1',
          orderId: 'ord-deduct-test',
          menuItemId: 'menu-test-steak',
          nameAr: 'ستيك التجربة',
          nameEn: 'Test Steak',
          quantity: 2, // 2 steaks ordered -> 2 * 0.55 = 1.10 kg deduction
          unitPrice: 172.5,
          costPrice: 80,
          subtotal: 300,
          taxAmount: 45,
          discountAmount: 0,
          totalAmount: 345,
          selectedModifiers: [],
          kitchenStation: 'grill',
          status: 'cooking',
          printedToKitchen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const deductionResults = await recipeService.deductInventoryForOrder(mockOrder, mockItems);

      expect(deductionResults).toHaveLength(1);
      expect(deductionResults[0].inventoryItemId).toBe('raw-test-wagyu');
      expect(deductionResults[0].deductedQuantity).toBe(1.1);
      expect(deductionResults[0].previousStock).toBe(10.0);
      expect(deductionResults[0].newStock).toBe(8.9);
      expect(deductionResults[0].isLowStock).toBe(false);

      // Verify DB persistence
      const updatedItem = await db.getById('inventoryItems', 'raw-test-wagyu');
      expect(updatedItem?.currentStock).toBe(8.9);

      // Verify StockMovement record
      const movements = await db.query('stockMovements', {
        where: (m) => m.referenceId === 'ord-deduct-test',
      });
      expect(movements).toHaveLength(1);
      expect(movements[0].type).toBe('sale_consumption');
      expect(movements[0].quantity).toBe(-1.1);

      // Verify EventBus emission
      expect(deductedEvents).toHaveLength(1);
      expect(deductedEvents[0].inventoryItemId).toBe('raw-test-wagyu');
      expect(deductedEvents[0].quantity).toBe(1.1);
      expect(deductedEvents[0].newStock).toBe(8.9);
    });

    it('should fire INVENTORY_LOW_STOCK_ALERT when stock falls below threshold', async () => {
      const lowStockItem: InventoryItem = {
        id: 'raw-low-alert',
        code: 'RAW-LOW-01',
        nameAr: 'عنصر قارب على النفاد',
        nameEn: 'Low Stock Item',
        category: 'Dairy',
        unit: 'kg',
        currentStock: 3.5,
        minStockAlert: 3.0,
        maxStock: 20.0,
        reorderQuantity: 10.0,
        averageCost: 20.0,
        lastPurchasePrice: 20.0,
        expiryTracking: false,
        yieldRatio: 1.0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const recipe: Recipe = {
        id: 'rec-low-alert',
        menuItemId: 'menu-low-item',
        portionYield: 1,
        laborCostEstimate: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const ingredient: RecipeIngredient = {
        id: 'ing-low-alert',
        recipeId: 'rec-low-alert',
        inventoryItemId: 'raw-low-alert',
        quantity: 1.0,
        unit: 'kg',
        wastePercentage: 0,
        costContribution: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.insert('inventoryItems', lowStockItem);
      await db.insert('recipes', recipe);
      await db.insert('recipeIngredients', ingredient);

      const alertSpy = vi.fn();
      eventBus.on('INVENTORY_LOW_STOCK_ALERT', alertSpy);

      const mockOrder: any = { id: 'ord-low-1', orderNumber: 'ORD-LOW-01' };
      const mockItems: any[] = [{ menuItemId: 'menu-low-item', quantity: 1 }];

      // Initial: 3.5 kg. Deduct 1.0 kg -> 2.5 kg (<= 3.0 minStockAlert)
      const results = await recipeService.deductInventoryForOrder(mockOrder, mockItems);

      expect(results[0].newStock).toBe(2.5);
      expect(results[0].isLowStock).toBe(true);
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0][0].payload.currentStock).toBe(2.5);
      expect(alertSpy.mock.calls[0][0].payload.minStockAlert).toBe(3.0);
    });
  });
});
