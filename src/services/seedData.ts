import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';
import { DEFAULT_PLATFORM_SETTINGS } from './pricingEngine';
import { BUNDLED_IMAGES, ImageService } from './imageService';
import { CategoryService } from './categoryService';

export const INITIAL_PRODUCTS: Product[] = [
  {
    productId: 'prod_smartwatch_titanium',
    name: 'Apex Horizon Titanium Smartwatch',
    slug: 'apex-horizon-titanium-smartwatch',
    description:
      'Engineered with aerospace-grade titanium bezel, sapphire crystal AMOLED display, and comprehensive biometric tracking with up to 14 days battery life. Water-resistant up to 50 meters.',
    categoryId: 'wearables',
    categoryName: 'Smart Wearables',
    imageUrls: [BUNDLED_IMAGES.smartwatch],
    adminBasePrice: 600, // Matches prompt benchmark: Base ৳600, max increase ৳150
    maxAffiliateIncrease: 150,
    stockQuantity: 45,
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 'prod_earbuds_anc',
    name: 'Acoustic Pro ANC Wireless Earbuds',
    slug: 'acoustic-pro-anc-wireless-earbuds',
    description:
      'True wireless active noise cancelling earbuds featuring custom 11mm graphene drivers, spatial sound architecture, and quad-mic beamforming for crystal-clear conversations in bustling cities.',
    categoryId: 'audio',
    categoryName: 'Wireless Audio',
    imageUrls: [BUNDLED_IMAGES.earbuds],
    adminBasePrice: 1400,
    maxAffiliateIncrease: 350,
    stockQuantity: 60,
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 'prod_backpack_leather',
    name: 'Vanguard Commuter Modular Backpack',
    slug: 'vanguard-commuter-modular-backpack',
    description:
      'Weatherproof ballistic nylon structured shell with vegetable-tanned full-grain leather accents. Features a dedicated suspended 16-inch laptop compartment, hidden security pocket, and ergonomic back airflow channels.',
    categoryId: 'lifestyle',
    categoryName: 'Bags & Lifestyle',
    imageUrls: [BUNDLED_IMAGES.bag],
    adminBasePrice: 2200,
    maxAffiliateIncrease: 500,
    stockQuantity: 32,
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 'prod_chronos_steel',
    name: 'Chronos Minimalist Sapphire Watch',
    slug: 'chronos-minimalist-sapphire-watch',
    description:
      'Sleek 40mm 316L stainless steel case with sunburst dial and date complication. Japanese quartz precision movement with quick-release genuine leather strap.',
    categoryId: 'accessories',
    categoryName: 'Tech Accessories',
    imageUrls: [BUNDLED_IMAGES.hero],
    adminBasePrice: 1800,
    maxAffiliateIncrease: 400,
    stockQuantity: 24,
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const PRODUCTS_STORAGE_KEY = 'ronvex_products_cache';

export function getLocalProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return [];
}

export function saveLocalProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    // If quota exceeded or error, log warning
    console.warn('Could not cache products to localStorage:', e);
  }
}

export function saveSingleProductLocally(product: Product): Product[] {
  const current = getLocalProducts();
  const list = current.length > 0 ? [...current] : [...INITIAL_PRODUCTS];
  const idx = list.findIndex(p => p.productId === product.productId);
  if (idx >= 0) {
    list[idx] = product;
  } else {
    list.unshift(product);
  }
  saveLocalProducts(list);
  return list;
}

export function deleteSingleProductLocally(productId: string): Product[] {
  const current = getLocalProducts();
  const list = (current.length > 0 ? current : INITIAL_PRODUCTS).filter(p => p.productId !== productId);
  saveLocalProducts(list);
  return list;
}

export async function bootstrapDatabase(): Promise<void> {
  try {
    // 1. Seed Platform Settings (non-blocking)
    try {
      const settingsRef = doc(db, 'settings', 'platform_settings');
      const settingsSnap = await getDoc(settingsRef);
      if (!settingsSnap.exists()) {
        await setDoc(settingsRef, DEFAULT_PLATFORM_SETTINGS);
      }
    } catch (e) {
      // Non-fatal if settings read/write has auth constraint
    }

    // 2. Ensure Categories are initialized
    await CategoryService.getCategories();

    // 3. Seed Products ONLY if the products collection is completely empty (first run)
    const prodCol = collection(db, 'products');
    const prodColSnap = await getDocs(prodCol);
    if (prodColSnap.empty) {
      for (const prod of INITIAL_PRODUCTS) {
        try {
          await setDoc(doc(db, 'products', prod.productId), prod);
        } catch (prodErr) {
          // Non-blocking
        }
      }
    }
  } catch (error) {
    console.error('Bootstrap data check failed (will use fallback cache):', error);
  }
}
