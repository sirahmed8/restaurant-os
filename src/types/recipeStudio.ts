/**
 * =====================================================================
 * RESTAURANT OS — RECIPE STUDIO & CHEF TRAINING TYPES
 * =====================================================================
 */

export type AllergenType =
  | 'gluten'
  | 'dairy'
  | 'nuts'
  | 'peanuts'
  | 'eggs'
  | 'soy'
  | 'fish'
  | 'crustaceans'
  | 'sesame'
  | 'mustard'
  | 'celery'
  | 'sulphites';

export type RecipeStage = 'prep' | 'cooking' | 'plating';
export type RecipeDifficulty = 'easy' | 'medium' | 'hard' | 'master';
export type KitchenStationType = 'grill' | 'fryer' | 'salad_cold' | 'beverages' | 'bakery' | 'main_kitchen' | 'dessert';

export interface StudioIngredient {
  id: string;
  inventoryItemId?: string;
  nameAr: string;
  nameEn: string;
  baseQuantity: number; // For baseYield
  unit: 'g' | 'kg' | 'ml' | 'l' | 'piece' | 'tbsp' | 'tsp' | 'pinch';
  costPerUnit: number; // Cost in SAR per display unit (or per kg/liter/piece)
  wastePercentage: number; // Waste factor e.g. 5% = 5
  allergens: AllergenType[];
  isCore?: boolean;
  notesAr?: string;
  notesEn?: string;
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  stage: RecipeStage;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  timerSeconds?: number;
  temperatureTarget?: string;
  criticalPointAr?: string;
  criticalPointEn?: string;
  equipmentNeeded: string[];
  image?: string;
}

export interface PlatingGuide {
  dishwareTypeAr: string;
  dishwareTypeEn: string;
  garnishAr: string;
  garnishEn: string;
  saucingTechniqueAr: string;
  saucingTechniqueEn: string;
  presentationNotesAr: string;
  presentationNotesEn: string;
  idealServingTemperature: string;
}

export interface StudioRecipe {
  id: string;
  menuItemId?: string;
  nameAr: string;
  nameEn: string;
  category: string;
  categoryAr: string;
  categoryEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  platingImage: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  baseYield: number; // Default portions (e.g. 1 or 4)
  difficulty: RecipeDifficulty;
  station: KitchenStationType;
  sellingPrice: number;
  targetFoodCostPercentage: number; // e.g. 28%
  laborCostPerPortion: number;
  allergens: AllergenType[];
  caloriesPerPortion: number;
  ingredients: StudioIngredient[];
  steps: RecipeStep[];
  platingGuide: PlatingGuide;
  equipment: string[];
  chefTipsAr: string[];
  chefTipsEn: string[];
  videoTutorialUrl?: string;
}

export interface ScaledIngredient {
  id: string;
  nameAr: string;
  nameEn: string;
  baseQuantity: number;
  scaledRawQuantity: number;
  wastePercentage: number;
  scaledEffectiveQuantity: number; // includes waste factor
  displayQuantity: number;
  displayUnit: string;
  unitCost: number;
  totalCost: number;
  wasteCost: number;
  costContributionPercent: number;
  allergens: AllergenType[];
}

export interface AllergenWarningDetail {
  allergen: AllergenType;
  nameAr: string;
  nameEn: string;
  icon: string;
  severity: 'high' | 'medium' | 'info';
  sourcesAr: string[];
  sourcesEn: string[];
  preventionTipAr: string;
  preventionTipEn: string;
}

export interface ScaledRecipeResult {
  recipeId: string;
  targetPortions: number;
  scaleMultiplier: number;
  scaledIngredients: ScaledIngredient[];
  totalRawWeightKg: number;
  totalEffectiveWeightKg: number;
  totalIngredientsCost: number;
  totalWasteCost: number;
  totalLaborCost: number;
  totalBatchCost: number;
  costPerPortion: number;
  sellingPricePerPortion: number;
  totalSellingPrice: number;
  totalGrossRevenue: number;
  grossProfit: number;
  grossMarginPercentage: number;
  foodCostPercentage: number;
  estimatedPrepTimeMinutes: number;
  batchCount: number;
  allergenWarnings: AllergenWarningDetail[];
}

export interface ChefQuizQuestion {
  id: string;
  questionAr: string;
  questionEn: string;
  optionsAr: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationAr: string;
  explanationEn: string;
}
