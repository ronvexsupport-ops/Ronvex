import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProductCategory } from '../types';

export const DEFAULT_CATEGORIES: ProductCategory[] = [
  {
    categoryId: 'wearables',
    name: 'Smart Wearables',
    slug: 'wearables',
    description: 'Aerospace-grade titanium smartwatches, fitness bands, and sapphire glass biometrics.',
    iconName: 'Watch',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    categoryId: 'audio',
    name: 'Wireless Audio',
    slug: 'audio',
    description: 'Active noise cancelling true wireless earbuds, graphene drivers, and spatial acoustics.',
    iconName: 'Headphones',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    categoryId: 'accessories',
    name: 'Tech Accessories',
    slug: 'accessories',
    description: 'Magnetic wireless charging docks, braided cables, straps, and minimalist power accessories.',
    iconName: 'Sliders',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    categoryId: 'lifestyle',
    name: 'Bags & Lifestyle',
    slug: 'lifestyle',
    description: 'Weatherproof modular commuter backpacks, full-grain leather sleeves, and executive luggage.',
    iconName: 'ShoppingBag',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    categoryId: 'smart-living',
    name: 'Smart Living',
    slug: 'smart-living',
    description: 'Desk ecosystem, ambient LED lighting, ergonomic lifestyle tools, and home intelligence.',
    iconName: 'Zap',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const CATEGORIES_STORAGE_KEY = 'ronvex_custom_categories';

function getLocalCategories(): ProductCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return [];
}

function saveLocalCategories(cats: ProductCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
  } catch (e) {
    // ignore
  }
}

export class CategoryService {
  /**
   * Fetches all categories from Firestore and local storage, ensuring defaults exist
   * and newly created categories are preserved.
   */
  public static async getCategories(): Promise<ProductCategory[]> {
    const local = getLocalCategories();
    let firestoreList: ProductCategory[] = [];

    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        firestoreList = snap.docs.map(d => d.data() as ProductCategory);
      } else {
        // First time initialization: seed default categories in Firestore
        for (const cat of DEFAULT_CATEGORIES) {
          await setDoc(doc(db, 'categories', cat.categoryId), cat).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('CategoryService: Error fetching categories from Firestore:', err);
    }

    // Merge: DEFAULT_CATEGORIES + Firestore + Local
    const categoryMap = new Map<string, ProductCategory>();
    for (const c of DEFAULT_CATEGORIES) {
      categoryMap.set(c.categoryId, c);
    }
    for (const c of firestoreList) {
      categoryMap.set(c.categoryId, c);
    }
    for (const c of local) {
      categoryMap.set(c.categoryId, c);
    }

    const merged = Array.from(categoryMap.values());
    saveLocalCategories(merged);
    return merged;
  }

  /**
   * Creates or updates a category in Firestore and local storage.
   */
  public static async saveCategory(
    category: ProductCategory,
    adminEmail?: string,
    adminUid?: string
  ): Promise<ProductCategory[]> {
    const cleanId = (category.slug || category.categoryId || category.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-');

    const payload: ProductCategory = {
      ...category,
      categoryId: cleanId,
      slug: cleanId,
      name: category.name.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: category.createdAt || new Date().toISOString(),
    };

    // 1. Immediately update localStorage
    const local = getLocalCategories();
    const map = new Map<string, ProductCategory>();
    for (const c of DEFAULT_CATEGORIES) map.set(c.categoryId, c);
    for (const c of local) map.set(c.categoryId, c);
    map.set(cleanId, payload);
    const updated = Array.from(map.values());
    saveLocalCategories(updated);

    // 2. Persist to Firestore
    try {
      await setDoc(doc(db, 'categories', cleanId), payload);
    } catch (err) {
      console.error('CategoryService: Error saving to Firestore:', err);
    }

    return updated;
  }

  /**
   * Deletes a category from Firestore and local storage.
   */
  public static async deleteCategory(
    categoryId: string,
    adminEmail?: string,
    adminUid?: string
  ): Promise<ProductCategory[]> {
    const local = getLocalCategories().filter(c => c.categoryId !== categoryId);
    saveLocalCategories(local);

    try {
      await deleteDoc(doc(db, 'categories', categoryId));
    } catch (err) {
      console.warn('CategoryService: Error deleting from Firestore:', err);
    }

    const map = new Map<string, ProductCategory>();
    for (const c of DEFAULT_CATEGORIES) {
      if (c.categoryId !== categoryId) map.set(c.categoryId, c);
    }
    for (const c of local) {
      map.set(c.categoryId, c);
    }
    return Array.from(map.values());
  }
}
