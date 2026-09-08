import { describe, it, expect, beforeEach } from 'vitest';
import {
  recipeStudioService,
  SIGNATURE_RECIPES,
  ALLERGEN_METADATA,
} from '../services/recipeStudioService';
import {
  marketingService,
  MOCK_CUSTOMERS_CRM,
  DEFAULT_WHATSAPP_TEMPLATES,
} from '../services/marketingService';
import { StudioRecipe, AllergenType } from '../types/recipeStudio';
import { CustomerTarget } from '../types/marketing';

describe('Recipe Studio, Portion Scaler & WhatsApp Marketing Engine', () => {
  const wagyuRecipe = SIGNATURE_RECIPES.find((r) => r.id === 'rec-wagyu-ribeye')!;
  const risottoRecipe = SIGNATURE_RECIPES.find((r) => r.id === 'rec-truffle-risotto')!;
  const mezzeRecipe = SIGNATURE_RECIPES.find((r) => r.id === 'rec-mezze-royale')!;
  const kunafaRecipe = SIGNATURE_RECIPES.find((r) => r.id === 'rec-kunafa-souffle')!;

  describe('1. Recipe Portion Scaling & Batch Production (10 to 1,000 Portions)', () => {
    it('should scale ingredients proportionally from 1 portion to 10 portions', () => {
      const scaled10 = recipeStudioService.scaleRecipe(wagyuRecipe, 10);

      expect(scaled10.targetPortions).toBe(10);
      expect(scaled10.scaleMultiplier).toBe(10); // baseYield is 1

      // Wagyu Beef base is 300g with 4% waste -> 3000g raw -> 3120g effective (3.12 kg)
      const beef = scaled10.scaledIngredients.find((i) => i.id === 'ing-wagyu-beef')!;
      expect(beef.scaledRawQuantity).toBe(3000);
      expect(beef.scaledEffectiveQuantity).toBe(3120);
      expect(beef.displayQuantity).toBe(3.12);
      expect(beef.displayUnit).toBe('kg');

      // Truffle butter base is 35g with 2% waste -> 350g raw -> 357g effective
      const butter = scaled10.scaledIngredients.find((i) => i.id === 'ing-truffle-butter')!;
      expect(butter.scaledRawQuantity).toBe(350);
      expect(butter.scaledEffectiveQuantity).toBe(357);
      expect(butter.displayUnit).toBe('g');
    });

    it('should scale accurately for massive catering batches (100, 500, and 1,000 portions)', () => {
      const scaled100 = recipeStudioService.scaleRecipe(wagyuRecipe, 100);
      const scaled500 = recipeStudioService.scaleRecipe(wagyuRecipe, 500);
      const scaled1000 = recipeStudioService.scaleRecipe(wagyuRecipe, 1000);

      expect(scaled100.scaleMultiplier).toBe(100);
      expect(scaled500.scaleMultiplier).toBe(500);
      expect(scaled1000.scaleMultiplier).toBe(1000);

      // 1000 portions = 1000 * 300g = 300,000g = 300 kg raw beef
      const beef1000 = scaled1000.scaledIngredients.find((i) => i.id === 'ing-wagyu-beef')!;
      expect(beef1000.scaledRawQuantity).toBe(300000);
      // Effective with 4% waste = 312,000g = 312 kg
      expect(beef1000.scaledEffectiveQuantity).toBe(312000);
      expect(beef1000.displayQuantity).toBe(312);
      expect(beef1000.displayUnit).toBe('kg');

      // Total weights
      expect(scaled1000.totalRawWeightKg).toBeGreaterThanOrEqual(500); // 500+ kg total batch
      expect(scaled1000.totalEffectiveWeightKg).toBeGreaterThan(scaled1000.totalRawWeightKg);
    });

    it('should handle unit conversions automatically for grams to kilograms and ml to liters', () => {
      const scaled100Risotto = recipeStudioService.scaleRecipe(risottoRecipe, 100);

      // Saffron Broth base: 400 ml -> 40,000 ml for 100 portions -> 41.2 L with 3% waste
      const broth = scaled100Risotto.scaledIngredients.find((i) => i.id === 'ing-broth-saffron')!;
      expect(broth.scaledRawQuantity).toBe(40000);
      expect(broth.displayUnit).toBe('l');
      expect(broth.displayQuantity).toBe(41.2);

      // Rice Carnaroli base: 110g -> 11,000g -> 11.11 kg
      const rice = scaled100Risotto.scaledIngredients.find((i) => i.id === 'ing-rice-carnaroli')!;
      expect(rice.displayUnit).toBe('kg');
      expect(rice.displayQuantity).toBe(11.11);
    });

    it('should calculate batch yield from recipes with multi-portion base yield', () => {
      // Mezze baseYield is 2 portions
      const scaled10Mezze = recipeStudioService.scaleRecipe(mezzeRecipe, 10);
      expect(scaled10Mezze.scaleMultiplier).toBe(5); // 10 / 2 = 5

      // Chickpeas base: 250g for 2 portions -> 1250g raw for 10 portions -> 1287.5g effective
      const chickpeas = scaled10Mezze.scaledIngredients.find((i) => i.id === 'ing-chickpeas-cooked')!;
      expect(chickpeas.scaledRawQuantity).toBe(1250);
      expect(chickpeas.displayUnit).toBe('kg');
      expect(chickpeas.displayQuantity).toBe(1.29);
    });
  });

  describe('2. Recipe Costing, Waste & Profit Margin Analytics', () => {
    it('should compute exact total ingredient cost, waste cost, and labor cost', () => {
      const scaled10 = recipeStudioService.scaleRecipe(wagyuRecipe, 10);

      // Selling price: 345 SAR * 10 = 3,450 SAR
      expect(scaled10.totalSellingPrice).toBe(3450);
      expect(scaled10.totalGrossRevenue).toBe(3450);

      // Ingredients cost check
      expect(scaled10.totalIngredientsCost).toBeGreaterThan(0);
      expect(scaled10.totalWasteCost).toBeGreaterThan(0);

      // Total batch cost = ingredients + labor
      expect(scaled10.totalBatchCost).toBe(
        Number((scaled10.totalIngredientsCost + scaled10.totalLaborCost).toFixed(2))
      );

      // Cost per portion
      expect(scaled10.costPerPortion).toBe(
        Number((scaled10.totalBatchCost / 10).toFixed(2))
      );

      // Gross profit = revenue - total batch cost
      expect(scaled10.grossProfit).toBe(
        Number((scaled10.totalGrossRevenue - scaled10.totalBatchCost).toFixed(2))
      );

      // Margins
      expect(scaled10.grossMarginPercentage).toBeGreaterThan(50); // Luxury Wagyu high margin
      expect(scaled10.foodCostPercentage).toBeLessThan(40);
    });

    it('should apply labor economies of scale for large batches (> 100 and > 500 portions)', () => {
      const scaled10 = recipeStudioService.scaleRecipe(wagyuRecipe, 10);
      const scaled100 = recipeStudioService.scaleRecipe(wagyuRecipe, 100);
      const scaled500 = recipeStudioService.scaleRecipe(wagyuRecipe, 500);

      // Labor per portion in scaled10: 18.0 * 10 * 1.0 = 180 SAR (18 SAR/portion)
      // Labor per portion in scaled100: 18.0 * 100 * 0.75 = 1,350 SAR (13.5 SAR/portion)
      // Labor per portion in scaled500: 18.0 * 500 * 0.60 = 5,400 SAR (10.8 SAR/portion)
      const laborPerPortion10 = scaled10.totalLaborCost / 10;
      const laborPerPortion100 = scaled100.totalLaborCost / 100;
      const laborPerPortion500 = scaled500.totalLaborCost / 500;

      expect(laborPerPortion10).toBe(18.0);
      expect(laborPerPortion100).toBe(13.5);
      expect(laborPerPortion500).toBe(10.8);
      expect(laborPerPortion500).toBeLessThan(laborPerPortion100);
    });

    it('should calculate non-linear sub-linear prep time for batches', () => {
      const scaled10 = recipeStudioService.scaleRecipe(wagyuRecipe, 10);
      const scaled100 = recipeStudioService.scaleRecipe(wagyuRecipe, 100);

      // Base prep time = 15 mins. 10 portions should take ~39 mins (not 150 mins)
      expect(scaled10.estimatedPrepTimeMinutes).toBeGreaterThan(15);
      expect(scaled10.estimatedPrepTimeMinutes).toBeLessThan(150);

      // 100 portions should take ~104 mins (not 1500 mins)
      expect(scaled100.estimatedPrepTimeMinutes).toBeGreaterThan(scaled10.estimatedPrepTimeMinutes);
      expect(scaled100.estimatedPrepTimeMinutes).toBeLessThan(200);
    });
  });

  describe('3. Allergen Detection, Severity & Kitchen Safety Rules', () => {
    it('should identify all allergens correctly and map severity levels', () => {
      const scaledMezze = recipeStudioService.scaleRecipe(mezzeRecipe, 10);

      // Mezze ingredients have sesame (Tahini) and nuts (Pine nuts)
      const allergenTypes = scaledMezze.allergenWarnings.map((w) => w.allergen);
      expect(allergenTypes).toContain('sesame');
      expect(allergenTypes).toContain('nuts');

      const nutsWarning = scaledMezze.allergenWarnings.find((w) => w.allergen === 'nuts')!;
      expect(nutsWarning.severity).toBe('high');
      expect(nutsWarning.sourcesAr.some((s) => s.includes('صنوبر'))).toBe(true);

      const sesameWarning = scaledMezze.allergenWarnings.find((w) => w.allergen === 'sesame')!;
      expect(sesameWarning.severity).toBe('medium');
      expect(sesameWarning.sourcesAr.some((s) => s.includes('طحينة'))).toBe(true);
    });

    it('should detect dairy and gluten in dessert souffle recipe', () => {
      const scaledKunafa = recipeStudioService.scaleRecipe(kunafaRecipe, 10);
      const allergenTypes = scaledKunafa.allergenWarnings.map((w) => w.allergen);

      expect(allergenTypes).toContain('gluten'); // Dough
      expect(allergenTypes).toContain('dairy'); // Akkawi cheese & Ashta
      expect(allergenTypes).toContain('nuts'); // Pistachio
    });
  });

  describe('4. RFM Customer Segmentation Engine', () => {
    it('should classify VIP / Champions customers with high spend or VIP tier', () => {
      const vipCustomer = {
        totalSpent: 12400,
        totalOrders: 38,
        lastVisitDaysAgo: 1,
        tier: 'Black VIP',
      };
      const segment = marketingService.classifyCustomerSegment(vipCustomer);
      expect(segment).toBe('vip');
    });

    it('should classify at-risk and inactive dormant customers accurately based on recency', () => {
      // Visited 50 days ago with 14 orders -> At-Risk
      const atRiskCustomer = {
        totalSpent: 3000,
        totalOrders: 14,
        lastVisitDaysAgo: 50,
        tier: 'Gold',
      };
      expect(marketingService.classifyCustomerSegment(atRiskCustomer)).toBe('at_risk');

      // Visited 100 days ago -> Inactive
      const inactiveCustomer = {
        totalSpent: 800,
        totalOrders: 4,
        lastVisitDaysAgo: 100,
        tier: 'Bronze',
      };
      expect(marketingService.classifyCustomerSegment(inactiveCustomer)).toBe('inactive');
    });

    it('should classify new diners with low visit count and recent visits', () => {
      const newCustomer = {
        totalSpent: 185,
        totalOrders: 1,
        lastVisitDaysAgo: 2,
        tier: 'Bronze',
      };
      expect(marketingService.classifyCustomerSegment(newCustomer)).toBe('new');
    });

    it('should generate statistical breakdown across all segments', () => {
      const stats = marketingService.getSegmentStats(MOCK_CUSTOMERS_CRM);
      expect(stats).toHaveLength(6); // all, vip, loyal, at_risk, inactive, new

      const allStats = stats.find((s) => s.segment === 'all')!;
      expect(allStats.count).toBe(MOCK_CUSTOMERS_CRM.length);
      expect(allStats.averageSpend).toBeGreaterThan(0);
    });
  });

  describe('5. WhatsApp Campaign Generator, Dynamic Tag Renderer & ROI Simulation', () => {
    it('should interpolate template tags ({name}, {tier}, {favorite_dish}, {discount_code}) correctly', () => {
      const template =
        'مرحباً {name}، بصفتك عميل {tier}، يسعدنا دعوتك لتناول {favorite_dish} مع خصم كود {discount_code} ورصيدك {points_balance} نقطة!';

      const customer: CustomerTarget = {
        id: 'c-test',
        name: 'سلطان المقرن',
        phone: '+966554912233',
        tier: 'Black VIP',
        totalSpent: 12400,
        totalOrders: 38,
        loyaltyPoints: 4850,
        favoriteDish: 'ستيك ريب آي واغيو A5',
        lastVisitDaysAgo: 1,
        segment: 'vip',
      };

      const rendered = marketingService.renderTemplate(template, customer, {
        discount_code: 'ROYAL20',
      });

      expect(rendered).toContain('سلطان المقرن');
      expect(rendered).toContain('Black VIP');
      expect(rendered).toContain('ستيك ريب آي واغيو A5');
      expect(rendered).toContain('ROYAL20');
      expect(rendered).toContain('4850');
      expect(rendered).not.toContain('{name}');
      expect(rendered).not.toContain('{tier}');
    });

    it('should create and simulate full dispatch of WhatsApp marketing campaign', () => {
      const campaign = marketingService.createCampaign({
        titleAr: 'حملة استعادة العملاء الخاصة',
        titleEn: 'Special Win-Back Campaign',
        segment: 'vip',
        messageTextAr: 'أهلاً يا {name}، خصم خاص بكود {discount_code}',
        messageTextEn: 'Hello {name}, special discount {discount_code}',
        couponCode: 'WINBACK20',
        discountPercentage: 20,
      });

      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe('scheduled');
      expect(campaign.targetedCount).toBeGreaterThanOrEqual(1);

      // Simulate dispatch
      const results = marketingService.simulateCampaignDispatch(campaign.id, MOCK_CUSTOMERS_CRM);

      expect(results.campaignId).toBe(campaign.id);
      expect(results.deliveryRate).toBeGreaterThanOrEqual(90);
      expect(results.readRate).toBeGreaterThanOrEqual(80);
      expect(results.conversionRate).toBeGreaterThan(0);
      expect(results.roi).toBeGreaterThan(100); // Positive ROI on WhatsApp marketing

      const updatedCampaign = marketingService.getAllCampaigns().find((c) => c.id === campaign.id)!;
      expect(updatedCampaign.status).toBe('completed');
      expect(updatedCampaign.revenueGenerated).toBeGreaterThan(0);
    });
  });

  describe('6. Chef Quality Control Quiz & Certification Engine', () => {
    it('should retrieve quality quizzes for signature dishes', () => {
      const wagyuQuiz = recipeStudioService.getQuizForRecipe('rec-wagyu-ribeye');
      expect(wagyuQuiz.length).toBeGreaterThanOrEqual(2);

      const q1 = wagyuQuiz[0];
      expect(q1.optionsAr).toHaveLength(4);
      expect(q1.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q1.explanationAr).toBeDefined();
    });

    it('should provide fallback quiz for custom recipes without explicit questions', () => {
      const fallbackQuiz = recipeStudioService.getQuizForRecipe('non-existing-recipe');
      expect(fallbackQuiz).toHaveLength(1);
      expect(fallbackQuiz[0].optionsAr[fallbackQuiz[0].correctIndex]).toContain('HACCP');
    });
  });
});
