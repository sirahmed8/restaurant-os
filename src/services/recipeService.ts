/**
 * =====================================================================
 * RESTAURANT OS — RECIPE COSTING & AUTOMATIC INVENTORY DEDUCTION ENGINE
 * =====================================================================
 * Handles:
 * - Theoretical Food Costing (Recipe Cost Breakdown & Margin Calculations)
 * - Automatic Inventory Stock Deductions on Order Placement
 * - Waste Factor & Portion Yield Calculations
 * - Low Stock Alerts via EventBus
 */

import { Recipe, RecipeIngredient, InventoryItem, Order, OrderItem, StockMovement } from '../db/schema';
import { db } from '../db';
import { eventBus } from './eventBus';

export interface IngredientCostDetail {
  inventoryItemId: string;
  nameAr: string;
  nameEn: string;
  unit: string;
  rawQuantity: number;
  wastePercentage: number;
  effectiveQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface RecipeCostBreakdown {
  recipeId: string;
  menuItemId: string;
  portionYield: number;
  ingredients: IngredientCostDetail[];
  totalIngredientsCost: number;
  laborCostEstimate: number;
  totalRecipeCost: number;
  costPerPortion: number;
  suggestedSellingPrice: number; // e.g. based on target 30% food cost
  foodCostPercentage?: number;
}

export interface StockDeductionResult {
  inventoryItemId: string;
  itemNameAr: string;
  deductedQuantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  movementId: string;
  isLowStock: boolean;
}

export class RecipeService {
  /**
   * Calculate exact costing breakdown for a recipe and its ingredients.
   */
  public calculateRecipeCost(
    recipe: Recipe,
    ingredients: RecipeIngredient[],
    inventoryItems: InventoryItem[],
    menuItemSellingPrice?: number
  ): RecipeCostBreakdown {
    const invMap = new Map<string, InventoryItem>();
    inventoryItems.forEach((item) => invMap.set(item.id, item));

    let totalIngredientsCost = 0;
    const ingredientDetails: IngredientCostDetail[] = [];

    for (const ing of ingredients) {
      const invItem = invMap.get(ing.inventoryItemId);
      const unitCost = invItem ? invItem.averageCost : 0;
      const wasteFactor = 1 + (ing.wastePercentage || 0) / 100;
      const effectiveQuantity = ing.quantity * wasteFactor;
      const totalCost = Number((effectiveQuantity * unitCost).toFixed(4));

      totalIngredientsCost += totalCost;

      ingredientDetails.push({
        inventoryItemId: ing.inventoryItemId,
        nameAr: invItem?.nameAr || 'مكون مجهول',
        nameEn: invItem?.nameEn || 'Unknown Ingredient',
        unit: ing.unit,
        rawQuantity: ing.quantity,
        wastePercentage: ing.wastePercentage || 0,
        effectiveQuantity: Number(effectiveQuantity.toFixed(4)),
        unitCost,
        totalCost,
      });
    }

    const portionYield = Math.max(1, recipe.portionYield || 1);
    const laborCost = recipe.laborCostEstimate || 0;
    const totalRecipeCost = Number((totalIngredientsCost + laborCost).toFixed(2));
    const costPerPortion = Number((totalRecipeCost / portionYield).toFixed(2));

    // Suggested selling price with standard 30% target food cost
    const suggestedSellingPrice = Number((costPerPortion / 0.3).toFixed(2));

    let foodCostPercentage: number | undefined;
    if (menuItemSellingPrice && menuItemSellingPrice > 0) {
      foodCostPercentage = Number(((costPerPortion / menuItemSellingPrice) * 100).toFixed(2));
    }

    return {
      recipeId: recipe.id,
      menuItemId: recipe.menuItemId,
      portionYield,
      ingredients: ingredientDetails,
      totalIngredientsCost: Number(totalIngredientsCost.toFixed(2)),
      laborCostEstimate: laborCost,
      totalRecipeCost,
      costPerPortion,
      suggestedSellingPrice,
      foodCostPercentage,
    };
  }

  /**
   * Automatically deduct raw ingredients from inventory when an order is placed.
   */
  public async deductInventoryForOrder(
    order: Order,
    items: OrderItem[],
    employeeId: string = 'system'
  ): Promise<StockDeductionResult[]> {
    const deductionResults: StockDeductionResult[] = [];

    // 1. Fetch all recipes and ingredients
    const [recipes, allIngredients, allInventory] = await Promise.all([
      db.getAll('recipes'),
      db.getAll('recipeIngredients'),
      db.getAll('inventoryItems'),
    ]);

    const recipeMap = new Map<string, Recipe>();
    recipes.forEach((r) => recipeMap.set(r.menuItemId, r));

    const ingredientsByRecipe = new Map<string, RecipeIngredient[]>();
    allIngredients.forEach((ing) => {
      if (!ingredientsByRecipe.has(ing.recipeId)) {
        ingredientsByRecipe.set(ing.recipeId, []);
      }
      ingredientsByRecipe.get(ing.recipeId)!.push(ing);
    });

    const inventoryMap = new Map<string, InventoryItem>();
    allInventory.forEach((inv) => inventoryMap.set(inv.id, inv));

    // 2. Aggregate deductions across order items
    const aggregatedDeductions = new Map<string, { quantity: number; unit: string }>();

    for (const item of items) {
      const recipe = recipeMap.get(item.menuItemId);
      if (!recipe) continue;

      const ingredients = ingredientsByRecipe.get(recipe.id) || [];
      const portionYield = Math.max(1, recipe.portionYield || 1);

      for (const ing of ingredients) {
        const wasteFactor = 1 + (ing.wastePercentage || 0) / 100;
        const requiredQtyPerPortion = (ing.quantity / portionYield) * wasteFactor;
        const totalDeductionForThisItem = requiredQtyPerPortion * item.quantity;

        const currentAgg = aggregatedDeductions.get(ing.inventoryItemId) || { quantity: 0, unit: ing.unit };
        currentAgg.quantity += totalDeductionForThisItem;
        aggregatedDeductions.set(ing.inventoryItemId, currentAgg);
      }
    }

    // 3. Apply deductions, update DB, and create StockMovement logs
    for (const [inventoryItemId, deduction] of aggregatedDeductions.entries()) {
      const invItem = inventoryMap.get(inventoryItemId) || (await db.getById('inventoryItems', inventoryItemId));
      if (!invItem) continue;

      const previousStock = invItem.currentStock;
      const deductedQuantity = Number(deduction.quantity.toFixed(4));
      const newStock = Math.max(0, Number((previousStock - deductedQuantity).toFixed(4)));

      // Update inventory stock
      await db.update('inventoryItems', inventoryItemId, { currentStock: newStock });

      // Create stock movement record
      const movementId = db.generateUUID();
      const movement: StockMovement = {
        id: movementId,
        inventoryItemId,
        type: 'sale_consumption',
        quantity: -deductedQuantity,
        unitPrice: invItem.averageCost,
        previousStock,
        newStock,
        referenceId: order.id,
        referenceType: 'order',
        reason: `خصم تلقائي للطلب ${order.orderNumber}`,
        employeeId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.insert('stockMovements', movement);

      const isLowStock = newStock <= invItem.minStockAlert;

      // Dispatch Stock Deducted Event
      eventBus.publish('INVENTORY_STOCK_DEDUCTED', {
        inventoryItemId,
        quantity: deductedQuantity,
        newStock,
        reason: `Auto deduction for order ${order.orderNumber}`,
      }, 'inventory');

      // Check Low Stock Alert
      if (isLowStock) {
        eventBus.publish('INVENTORY_LOW_STOCK_ALERT', {
          item: { ...invItem, currentStock: newStock },
          currentStock: newStock,
          minStockAlert: invItem.minStockAlert,
        }, 'inventory');
      }

      deductionResults.push({
        inventoryItemId,
        itemNameAr: invItem.nameAr,
        deductedQuantity,
        previousStock,
        newStock,
        unit: deduction.unit,
        movementId,
        isLowStock,
      });
    }

    return deductionResults;
  }
}

export const recipeService = new RecipeService();
