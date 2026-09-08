/**
 * =====================================================================
 * RESTAURANT OS — AI VISION & MULTIMODAL SCANNER TYPES
 * =====================================================================
 * Gemini 2.5 Flash Multimodal Vision:
 * 1. Plate Waste Estimator (هدر الصحون وتحسين أحجام الحصص)
 * 2. Visual Inventory & Expiry Scanner (مسح المخزون، الصلاحيات والباركود)
 */

export interface PlateWasteComponent {
  nameAr: string;
  nameEn: string;
  category: 'protein' | 'carbs' | 'vegetables' | 'sauce' | 'bread' | 'other';
  initialEstimatePercent: number; // e.g. 40% of original plate
  wastedPercent: number; // 0 to 100% of this component left unconsumed
  wastedGrams: number; // estimated weight leftover in grams
  wasteCostSar: number; // calculated financial cost of wasted portion
}

export type PlateWasteReason =
  | 'portion_too_large'
  | 'excessive_side_items'
  | 'overcooked_quality'
  | 'sauce_unwanted'
  | 'cold_temperature'
  | 'customer_appetite'
  | 'other';

export interface PlateWasteAnalysisResult {
  id: string;
  timestamp: string;
  dishNameAr: string;
  dishNameEn: string;
  matchedMenuItemId?: string;
  tableNumber?: string;
  totalWastePercentage: number; // overall percentage leftover (0 - 100)
  totalWasteGrams: number; // total estimated wasted weight
  totalFinancialLossSar: number; // estimated cost in SAR
  originalPlateCostSar: number; // original base cost of dish
  originalPlatePriceSar: number; // selling price
  components: PlateWasteComponent[];
  primaryWasteReason: PlateWasteReason;
  reasonAr: string;
  reasonEn: string;
  portionRecommendationAr: string;
  portionRecommendationEn: string;
  suggestedPortionReductionPercent: number; // e.g. 20%
  projectedMonthlySavingsSar: number; // e.g. 3500 SAR saved per month if adjusted
  confidence: number; // 0.0 to 1.0
  imageUrl?: string;
  aiModelUsed: string;
}

export type ExpiryStatus = 'safe' | 'expiring_soon' | 'critical' | 'expired';

export interface VisualInventoryItem {
  id: string;
  detectedNameAr: string;
  detectedNameEn: string;
  matchedInventoryItemId?: string;
  barcode?: string;
  batchNumber?: string;
  expiryDate?: string; // YYYY-MM-DD
  daysUntilExpiry?: number;
  expiryStatus: ExpiryStatus;
  quantityDetected: number;
  unit: string;
  storageCondition?: 'frozen' | 'chilled' | 'dry' | 'room_temp';
  packagingCondition: 'intact' | 'damaged' | 'unsealed';
  confidence: number;
  notes?: string;
}

export interface VisualInventoryScanResult {
  id: string;
  timestamp: string;
  imageUrl?: string;
  category?: string;
  items: VisualInventoryItem[];
  totalItemsDetected: number;
  criticalAlertsCount: number;
  summaryAr: string;
  summaryEn: string;
  confidence: number;
  aiModelUsed: string;
}

export type VisionScanMode = 'plate_waste' | 'inventory_scan' | 'analytics' | 'history';

export interface VisionSummaryStats {
  totalPlatesScanned: number;
  averageWastePercentage: number;
  totalLossSarToday: number;
  totalLossSarMonth: number;
  topWastedItems: {
    nameAr: string;
    wastePercent: number;
    lossSar: number;
    count: number;
  }[];
  inventoryScansCount: number;
  expiringItemsAlertCount: number;
  projectedAnnualSavingsSar: number;
}

export interface VisionSamplePreset {
  id: string;
  titleAr: string;
  titleEn: string;
  mode: 'plate_waste' | 'inventory_scan';
  imagePlaceholder: string;
  descriptionAr: string;
  descriptionEn: string;
  presetData: PlateWasteAnalysisResult | VisualInventoryScanResult;
}
