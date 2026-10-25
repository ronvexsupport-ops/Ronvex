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

export class CategoryService {
  /**
   * Fetches all categories from Firestore. If empty, seeds defaults and returns them.
   */
  public static async getCategories(): Promise<ProductCategory[]> {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as ProductCategory);
      }

      // First time initialization: seed default categories in Firestore
      for (const cat of DEFAULT_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.categoryId), cat);
      }
      return DEFAULT_CATEGORIES;
    } catch (err) {
      console.warn('CategoryService: Error fetching categories, using fallback defaults:', err);
      return DEFAULT_CATEGORIES;
    }
  }

  /**
   * Creates or updates a category in Firestore
   */
  public static async saveCategory(
    category: ProductCategory,
    adminEmail?: string,
    adminUid?: string
  ): Promise<void> {
    const cleanId = category.categoryId.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const payload: ProductCategory = {
      ...category,
      categoryId: cleanId,
      slug: cleanId,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'categories', cleanId), payload);
  }

  /**
   * Deletes a category from Firestore
   */
  public static async deleteCategory(
    categoryId: string,
    adminEmail?: string,
    adminUid?: string
  ): Promise<void> {
    await deleteDoc(doc(db, 'categories', categoryId));
  }
}
