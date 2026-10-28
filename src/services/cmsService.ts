import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  HomepageCMSConfig,
  HeaderConfig,
  FooterConfig,
  ThemeConfig,
  SEOSettings,
  CustomPage,
  MediaAsset,
  Coupon,
  ContactMessage,
  ActivityLog,
  AdminUserRecord,
  AdminRole,
} from '../types';
import { updateDocumentFavicon } from '../utils/brandingPresets';

export const DEFAULT_HOMEPAGE_CMS: HomepageCMSConfig = {
  id: 'homepage',
  isPublished: true,
  hero: {
    badgeText: 'Curated Bangladeshi E-Commerce & Affiliate Network',
    title: 'Engineered For Pure Performance.',
    subtitle: 'RONVEX Lifestyle Collection',
    description:
      'Discover high-performance smart wearables, premium wireless audio, and precision lifestyle tech — designed for Bangladesh and supported by nationwide cash-on-delivery.',
    primaryButtonText: 'Explore Catalog',
    primaryButtonUrl: '#shop',
    secondaryButtonText: 'Join Affiliate Program',
    secondaryButtonUrl: '#affiliate/register',
    bgImageUrl: '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg',
    enabled: true,
  },
  promoBanner: {
    enabled: true,
    text: 'Summer Delivery Sprint: Fast 24h delivery inside Dhaka &',
    highlightText: 'Free Shipping over ৳3,000',
    linkText: 'Shop Wearables',
    linkUrl: '#shop?category=wearables',
  },
  featuredSection: {
    enabled: true,
    title: 'Featured Innovations',
    subtitle: 'Direct from RONVEX labs with nationwide warranty and rapid dispatch.',
    displayCount: 6,
  },
  popularSection: {
    enabled: true,
    title: 'Trending Essentials',
    subtitle: 'Customer favorites across smartwatches, earbuds, and premium accessories.',
    displayCount: 4,
  },
  categorySection: {
    enabled: true,
    title: 'Browse By Category',
    subtitle: 'Explore our specialized product categories curated for quality and durability.',
  },
  trustBadges: [
    {
      id: 'tb_1',
      title: 'Nationwide Delivery',
      description: '৳80 inside Dhaka (24-48h), ৳150 nationwide via Pathao & Steadfast.',
      iconName: 'Truck',
    },
    {
      id: 'tb_2',
      title: '100% Genuine Tech',
      description: 'Authentic products with official warranty and QC inspection.',
      iconName: 'ShieldCheck',
    },
    {
      id: 'tb_3',
      title: 'Cash On Delivery',
      description: 'Check product before payment at your doorstep anywhere in Bangladesh.',
      iconName: 'CreditCard',
    },
    {
      id: 'tb_4',
      title: 'Affiliate Opportunity',
      description: 'Earn generous commissions with weekly Wednesday manual payouts.',
      iconName: 'TrendingUp',
    },
  ],
  affiliatePromo: {
    enabled: true,
    badge: 'RONVEX Partner Program',
    title: 'Monetize Your Audience with RONVEX Affiliate Network',
    description:
      'Join hundreds of creators, influencers, and digital entrepreneurs in Bangladesh. Get custom storefront links, real-time commission tracking, and reliable weekly payouts.',
    buttonText: 'Apply to Become an Affiliate',
    buttonUrl: '#affiliate/register',
    bulletPoints: [
      'Flexible margin pricing up to maximum allowed bonus per product',
      '30-day attribution tracking on custom partner storefronts',
      'Direct bKash, Nagad, or Bank payouts every Wednesday',
      'Exclusive dashboard with real-time conversion and order analytics',
    ],
  },
  newsletter: {
    enabled: true,
    title: 'Stay Ahead of New Releases',
    description: 'Subscribe to receive product launch announcements, flash discounts, and partner highlights.',
    placeholder: 'Enter your email or phone number',
    buttonText: 'Subscribe',
    disclaimer: 'We respect your privacy. No spam, unsubscribe anytime.',
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'System Default',
};

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  id: 'header',
  brandName: 'RONVEX',
  logoUrl: '',
  logoDarkUrl: '',
  logoHeight: 32,
  showWordmark: true,
  logoAltText: 'RONVEX Premium Lifestyle & Tech Bangladesh',
  faviconUrl: 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20rx%3D%2214%22%20fill%3D%22%23090d16%22%20%2F%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%2260%22%20height%3D%2260%22%20rx%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%23059669%22%20stroke-width%3D%222.5%22%20stroke-opacity%3D%220.8%22%20%2F%3E%3Cpath%20d%3D%22M22%2017h12c6%200%2010%203.5%2010%208.5%200%203.8-2.5%206.8-6.5%207.8L44%2047H36l-5.5-12H28v12H22V17zm6%206v7h6c2.5%200%204.5-1.2%204.5-3.5S36.5%2023%2034%2023h-6z%22%20fill%3D%22%23ffffff%22%20%2F%3E%3Ccircle%20cx%3D%2243%22%20cy%3D%2219%22%20r%3D%223.5%22%20fill%3D%22%2310b981%22%20%2F%3E%3C%2Fsvg%3E',
  appleTouchIconUrl: '',
  faviconPreset: 'emerald_crest',
  topNoticeEnabled: false,
  topNoticeText: '⚡ Flash Sale: Enjoy free delivery on orders above ৳3,000!',
  navItems: [
    { id: 'nav_1', label: 'Catalog', url: '#shop' },
    { id: 'nav_2', label: 'Wearables', url: '#shop?category=wearables' },
    { id: 'nav_3', label: 'Audio', url: '#shop?category=audio' },
    { id: 'nav_4', label: 'Track Order', url: '#track-order' },
    { id: 'nav_5', label: 'Join Affiliate Program', url: '#affiliate/register' },
  ],
  supportPhone: '+880 1700-000000',
  supportEmail: 'support@ronvex.com',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_FOOTER_CONFIG: FooterConfig = {
  id: 'footer',
  aboutText:
    'RONVEX is a premier Bangladeshi lifestyle tech brand dedicated to precision-engineered wearable tech, premium audio, and an empowering affiliate entrepreneurship ecosystem.',
  columns: [
    {
      id: 'col_shop',
      title: 'Shop Categories',
      links: [
        { label: 'Smart Wearables', url: '#shop?category=wearables' },
        { label: 'Wireless Audio', url: '#shop?category=audio' },
        { label: 'Accessories', url: '#shop?category=accessories' },
        { label: 'All Products', url: '#shop' },
      ],
    },
    {
      id: 'col_affiliate',
      title: 'Affiliate Program',
      links: [
        { label: 'Join Affiliate Program', url: '#affiliate/register' },
        { label: 'Affiliate Status Check', url: '#affiliate/status' },
        { label: 'Affiliate Dashboard', url: '#affiliate/dashboard' },
        { label: 'Commission Terms', url: '#page/affiliate-terms' },
      ],
    },
    {
      id: 'col_info',
      title: 'Customer Service',
      links: [
        { label: 'Track Order', url: '#track-order' },
        { label: 'About Us', url: '#page/about-us' },
        { label: 'Contact Us', url: '#page/contact' },
        { label: 'Shipping & Delivery', url: '#page/shipping-returns' },
        { label: 'Privacy Policy', url: '#page/privacy-policy' },
        { label: 'Terms & Conditions', url: '#page/terms' },
      ],
    },
  ],
  address: 'Level 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh',
  phone: '+880 1700-000000',
  email: 'ronvex.support@gmail.com',
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  copyrightText: '© 2026 RONVEX Technologies Ltd. All rights reserved.',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  id: 'theme',
  brandName: 'RONVEX',
  primaryColor: '#0f172a',
  accentColor: '#059669',
  fontFamily: 'serif',
  bannerBgColor: '#020617',
  announcementBarColor: '#0f172a',
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_SEO_SETTINGS: SEOSettings = {
  id: 'seo',
  metaTitle: 'RONVEX | Premium Lifestyle Tech & Affiliate Platform in Bangladesh',
  metaDescription:
    'Shop smartwatches, premium wireless earbuds, and precision tech with cash on delivery across Bangladesh. Join the RONVEX Affiliate Program to earn commissions weekly.',
  keywords: 'smartwatch bangladesh, earbuds bd, lifestyle tech, ronvex affiliate, earn money online bd',
  ogImage: '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg',
  canonicalUrl: 'https://ronvex.com',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_CUSTOM_PAGES: CustomPage[] = [
  {
    pageId: 'about-us',
    slug: 'about-us',
    title: 'About RONVEX',
    isPublished: true,
    showInHeader: false,
    showInFooter: true,
    order: 1,
    metaTitle: 'About Us | RONVEX Bangladesh',
    metaDescription: 'Learn about RONVEX and our mission to power tech lovers and digital entrepreneurs in Bangladesh.',
    content: `## Who We Are

RONVEX is an innovative lifestyle tech company headquartered in Dhaka, Bangladesh. We bridge the gap between premium international electronics manufacturing and consumer trust.

### Our Mission
To deliver meticulously tested smart accessories, audio devices, and wearable gadgets directly to Bangladeshi homes with uncompromising build quality, transparent pricing, and nationwide cash on delivery.

### The Affiliate Revolution
Through the **RONVEX Partner Program**, we equip thousands of content creators, marketing professionals, and university students with real e-commerce storefronts. Our partners earn generous, transparent margins paid out every single Wednesday directly through bKash, Nagad, or Bank transfers.

### Our Guarantees
- 100% Quality Inspection before dispatch.
- 7-Day Replacement Guarantee on manufacturing defects.
- Responsive customer support via WhatsApp and phone.`,
    updatedAt: new Date().toISOString(),
  },
  {
    pageId: 'contact',
    slug: 'contact',
    title: 'Contact Us',
    isPublished: true,
    showInHeader: false,
    showInFooter: true,
    order: 2,
    metaTitle: 'Contact Us | RONVEX Support',
    metaDescription: 'Get in touch with the RONVEX support, logistics, and affiliate team.',
    content: `## Get in Touch

We are here to help you with product queries, order tracking, returns, and affiliate program support.

### Office Address
Level 4, House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh

### Customer Support Hours
- **Saturday – Thursday:** 10:00 AM – 8:00 PM
- **Friday:** Closed (Logistics dispatch active)

### Direct Contact
- **Helpline:** +880 1700-000000
- **Email:** ronvex.support@gmail.com
- **Affiliate Queries:** affiliate@ronvex.com`,
    updatedAt: new Date().toISOString(),
  },
  {
    pageId: 'shipping-returns',
    slug: 'shipping-returns',
    title: 'Shipping & Return Policy',
    isPublished: true,
    showInHeader: false,
    showInFooter: true,
    order: 3,
    metaTitle: 'Shipping & Returns | RONVEX',
    metaDescription: 'Delivery timelines, shipping fees, and 7-day return policy.',
    content: `## Delivery Policy

### Delivery Coverage & Rates
- **Inside Dhaka:** ৳80 (Delivered within 24–48 hours)
- **Outside Dhaka:** ৳150 (Delivered within 48–72 hours via Pathao or Steadfast courier)
- **Free Shipping:** Applicable automatically on all retail orders of ৳3,000 or more.

### Cash On Delivery
Customers can inspect the outer packaging and verify product integrity with the courier delivery officer prior to full payment.

---

## 7-Day Return & Replacement Policy

If you receive a defective, damaged, or incorrect item:
1. Contact support within 7 days of delivery with photos/video of the issue.
2. Our courier team will arrange reverse pickup.
3. Upon inspection at our hub, a fresh replacement or instant refund will be issued.`,
    updatedAt: new Date().toISOString(),
  },
  {
    pageId: 'privacy-policy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    isPublished: true,
    showInHeader: false,
    showInFooter: true,
    order: 4,
    metaTitle: 'Privacy Policy | RONVEX',
    metaDescription: 'How RONVEX protects and uses your personal information.',
    content: `## Privacy Commitment

RONVEX respects your privacy and is dedicated to safeguarding customer and affiliate partner data.

### Information We Collect
- Contact information (Full Name, Phone Number, Delivery Address, District).
- Order details and payment references for Cash on Delivery and mobile wallet reconciliation.
- Affiliate registration information (Payment phone numbers for weekly commission settlements).

### How We Use Your Data
- Processing and shipping customer orders nationwide.
- Sending SMS tracking updates and courier notifications.
- Reconciling weekly affiliate commission disbursements.
- We **never** sell, rent, or trade customer information to third parties.`,
    updatedAt: new Date().toISOString(),
  },
  {
    pageId: 'terms',
    slug: 'terms',
    title: 'Terms & Conditions',
    isPublished: true,
    showInHeader: false,
    showInFooter: true,
    order: 5,
    metaTitle: 'Terms & Conditions | RONVEX',
    metaDescription: 'Official terms and conditions for ordering and using RONVEX services.',
    content: `## Terms of Service

By placing an order on RONVEX or joining our partner program, you agree to these terms:

### 1. Product Pricing & Stock
Prices are stated in Bangladeshi Taka (৳ BDT) and inclusive of relevant local tariffs. Prices are subject to change without prior notice, but confirmed orders will be honored at the order checkout price.

### 2. Affiliate Program Conduct
Affiliates must market ethically. Misleading claims, fake review sites, or fraudulent fake order generation are strictly prohibited and will lead to immediate account suspension and forfeiture of unpaid commissions.

### 3. Payout Processing
Affiliate commissions are calculated on delivered, return-cleared orders and processed manually every Wednesday without arbitrary minimum limits.`,
    updatedAt: new Date().toISOString(),
  },
];

// Local storage cache keys for zero-revert persistence
const CMS_HOMEPAGE_KEY = 'ronvex_cms_homepage';
const CMS_HEADER_KEY = 'ronvex_cms_header';
const CMS_FOOTER_KEY = 'ronvex_cms_footer';
const CMS_THEME_KEY = 'ronvex_cms_theme';
const CMS_SEO_KEY = 'ronvex_cms_seo';
const CMS_PAGES_KEY = 'ronvex_cms_pages';

function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return fallback;
}

function setLocalItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

export class CMSService {
  // 1. Homepage CMS
  static async getHomepageConfig(): Promise<HomepageCMSConfig> {
    const local = getLocalItem(CMS_HOMEPAGE_KEY, DEFAULT_HOMEPAGE_CMS);
    try {
      const snap = await getDoc(doc(db, 'cms', 'homepage'));
      if (snap.exists()) {
        const data = snap.data() as HomepageCMSConfig;
        setLocalItem(CMS_HOMEPAGE_KEY, data);
        return data;
      }
    } catch (e) {
      console.warn('CMSService: Error fetching homepage config, using local cache:', e);
    }
    return local;
  }

  static async saveHomepageConfig(config: HomepageCMSConfig, adminEmail: string, adminUid: string): Promise<void> {
    const updated: HomepageCMSConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };
    // Persist to Firestore as source of truth
    await setDoc(doc(db, 'cms', 'homepage'), updated);
    setLocalItem(CMS_HOMEPAGE_KEY, updated);
    await this.logActivity(adminUid, adminEmail, 'UPDATE_HOMEPAGE_CMS', 'CMS', 'Updated homepage builder content').catch(() => {});
  }

  // 2. Header, Logo & Favicon
  static applyBrandingToDocument(config?: Partial<HeaderConfig>): void {
    if (!config) return;
    updateDocumentFavicon(config.faviconUrl, config.appleTouchIconUrl);
  }

  static async getHeaderConfig(): Promise<HeaderConfig> {
    const local = getLocalItem(CMS_HEADER_KEY, DEFAULT_HEADER_CONFIG);
    try {
      const snap = await getDoc(doc(db, 'cms', 'header'));
      if (snap.exists()) {
        const data = snap.data() as HeaderConfig;
        setLocalItem(CMS_HEADER_KEY, data);
        this.applyBrandingToDocument(data);
        return data;
      }
    } catch (e) {
      console.warn('CMSService: Error fetching header config, using local cache:', e);
    }
    this.applyBrandingToDocument(local);
    return local;
  }

  static async saveHeaderConfig(config: HeaderConfig, adminEmail: string, adminUid: string): Promise<void> {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'cms', 'header'), updated);
    setLocalItem(CMS_HEADER_KEY, updated);
    this.applyBrandingToDocument(updated);
    await this.logActivity(adminUid, adminEmail, 'UPDATE_HEADER', 'Branding', 'Updated site logo, favicon, and header navigation').catch(() => {});
  }

  // 3. Footer
  static async getFooterConfig(): Promise<FooterConfig> {
    const local = getLocalItem(CMS_FOOTER_KEY, DEFAULT_FOOTER_CONFIG);
    try {
      const snap = await getDoc(doc(db, 'cms', 'footer'));
      if (snap.exists()) {
        const data = snap.data() as FooterConfig;
        setLocalItem(CMS_FOOTER_KEY, data);
        return data;
      }
    } catch (e) {
      console.warn('CMSService: Error fetching footer config, using local cache:', e);
    }
    return local;
  }

  static async saveFooterConfig(config: FooterConfig, adminEmail: string, adminUid: string): Promise<void> {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'cms', 'footer'), updated);
    setLocalItem(CMS_FOOTER_KEY, updated);
    await this.logActivity(adminUid, adminEmail, 'UPDATE_FOOTER', 'Footer', 'Updated footer columns, contact details, and copyright').catch(() => {});
  }

  // 4. Theme
  static async getThemeConfig(): Promise<ThemeConfig> {
    const local = getLocalItem(CMS_THEME_KEY, DEFAULT_THEME_CONFIG);
    try {
      const snap = await getDoc(doc(db, 'cms', 'theme'));
      if (snap.exists()) {
        const data = snap.data() as ThemeConfig;
        setLocalItem(CMS_THEME_KEY, data);
        return data;
      }
    } catch (e) {
      console.warn('CMSService: Error fetching theme config, using local cache:', e);
    }
    return local;
  }

  static async saveThemeConfig(config: ThemeConfig, adminEmail: string, adminUid: string): Promise<void> {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'cms', 'theme'), updated);
    setLocalItem(CMS_THEME_KEY, updated);
    await this.logActivity(adminUid, adminEmail, 'UPDATE_THEME', 'Theme', 'Updated brand appearance and colors').catch(() => {});
  }

  // 5. SEO
  static async getSEOSettings(): Promise<SEOSettings> {
    const local = getLocalItem(CMS_SEO_KEY, DEFAULT_SEO_SETTINGS);
    try {
      const snap = await getDoc(doc(db, 'cms', 'seo'));
      if (snap.exists()) {
        const data = snap.data() as SEOSettings;
        setLocalItem(CMS_SEO_KEY, data);
        return data;
      }
    } catch (e) {
      console.warn('CMSService: Error fetching SEO settings, using local cache:', e);
    }
    return local;
  }

  static async saveSEOSettings(settings: SEOSettings, adminEmail: string, adminUid: string): Promise<void> {
    const updated = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'cms', 'seo'), updated);
    setLocalItem(CMS_SEO_KEY, updated);
    await this.logActivity(adminUid, adminEmail, 'UPDATE_SEO', 'SEO', 'Updated meta tags, keywords, and OpenGraph data').catch(() => {});
  }

  // 6. Custom Dynamic Pages
  static async getPages(): Promise<CustomPage[]> {
    try {
      const snap = await getDocs(collection(db, 'pages'));
      if (!snap.empty) {
        const firestorePages = snap.docs.map(d => d.data() as CustomPage).sort((a, b) => a.order - b.order);
        setLocalItem(CMS_PAGES_KEY, firestorePages);
        return firestorePages;
      }
    } catch (e) {
      console.warn('CMSService: Error fetching pages, checking local cache:', e);
    }
    const local = getLocalItem<CustomPage[] | null>(CMS_PAGES_KEY, null);
    if (local && local.length > 0) {
      return local;
    }
    return INITIAL_CUSTOM_PAGES;
  }

  static async getPageBySlug(slug: string): Promise<CustomPage | null> {
    const cleanSlug = slug.toLowerCase().trim();
    try {
      const snapDirect = await getDoc(doc(db, 'pages', cleanSlug));
      if (snapDirect.exists()) {
        return snapDirect.data() as CustomPage;
      }
      const allPages = await this.getPages();
      const found = allPages.find(p => p.slug.toLowerCase() === cleanSlug);
      if (found) return found;
    } catch (e) {
      console.warn('CMSService: Error fetching page by slug:', e);
    }
    return INITIAL_CUSTOM_PAGES.find(p => p.slug.toLowerCase() === cleanSlug) || null;
  }

  static async savePage(page: CustomPage, adminEmail: string, adminUid: string): Promise<void> {
    const payload = {
      ...page,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };
    // Write directly to Firestore first
    await setDoc(doc(db, 'pages', page.slug), payload);

    // Update local cache
    const current = getLocalItem<CustomPage[]>(CMS_PAGES_KEY, INITIAL_CUSTOM_PAGES);
    const map = new Map<string, CustomPage>();
    for (const p of current) map.set(p.slug, p);
    map.set(page.slug, payload);
    const updated = Array.from(map.values()).sort((a, b) => a.order - b.order);
    setLocalItem(CMS_PAGES_KEY, updated);

    await this.logActivity(adminUid, adminEmail, 'SAVE_PAGE', 'Pages', `Saved page: ${page.title} (/${page.slug})`).catch(() => {});
  }

  static async deletePage(slug: string, adminEmail: string, adminUid: string): Promise<void> {
    await deleteDoc(doc(db, 'pages', slug));
    const current = getLocalItem<CustomPage[]>(CMS_PAGES_KEY, INITIAL_CUSTOM_PAGES);
    const updated = current.filter(p => p.slug !== slug);
    setLocalItem(CMS_PAGES_KEY, updated);
    await this.logActivity(adminUid, adminEmail, 'DELETE_PAGE', 'Pages', `Deleted page: /${slug}`).catch(() => {});
  }

  // 7. Media Library
  static async getMediaAssets(): Promise<MediaAsset[]> {
    try {
      const snap = await getDocs(collection(db, 'media'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as MediaAsset);
      }
    } catch (e) {
      console.warn('CMSService: Error fetching media assets:', e);
    }
    // Return initial asset catalog
    return [
      {
        id: 'med_hero_1',
        title: 'RONVEX Hero Lifestyle',
        url: '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg',
        category: 'banner',
        altText: 'RONVEX Smartwatch & Earbuds lifestyle banner',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'med_titan_1',
        title: 'AeroBeat Pro Earbuds',
        url: '/src/assets/images/ronvex_lifestyle_audio_1792837016254.jpg',
        category: 'product',
        altText: 'AeroBeat ANC wireless earbuds',
        uploadedAt: new Date().toISOString(),
      },
    ];
  }

  static async saveMediaAsset(asset: MediaAsset, adminEmail: string, adminUid: string): Promise<void> {
    await setDoc(doc(db, 'media', asset.id), asset);
    await this.logActivity(adminUid, adminEmail, 'ADD_MEDIA', 'Media', `Added media asset: ${asset.title}`);
  }

  static async deleteMediaAsset(assetId: string, adminEmail: string, adminUid: string): Promise<void> {
    await deleteDoc(doc(db, 'media', assetId));
    await this.logActivity(adminUid, adminEmail, 'DELETE_MEDIA', 'Media', `Deleted media asset ID: ${assetId}`);
  }

  // 8. Coupons
  static async getCoupons(): Promise<Coupon[]> {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Coupon);
      }
    } catch (e) {
      console.warn('CMSService: Error fetching coupons:', e);
    }
    return [
      {
        couponId: 'coup_launch',
        code: 'RONVEX10',
        discountType: 'PERCENTAGE',
        discountAmount: 10,
        minOrderAmount: 1000,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        usageCount: 42,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        couponId: 'coup_summer',
        code: 'SUMMER200',
        discountType: 'FIXED',
        discountAmount: 200,
        minOrderAmount: 2500,
        startDate: '2026-06-01',
        endDate: '2026-08-31',
        usageCount: 18,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  static async saveCoupon(coupon: Coupon, adminEmail: string, adminUid: string): Promise<void> {
    await setDoc(doc(db, 'coupons', coupon.couponId), coupon);
    await this.logActivity(adminUid, adminEmail, 'SAVE_COUPON', 'Coupons', `Saved coupon code: ${coupon.code}`);
  }

  static async deleteCoupon(couponId: string, adminEmail: string, adminUid: string): Promise<void> {
    await deleteDoc(doc(db, 'coupons', couponId));
    await this.logActivity(adminUid, adminEmail, 'DELETE_COUPON', 'Coupons', `Deleted coupon ID: ${couponId}`);
  }

  // 9. Contact Messages
  static async submitContactMessage(msg: Omit<ContactMessage, 'id' | 'submittedAt' | 'status'>): Promise<string> {
    const id = `msg_${Date.now()}`;
    const payload: ContactMessage = {
      ...msg,
      id,
      status: 'UNREAD',
      submittedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'contactMessages', id), payload);
    return id;
  }

  static async getContactMessages(): Promise<ContactMessage[]> {
    try {
      const snap = await getDocs(collection(db, 'contactMessages'));
      return snap.docs.map(d => d.data() as ContactMessage).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    } catch (e) {
      console.warn('CMSService: Error fetching contact messages:', e);
      return [];
    }
  }

  static async updateContactMessageStatus(id: string, status: 'UNREAD' | 'READ' | 'REPLIED', replyNote?: string): Promise<void> {
    await updateDoc(doc(db, 'contactMessages', id), {
      status,
      ...(replyNote ? { replyNote } : {}),
    });
  }

  // 10. Admin Users & Permissions
  static async getAdminUsers(): Promise<AdminUserRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'admins'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as AdminUserRecord);
      }
    } catch (e) {
      console.warn('CMSService: Error fetching admin users:', e);
    }
    // Return primary super admin
    return [
      {
        uid: 'super_admin_primary',
        email: 'ronvex.support@gmail.com',
        displayName: 'RONVEX Executive Admin',
        role: 'super_admin',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ];
  }

  static async saveAdminUser(admin: AdminUserRecord, byEmail: string, byUid: string): Promise<void> {
    await setDoc(doc(db, 'admins', admin.uid), admin);
    await this.logActivity(byUid, byEmail, 'SAVE_ADMIN_USER', 'Admin Management', `Granted ${admin.role} to ${admin.email}`);
  }

  static async deleteAdminUser(uid: string, byEmail: string, byUid: string): Promise<void> {
    await deleteDoc(doc(db, 'admins', uid));
    await this.logActivity(byUid, byEmail, 'REMOVE_ADMIN_USER', 'Admin Management', `Removed admin UID: ${uid}`);
  }

  // 11. Activity Logs
  static async logActivity(
    adminId: string,
    adminEmail: string,
    action: string,
    module: string,
    details: string
  ): Promise<void> {
    try {
      const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const log: ActivityLog = {
        id,
        adminId,
        adminEmail,
        action,
        module,
        details,
        timestamp: new Date().toISOString(),
      };
      await setDoc(doc(db, 'auditLogs', id), log);
    } catch (e) {
      console.warn('CMSService: Non-blocking logActivity failure:', e);
    }
  }

  static async getActivityLogs(limitCount = 50): Promise<ActivityLog[]> {
    try {
      const snap = await getDocs(collection(db, 'auditLogs'));
      return snap.docs
        .map(d => d.data() as ActivityLog)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limitCount);
    } catch (e) {
      console.warn('CMSService: Error fetching activity logs:', e);
      return [];
    }
  }
}
