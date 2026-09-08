/**
 * =====================================================================
 * RESTAURANT OS — RECIPE STUDIO & CHEF TRAINING SERVICE
 * =====================================================================
 * Handles:
 * - High-Precision Multi-Portion Recipe Scaling (10 to 1,000 portions)
 * - Raw Ingredient Weights, Waste / Yield Percentage & Volume Conversion
 * - Exact Batch Costing, Labor Economics & Gross Margin Analytics
 * - Comprehensive Allergen Detection & Cross-Contamination Safety Alerts
 * - Chef Step-by-Step Training & Quality Control Protocols
 */

import {
  StudioRecipe,
  StudioIngredient,
  ScaledRecipeResult,
  ScaledIngredient,
  AllergenType,
  AllergenWarningDetail,
  ChefQuizQuestion,
} from '../types/recipeStudio';

export const ALLERGEN_METADATA: Record<
  AllergenType,
  {
    nameAr: string;
    nameEn: string;
    icon: string;
    severity: 'high' | 'medium' | 'info';
    preventionTipAr: string;
    preventionTipEn: string;
  }
> = {
  gluten: {
    nameAr: 'جلوتين (قمح / شعير)',
    nameEn: 'Gluten (Wheat / Barley)',
    icon: '🌾',
    severity: 'medium',
    preventionTipAr: 'استخدم ألواح تقطيع منفصلة وأواني معقمة لتجنب التلوث التبادلي للمرضى الحساسين للجلوتين.',
    preventionTipEn: 'Use dedicated chopping boards and sterilized utensils to prevent cross-contact for celiac diners.',
  },
  dairy: {
    nameAr: 'مشتقات الحليب واللاكتوز',
    nameEn: 'Dairy & Lactose',
    icon: '🥛',
    severity: 'medium',
    preventionTipAr: 'احفظ الزبدة والأجبان في أوعية محكمة الإغلاق ومبردة عند درجة حرارة أقل من 4 درجات مئوية.',
    preventionTipEn: 'Store butter and cheeses in sealed airtight containers refrigerated below 4°C.',
  },
  nuts: {
    nameAr: 'مكسرات شجرية (صنوبر، جوز، فستق)',
    nameEn: 'Tree Nuts (Pine nuts, Walnuts, Pistachios)',
    icon: '🌰',
    severity: 'high',
    preventionTipAr: 'تحذير عالي الخطورة! جهز المكسرات في محطة مخصصة تماماً واغسل اليدين جيداً بعد التعامل معها.',
    preventionTipEn: 'HIGH RISK ALERT! Prep nuts at a dedicated cold station and wash hands thoroughly after handling.',
  },
  peanuts: {
    nameAr: 'فول سوداني',
    nameEn: 'Peanuts',
    icon: '🥜',
    severity: 'high',
    preventionTipAr: 'تحذير حساسية قاتلة (صدمة تأقية)! استعمل مقالي ومعدات معزولة بالكامل.',
    preventionTipEn: 'CRITICAL ANAPHYLAXIS RISK! Use isolated fryers and designated cookware.',
  },
  eggs: {
    nameAr: 'بيض ومشتقاته',
    nameEn: 'Eggs & Derivatives',
    icon: '🥚',
    severity: 'medium',
    preventionTipAr: 'استخدم بيضاً مبستراً في الصلصات الباردة وافصل أواني الخفق بعناية.',
    preventionTipEn: 'Use pasteurized eggs for cold emulsions and keep whisking bowls dedicated.',
  },
  soy: {
    nameAr: 'فول الصويا',
    nameEn: 'Soybeans & Soy Sauce',
    icon: '🌱',
    severity: 'medium',
    preventionTipAr: 'تحقق من صلصات التتبيل والمارينيت لاحتوائها على الصويا المركزة.',
    preventionTipEn: 'Double-check marinades and seasoning glazes for hidden soy concentrates.',
  },
  fish: {
    nameAr: 'أسماك ومأكولات بحرية زعانفية',
    nameEn: 'Finned Fish',
    icon: '🐟',
    severity: 'high',
    preventionTipAr: 'استخدم لوح التقطيع الأزرق المخصص للأسماك لمنع انتقال الروائح والمسببات للحوم الأخرى.',
    preventionTipEn: 'Use blue color-coded chopping boards exclusively for finned fish.',
  },
  crustaceans: {
    nameAr: 'قشريات ورخويات (روبيان، استاكوزا)',
    nameEn: 'Crustaceans & Shellfish',
    icon: '🦐',
    severity: 'high',
    preventionTipAr: 'تحذير حساسية شديدة! لا تخلط زيت قلي الروبيان مع باقي المقليات أبداً.',
    preventionTipEn: 'HIGH RISK ALLERGEN! Never share shrimp fryer oil with other fried items.',
  },
  sesame: {
    nameAr: 'سمسم وطحينة',
    nameEn: 'Sesame & Tahini',
    icon: '🥯',
    severity: 'medium',
    preventionTipAr: 'احذر من قطرات زيت السمسم والطحينة على أسطح التجهيز.',
    preventionTipEn: 'Watch out for residual sesame oil and tahini drippings on prep countertops.',
  },
  mustard: {
    nameAr: 'خردل (مستردة)',
    nameEn: 'Mustard',
    icon: '🟡',
    severity: 'info',
    preventionTipAr: 'نظف ملاعق التتبيل فور الانتهاء لتفادي نقل نكهة وبقايا الخردل.',
    preventionTipEn: 'Sanitize marinade spoons immediately to avoid residual mustard contact.',
  },
  celery: {
    nameAr: 'كرفس',
    nameEn: 'Celery',
    icon: '🥬',
    severity: 'info',
    preventionTipAr: 'افصل الكرفس عند فرم الميربوا إذا كان العميل يعاني من حساسية الكرفس.',
    preventionTipEn: 'Exclude celery from aromatic mirepoix bases for sensitive diners upon request.',
  },
  sulphites: {
    nameAr: 'كبريتات ومواد حافظة',
    nameEn: 'Sulphites & Preservatives',
    icon: '🧪',
    severity: 'info',
    preventionTipAr: 'تأكد من شطف الفواكه المجففة والخل المنكه المضاف للصلصات.',
    preventionTipEn: 'Rinse dried fruits and inspect vinegars with added preservative sulphites.',
  },
};

export const SIGNATURE_RECIPES: StudioRecipe[] = [
  {
    id: 'rec-wagyu-ribeye',
    nameAr: 'ستيك ريب آي واغيو ياباني A5 بالكمأة السوداء',
    nameEn: 'A5 Japanese Wagyu Ribeye with Black Truffle Butter',
    category: 'grills',
    categoryAr: 'المشاوي الملكية واللحوم',
    categoryEn: 'Prime Grills & Steaks',
    descriptionAr: 'قطعة ستيك ريب آي رخامية من أجود سلالات الواغيو الياباني A5، مشوية بدقة على الفحم ومقدمة مع زبدة الكمأة السوداء والبطاطس المهروسة المخملية.',
    descriptionEn: 'Ultra-marbled A5 Japanese Wagyu Ribeye seared over natural oak charcoal, served with black truffle compound butter and velvet Robuchon mousseline.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=1200&q=85',
    platingImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=85',
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    baseYield: 1, // 1 portion
    difficulty: 'master',
    station: 'grill',
    sellingPrice: 345.0,
    targetFoodCostPercentage: 28.0,
    laborCostPerPortion: 18.0,
    allergens: ['dairy'],
    caloriesPerPortion: 780,
    equipment: [
      'شواية فحم البلوط / مقلاة حديد زهر Cast Iron',
      'ميزان حرارة فوري Meater / Thermapen',
      'ملقط لحوم شيف احترافي',
      'مغرفة زبدة للتعريق Basting Spoon',
    ],
    chefTipsAr: [
      'أخرج قطعة الواغيو من الثلاجة قبل الطهي بـ 25 دقيقة لتصل إلى حرارة الغرفة (20°C) لضمان نضج متجانس وذوبان الدهن الرخامي.',
      'اعتمد التمليح بملح مالدون البحري الخشن قبل إنزال اللحم على النار مباشرة للحفاظ على العصارة الداخلية.',
      'أرح اللحم (Resting) لمدة 6 دقائق كاملة على رف شبكي دافئ لتعود العصارة للتوزع في كافة الأنسجة.',
    ],
    chefTipsEn: [
      'Bring Wagyu to room temp (20°C) 25 mins prior to cooking to ensure even fat rendering.',
      'Season generously with flaky Maldon sea salt immediately before hitting the smoking-hot surface.',
      'Rest meat for a full 6 minutes on a warm resting rack to lock in intracellular juices.',
    ],
    ingredients: [
      {
        id: 'ing-wagyu-beef',
        nameAr: 'لحم ستيك واغيو A5 مقطع 300 غرام',
        nameEn: 'A5 Wagyu Ribeye Cut (300g)',
        baseQuantity: 300,
        unit: 'g',
        costPerUnit: 0.38, // 380 SAR/kg
        wastePercentage: 4.0, // 4% trim waste
        allergens: [],
        isCore: true,
        notesAr: 'رخامية BMS 9-11',
      },
      {
        id: 'ing-truffle-butter',
        nameAr: 'زبدة الكمأة السوداء الفرنسية الفاخرة',
        nameEn: 'French Black Truffle Butter',
        baseQuantity: 35,
        unit: 'g',
        costPerUnit: 0.22, // 220 SAR/kg
        wastePercentage: 2.0,
        allergens: ['dairy'],
        isCore: true,
      },
      {
        id: 'ing-rosemary-garlic',
        nameAr: 'أعواد روزماري طازجة وثوم معتق',
        nameEn: 'Fresh Rosemary Sprigs & Aged Garlic',
        baseQuantity: 20,
        unit: 'g',
        costPerUnit: 0.05,
        wastePercentage: 10.0,
        allergens: [],
      },
      {
        id: 'ing-potato-puree',
        nameAr: 'بطاطس راتاتويل مهروسة بالكريمة والزبدة',
        nameEn: 'Velvet Potato Mousseline',
        baseQuantity: 150,
        unit: 'g',
        costPerUnit: 0.04,
        wastePercentage: 5.0,
        allergens: ['dairy'],
      },
      {
        id: 'ing-maldon-salt',
        nameAr: 'رقائق ملح مالدون البحري وفلفل أسود مدخن',
        nameEn: 'Flaky Maldon Sea Salt & Smoked Peppercorn',
        baseQuantity: 6,
        unit: 'g',
        costPerUnit: 0.08,
        wastePercentage: 0.0,
        allergens: [],
      },
    ],
    steps: [
      {
        id: 'step-1-prep',
        stepNumber: 1,
        stage: 'prep',
        titleAr: 'تجهيز وتتبيل الواغيو وضبط الحرارة',
        titleEn: 'Wagyu Tempering & Initial Seasoning',
        descriptionAr: 'تجفيف سطح الستيك بمناديل الطهي، التمليح بملح مالدون البحري الخشن، وتحضير أعشاب الروزماري والثوم المسحوق.',
        descriptionEn: 'Pat dry the steak surface with chef paper towels, season liberally with coarse Maldon salt, and prep fresh herbs.',
        timerSeconds: 120,
        temperatureTarget: '20°C (حرارة الغرفة الداخلية للقطعة)',
        criticalPointAr: 'تأكد من جفاف السطح تماماً للحصول على قشرة كراميل Maillard مقرمشة وذهبية.',
        criticalPointEn: 'Surface must be completely dry to achieve a deep golden Maillard crust without boiling.',
        equipmentNeeded: ['لوح تقطيع خشبي فاخر', 'مناديل شيف ماصة'],
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'step-2-sear',
        stepNumber: 2,
        stage: 'cooking',
        titleAr: 'الكي الحراري المزدوج (Sear & Butter Basting)',
        titleEn: 'High-Heat Sear & Aromatic Basting',
        descriptionAr: 'إنزال الستيك على المقلاة الملتهبة لمدة 90 ثانية لكل وجه، ثم إضافة زبدة الكمأة والروزماري والثوم والتعريق المستمر بالمغرفة.',
        descriptionEn: 'Sear in screaming-hot cast iron for 90s per side, drop in truffle butter, crushed garlic and rosemary, basting vigorously.',
        timerSeconds: 360,
        temperatureTarget: 'حرارة المقلاة 230°C / قلب اللحم 54°C (Medium-Rare)',
        criticalPointAr: 'لا تتجاوز درجة الحرارة الداخلية 55°C لأن دهن الواغيو يبدأ بالذوبان التام عند 25°C.',
        criticalPointEn: 'Never exceed internal 55°C core temp as Wagyu intramuscular fat renders instantly.',
        equipmentNeeded: ['مقلاة حديد زهر 12 إنش', 'ميزان حرارة Meater الرقمي', 'مغرفة تعريق'],
        image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'step-3-plating',
        stepNumber: 3,
        stage: 'plating',
        titleAr: 'التقطيع المروحي والتقديم الملكي',
        titleEn: 'Fan Slicing & Royal Plating Presentation',
        descriptionAr: 'سكب مسحة دائرية من موسلين البطاطس الكريمية، تقطيع الستيك بزاوية 45 درجة إلى شرائح مروحية بسماكة 1.5 سم، ورش رقائق الملح وزيت الكمأة.',
        descriptionEn: 'Create an elegant circular swipe of velvet potato puree, fan-slice steak at 45° angle, garnish with truffle reduction and Maldon flakes.',
        timerSeconds: 90,
        temperatureTarget: 'تقديم على طبق مسخن مسبقاً عند 60°C',
        criticalPointAr: 'يجب أن يكون الصحن دافئاً لحفظ دهن الواغيو في حالته الذائبة الحريرية.',
        criticalPointEn: 'Plates MUST be pre-heated to 60°C to preserve velvety Wagyu lipid texture.',
        equipmentNeeded: ['سكين شيف ياباني حاد Damacus', 'صحن فخار سيراميك أسود بركاني'],
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      },
    ],
    platingGuide: {
      dishwareTypeAr: 'صحن سيراميك حجري أسود بركاني غير لامع (Matte Black Slate, 30cm)',
      dishwareTypeEn: 'Matte Charcoal Black Slate Round Ceramic Plate (30cm)',
      garnishAr: 'أوراق الميكروجرينز العطرية، رقائق الملح البحري الفضي، وشرائح كمأة إيطالية رقيقة',
      garnishEn: 'Aromatic micro-greens, silver Maldon sea salt flakes, and shaved Italian summer truffles',
      saucingTechniqueAr: 'مسحة هلالية نصف دائرية بملعقة السكب (Crescent Swipe) مع قطرات صوص ديمي غلاس المركز',
      saucingTechniqueEn: 'Smooth crescent offset spoon swipe with centered demi-glace drizzle dots',
      presentationNotesAr: 'توجيه شرائح الستيك لتعكس الضوء وتظهر الخطوط الرخامية الوردية المشرقة (Medium Rare Rosé).',
      presentationNotesEn: 'Angle the fan slices towards dining vantage point highlighting glistening pink marble fibers.',
      idealServingTemperature: '62°C - 65°C',
    },
  },
  {
    id: 'rec-truffle-risotto',
    nameAr: 'ريزوتو الفطر البري الإيطالي بالزعفران والبارميزان المعتق',
    nameEn: 'Wild Forest Mushroom & Saffron Carnaroli Risotto',
    category: 'pasta-pizza',
    categoryAr: 'الباستا والريزوتو الفاخر',
    categoryEn: 'Artisan Pasta & Risotto',
    descriptionAr: 'أرز كارنارولي الإيطالي الأصيل المطهو ببطء مع مرق الدجاج المركز، فطر البورشيني والشيتاكي المحمر، وجبن البارميزان المعتق 24 شهراً.',
    descriptionEn: 'Slow-simmered authentic Carnaroli rice infused with rich chicken essence, roasted porcini, shiitake mushrooms, and 24-month aged Parmigiano Reggiano.',
    image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=1200&q=85',
    platingImage: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=1200&q=85',
    prepTimeMinutes: 12,
    cookTimeMinutes: 18,
    baseYield: 1,
    difficulty: 'hard',
    station: 'main_kitchen',
    sellingPrice: 98.0,
    targetFoodCostPercentage: 24.0,
    laborCostPerPortion: 9.5,
    allergens: ['dairy', 'celery'],
    caloriesPerPortion: 620,
    equipment: [
      'قدر نحاسي عريض Risotto Pan',
      'ملعقة خشبية مثقوبة Girariso',
      'مبشرة ميكروبلين Microplane Grater',
    ],
    chefTipsAr: [
      'احرص على إضافة المرق ساخناً ومغلياً تدريجياً مع التحريك المستمر لاستخراج النشا وصنع قوام كريمي موجي (All’onda).',
      'عملية الـ Mantecatura (إضافة الزبدة والبارميزان الباردين خارج النار مع الخفق الشديد) هي سر اللمعان المخملي.',
    ],
    chefTipsEn: [
      'Always add hot boiling stock gradually while stirring continuously to release creamy starch (All’onda wave).',
      'The Mantecatura off-heat emulsification with ice-cold butter and parmesan creates signature glossy velvet.',
    ],
    ingredients: [
      {
        id: 'ing-rice-carnaroli',
        nameAr: 'أرز كارنارولي إيطالي فاخر',
        nameEn: 'Italian Carnaroli Rice',
        baseQuantity: 110,
        unit: 'g',
        costPerUnit: 0.035,
        wastePercentage: 1.0,
        allergens: [],
        isCore: true,
      },
      {
        id: 'ing-mushrooms-mix',
        nameAr: 'مزيج فطر بورشيني وشيتاكي طازج ومجفف',
        nameEn: 'Wild Porcini & Shiitake Blend',
        baseQuantity: 80,
        unit: 'g',
        costPerUnit: 0.09,
        wastePercentage: 8.0,
        allergens: [],
        isCore: true,
      },
      {
        id: 'ing-parmigiano',
        nameAr: 'جبن بارميزان ريجانو معتق 24 شهراً',
        nameEn: '24-Month Aged Parmigiano Reggiano',
        baseQuantity: 40,
        unit: 'g',
        costPerUnit: 0.14,
        wastePercentage: 2.0,
        allergens: ['dairy'],
        isCore: true,
      },
      {
        id: 'ing-broth-saffron',
        nameAr: 'مرق شيف مصفى مع خيوط الزعفران الإيراني',
        nameEn: 'Infused Saffron Reduction Broth',
        baseQuantity: 400,
        unit: 'ml',
        costPerUnit: 0.015,
        wastePercentage: 3.0,
        allergens: ['celery'],
      },
      {
        id: 'ing-cold-butter',
        nameAr: 'زبدة فرنسية غير مملحة مثلجة',
        nameEn: 'Cold French Unsalted Butter',
        baseQuantity: 30,
        unit: 'g',
        costPerUnit: 0.045,
        wastePercentage: 0.0,
        allergens: ['dairy'],
      },
    ],
    steps: [
      {
        id: 'step-risotto-1',
        stepNumber: 1,
        stage: 'prep',
        titleAr: 'تحميص حبات الأرز (Tostatura)',
        titleEn: 'Rice Tostatura Dry Toasting',
        descriptionAr: 'تحميص حبات أرز الكارنارولي في القدر النحاسي حتى تصبح شفافة مع انبعاث رائحة المكسرات الشهية.',
        descriptionEn: 'Toast Carnaroli grains in dry copper pan until translucent with subtle nutty aroma.',
        timerSeconds: 180,
        temperatureTarget: '160°C حرارة قاع القدر',
        equipmentNeeded: ['قدر نحاسي عريض Risotto Pan'],
      },
      {
        id: 'step-risotto-2',
        stepNumber: 2,
        stage: 'cooking',
        titleAr: 'الطهي التدريجي بالمرق الساخن والفطر',
        titleEn: 'Slow Ladle Simmer & Wild Mushroom Fold',
        descriptionAr: 'إضافة مغارف المرق المغلي الممزوج بالزعفران واحدة تلو الأخرى مع التقليب المستمر وإضافة الفطر المحمر.',
        descriptionEn: 'Add hot saffron stock one ladle at a time, stirring constantly to yield rich starches.',
        timerSeconds: 900,
        temperatureTarget: 'غليان هادئ Simmering 92°C',
        equipmentNeeded: ['ملعقة Girariso المثقوبة', 'مغرفة مرق ستانلس'],
      },
      {
        id: 'step-risotto-3',
        stepNumber: 3,
        stage: 'plating',
        titleAr: 'مستحلب المانتيكاتورا والتزيين العطري',
        titleEn: 'Mantecatura Emulsification & Plating',
        descriptionAr: 'خفق الزبدة والبارميزان الباردين بقوة خارج النار، ثم صب الريزوتو ليهتز كالموجة وتزيينه بكراميل الفطر.',
        descriptionEn: 'Vigorously whip cold butter and aged parmesan off heat, pour onto wide warm rim plate with mushroom chips.',
        timerSeconds: 120,
        temperatureTarget: '72°C حرارة التقديم الفورية',
        equipmentNeeded: ['صحن غائر عريض وايد ريم (Wide-Rim Pasta Bowl)'],
      },
    ],
    platingGuide: {
      dishwareTypeAr: 'صحن ريزوتو عميق ذو حافة عريضة مذهبة (Gold-Rimmed Deep Porcelain Bowl)',
      dishwareTypeEn: 'Gold-Rimmed Deep Porcelain Risotto Bowl',
      garnishAr: 'رقائق فطر مقرمشة، خيوط زعفران نقي، ورشة جبن بارميزان مفروم ناعماً',
      garnishEn: 'Crispy mushroom tuile, Persian saffron threads, and snowed microplane Parmigiano',
      saucingTechniqueAr: 'طريقة التموج الحر (All’onda Flow) بحيث ينساب الريزوتو دون سيلان مائي',
      saucingTechniqueEn: 'Natural flat wave spread filling bottom center bowl effortlessly',
      presentationNotesAr: 'يجب أن يملأ الريزوتو قاع الصحن بحركة اهتزازية خفيفة ويحافظ على قوامه الكريمي المتماسك.',
      presentationNotesEn: 'A light tap under the bowl should level the risotto flat without breaking consistency.',
      idealServingTemperature: '68°C - 72°C',
    },
  },
  {
    id: 'rec-mezze-royale',
    nameAr: 'تشكيلة المزة الشامية الملكية بالصنوبر وزيت الزيتون البكر',
    nameEn: 'Royal Levantine Mezze Symphony with Toasted Pine Nuts',
    category: 'appetizers',
    categoryAr: 'المقبلات الفاخرة',
    categoryEn: 'Luxury Appetizers',
    descriptionAr: 'حمص كريمي بالصنوبر المحمص واللحم المفروم، متبل باذنجان مدخن بالحطب، تبولة الكينوا بالأعشاب، وورق عنب بالدبس.',
    descriptionEn: 'Silky hummus with roasted pine nuts and spiced lamb, wood-smoked mutabbal, quinoa-herb tabbouleh, and pomegranate vine leaves.',
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=1200&q=85',
    platingImage: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=1200&q=85',
    prepTimeMinutes: 20,
    cookTimeMinutes: 8,
    baseYield: 2, // 2 portions
    difficulty: 'medium',
    station: 'salad_cold',
    sellingPrice: 85.0,
    targetFoodCostPercentage: 22.0,
    laborCostPerPortion: 7.0,
    allergens: ['sesame', 'nuts', 'gluten'],
    caloriesPerPortion: 480,
    equipment: [
      'محضر طعام Robot Coupe احترافي',
      'مدخنة شواء خشب البلوط للباذنجان',
      'أواني تقديم رخامية مقسمة Trio Marble Platter',
    ],
    chefTipsAr: [
      'سر نعومة الحمص الحريري هو طهي حبوب الحمص مع رشة بيكربونات الصوديوم وخلطها مع مكعبات الثلج وطحينة السمسم النقية 100%.',
      'اشوِ الباذنجان مباشرة على الفحم المشتعل لنقل نكهة التدخين الأصيلة قبل خلطه مع اللبنة ودبس الرمان.',
    ],
    chefTipsEn: [
      'Silkiest hummus texture is achieved by blending warm boiled chickpeas with ice cubes and 100% pure tahini.',
      'Roast eggplants directly over glowing coals for authentic deep woodsmoke essence.',
    ],
    ingredients: [
      {
        id: 'ing-chickpeas-cooked',
        nameAr: 'حمص حب مسلوق طازج مصفى',
        nameEn: 'Cooked Tender Chickpeas',
        baseQuantity: 250,
        unit: 'g',
        costPerUnit: 0.015,
        wastePercentage: 3.0,
        allergens: [],
        isCore: true,
      },
      {
        id: 'ing-tahini-pure',
        nameAr: 'طحينة سمسم فاخرة معصورة على البارد',
        nameEn: 'Pure Cold-Pressed Sesame Tahini',
        baseQuantity: 80,
        unit: 'g',
        costPerUnit: 0.035,
        wastePercentage: 2.0,
        allergens: ['sesame'],
        isCore: true,
      },
      {
        id: 'ing-pine-nuts',
        nameAr: 'صنوبر بلدي محمص بالزبدة البلدية',
        nameEn: 'Golden Ghee Toasted Pine Nuts',
        baseQuantity: 30,
        unit: 'g',
        costPerUnit: 0.28, // 280 SAR/kg
        wastePercentage: 1.0,
        allergens: ['nuts'],
        isCore: true,
      },
      {
        id: 'ing-olive-oil-ev',
        nameAr: 'زيت زيتون الجوف بكر ممتاز معصور على البارد',
        nameEn: 'Extra Virgin Al-Jouf Olive Oil',
        baseQuantity: 50,
        unit: 'ml',
        costPerUnit: 0.04,
        wastePercentage: 0.0,
        allergens: [],
      },
      {
        id: 'ing-pomegranate-molasses',
        nameAr: 'دبس رمان طبيعي مركز 100%',
        nameEn: '100% Pure Pomegranate Molasses',
        baseQuantity: 25,
        unit: 'ml',
        costPerUnit: 0.03,
        wastePercentage: 0.0,
        allergens: [],
      },
    ],
    steps: [
      {
        id: 'step-mezze-1',
        stepNumber: 1,
        stage: 'prep',
        titleAr: 'طحن الحمص بالثلج واستحلاب الطحينة',
        titleEn: 'Hummus Ice-Emulsification & Tahini Whip',
        descriptionAr: 'طحن الحمص المسلوق الساخن مع مكعبات الثلج وعصير الليمون والملح حتى يتكون قوام كريمي حريري مخملي.',
        descriptionEn: 'Blend warm chickpeas with ice cubes, lemon juice and salt into velvet silk puree.',
        timerSeconds: 300,
        equipmentNeeded: ['محضر طعام Robot Coupe'],
      },
      {
        id: 'step-mezze-2',
        stepNumber: 2,
        stage: 'cooking',
        titleAr: 'تحميص الصنوبر بالزبدة وطهي اللحم',
        titleEn: 'Pine Nut Sauté & Spiced Lamb Searing',
        descriptionAr: 'تحمير الصنوبر في مقلاة نحاسية مع الزبدة حتى يكتسب لوناً ذهبياً عطرياً مع اللحم المفروم المتبل.',
        descriptionEn: 'Brown pine nuts in foaming ghee until nutty gold with seasoned minced lamb.',
        timerSeconds: 240,
        temperatureTarget: '175°C تحمير متجانس',
        equipmentNeeded: ['مقلاة تحمير نحاسية صغيرة'],
      },
      {
        id: 'step-mezze-3',
        stepNumber: 3,
        stage: 'plating',
        titleAr: 'التشكيل الحلزوني وسكب زيت الزيتون',
        titleEn: 'Spiral Swirl & EVOO Cascading',
        descriptionAr: 'تشكيل فجوة حلزونية بظهر الملعقة، سكب زيت الزيتون البكر، نثر حبات الصنوبر والرمان وأوراق النعناع.',
        descriptionEn: 'Sculpt deep center pool with offset spatula, flood with golden EVOO, crown with pine nuts and ruby seeds.',
        timerSeconds: 90,
        equipmentNeeded: ['طبق تقديم رخامي أبيض ثلاثي'],
      },
    ],
    platingGuide: {
      dishwareTypeAr: 'طبق رخامي أبيض فاخر (Carrara White Marble Trio Platter)',
      dishwareTypeEn: 'Carrara White Marble Trio Platter',
      garnishAr: 'حبات الرمان الياقوتية، صنوبر ذهبي، أوراق نعناع بري، وسماق بلدي أحمر',
      garnishEn: 'Ruby pomegranate jewels, toasted pine nuts, baby wild mint, and crimson sumac dust',
      saucingTechniqueAr: 'سكب شلالي لزيت الزيتون داخل التجويف الحلزوني (Center Oil Pool)',
      saucingTechniqueEn: 'Cascading golden oil pool nestled within hand-carved spiral rim',
      presentationNotesAr: 'توزيع الألوان المتباينة (أحمر الرمان، أخضر النعناع، ذهبي الصنوبر) فوق بياض الحمص.',
      presentationNotesEn: 'High color contrast between ruby gems, green mint, and golden nuts over silky beige canvas.',
      idealServingTemperature: '16°C - 18°C (حرارة الغرفة المنعشة)',
    },
  },
  {
    id: 'rec-kunafa-souffle',
    nameAr: 'سوفليه الكنافة النابلسية بالقشطة والفستق الحلبي',
    nameEn: 'Artisan Kunafa Soufflé with Clotted Cream & Pistachio',
    category: 'desserts',
    categoryAr: 'الحلويات الفاخرة',
    categoryEn: 'Signature Desserts & Pastry',
    descriptionAr: 'خيوط كنافة مقرمشة بالزبدة البلدية، محشوة بقشطة طازجة وجبن عكاوي مطاطي، مخبوزة حتى ترتفع وتُسقى بشيرة ماء الورد والفستق.',
    descriptionEn: 'Crispy spun kunafa dough enriched with pure ghee, layered with fresh clotted ashta & sweet akkawi cheese, drizzled with rose blossom syrup.',
    image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=1200&q=85',
    platingImage: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?auto=format&fit=crop&w=1200&q=85',
    prepTimeMinutes: 15,
    cookTimeMinutes: 14,
    baseYield: 1,
    difficulty: 'medium',
    station: 'bakery',
    sellingPrice: 58.0,
    targetFoodCostPercentage: 20.0,
    laborCostPerPortion: 6.0,
    allergens: ['gluten', 'dairy', 'nuts'],
    caloriesPerPortion: 540,
    equipment: [
      'قوالب سوفليه فخارية صغيرة Ramekins',
      'فرن حلويات سيراميكي حراري Convection Oven',
      'إبريق سكب الشيرة النحاسي',
    ],
    chefTipsAr: [
      'انقع جبن العكاوي في ماء فاتر لـ 4 ساعات مع تغيير الماء كل ساعة للتخلص من الملوحة الزائدة تماماً والحفاظ على مطاطية الجبن.',
      'اسكب شيرة ماء الورد الساخنة فور خروج الكنافة من الفرن مباشرة لسماع صوت الطشة الشهير وامتصاص كامل للقطر.',
    ],
    chefTipsEn: [
      'Desalinate Akkawi cheese in lukewarm water for 4 hours with hourly water changes for optimal sweet melt.',
      'Pour hot rose blossom syrup immediately upon oven emergence for signature sizzle and deep absorption.',
    ],
    ingredients: [
      {
        id: 'ing-kunafa-dough',
        nameAr: 'عجينة خيوط الكنافة الطازجة',
        nameEn: 'Fresh Spun Kunafa Dough',
        baseQuantity: 120,
        unit: 'g',
        costPerUnit: 0.02,
        wastePercentage: 2.0,
        allergens: ['gluten'],
        isCore: true,
      },
      {
        id: 'ing-cheese-akkawi',
        nameAr: 'جبن عكاوي محلى منزوع الملوحة',
        nameEn: 'Desalinated Sweet Akkawi Cheese',
        baseQuantity: 70,
        unit: 'g',
        costPerUnit: 0.05,
        wastePercentage: 4.0,
        allergens: ['dairy'],
        isCore: true,
      },
      {
        id: 'ing-ashta-cream',
        nameAr: 'قشطة طازجة بلدية كثيفة',
        nameEn: 'Fresh Clotted Ashta Cream',
        baseQuantity: 50,
        unit: 'g',
        costPerUnit: 0.06,
        wastePercentage: 1.0,
        allergens: ['dairy'],
      },
      {
        id: 'ing-pistachio-crushed',
        nameAr: 'فستق حلبي أخضر مجروش ومطحون',
        nameEn: 'Crushed Vibrant Aleppo Pistachios',
        baseQuantity: 25,
        unit: 'g',
        costPerUnit: 0.18, // 180 SAR/kg
        wastePercentage: 0.0,
        allergens: ['nuts'],
        isCore: true,
      },
      {
        id: 'ing-rose-syrup',
        nameAr: 'قطر شيرة ماء الزهر والورد الطبيعي',
        nameEn: 'Rose & Orange Blossom Sugar Syrup',
        baseQuantity: 45,
        unit: 'ml',
        costPerUnit: 0.012,
        wastePercentage: 0.0,
        allergens: [],
      },
    ],
    steps: [
      {
        id: 'step-kunafa-1',
        stepNumber: 1,
        stage: 'prep',
        titleAr: 'تفتيت الكنافة وتشبيعها بالسمن البلدي',
        titleEn: 'Kunafa Dough Shredding & Pure Ghee Infusion',
        descriptionAr: 'تفتيت خيوط الكنافة وفركها جيداً بالسمن البلدي المذاب حتى تتغلف كل شعيرة باللون الذهبي اللامع.',
        descriptionEn: 'Shred delicate kunafa pastry strands and massage with golden clarified ghee.',
        timerSeconds: 180,
        equipmentNeeded: ['وعاء خلط ستانلس كبير'],
      },
      {
        id: 'step-kunafa-2',
        stepNumber: 2,
        stage: 'cooking',
        titleAr: 'الخبز في الفرن وارتفاع السوفليه',
        titleEn: 'Oven Baking & Soufflé Rising',
        descriptionAr: 'رص طبقة الكنافة الأولى ثم الجبن والقشطة ثم الغطاء، والخبز على حرارة 195°C حتى تحمر القشرة وترتفع الحواف.',
        descriptionEn: 'Layer dough, cheese and ashta inside ramekin, bake at 195°C until puffed and blistered gold.',
        timerSeconds: 840,
        temperatureTarget: '195°C فرن حراري',
        criticalPointAr: 'لا تفتح باب الفرن خلال أول 10 دقائق لتجنب هبوط السوفليه.',
        criticalPointEn: 'Do not open oven door during first 10 minutes to prevent collapse.',
        equipmentNeeded: ['فرن حراري', 'قوالب رامكين فخارية'],
      },
      {
        id: 'step-kunafa-3',
        stepNumber: 3,
        stage: 'plating',
        titleAr: 'السقي بالشيرة ورش الفستق الأخضر',
        titleEn: 'Rose Blossom Drizzle & Pistachio Crown',
        descriptionAr: 'صب الشيرة الساخنة فتهتز الكنافة، وتغطية السطح بسخاء بالفستق الحلبي الأخضر وأوراق الورد الدمشقي المجفف.',
        descriptionEn: 'Drizzle piping hot rose syrup for aromatic sizzle, crown generously with emerald pistachios & dry rose petals.',
        timerSeconds: 60,
        equipmentNeeded: ['إبريق سكب نحاسي', 'ملقط تزيين الحلويات'],
      },
    ],
    platingGuide: {
      dishwareTypeAr: 'صحن نحاسي شرقي منقوش يدوياً مع قاعدة خشب الجوز (Hammered Copper Dessert Plate)',
      dishwareTypeEn: 'Hand-Hammered Antique Copper Plate with Walnut Base',
      garnishAr: 'فستق حلبي مجروش ناصع الخضرة، أوراق الورد الجوري الدمشقي القابلة للأكل',
      garnishEn: 'Vibrant Aleppo emerald pistachio powder, edible damask rose petals',
      saucingTechniqueAr: 'سكب شيرة حريري أمام الضيف مباشرة من إبريق نحاسي معتق',
      saucingTechniqueEn: 'Tableside hot syrup pour with theatrical fragrant steam rise',
      presentationNotesAr: 'يجب أن يقدم ساخناً فوراً مع ذوبان الجبن ومطاطيته عند الغرف.',
      presentationNotesEn: 'Serve steaming hot showcasing dramatic elastic cheese pull upon first spoon cut.',
      idealServingTemperature: '75°C - 80°C',
    },
  },
];

export const CHEF_QUIZZES: Record<string, ChefQuizQuestion[]> = {
  'rec-wagyu-ribeye': [
    {
      id: 'q-wagyu-1',
      questionAr: 'ما هي درجة الحرارة الداخلية المستهدفة لتقديم ستيك الواغيو بدرجة استواء Medium-Rare المثالية؟',
      questionEn: 'What is the target internal core temperature for perfect Medium-Rare Wagyu steak?',
      optionsAr: ['42°C - 45°C', '54°C - 56°C', '68°C - 70°C', '80°C - 85°C'],
      optionsEn: ['42°C - 45°C', '54°C - 56°C', '68°C - 70°C', '80°C - 85°C'],
      correctIndex: 1,
      explanationAr: 'درجة حرارة 54°C - 56°C تسمح للدهن الرخامي الفاخر في الواغيو بالذوبان التام دون تجفيف أنسجة اللحم.',
      explanationEn: '54°C - 56°C allows Wagyu intramuscular marble fat to render completely while retaining maximum succulence.',
    },
    {
      id: 'q-wagyu-2',
      questionAr: 'كم المدة الموصى بها لإراحة قطعة ستيك الواغيو بعد رفعه عن النار قبل التقطيع؟',
      questionEn: 'How long should Wagyu steak rest on a warm wire rack before slicing?',
      optionsAr: ['بدون إراحة، يقطع فوراً', '1 دقيقة فقط', '5 إلى 6 دقائق كاملة', '20 دقيقة'],
      optionsEn: ['No rest, slice instantly', '1 minute only', '5 to 6 full minutes', '20 minutes'],
      correctIndex: 2,
      explanationAr: 'الإراحة لمدة 5-6 دقائق تسمح للعصارات بالعودة للأنسجة ومنع سيلان الدم والعصارة على لوح التقطيع.',
      explanationEn: 'Resting 5-6 minutes re-distributes intracellular fluids, preventing dry meat and juice pooling on board.',
    },
  ],
  'rec-truffle-risotto': [
    {
      id: 'q-risotto-1',
      questionAr: 'ما هي الخطوة الإيطالية الأساسية (Mantecatura) في تحضير الريزوتو؟',
      questionEn: 'What is the critical Italian technique "Mantecatura" in making risotto?',
      optionsAr: [
        'غسل الأرز بالماء البارد 3 مرات',
        'خفق الزبدة والجبن الباردين بقوة خارج النار لصنع قوام مخملي لامع',
        'قلي الأرز في زيت غزير',
        'خبز الأرز في الفرن المغلق',
      ],
      optionsEn: [
        'Rinsing rice with cold water 3 times',
        'Vigorously whipping cold butter and cheese off-heat to create glossy velvet emulsification',
        'Deep frying rice in oil',
        'Baking rice in sealed oven',
      ],
      correctIndex: 1,
      explanationAr: 'المانتيكاتورا تعتمد على استحلاب دهون الزبدة والجبن الباردين مع نشا الأرز الساخن لخلق القوام الكريمي الفريد.',
      explanationEn: 'Mantecatura emulsifies cold fats with hot rice starch, creating signature glossy creamy texture.',
    },
  ],
};

export class RecipeStudioService {
  private recipes: StudioRecipe[] = SIGNATURE_RECIPES;

  public getAllRecipes(): StudioRecipe[] {
    return this.recipes;
  }

  public getRecipeById(id: string): StudioRecipe | undefined {
    return this.recipes.find((r) => r.id === id);
  }

  public getRecipesByCategory(category: string): StudioRecipe[] {
    if (!category || category === 'all') return this.recipes;
    return this.recipes.filter((r) => r.category === category);
  }

  /**
   * Scale a recipe for a target number of portions (e.g. 10 to 1,000 portions).
   * Computes exact raw weights, waste percentage, costs, margins, and allergen alerts.
   */
  public scaleRecipe(recipe: StudioRecipe, targetPortions: number): ScaledRecipeResult {
    const safePortions = Math.max(1, Math.round(targetPortions));
    const baseYield = Math.max(1, recipe.baseYield || 1);
    const scaleMultiplier = safePortions / baseYield;

    let totalRawWeightGrams = 0;
    let totalEffectiveWeightGrams = 0;
    let totalIngredientsCost = 0;
    let totalWasteCost = 0;

    const scaledIngredients: ScaledIngredient[] = recipe.ingredients.map((ing) => {
      const scaledRawQuantity = Number((ing.baseQuantity * scaleMultiplier).toFixed(4));
      const wasteFactor = 1 + (ing.wastePercentage || 0) / 100;
      const scaledEffectiveQuantity = Number((scaledRawQuantity * wasteFactor).toFixed(4));

      // Unit conversion for display
      let displayQuantity = scaledEffectiveQuantity;
      let displayUnit = ing.unit;

      if (ing.unit === 'g') {
        totalRawWeightGrams += scaledRawQuantity;
        totalEffectiveWeightGrams += scaledEffectiveQuantity;
        if (scaledEffectiveQuantity >= 1000) {
          displayQuantity = Number((scaledEffectiveQuantity / 1000).toFixed(2));
          displayUnit = 'kg';
        } else {
          displayQuantity = Number(scaledEffectiveQuantity.toFixed(1));
        }
      } else if (ing.unit === 'ml') {
        totalRawWeightGrams += scaledRawQuantity; // approximate 1ml ~= 1g
        totalEffectiveWeightGrams += scaledEffectiveQuantity;
        if (scaledEffectiveQuantity >= 1000) {
          displayQuantity = Number((scaledEffectiveQuantity / 1000).toFixed(2));
          displayUnit = 'l';
        } else {
          displayQuantity = Number(scaledEffectiveQuantity.toFixed(1));
        }
      } else if (ing.unit === 'kg') {
        totalRawWeightGrams += scaledRawQuantity * 1000;
        totalEffectiveWeightGrams += scaledEffectiveQuantity * 1000;
        displayQuantity = Number(scaledEffectiveQuantity.toFixed(2));
      } else if (ing.unit === 'l') {
        totalRawWeightGrams += scaledRawQuantity * 1000;
        totalEffectiveWeightGrams += scaledEffectiveQuantity * 1000;
        displayQuantity = Number(scaledEffectiveQuantity.toFixed(2));
      }

      // Cost calculation
      const itemTotalCost = Number((scaledEffectiveQuantity * ing.costPerUnit).toFixed(2));
      const rawCost = Number((scaledRawQuantity * ing.costPerUnit).toFixed(2));
      const itemWasteCost = Math.max(0, Number((itemTotalCost - rawCost).toFixed(2)));

      totalIngredientsCost += itemTotalCost;
      totalWasteCost += itemWasteCost;

      return {
        id: ing.id,
        nameAr: ing.nameAr,
        nameEn: ing.nameEn,
        baseQuantity: ing.baseQuantity,
        scaledRawQuantity,
        wastePercentage: ing.wastePercentage,
        scaledEffectiveQuantity,
        displayQuantity,
        displayUnit,
        unitCost: ing.costPerUnit,
        totalCost: itemTotalCost,
        wasteCost: itemWasteCost,
        costContributionPercent: 0, // calculated below
        allergens: ing.allergens || [],
      };
    });

    // Calculate percentage cost contribution per ingredient
    scaledIngredients.forEach((ing) => {
      ing.costContributionPercent =
        totalIngredientsCost > 0
          ? Number(((ing.totalCost / totalIngredientsCost) * 100).toFixed(1))
          : 0;
    });

    // Labor economies of scale: large batch prep decreases labor cost per portion
    const laborEfficiencyFactor =
      safePortions >= 500 ? 0.6 : safePortions >= 100 ? 0.75 : safePortions >= 25 ? 0.88 : 1.0;
    const totalLaborCost = Number(
      (recipe.laborCostPerPortion * safePortions * laborEfficiencyFactor).toFixed(2)
    );

    const totalBatchCost = Number((totalIngredientsCost + totalLaborCost).toFixed(2));
    const costPerPortion = Number((totalBatchCost / safePortions).toFixed(2));

    const sellingPricePerPortion = recipe.sellingPrice;
    const totalSellingPrice = Number((sellingPricePerPortion * safePortions).toFixed(2));
    const totalGrossRevenue = totalSellingPrice;
    const grossProfit = Number((totalGrossRevenue - totalBatchCost).toFixed(2));
    const grossMarginPercentage =
      totalGrossRevenue > 0
        ? Number(((grossProfit / totalGrossRevenue) * 100).toFixed(2))
        : 0;
    const foodCostPercentage =
      totalGrossRevenue > 0
        ? Number(((totalIngredientsCost / totalGrossRevenue) * 100).toFixed(2))
        : 0;

    // Sub-linear batch prep time calculation
    const estimatedPrepTimeMinutes = Math.round(
      recipe.prepTimeMinutes * Math.pow(safePortions / baseYield, 0.42)
    );

    // Standard commercial batch count (e.g. 10 portions per hotel pan)
    const batchCount = Math.max(1, Math.ceil(safePortions / (baseYield * 8)));

    // Allergen mapping
    const allergenMap = new Map<AllergenType, { sourcesAr: string[]; sourcesEn: string[] }>();

    recipe.ingredients.forEach((ing) => {
      ing.allergens.forEach((alg) => {
        if (!allergenMap.has(alg)) {
          allergenMap.set(alg, { sourcesAr: [], sourcesEn: [] });
        }
        const data = allergenMap.get(alg)!;
        if (!data.sourcesAr.includes(ing.nameAr)) data.sourcesAr.push(ing.nameAr);
        if (!data.sourcesEn.includes(ing.nameEn)) data.sourcesEn.push(ing.nameEn);
      });
    });

    const allergenWarnings: AllergenWarningDetail[] = Array.from(allergenMap.entries()).map(
      ([allergen, sources]) => {
        const meta = ALLERGEN_METADATA[allergen] || {
          nameAr: allergen,
          nameEn: allergen,
          icon: '⚠️',
          severity: 'medium',
          preventionTipAr: 'يرجى توخي الحذر عند التحضير لتجنب التلوث التبادلي.',
          preventionTipEn: 'Take caution to prevent allergen cross-contamination.',
        };
        return {
          allergen,
          nameAr: meta.nameAr,
          nameEn: meta.nameEn,
          icon: meta.icon,
          severity: meta.severity,
          sourcesAr: sources.sourcesAr,
          sourcesEn: sources.sourcesEn,
          preventionTipAr: meta.preventionTipAr,
          preventionTipEn: meta.preventionTipEn,
        };
      }
    );

    return {
      recipeId: recipe.id,
      targetPortions: safePortions,
      scaleMultiplier: Number(scaleMultiplier.toFixed(3)),
      scaledIngredients,
      totalRawWeightKg: Number((totalRawWeightGrams / 1000).toFixed(3)),
      totalEffectiveWeightKg: Number((totalEffectiveWeightGrams / 1000).toFixed(3)),
      totalIngredientsCost: Number(totalIngredientsCost.toFixed(2)),
      totalWasteCost: Number(totalWasteCost.toFixed(2)),
      totalLaborCost,
      totalBatchCost,
      costPerPortion,
      sellingPricePerPortion,
      totalSellingPrice,
      totalGrossRevenue,
      grossProfit,
      grossMarginPercentage,
      foodCostPercentage,
      estimatedPrepTimeMinutes,
      batchCount,
      allergenWarnings,
    };
  }

  public getQuizForRecipe(recipeId: string): ChefQuizQuestion[] {
    return CHEF_QUIZZES[recipeId] || [
      {
        id: 'q-default-1',
        questionAr: 'ما هي أهم خطوة لضمان جودة ونظافة المحطة أثناء تحضير هذا الصنف؟',
        questionEn: 'What is the most critical step to ensure station cleanliness and quality?',
        optionsAr: [
          'استخدام ألواح تقطيع منفصلة وتعقيم السكاكين دورياً (معايير HACCP)',
          'ترك المكونات دون تغطية',
          'الطهي على نار هادئة جداً فقط',
          'عدم ارتداء قفازات',
        ],
        optionsEn: [
          'Using segregated chopping boards and frequent knife sanitation (HACCP Standards)',
          'Leaving ingredients uncovered',
          'Cooking on low flame only',
          'Skipping gloves',
        ],
        correctIndex: 0,
        explanationAr: 'الالتزام بمعايير الهاسب HACCP وفصل ألواح التقطيع يمنع التلوث التبادلي بنسبة 100%.',
        explanationEn: 'Strict HACCP color-coded boards eliminate cross-contamination risks entirely.',
      },
    ];
  }
}

export const recipeStudioService = new RecipeStudioService();
