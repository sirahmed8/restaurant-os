/**
 * =====================================================================
 * RESTAURANT OS — 3-MINUTE ONBOARDING & INSTANT SEED SERVICE
 * =====================================================================
 */

import { db } from '../db';
import { eventBus } from './eventBus';
import { MenuItem, MenuCategory, DiningTable } from '../db/schema';

export type RestaurantCuisineType = 
  | 'burgers' 
  | 'fine_dining' 
  | 'cafe' 
  | 'shawarma_grill' 
  | 'pizza_pasta';

export type TaxJurisdiction = 'SA_ZATCA_15' | 'EG_ETA_14' | 'AE_FTA_5';

export interface SetupConfig {
  restaurantNameAr: string;
  restaurantNameEn: string;
  cuisine: RestaurantCuisineType;
  jurisdiction: TaxJurisdiction;
  tablesCount: number;
  currency: string;
  branchName: string;
}

export class OnboardingService {
  /**
   * Run 1-Click Zero-Configuration Auto Setup & Data Seeding
   */
  public async applySetup(config: SetupConfig): Promise<{ success: boolean; categoriesCount: number; dishesCount: number; tablesCount: number }> {
    const taxRate = config.jurisdiction === 'SA_ZATCA_15' ? 0.15 : config.jurisdiction === 'EG_ETA_14' ? 0.14 : 0.05;

    // 1. Generate Categories based on Cuisine
    const categories = this.getCategoriesForCuisine(config.cuisine);
    for (const cat of categories) {
      const existing = await db.getAll('categories');
      if (!existing.some((c) => c.id === cat.id)) {
        await db.insert('categories', cat as any);
      }
    }

    // 2. Generate Menu Items based on Cuisine
    const dishes = this.getDishesForCuisine(config.cuisine, taxRate);
    for (const dish of dishes) {
      const existing = await db.getAll('menuItems');
      if (!existing.some((d) => d.id === dish.id)) {
        await db.insert('menuItems', dish as any);
      }
    }

    // 3. Generate Tables
    const tables: DiningTable[] = [];
    for (let i = 1; i <= config.tablesCount; i++) {
      const tableNumber = `T-${i < 10 ? '0' + i : i}`;
      const existing = await db.getAll('tables');
      if (!existing.some((t) => t.tableNumber === tableNumber)) {
        const table: DiningTable = {
          id: `tbl-${i}`,
          tableNumber,
          sectionId: i <= 6 ? 'sec-main' : i <= 12 ? 'sec-family' : 'sec-terrace',
          capacity: i % 3 === 0 ? 6 : i % 2 === 0 ? 4 : 2,
          shape: i % 3 === 0 ? 'round' : 'square',
          status: 'available',
          posX: 50 + ((i - 1) % 6) * 140,
          posY: 80 + Math.floor((i - 1) / 6) * 140,
          qrCodeToken: `QR_TABLE_${i}_TOKEN`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.insert('tables', table as any);
        tables.push(table);
      }
    }

    // Emit event
    eventBus.emit('NOTIFICATION_RECEIVED', {
      title: 'تم اكتمال الإعداد السريع!',
      message: `تم تهيئة ${config.restaurantNameAr} بنجاح مع إضافة ${dishes.length} صنف و ${config.tablesCount} طاولة.`,
      severity: 'success',
    });

    return {
      success: true,
      categoriesCount: categories.length,
      dishesCount: dishes.length,
      tablesCount: config.tablesCount,
    };
  }

  private getCategoriesForCuisine(cuisine: RestaurantCuisineType): MenuCategory[] {
    const now = new Date().toISOString();
    const base: MenuCategory[] = [
      { id: 'beverages', nameAr: 'المشروبات والعصائر', nameEn: 'Beverages & Mocktails', icon: 'CupSoda', sortOrder: 10, isActive: true, createdAt: now, updatedAt: now },
      { id: 'desserts', nameAr: 'الحلويات والمخبوزات', nameEn: 'Desserts & Sweets', icon: 'Cake', sortOrder: 11, isActive: true, createdAt: now, updatedAt: now },
    ];

    switch (cuisine) {
      case 'burgers':
        return [
          { id: 'burgers_prime', nameAr: 'برجر أنجوس وسلايدرز', nameEn: 'Prime Angus Burgers', icon: 'Flame', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
          { id: 'appetizers_crispy', nameAr: 'المقبلات والبطاطس المقرمشة', nameEn: 'Loaded Fries & Bites', icon: 'Utensils', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
          ...base,
        ];
      case 'fine_dining':
        return [
          { id: 'steaks', nameAr: 'الستيك واللحوم المعتقة', nameEn: 'Prime Steaks & Chops', icon: 'Flame', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
          { id: 'seafood', nameAr: 'المأكولات البحرية الفاخرة', nameEn: 'Caviar & Lobster', icon: 'Fish', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
          { id: 'appetizers', nameAr: 'المقبلات الأوروبية', nameEn: 'Gourmet Appetizers', icon: 'Soup', sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
          ...base,
        ];
      case 'shawarma_grill':
        return [
          { id: 'shawarma', nameAr: 'الشاورما العربي والصاج', nameEn: 'Shawarma & Saj Wraps', icon: 'Flame', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
          { id: 'grills_kebabs', nameAr: 'المشاوي الحلبية والكباب', nameEn: 'Mixed Charcoal Grills', icon: 'Flame', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
          { id: 'mezza', nameAr: 'المقبلات الشامية والفتوش', nameEn: 'Cold & Hot Mezza', icon: 'Salad', sortOrder: 3, isActive: true, createdAt: now, updatedAt: now },
          ...base,
        ];
      case 'pizza_pasta':
        return [
          { id: 'pizza_woodfired', nameAr: 'البيتزا النابولية على الحطب', nameEn: 'Woodfired Pizza', icon: 'Flame', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
          { id: 'pasta_artisan', nameAr: 'الباستا الطازجة والريزوتو', nameEn: 'Fresh Handcrafted Pasta', icon: 'Utensils', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
          ...base,
        ];
      case 'cafe':
      default:
        return [
          { id: 'specialty_coffee', nameAr: 'القهوة المختصة والاسبريسو', nameEn: 'Specialty Coffee V60', icon: 'Coffee', sortOrder: 1, isActive: true, createdAt: now, updatedAt: now },
          { id: 'bakery_croissant', nameAr: 'الكرواسون والمخبوزات الفرنسية', nameEn: 'French Pastries', icon: 'Cake', sortOrder: 2, isActive: true, createdAt: now, updatedAt: now },
          ...base,
        ];
    }
  }

  private getDishesForCuisine(cuisine: RestaurantCuisineType, taxRate: number): MenuItem[] {
    const now = new Date().toISOString();

    const dishes: MenuItem[] = [
      {
        id: `dish_preset_1`,
        categoryId: cuisine === 'burgers' ? 'burgers_prime' : 'steaks',
        nameAr: cuisine === 'burgers' ? 'سماش برجر دبل كلاسيك' : 'ستيك واغيو تندرلوين A5',
        nameEn: cuisine === 'burgers' ? 'Double Smash Classic' : 'Wagyu Tenderloin A5',
        descriptionAr: 'محضر من أجود أنواع اللحوم الطازجة مع صوصاتنا الحصرية',
        descriptionEn: 'Prepared from prime quality cuts with artisanal signature sauces',
        price: cuisine === 'burgers' ? 42 : 220,
        costPrice: cuisine === 'burgers' ? 14 : 75,
        taxRate,
        calories: cuisine === 'burgers' ? 680 : 850,
        preparationTimeMinutes: cuisine === 'burgers' ? 8 : 18,
        isAvailable: true,
        isFeatured: true,
        isRecommended: true,
        allergens: ['dairy', 'gluten'],
        kitchenStation: 'grill',
        sortOrder: 1,
        soldCount: 45,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `dish_preset_2`,
        categoryId: 'beverages',
        nameAr: 'موهيتو رمان وتوت منعش',
        nameEn: 'Pomegranate Berry Mojito',
        descriptionAr: 'باشن فروت وتوت بري طازج مع الليمون والنعناع',
        descriptionEn: 'Fresh berry puree with crushed mint and soda',
        price: 24,
        costPrice: 4,
        taxRate,
        calories: 140,
        preparationTimeMinutes: 3,
        isAvailable: true,
        isFeatured: true,
        isRecommended: true,
        allergens: [],
        kitchenStation: 'beverages',
        sortOrder: 2,
        soldCount: 110,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `dish_preset_3`,
        categoryId: 'desserts',
        nameAr: 'كيكة الشوكولاتة الذائبة لافا',
        nameEn: 'Molten Chocolate Lava Cake',
        descriptionAr: 'شوكولاتة بلجيكية فاخرة مع آيسكريم الفانيلا الفرنسي',
        descriptionEn: 'Belgian molten chocolate with pure bourbon vanilla gelato',
        price: 36,
        costPrice: 9,
        taxRate,
        calories: 520,
        preparationTimeMinutes: 6,
        isAvailable: true,
        isFeatured: true,
        isRecommended: true,
        allergens: ['dairy', 'eggs', 'gluten'],
        kitchenStation: 'bakery',
        sortOrder: 3,
        soldCount: 65,
        createdAt: now,
        updatedAt: now,
      },
    ];

    return dishes;
  }
}

export const onboardingService = new OnboardingService();
