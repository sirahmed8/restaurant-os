/**
 * =====================================================================
 * RESTAURANT OS — MENU & CATALOG STORE (ZUSTAND)
 * =====================================================================
 */

import { create } from 'zustand';
import { MenuCategory, MenuItem, ModifierGroup, ModifierOption, ItemModifierLink } from '../db/schema';
import { db } from '../db';
import { eventBus } from '../services/eventBus';

interface MenuState {
  categories: MenuCategory[];
  items: MenuItem[];
  modifierGroups: ModifierGroup[];
  modifierOptions: ModifierOption[];
  itemModifierLinks: ItemModifierLink[];
  
  selectedCategoryId: string | null;
  searchQuery: string;
  selectedAllergenFilter: string | null;
  isLoading: boolean;
  
  // Actions
  loadMenu: () => Promise<void>;
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setAllergenFilter: (allergen: string | null) => void;
  
  addItem: (item: MenuItem) => Promise<void>;
  updateItem: (id: string, partial: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  
  addCategory: (category: MenuCategory) => Promise<void>;
  updateCategory: (id: string, partial: Partial<MenuCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  getItemModifiers: (itemId: string) => { group: ModifierGroup; options: ModifierOption[] }[];
}

export const useMenuStore = create<MenuState>((set, get) => ({
  categories: [],
  items: [],
  modifierGroups: [],
  modifierOptions: [],
  itemModifierLinks: [],
  selectedCategoryId: null,
  searchQuery: '',
  selectedAllergenFilter: null,
  isLoading: false,

  loadMenu: async () => {
    set({ isLoading: true });
    try {
      const [categories, items, modifierGroups, modifierOptions, itemModifierLinks] = await Promise.all([
        db.getAll('categories'),
        db.getAll('menuItems'),
        db.getAll('modifierGroups'),
        db.getAll('modifierOptions'),
        db.getAll('itemModifierLinks'),
      ]);

      // Sort categories
      categories.sort((a, b) => a.sortOrder - b.sortOrder);
      // Sort items
      items.sort((a, b) => a.sortOrder - b.sortOrder);

      const firstCat = categories.length > 0 ? categories[0].id : null;

      set({
        categories,
        items,
        modifierGroups,
        modifierOptions,
        itemModifierLinks,
        selectedCategoryId: get().selectedCategoryId || firstCat,
        isLoading: false,
      });
    } catch (err) {
      console.error('[useMenuStore] Failed to load menu data:', err);
      set({ isLoading: false });
    }
  },

  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setAllergenFilter: (selectedAllergenFilter) => set({ selectedAllergenFilter }),

  addItem: async (item) => {
    const inserted = await db.insert('menuItems', item);
    set((state) => ({ items: [...state.items, inserted] }));
  },

  updateItem: async (id, partial) => {
    const updated = await db.update('menuItems', id, partial);
    if (updated) {
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? updated : i)),
      }));
    }
  },

  deleteItem: async (id) => {
    await db.delete('menuItems', id);
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));
  },

  addCategory: async (category) => {
    const inserted = await db.insert('categories', category);
    set((state) => ({ categories: [...state.categories, inserted] }));
  },

  updateCategory: async (id, partial) => {
    const updated = await db.update('categories', id, partial);
    if (updated) {
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updated : c)),
      }));
    }
  },

  deleteCategory: async (id) => {
    await db.delete('categories', id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },

  getItemModifiers: (itemId) => {
    const state = get();
    const links = state.itemModifierLinks.filter((l) => l.menuItemId === itemId);
    const groups: { group: ModifierGroup; options: ModifierOption[] }[] = [];

    links.forEach((link) => {
      const group = state.modifierGroups.find((g) => g.id === link.modifierGroupId);
      if (group) {
        const options = state.modifierOptions
          .filter((opt) => opt.groupId === group.id && opt.isAvailable)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        groups.push({ group, options });
      }
    });

    return groups;
  },
}));

// Reactive sync with db subscribers
db.subscribe('categories', (categories) => {
  useMenuStore.setState({ categories: categories.sort((a, b) => a.sortOrder - b.sortOrder) });
});

db.subscribe('menuItems', (items) => {
  useMenuStore.setState({ items: items.sort((a, b) => a.sortOrder - b.sortOrder) });
});
