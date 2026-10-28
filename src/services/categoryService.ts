import {
  collection,
  doc,
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
  {
    categoryId: 'women-clothing',
    name: "Women's Clothing",
    slug: 'womens-clothing',
    description: 'Designer lawn, luxury embroidered Pakistani suits, unstitched collections, and festive apparel.',
    iconName: 'ShoppingBag',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const CATEGORIES_STORAGE_KEY = 'ronvex_persisted_categories';

export function getLocalCategories(): ProductCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_CATEGORIES;
}

export function saveLocalCategories(cats: ProductCategory[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(cats));
  } catch (e) {
    // ignore
  }
}

export class CategoryService {
  /**
   * Fetches all categories directly from Firestore (authoritative source).
   * Only falls back to localStorage or defaults if network is offline.
   */
  public static async getCategories(): Promise<ProductCategory[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        const firestoreList = snap.docs.map(d => d.data() as ProductCategory);
        saveLocalCategories(firestoreList);
        return firestoreList;
      }

      // First time initialization ONLY if Firestore categories collection is truly empty
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.categoryId), cat).catch(() => {});
      }
      saveLocalCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    } catch (err) {
      console.warn('CategoryService: Error fetching categories from Firestore, using offline cache:', err);
      return getLocalCategories();
    }
  }

  /**
   * Creates or updates a category in Firestore persistently.
   * Throws on failure so callers never report false successes.
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

    // 1. MUST write to Firestore first (authoritative database)
    await setDoc(doc(db, 'categories', cleanId), payload);

    // 2. Fetch fresh authoritative list from Firestore
    return await this.getCategories();
  }

  /**
   * Deletes a category from Firestore persistently.
   * Throws on failure so callers never report false successes.
   */
  public static async deleteCategory(
    categoryId: string,
    adminEmail?: string,
    adminUid?: string
  ): Promise<ProductCategory[]> {
    // 1. MUST delete from Firestore first
    await deleteDoc(doc(db, 'categories', categoryId));

    // 2. Fetch fresh authoritative list from Firestore
    return await this.getCategories();
  }
}
