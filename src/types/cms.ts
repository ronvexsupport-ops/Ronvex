export interface HomepageCMS {
  announcement: {
    enabled: boolean;
    text: string;
    link?: string;
    badge?: string;
  };
  hero: {
    collectionTag: string;
    title: string;
    subtitle: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    imageUrl: string;
    trustMarkers: string[];
  };
  featuredSection: {
    tagline: string;
    title: string;
    limit: number;
    showViewAll: boolean;
  };
  valueProps: {
    title: string;
    items: Array<{
      id: string;
      title: string;
      description: string;
      badge?: string;
    }>;
  };
  affiliateBanner: {
    enabled: boolean;
    title: string;
    description: string;
    ctaText: string;
    targetBonusText: string;
    weeklyPayoutText: string;
  };
}

export interface HeaderCMS {
  logoText: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  logoHeight?: number;
  showWordmark?: boolean;
  faviconUrl?: string;
  appleTouchIconUrl?: string;
  announcementBarEnabled: boolean;
  announcementText: string;
  navLinks: Array<{
    id: string;
    label: string;
    view: string;
    param?: string;
  }>;
  showAffiliateCta: boolean;
  affiliateCtaText: string;
}

export interface FooterCMS {
  brandName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  deliveryDistricts: string;
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
  copyright: string;
}

export interface ContentPageCMS {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  content: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface ThemeCMS {
  brandAccent: string; // e.g. '#0f172a'
  badgeAccent: string; // e.g. '#d97706'
  fontSerifTitles: boolean;
  roundedStyle: 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
}

export interface SEOCMS {
  siteTitle: string;
  metaDescription: string;
  keywords: string;
  ogImageUrl: string;
  canonicalUrl: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  category: 'product' | 'banner' | 'lifestyle' | 'icon';
  dimensions?: string;
  addedAt: string;
}

export interface Coupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number; // e.g. 10 (%) or 100 (BDT)
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  isActive: boolean;
  usageCount: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'NEW' | 'REPLIED' | 'ARCHIVED';
  createdAt: string;
  adminNote?: string;
}

export interface AdminTeamMember {
  id: string;
  email: string;
  displayName: string;
  role: 'SUPER_ADMIN' | 'STORE_MANAGER' | 'AFFILIATE_DIRECTOR' | 'SUPPORT_AGENT';
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export interface AuditLogEntry {
  id: string;
  adminEmail: string;
  action: string;
  category: string;
  details: string;
  targetId?: string;
  timestamp: string;
}

export interface FullWebsiteCMS {
  homepage: HomepageCMS;
  header: HeaderCMS;
  footer: FooterCMS;
  pages: ContentPageCMS[];
  theme: ThemeCMS;
  seo: SEOCMS;
  version: number;
  publishedAt: string;
  updatedBy: string;
}
