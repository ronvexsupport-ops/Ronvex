import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';
import { getLocalProducts, saveLocalProducts, saveSingleProductLocally, deleteSingleProductLocally } from './seedData';

export class ProductService {
  /**
   * Utility function to auto-generate unique SKU numbers for new products using a prefix and timestamp.
   * Format: [PREFIX]-[TIMESTAMP]
   * e.g., "SJ-1793201021948" or "RNV-1793201021948" or "JAZ-1793201021948"
   *
   * @param prefix The brand or store prefix (e.g., 'SJ', 'RNV', 'JAZMIN'). Defaults to 'RNV'.
   * @param timestamp The timestamp in milliseconds. Defaults to Date.now().
   * @returns A guaranteed-unique uppercase SKU string.
   */
  public static generateSku(prefix: string = 'RNV', timestamp: number = Date.now()): string {
    const raw = (prefix || 'RNV').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanPrefix = raw.length > 0 ? (raw.length > 6 ? raw.slice(0, 4) : raw) : 'RNV';
    return `${cleanPrefix}-${timestamp}`;
  }

  /**
   * Alternate compact SKU generator using prefix and hex/base36 timestamp
   */
  public static generateCompactSku(prefix: string = 'SJ', timestamp: number = Date.now()): string {
    const raw = (prefix || 'SJ').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanPrefix = raw.length > 0 ? (raw.length > 6 ? raw.slice(0, 4) : raw) : 'SJ';
    return `${cleanPrefix}-${timestamp.toString(36).toUpperCase()}`;
  }

  /**
   * Fetches all products from Firestore with local storage fallback
   */
  public static async getProducts(): Promise<Product[]> {
    try {
      const snap = await getDocs(collection(db, 'products'));
      if (!snap.empty) {
        const prods = snap.docs.map(d => d.data() as Product);
        saveLocalProducts(prods);
        return prods;
      }
    } catch (e) {
      console.warn('ProductService.getProducts fallback to local:', e);
    }
    return getLocalProducts();
  }

  /**
   * Fetches a single product by productId or slug
   */
  public static async getProduct(idOrSlug: string): Promise<Product | null> {
    try {
      const snap = await getDoc(doc(db, 'products', idOrSlug));
      if (snap.exists()) {
        return snap.data() as Product;
      }
      const all = await this.getProducts();
      return all.find(p => p.productId === idOrSlug || p.slug === idOrSlug) || null;
    } catch (e) {
      console.warn('ProductService.getProduct error:', e);
      const all = getLocalProducts();
      return all.find(p => p.productId === idOrSlug || p.slug === idOrSlug) || null;
    }
  }

  /**
   * Saves or updates a product in Firestore and local storage
   */
  public static async saveProduct(product: Product): Promise<void> {
    await setDoc(doc(db, 'products', product.productId), product);
    saveSingleProductLocally(product);
  }

  /**
   * Deletes a product from Firestore and local storage
   */
  public static async deleteProduct(productId: string): Promise<void> {
    await deleteDoc(doc(db, 'products', productId));
    deleteSingleProductLocally(productId);
  }
}
