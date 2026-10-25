import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import {
  FullWebsiteCMS,
  HomepageCMS,
  HeaderCMS,
  FooterCMS,
  ContentPageCMS,
  ThemeCMS,
  SEOCMS,
  MediaAsset,
  Coupon,
  ContactMessage,
  AdminTeamMember,
  AuditLogEntry,
} from '../types/cms';

export const DEFAULT_CMS: FullWebsiteCMS = {
  version: 1,
  publishedAt: new Date().toISOString(),
  updatedBy: 'system',
  homepage: {
    announcement: {
      enabled: true,
      text: 'Special Wednesday Affiliate Payouts · Nationwide Cash on Delivery Across Bangladesh',
      badge: 'OFFICIAL',
    },
    hero: {
      collectionTag: 'Dhaka Verified Essentials · 2026 Collection',
      title: 'Refined consumer essentials, built to last.',
      subtitle:
        'Discover titanium wearables, studio-grade acoustics, and executive commuter accessories. Backed by transparent pricing, authorized affiliate partnerships, and nationwide cash on delivery.',
      primaryCtaText: 'Explore Catalog',
      primaryCtaLink: 'shop',
      secondaryCtaText: 'Join Affiliate Program',
      secondaryCtaLink: 'affiliate-register',
      imageUrl: '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg',
      trustMarkers: ['100% Authentic Warranty', '64 Districts Covered', 'Cash on Delivery'],
    },
    featuredSection: {
      tagline: 'Curated Highlights',
      title: 'Featured Flagship Releases',
      limit: 4,
      showViewAll: true,
    },
    valueProps: {
      title: 'Why Choose RONVEX Bangladesh',
      items: [
        {
          id: 'v1',
          title: '01. Uncompromising Build Quality',
          description:
            'Every unit undergoes strict quality inspection before dispatch. Titanium casings, graphene drivers, sourced directly from authorized lines.',
        },
        {
          id: 'v2',
          title: '02. Transparent Affiliate Ecosystem',
          description:
            'Approved partners configure retail prices, share custom storefront links, and earn direct margins on every delivered sale. Zero markup clipping.',
        },
        {
          id: 'v3',
          title: '03. Weekly Wednesday Payouts',
          description:
            'Affiliate earnings are disbursed directly via bKash, Nagad, or bank transfer every Wednesday for your entire payable balance, with no minimum threshold.',
        },
      ],
    },
    affiliateBanner: {
      enabled: true,
      title: 'Monetize Your Audience with Transparent Commissions',
      description:
        'Apply as a RONVEX Partner. Earn wholesale-to-retail margins plus ৳800 bonus when your team hits ৳100,000 delivered sales in a month.',
      ctaText: 'Join Affiliate Program',
      targetBonusText: '৳100,000 Sales → ৳800 Bonus',
      weeklyPayoutText: 'Zero Minimum Payout Every Wednesday',
    },
  },
  header: {
    logoText: 'RONVEX',
    announcementBarEnabled: true,
    announcementText: 'Weekly Wednesday Payouts · Nationwide Fast Delivery',
    navLinks: [
      { id: 'n1', label: 'Catalog', view: 'shop' },
      { id: 'n2', label: 'Wearables', view: 'shop', param: 'wearables' },
      { id: 'n3', label: 'Audio', view: 'shop', param: 'audio' },
      { id: 'n4', label: 'Track Order', view: 'track-order' },
      { id: 'n5', label: 'Affiliate Portal', view: 'affiliate-portal' },
    ],
    showAffiliateCta: true,
    affiliateCtaText: 'Join Affiliate Program',
  },
  footer: {
    brandName: 'RONVEX Technologies Ltd.',
    tagline: 'Premium Consumer Technology & Curated Electronics in Bangladesh',
    description:
      'Curating reliable, authentic smart electronics, acoustic wearables, and lifestyle commuter gear backed by nationwide cash on delivery and honest affiliate relationships.',
    phone: '+880 1700-000000',
    email: 'ronvex.support@gmail.com',
    address: 'Level 8, Motijheel C/A, Dhaka 1000, Bangladesh',
    hours: 'Saturday to Thursday: 9:00 AM – 8:00 PM',
    deliveryDistricts: 'All 64 districts via Pathao, Steadfast & RedX Logistics',
    socialLinks: [
      { platform: 'Facebook', url: 'https://facebook.com/ronvex' },
      { platform: 'Instagram', url: 'https://instagram.com/ronvex' },
      { platform: 'YouTube', url: 'https://youtube.com/@ronvex' },
    ],
    copyright: '© 2026 RONVEX. All rights reserved.',
  },
  pages: [
    {
      id: 'about-us',
      slug: 'about-us',
      title: 'About RONVEX',
      subtitle: 'Our heritage, engineering values, and Bangladesh consumer mission',
      content: `RONVEX was founded with a singular mandate: to eliminate counterfeit consumer electronics and inflated retail markups across Bangladesh.\n\nWe collaborate directly with manufacturing fabrication facilities to deliver aerospace-grade titanium smartwatches, graphene-driver acoustics, and water-repellent executive commuter gear.\n\nEvery product is backed by authentic warranty coverage, rigorous warehouse QC before dispatch, and seamless nationwide logistics.`,
      isPublished: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'affiliate-agreement',
      slug: 'affiliate-agreement',
      title: 'Affiliate Partner Terms & Operating Guidelines',
      subtitle: 'Guidelines governing custom price markups, link attribution, and Wednesday payouts',
      content: `1. Retail Price Authority: Affiliates may set retail selling prices up to the maximum permitted increase configured by the administrator for each SKU.\n2. Commission Qualification: Commission is credited to PENDING upon order placement and converts to PAYABLE when an order is verified DELIVERED by courier.\n3. Weekly Wednesday Disbursement: Payouts are manually disbursed every Wednesday via bKash, Nagad, or direct bank transfer. There is no minimum payout threshold—any positive payable balance will be paid in full.\n4. Attribution Window: Customer referrals are tracked with a 30-day first-party window.\n5. Zero Self-Referral Policy: Affiliates may not place fraudulent orders through their own links to generate synthetic commissions.`,
      isPublished: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'shipping-delivery',
      slug: 'shipping-delivery',
      title: 'Nationwide Delivery & Shipping Policy',
      subtitle: 'Logistics partners, delivery timelines, and transit fee structure',
      content: `We ship to all 64 districts of Bangladesh through verified courier partners including Pathao Courier, Steadfast Courier, and RedX.\n\n• Delivery Charges: Dhaka Metro: ৳80 | Outside Dhaka: ৳150\n• Free Delivery: Orders of ৳3,000 or above qualify for zero delivery charge.\n• Transit Times: Inside Dhaka: 24–48 hours | Outside Dhaka: 48–72 hours\n• Cash on Delivery: Customers can inspect product packaging at the time of delivery before handing cash to the courier representative.`,
      isPublished: true,
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'faqs',
      slug: 'faqs',
      title: 'Frequently Asked Questions',
      subtitle: 'Common questions regarding ordering, warranties, and affiliate earnings',
      content: `Q: How do I become an affiliate?\nA: Click 'Join Affiliate Program', fill in your profile and promotion channels. Our admin team verifies applications and assigns your unique storefront slug.\n\nQ: When are affiliate commissions paid?\nA: Every Wednesday! There is no minimum payout amount (no ৳500 barrier). You receive 100% of your available payable balance via bKash, Nagad, or bank.\n\nQ: How does the monthly bonus work?\nA: If your delivered sales reach ৳100,000 in a calendar month, you earn an additional ৳800 performance bonus paid into your account.\n\nQ: What payment methods are supported?\nA: Cash on delivery (COD), bKash, Nagad, and bank transfer.`,
      isPublished: true,
      updatedAt: new Date().toISOString(),
    },
  ],
  theme: {
    brandAccent: '#090d16',
    badgeAccent: '#d97706',
    fontSerifTitles: true,
    roundedStyle: 'rounded-2xl',
  },
  seo: {
    siteTitle: 'RONVEX · Premium Consumer Electronics & Affiliate Network',
    metaDescription:
      'Curated smartwatches, ANC audio earbuds, and executive lifestyle accessories in Bangladesh. Weekly Wednesday payouts and nationwide cash on delivery.',
    keywords: 'RONVEX, electronics Bangladesh, smart watch Dhaka, affiliate program BD, bKash payout',
    ogImageUrl: '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg',
    canonicalUrl: 'https://ronvex.com',
  },
};

export const INITIAL_MEDIA_ASSETS: MediaAsset[] = [
  {
    id: 'media_hero_1',
    title: 'Autumn 2026 Collection Lifestyle Hero',
    url: '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg',
    category: 'banner',
    dimensions: '1920x1080',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'media_smartwatch_titanium',
    title: 'Apex Horizon Titanium Smartwatch Studio Shot',
    url: '/src/assets/images/product_smartwatch_elite_1792836929081.jpg',
    category: 'product',
    dimensions: '1000x1000',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'media_earbuds_anc',
    title: 'Acoustic Pro ANC Wireless Earbuds Case & Buds',
    url: '/src/assets/images/product_wireless_earbuds_1792836928757.jpg',
    category: 'product',
    dimensions: '1000x1000',
    addedAt: new Date().toISOString(),
  },
  {
    id: 'media_backpack_leather',
    title: 'Vanguard Commuter Modular Backpack Detail',
    url: '/src/assets/images/product_leather_commuter_bag_1792836929286.jpg',
    category: 'lifestyle',
    dimensions: '1000x1000',
    addedAt: new Date().toISOString(),
  },
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'RONVEX100',
    description: 'Flat ৳100 off on first order across Bangladesh',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 1500,
    expiryDate: '2026-12-31',
    isActive: true,
    usageCount: 24,
  },
  {
    code: 'FESTIVE5',
    description: '5% off on orders exceeding ৳3,000',
    discountType: 'percentage',
    discountValue: 5,
    minOrderAmount: 3000,
    maxDiscount: 350,
    expiryDate: '2026-12-31',
    isActive: true,
    usageCount: 18,
  },
];

export const INITIAL_ADMIN_TEAM: AdminTeamMember[] = [
  {
    id: 'admin_primary',
    email: 'ronvex.support@gmail.com',
    displayName: 'Executive Administrator',
    role: 'SUPER_ADMIN',
    permissions: ['all_access', 'financial_payouts', 'cms_publish', 'order_fulfillment', 'user_management'],
    status: 'ACTIVE',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'admin_ops',
    email: 'ops@ronvex.com',
    displayName: 'Logistics & Dispatch Manager',
    role: 'STORE_MANAGER',
    permissions: ['order_fulfillment', 'catalog_edit', 'courier_updates'],
    status: 'ACTIVE',
    lastActive: new Date().toISOString(),
  },
  {
    id: 'admin_affiliate',
    email: 'partners@ronvex.com',
    displayName: 'Affiliate Community Director',
    role: 'AFFILIATE_DIRECTOR',
    permissions: ['affiliate_approval', 'commission_audit', 'storefront_inspection'],
    status: 'ACTIVE',
    lastActive: new Date().toISOString(),
  },
];

export class CmsService {
  /**
   * Fetches published CMS data from Firestore with fallback to defaults
   */
  public static async getPublishedCMS(): Promise<FullWebsiteCMS> {
    try {
      const snap = await getDoc(doc(db, 'cms', 'published'));
      if (snap.exists()) {
        const remote = snap.data() as FullWebsiteCMS;
        return {
          ...DEFAULT_CMS,
          ...remote,
          homepage: { ...DEFAULT_CMS.homepage, ...(remote.homepage || {}) },
          header: { ...DEFAULT_CMS.header, ...(remote.header || {}) },
          footer: { ...DEFAULT_CMS.footer, ...(remote.footer || {}) },
          theme: { ...DEFAULT_CMS.theme, ...(remote.theme || {}) },
          seo: { ...DEFAULT_CMS.seo, ...(remote.seo || {}) },
          pages: remote.pages && remote.pages.length > 0 ? remote.pages : DEFAULT_CMS.pages,
        };
      }
    } catch (err) {
      console.warn('CMS read error, falling back to local defaults:', err);
    }
    return DEFAULT_CMS;
  }

  /**
   * Publishes new CMS content to live Firestore and records audit log
   */
  public static async publishCMS(cms: FullWebsiteCMS, adminEmail: string): Promise<void> {
    const payload: FullWebsiteCMS = {
      ...cms,
      version: (cms.version || 1) + 1,
      publishedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };

    await setDoc(doc(db, 'cms', 'published'), payload);

    await this.logActivity({
      adminEmail,
      action: 'PUBLISH_CMS',
      category: 'CMS',
      details: `Published Website CMS version ${payload.version} with updated homepage and page configurations.`,
    });
  }

  /**
   * Record action in audit log
   */
  public static async logActivity(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await setDoc(doc(db, 'auditLogs', logId), {
        ...entry,
        id: logId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Failed to record audit log:', err);
    }
  }

  /**
   * Fetch recent activity audit logs
   */
  public static async getRecentAuditLogs(limitCount = 40): Promise<AuditLogEntry[]> {
    try {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as AuditLogEntry);
      }
    } catch (err) {
      console.warn('Audit logs fetch fallback:', err);
    }
    // Fallback seed audit log entries
    return [
      {
        id: 'log_seed_1',
        adminEmail: 'ronvex.support@gmail.com',
        action: 'PLATFORM_BOOTSTRAP',
        category: 'SYSTEM',
        details: 'Initial system bootstrap and verification of Wednesday payout schedules.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'log_seed_2',
        adminEmail: 'ronvex.support@gmail.com',
        action: 'POLICY_UPDATE',
        category: 'FINANCE',
        details: 'Minimum affiliate withdrawal threshold removed (৳0 barrier). Full available balance pays every Wednesday.',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];
  }

  /**
   * Fetch coupons
   */
  public static async getCoupons(): Promise<Coupon[]> {
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Coupon);
      }
    } catch (err) {
      console.warn('Coupons fetch fallback:', err);
    }
    return INITIAL_COUPONS;
  }

  /**
   * Save or update coupon
   */
  public static async saveCoupon(coupon: Coupon, adminEmail: string): Promise<void> {
    await setDoc(doc(db, 'coupons', coupon.code.toUpperCase().trim()), {
      ...coupon,
      code: coupon.code.toUpperCase().trim(),
    });
    await this.logActivity({
      adminEmail,
      action: 'SAVE_COUPON',
      category: 'MARKETING',
      details: `Saved promotional coupon code ${coupon.code.toUpperCase().trim()}`,
      targetId: coupon.code,
    });
  }

  /**
   * Fetch contact messages
   */
  public static async getContactMessages(): Promise<ContactMessage[]> {
    try {
      const snap = await getDocs(collection(db, 'contactMessages'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as ContactMessage);
      }
    } catch (err) {
      console.warn('Contact messages fetch fallback:', err);
    }
    return [
      {
        id: 'msg_1',
        name: 'Tanvir Hossain',
        email: 'tanvir.h@gmail.com',
        phone: '01819283746',
        subject: 'Bulk Corporate Inquiry for Smartwatches',
        message: 'Interested in placing an order for 25 titanium smartwatches for an executive retreat. What is the corporate volume discount?',
        status: 'NEW',
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
      {
        id: 'msg_2',
        name: 'Sadia Rahman',
        email: 'sadia.tech@gmail.com',
        phone: '01712984561',
        subject: 'Affiliate Payout Inquiries',
        message: 'Can I add multiple bKash accounts or do I need to keep the one from registration? Confirmed my Wednesday payout arrived smoothly.',
        status: 'REPLIED',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        adminNote: 'Confirmed affiliate payout account can be edited anytime in the profile tab.',
      },
    ];
  }

  /**
   * Update contact message status
   */
  public static async updateContactMessage(
    id: string,
    updates: Partial<ContactMessage>,
    adminEmail: string
  ): Promise<void> {
    await setDoc(doc(db, 'contactMessages', id), updates, { merge: true });
    await this.logActivity({
      adminEmail,
      action: 'UPDATE_MESSAGE',
      category: 'SUPPORT',
      details: `Updated contact message ${id} status to ${updates.status || 'updated'}`,
      targetId: id,
    });
  }
}
