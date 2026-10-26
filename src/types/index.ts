export type UserRole = 'admin' | 'affiliate' | 'customer';

export type AccountStatus = 'active' | 'pending' | 'suspended' | 'rejected';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt?: string;
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface AffiliateApplication {
  applicationId: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  marketingExperience?: string;
  socialLinks?: string;
  applicationStatus: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface Affiliate {
  affiliateId: string;
  uid: string;
  affiliateSlug: string;
  displayName: string;
  email: string;
  phone?: string;
  accountStatus: 'APPROVED' | 'SUSPENDED' | 'PENDING';
  bio?: string;
  avatarUrl?: string;
  payoutMethod?: PayoutMethod;
  payoutAccountNumber?: string;
  createdAt: string;
  approvedAt?: string;
  updatedAt?: string;
}

export interface ProductCategory {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  iconName?: string;
  productCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  imageUrls: string[];
  adminBasePrice: number; // e.g., 600 BDT
  maxAffiliateIncrease: number; // e.g., 150 BDT
  stockQuantity: number;
  isActive: boolean;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliateProductPrice {
  id: string; // `${affiliateId}_${productId}`
  affiliateId: string;
  productId: string;
  sellingPrice: number;
  updatedAt: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'COD_CONFIRMED' | 'REFUNDED';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  adminBasePrice: number;
  affiliateSellingPrice: number;
  unitPrice: number; // Price charged to customer
  subtotal: number;
  imageUrl?: string;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  area?: string;
  orderNotes?: string;
}

export interface CourierInfo {
  company: string;
  trackingNumber: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  customerDetails: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'COD' | 'bKash' | 'Nagad' | 'Bank';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  affiliateId?: string | null;
  affiliateSlug?: string | null;
  affiliateMarginTotal?: number;
  courier?: CourierInfo;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStatusHistory {
  historyId: string;
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  changedBy: string;
  changedByName?: string;
  note?: string;
  timestamp: string;
}

export type CommissionStatus = 'PENDING' | 'ELIGIBLE' | 'PAYABLE' | 'PAID' | 'REVERSED';

export interface Commission {
  commissionId: string;
  orderId: string;
  affiliateId: string;
  amount: number;
  status: CommissionStatus;
  createdAt: string;
  updatedAt: string;
  orderNumber?: string;
  eligibleAt?: string;
  paidAt?: string;
  payoutId?: string;
  reversalReason?: string;
}

export type BonusStatus = 'IN_PROGRESS' | 'QUALIFIED' | 'PAID';

export interface MonthlyAffiliateStat {
  id: string; // `${affiliateId}_${yearMonth}`
  affiliateId: string;
  yearMonth: string; // 'YYYY-MM'
  eligibleDeliveredSales: number;
  targetAmount: number;
  bonusAmount: number;
  bonusStatus: BonusStatus;
  updatedAt: string;
  paidAt?: string;
}

export type PayoutMethod = 'bkash' | 'nagad' | 'bank';
export type PayoutStatus = 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'REJECTED';

export interface PayoutDetails {
  accountNumber: string;
  accountType?: 'personal' | 'agent' | 'savings' | 'current';
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
}

export interface Payout {
  payoutId: string;
  affiliateId: string;
  affiliateName?: string;
  affiliateEmail?: string;
  requestedAmount: number;
  paymentMethod: PayoutMethod;
  payoutDetails: PayoutDetails;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  paymentReference?: string;
  adminNotes?: string;
}

export interface PlatformSettings {
  currency: string;
  currencySymbol: string;
  defaultMonthlyTarget: number; // e.g. 100,000
  defaultMonthlyBonus: number; // e.g. 800
  minimumPayout?: number; // Optional, threshold removed completely
  payoutScheduleDay: string; // e.g. 'Wednesday'
  attributionWindowDays: number; // 30
  deliveryChargeInsideDhaka: number; // 80
  deliveryChargeOutsideDhaka: number; // 150
  freeDeliveryThreshold: number; // 3000
  returnWindowDays: number; // 7
}

export interface CartItem {
  product: Product;
  quantity: number;
  sellingPrice: number; // May reflect affiliate custom price if shopping via affiliate
  affiliateId?: string | null;
}

export interface AttributionData {
  affiliateId: string;
  affiliateSlug: string;
  timestamp: number;
}

// ---------------- Admin Roles & Access ----------------
export type AdminRole = 'super_admin' | 'content_editor' | 'product_manager' | 'order_manager' | 'finance_manager';

export interface AdminUserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  addedBy?: string;
}

// ---------------- CMS & Homepage Builder ----------------
export interface HeroSectionConfig {
  badgeText: string;
  title: string;
  subtitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  bgImageUrl: string;
  enabled: boolean;
}

export interface PromoBannerConfig {
  enabled: boolean;
  text: string;
  highlightText: string;
  linkText: string;
  linkUrl: string;
}

export interface FeaturedSectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  displayCount: number;
}

export interface PopularSectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  displayCount: number;
}

export interface CategorySectionConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
}

export interface TrustBadgeItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export interface AffiliatePromoSectionConfig {
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  bulletPoints: string[];
}

export interface NewsletterSectionConfig {
  enabled: boolean;
  title: string;
  description: string;
  placeholder: string;
  buttonText: string;
  disclaimer: string;
}

export interface HomepageCMSConfig {
  id: string; // 'homepage'
  isPublished: boolean;
  hero: HeroSectionConfig;
  promoBanner: PromoBannerConfig;
  featuredSection: FeaturedSectionConfig;
  popularSection: PopularSectionConfig;
  categorySection: CategorySectionConfig;
  trustBadges: TrustBadgeItem[];
  affiliatePromo: AffiliatePromoSectionConfig;
  newsletter: NewsletterSectionConfig;
  updatedAt: string;
  updatedBy?: string;
}

// ---------------- Dynamic Custom Pages & Blog Posts ----------------
export interface CustomPage {
  pageId: string;
  slug: string;
  title: string;
  content: string; // Markdown or formatted text
  metaTitle?: string;
  seoTitle?: string;
  metaDescription?: string;
  featuredImageUrl?: string;
  isPublished: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
  order: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface BlogPost {
  postId: string;
  slug: string;
  title: string;
  bodyContent: string;
  excerpt?: string;
  featuredImageUrl?: string;
  author: string;
  publicationDate: string; // YYYY-MM-DD or ISO string
  isPublished: boolean;
  category?: string;
  tags?: string[];
  seoTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

// ---------------- Navigation & Footer ----------------
export interface NavItem {
  id: string;
  label: string;
  url: string;
  isExternal?: boolean;
}

export interface HeaderConfig {
  id: string; // 'header'
  brandName: string;
  logoUrl?: string;
  topNoticeEnabled: boolean;
  topNoticeText: string;
  navItems: NavItem[];
  supportPhone: string;
  supportEmail: string;
  updatedAt: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: { label: string; url: string }[];
}

export interface FooterConfig {
  id: string; // 'footer'
  aboutText: string;
  columns: FooterColumn[];
  address: string;
  phone: string;
  email: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  copyrightText: string;
  updatedAt: string;
}

// ---------------- Theme & Appearance ----------------
export interface ThemeConfig {
  id: string; // 'theme'
  brandName: string;
  primaryColor: string; // Hex e.g. #0f172a
  accentColor: string; // Hex e.g. #059669
  fontFamily: 'serif' | 'sans' | 'mono';
  bannerBgColor: string;
  announcementBarColor: string;
  updatedAt: string;
}

// ---------------- SEO Settings ----------------
export interface SEOSettings {
  id: string; // 'seo'
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  ogImage: string;
  canonicalUrl: string;
  updatedAt: string;
}

// ---------------- Media Assets ----------------
export interface MediaAsset {
  id: string;
  title: string;
  url: string;
  category: 'banner' | 'product' | 'logo' | 'marketing' | 'other';
  altText: string;
  uploadedAt: string;
  uploadedBy?: string;
}

// ---------------- Coupons & Discounts ----------------
export interface Coupon {
  couponId: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountAmount: number;
  minOrderAmount: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

// ---------------- Contact Inquiries ----------------
export interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED';
  submittedAt: string;
  replyNote?: string;
}

// ---------------- Activity / Audit Logs ----------------
export interface ActivityLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  module: string;
  details: string;
  timestamp: string;
}
