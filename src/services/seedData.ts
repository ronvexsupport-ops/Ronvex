import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';
import { DEFAULT_PLATFORM_SETTINGS } from './pricingEngine';

export const INITIAL_PRODUCTS: Product[] = [
  {
    productId: 'prod_smartwatch_titanium',
    name: 'Apex Horizon Titanium Smartwatch',
    slug: 'apex-horizon-titanium-smartwatch',
    description:
      'Engineered with aerospace-grade titanium bezel, sapphire crystal AMOLED display, and comprehensive biometric tracking with up to 14 days battery life. Water-resistant up to 50 meters.',
    categoryId: 'wearables',
    categoryName: 'Smart Wearables',
    imageUrls: ['/src/assets/images/product_smartwatch_elite_1792836929081.jpg'],
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
    categoryName: 'Audio Hardware',
    imageUrls: ['/src/assets/images/product_wireless_earbuds_1792836928757.jpg'],
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
    categoryName: 'Bags & Luggage',
    imageUrls: ['/src/assets/images/product_leather_commuter_bag_1792836929286.jpg'],
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
    categoryId: 'watches',
    categoryName: 'Accessories',
    imageUrls: ['/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg'],
    adminBasePrice: 1800,
    maxAffiliateIncrease: 400,
    stockQuantity: 24,
    isActive: true,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function bootstrapDatabase(): Promise<void> {
  try {
    // 1. Seed Platform Settings
    const settingsRef = doc(db, 'settings', 'platform_settings');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, DEFAULT_PLATFORM_SETTINGS);
    }

    // 2. Seed Products
    for (const prod of INITIAL_PRODUCTS) {
      const prodRef = doc(db, 'products', prod.productId);
      const snap = await getDoc(prodRef);
      if (!snap.exists()) {
        await setDoc(prodRef, prod);
      }
    }
  } catch (error) {
    console.error('Bootstrap data check failed (will use fallback cache):', error);
  }
}
