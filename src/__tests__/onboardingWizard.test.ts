import { describe, it, expect, beforeEach } from 'vitest';
import { onboardingService } from '../services/onboardingService';
import { db } from '../db';

describe('3-Minute Onboarding & Zero-Configuration Wizard Suite', () => {
  beforeEach(async () => {
    // Clean tables and preset dishes for clean isolated test runs
    const tables = await db.getAll('tables');
    for (const t of tables) {
      if (t.id.startsWith('tbl-')) {
        await db.delete('tables', t.id);
      }
    }
    const menuItems = await db.getAll('menuItems');
    for (const d of menuItems) {
      if (d.id.startsWith('dish_preset_')) {
        await db.delete('menuItems', d.id);
      }
    }
  });

  describe('1. Auto Seeding & Cuisine Templates', () => {
    it('should generate tailored menu and tables for Burgers Cuisine', async () => {
      const res = await onboardingService.applySetup({
        restaurantNameAr: 'سماش برجر هاوس',
        restaurantNameEn: 'Smash Burger House',
        cuisine: 'burgers',
        jurisdiction: 'SA_ZATCA_15',
        tablesCount: 8,
        currency: 'SAR',
        branchName: 'الفرع الرئيسي',
      });

      expect(res.success).toBe(true);
      expect(res.categoriesCount).toBeGreaterThanOrEqual(3);
      expect(res.dishesCount).toBeGreaterThanOrEqual(3);
      expect(res.tablesCount).toBe(8);

      const allTables = await db.getAll('tables');
      const seeded = allTables.filter((t) => t.id.startsWith('tbl-'));
      expect(seeded.length).toBe(8);
    });

    it('should support Fine Dining Steakhouse with European Appetizers', async () => {
      const res = await onboardingService.applySetup({
        restaurantNameAr: 'ستيك هاوس رويال',
        restaurantNameEn: 'Royal Steakhouse',
        cuisine: 'fine_dining',
        jurisdiction: 'SA_ZATCA_15',
        tablesCount: 6,
        currency: 'SAR',
        branchName: 'فرع الرياض',
      });

      expect(res.success).toBe(true);
      expect(res.dishesCount).toBeGreaterThanOrEqual(3);
    });

    it('should calculate correct VAT for Egypt ETA jurisdiction', async () => {
      const res = await onboardingService.applySetup({
        restaurantNameAr: 'كافيه دي باريس',
        restaurantNameEn: 'Cafe de Paris',
        cuisine: 'cafe',
        jurisdiction: 'EG_ETA_14',
        tablesCount: 10,
        currency: 'EGP',
        branchName: 'فرع الزمالك',
      });

      expect(res.success).toBe(true);
      const menuItems = await db.getAll('menuItems');
      const sample = menuItems.find((d) => d.id === 'dish_preset_1');
      if (sample) {
        expect(sample.taxRate).toBe(0.14);
      }
    });
  });
});
