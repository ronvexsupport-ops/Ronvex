import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';
import { DEFAULT_PLATFORM_SETTINGS } from './pricingEngine';
import { BUNDLED_IMAGES, ImageService } from './imageService';
import { CategoryService } from './categoryService';

export const INITIAL_PRODUCTS: Product[] = [
  {
    productId: 'prod_lawn_use_9376',
    name: 'EMBROIDERED LAWN USE-9376',
    slug: 'embroidered-lawn-use-9376',
    brand: 'JAZMIN',
    sku: 'SJ0025',
    description:
      'Exquisite 3-Piece Embroidered Lawn Ensemble crafted from premium combed lawn cotton. Includes intricately embroidered organza neckline, embroidered schiffli daman border patch, digital printed pure silk chiffon dupatta, and dyed cambric trousers. Perfect for seasonal elegance and festive events.',
    categoryId: 'women-clothing',
    categoryName: "Women's Clothing",
    imageUrls: [
      '/assets/aistudio/image_3a2df0f6.png',
      '/assets/aistudio/6269227234010796902_cec44bc3.jpg',
      '/assets/aistudio/6269227234010796900_4ca35bdf.jpg',
      '/assets/aistudio/6269227234010796901_cbcf43fd.jpg',
    ],
    adminBasePrice: 4300,
    originalPrice: 5100,
    discountPercent: 16,
    stitchingType: 'Unstitched',
    stockQuantity: 1,
    stockUrgencyText: 'Only 1 left in stock',
    maxAffiliateIncrease: 500,
    isActive: true,
    featured: true,
    featuredInHeroSlider: true,
    heroOfferTitle: 'Jazmin Embroidered Lawn · BDT 4,300',
    disclaimer:
      'Product color may slightly vary due to photographic lighting sources or your device monitor settings. Dry clean recommended. Do not bleach. Iron at moderate temperature.',
    returnPolicy:
      'Any product purchased online can be exchanged within 7 days from the delivery date, provided it is unused, unwashed, with all original tags attached and intact original packaging.',
    shippingPolicy:
      'Nationwide delivery across all 64 districts in Bangladesh. Inside Dhaka: 24–48 hours (৳80). Outside Dhaka: 48–72 hours (৳150). Cash on delivery with doorstep parcel verification before payment.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 'prod_lawn_use_9174',
    name: 'EMBROIDERED LAWN USE-9174',
    slug: 'embroidered-lawn-use-9174',
    brand: 'SJ CLOSET',
    sku: 'SJ0026',
    description:
      'Luxury deep maroon & midnight navy 3-piece embroidered lawn suit. Features rich cord embroidery on neckline and sleeves, accompanied by a contrast heavy jacquard dupatta and matching dyed trousers.',
    categoryId: 'women-clothing',
    categoryName: "Women's Clothing",
    imageUrls: [
      '/assets/aistudio/6269227234010796902_cec44bc3.jpg',
      '/assets/aistudio/6269227234010796900_4ca35bdf.jpg',
    ],
    adminBasePrice: 5200,
    originalPrice: 6200,
    discountPercent: 16,
    stitchingType: 'Unstitched',
    stockQuantity: 1,
    stockUrgencyText: 'Only 1 remaining',
    maxAffiliateIncrease: 600,
    isActive: true,
    featured: true,
    featuredInHeroSlider: true,
    heroOfferTitle: 'Deep Maroon Lawn · BDT 5,200',
    disclaimer:
      'Product color may slightly vary due to photographic lighting sources or your device monitor settings. Dry clean recommended.',
    returnPolicy:
      'Any product purchased online can be exchanged within 7 days from the delivery date with original tags attached.',
    shippingPolicy:
      'Nationwide express delivery inside 24-48h (Dhaka) and 48-72h (Nationwide). Cash on delivery available.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 'prod_lawn_axis_bloom',
    name: '3 PIECE PRINTED LAWN SUIT-AXIS BLOOM',
    slug: '3-piece-printed-lawn-suit-axis-bloom',
    brand: 'SJ CLOSET',
    sku: 'SJ0027',
    description:
      'Contemporary geometric and ethnic mosaic printed lawn 3-piece suit with stylized lapel neckline, printed voile dupatta, and dyed trousers.',
    categoryId: 'women-clothing',
    categoryName: "Women's Clothing",
    imageUrls: [
      '/assets/aistudio/6269227234010796900_4ca35bdf.jpg',
      '/assets/aistudio/6269227234010796901_cbcf43fd.jpg',
    ],
    adminBasePrice: 2950,
    originalPrice: 3500,
    discountPercent: 15,
    stitchingType: 'Unstitched',
    stockQuantity: 3,
    stockUrgencyText: 'Only 3 left in stock',
    maxAffiliateIncrease: 400,
    isActive: true,
    featured: true,
    featuredInHeroSlider: true,
    heroOfferTitle: 'Axis Bloom Lawn · BDT 2,950',
    disclaimer:
      'Product color may slightly vary due to photographic lighting sources or your device monitor settings.',
    returnPolicy:
      'Any product purchased online can be exchanged within 7 days from the delivery date with original tags attached.',
    shippingPolicy:
      'Nationwide express delivery inside 24-48h (Dhaka) and 48-72h (Nationwide). Cash on delivery available.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
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
    featuredInHeroSlider: true,
    heroOfferTitle: 'Titanium Smartwatch · Special ৳600',
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
    featuredInHeroSlider: true,
    heroOfferTitle: 'Spatial ANC Audio · ৳1,400',
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
