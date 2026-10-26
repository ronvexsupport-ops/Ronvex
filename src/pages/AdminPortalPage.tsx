import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Truck,
  RotateCcw,
  Search,
  Filter,
  Upload,
  Link as LinkIcon,
  Target,
  FileCheck,
  Globe,
  Layout,
  FileText,
  Navigation,
  Columns,
  Palette,
  Image as ImageIcon,
  Tag,
  Mail,
  UserCheck,
  History,
  AlertCircle,
  LogOut,
  ExternalLink,
  Save,
  Check,
  Eye,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  ShieldAlert,
  ChevronRight,
  Send,
  FolderPlus,
  Sparkles,
  BookOpen,
  Copy,
  RotateCw,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Product,
  ProductCategory,
  Order,
  AffiliateApplication,
  Affiliate,
  Payout,
  Commission,
  OrderStatus,
  PaymentStatus,
  HomepageCMSConfig,
  HeaderConfig,
  FooterConfig,
  ThemeConfig,
  SEOSettings,
  CustomPage,
  BlogPost,
  MediaAsset,
  Coupon,
  ContactMessage,
  ActivityLog,
  AdminUserRecord,
  AdminRole,
  PlatformSettings,
} from '../types';
import { PricingEngine, DEFAULT_PLATFORM_SETTINGS } from '../services/pricingEngine';
import { OrderService } from '../services/orderService';
import { AffiliateService } from '../services/affiliateService';
import { PayoutService } from '../services/payoutService';
import { BlogService, INITIAL_BLOG_POSTS } from '../services/blogService';
import {
  generateSlug,
  normalizeSlug,
  resolveUniqueSlug,
  buildPublicUrl,
} from '../utils/slugUtils';
import { generateSitemapXml } from '../utils/seoUtils';
import {
  ImageService,
  DEFAULT_FALLBACK_IMAGE,
  PRODUCT_IMAGE_PRESETS,
  BUNDLED_IMAGES,
} from '../services/imageService';
import { CategoryService, DEFAULT_CATEGORIES } from '../services/categoryService';
import {
  saveSingleProductLocally,
  deleteSingleProductLocally,
  getLocalProducts,
} from '../services/seedData';
import {
  CMSService,
  DEFAULT_HOMEPAGE_CMS,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_THEME_CONFIG,
  DEFAULT_SEO_SETTINGS,
  INITIAL_CUSTOM_PAGES,
} from '../services/cmsService';
import { useAuth } from '../context/AuthContext';
import { AdminLoginPage } from './AdminLoginPage';

interface AdminPortalPageProps {
  products: Product[];
  onRefreshProducts: () => void;
  onOpenDiagnostics?: () => void;
  onNavigateHome?: () => void;
}

export type AdminTab =
  | 'overview'
  | 'website_editor'
  | 'homepage_builder'
  | 'pages_content'
  | 'blog_posts'
  | 'header_nav'
  | 'footer_editor'
  | 'theme_appearance'
  | 'media_library'
  | 'seo_settings'
  | 'products'
  | 'categories'
  | 'orders'
  | 'customers'
  | 'applications'
  | 'affiliates'
  | 'affiliate_storefronts'
  | 'commissions'
  | 'targets_bonuses'
  | 'payouts'
  | 'delivery_status'
  | 'coupons'
  | 'contact_messages'
  | 'admin_users'
  | 'activity_logs'
  | 'general_settings';

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  products: initialProducts,
  onRefreshProducts,
  onOpenDiagnostics,
  onNavigateHome = () => { window.location.hash = ''; },
}) => {
  const { currentUser, appUser, adminRecord, isAdmin, logout, claimInitialAdminIfEligible } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Core Data Collections
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES);
  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);

  // CMS & Content States
  const [homepageCMS, setHomepageCMS] = useState<HomepageCMSConfig>(DEFAULT_HOMEPAGE_CMS);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME_CONFIG);
  const [seoSettings, setSeoSettings] = useState<SEOSettings>(DEFAULT_SEO_SETTINGS);
  const [customPages, setCustomPages] = useState<CustomPage[]>(INITIAL_CUSTOM_PAGES);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(INITIAL_BLOG_POSTS);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingCMS, setSavingCMS] = useState(false);

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Product Add / Edit Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('wearables');
  const [prodCategoryName, setProdCategoryName] = useState('Smart Wearables');
  const [prodBasePrice, setProdBasePrice] = useState<number>(600);
  const [prodMaxIncrease, setProdMaxIncrease] = useState<number>(150);
  const [prodStock, setProdStock] = useState<number>(50);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [prodAdditionalImages, setProdAdditionalImages] = useState<string[]>([]);

  // Category Add / Edit Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIsActive, setCatIsActive] = useState(true);

  // Page Editor Modal State
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageIsSlugCustom, setPageIsSlugCustom] = useState(false);
  const [pageContent, setPageContent] = useState('');
  const [pageFeaturedImage, setPageFeaturedImage] = useState('');
  const [pageSeoTitle, setPageSeoTitle] = useState('');
  const [pageMetaDesc, setPageMetaDesc] = useState('');
  const [pagePublished, setPagePublished] = useState(true);
  const [pageShowInFooter, setPageShowInFooter] = useState(true);
  const [pageShowInHeader, setPageShowInHeader] = useState(false);
  const [pageCopiedSlug, setPageCopiedSlug] = useState<string | null>(null);

  // Blog Post Editor Modal State
  const [showBlogPostModal, setShowBlogPostModal] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postSlug, setPostSlug] = useState('');
  const [postIsSlugCustom, setPostIsSlugCustom] = useState(false);
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postBodyContent, setPostBodyContent] = useState('');
  const [postFeaturedImage, setPostFeaturedImage] = useState('');
  const [postAuthor, setPostAuthor] = useState('RONVEX Editorial');
  const [postPublicationDate, setPostPublicationDate] = useState(new Date().toISOString().split('T')[0]);
  const [postCategory, setPostCategory] = useState('Guides');
  const [postTags, setPostTags] = useState('');
  const [postSeoTitle, setPostSeoTitle] = useState('');
  const [postMetaDesc, setPostMetaDesc] = useState('');
  const [postPublished, setPostPublished] = useState(true);
  const [postCopiedSlug, setPostCopiedSlug] = useState<string | null>(null);
  const [postSearch, setPostSearch] = useState('');
  const [postFilterCategory, setPostFilterCategory] = useState('ALL');

  // XML Sitemap State
  const [showSitemapModal, setShowSitemapModal] = useState(false);
  const [sitemapXmlContent, setSitemapXmlContent] = useState('');
  const [sitemapCopied, setSitemapCopied] = useState(false);

  // Coupon Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [couponAmount, setCouponAmount] = useState<number>(10);
  const [couponMinOrder, setCouponMinOrder] = useState<number>(1000);
  const [couponEndDate, setCouponEndDate] = useState('2026-12-31');

  // Media Modal
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCategory, setMediaCategory] = useState<'banner' | 'product' | 'logo' | 'marketing' | 'other'>('product');

  // Order Transition Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderNewStatus, setOrderNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [courierCompany, setCourierCompany] = useState('Pathao Courier');
  const [courierTracking, setCourierTracking] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Application Approval Modal
  const [selectedApp, setSelectedApp] = useState<AffiliateApplication | null>(null);
  const [assignedSlug, setAssignedSlug] = useState('');
  const [reviewNote, setReviewNote] = useState('');

  // Payout Process Modal
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [paymentRefCode, setPaymentRefCode] = useState('');

  // Search/Filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');

  const adminEmail = currentUser?.email || 'ronvex.support@gmail.com';
  const adminUid = currentUser?.uid || 'admin_user';

  // Keep productList in sync with incoming props
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductList(initialProducts);
    }
  }, [initialProducts]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'affiliateApplications')),
        getDocs(collection(db, 'affiliates')),
        getDocs(collection(db, 'payouts')),
        getDocs(collection(db, 'commissions')),
        CategoryService.getCategories(),
        CMSService.getHomepageConfig(),
        CMSService.getHeaderConfig(),
        CMSService.getFooterConfig(),
        CMSService.getThemeConfig(),
        CMSService.getSEOSettings(),
        CMSService.getPages(),
        BlogService.getPosts(),
        CMSService.getMediaAssets(),
        CMSService.getCoupons(),
        CMSService.getContactMessages(),
        CMSService.getAdminUsers(),
        CMSService.getActivityLogs(50),
      ]);

      const [
        prodRes,
        orderRes,
        appRes,
        affRes,
        payoutRes,
        commRes,
        catRes,
        hpRes,
        headerRes,
        footerRes,
        themeRes,
        seoRes,
        pageRes,
        blogRes,
        mediaRes,
        couponRes,
        contactRes,
        adminRes,
        logRes,
      ] = results;

      if (prodRes.status === 'fulfilled' && !prodRes.value.empty) {
        setProductList(prodRes.value.docs.map(d => d.data() as Product));
      }
      if (orderRes.status === 'fulfilled') {
        setOrders(orderRes.value.docs.map(d => d.data() as Order));
      }
      if (appRes.status === 'fulfilled') {
        setApplications(appRes.value.docs.map(d => d.data() as AffiliateApplication));
      }
      if (affRes.status === 'fulfilled') {
        setAffiliates(affRes.value.docs.map(d => d.data() as Affiliate));
      }
      if (payoutRes.status === 'fulfilled') {
        setPayouts(payoutRes.value.docs.map(d => d.data() as Payout));
      }
      if (commRes.status === 'fulfilled') {
        setCommissions(commRes.value.docs.map(d => d.data() as Commission));
      }
      if (catRes.status === 'fulfilled') {
        setCategories(catRes.value);
      }
      if (hpRes.status === 'fulfilled') {
        setHomepageCMS(hpRes.value);
      }
      if (headerRes.status === 'fulfilled') {
        setHeaderConfig(headerRes.value);
      }
      if (footerRes.status === 'fulfilled') {
        setFooterConfig(footerRes.value);
      }
      if (themeRes.status === 'fulfilled') {
        setThemeConfig(themeRes.value);
      }
      if (seoRes.status === 'fulfilled') {
        setSeoSettings(seoRes.value);
      }
      if (pageRes.status === 'fulfilled') {
        setCustomPages(pageRes.value);
      }
      if (blogRes.status === 'fulfilled') {
        setBlogPosts(blogRes.value);
      }
      if (mediaRes.status === 'fulfilled') {
        setMediaAssets(mediaRes.value);
      }
      if (couponRes.status === 'fulfilled') {
        setCoupons(couponRes.value);
      }
      if (contactRes.status === 'fulfilled') {
        setContactMessages(contactRes.value);
      }
      if (adminRes.status === 'fulfilled') {
        setAdminUsers(adminRes.value);
      }
      if (logRes.status === 'fulfilled') {
        setActivityLogs(logRes.value);
      }

      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.warn(`Admin query index ${idx} rejected:`, r.reason);
        }
      });
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  // Auth gate 1: Unauthenticated -> Real Firebase Auth Login
  if (!currentUser) {
    return (
      <AdminLoginPage
        onSuccess={() => {
          fetchAllData();
        }}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  // Auth gate 2: Authenticated but not authorized as admin
  if (!isAdmin) {
    const isEligibleSuperAdmin = currentUser.email?.toLowerCase() === 'ronvex.support@gmail.com';
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif text-white mb-2">Administrative Authorization Required</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            You are signed in as <span className="font-mono text-emerald-400">{currentUser.email}</span>, but this account is not registered in the RONVEX Administrator Directory (<code className="text-slate-300">/admins/&#123;uid&#125;</code>).
          </p>

          {isEligibleSuperAdmin ? (
            <div className="space-y-4">
              <p className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 p-3 rounded-xl">
                Primary Master Administrator Identity Detected! Click below to claim and initialize your super admin record.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await claimInitialAdminIfEligible();
                  fetchAllData();
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Claim Super Admin Console
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out & Switch Account</span>
              </button>
              <button
                type="button"
                onClick={onNavigateHome}
                className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Return to Storefront
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------- CATEGORY HANDLERS ----------------
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatSlug('');
    setCatDesc('');
    setCatIsActive(true);
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatDesc(cat.description);
    setCatIsActive(cat.isActive);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setActionError('Category name is required.');
      return;
    }
    const slug = catSlug.trim() || catName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const payload: ProductCategory = {
      categoryId: slug,
      name: catName.trim(),
      slug,
      description: catDesc.trim(),
      isActive: catIsActive,
      createdAt: editingCategory ? editingCategory.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const updated = await CategoryService.saveCategory(payload, adminEmail, adminUid);
      await CMSService.logActivity(adminUid, adminEmail, 'SAVE_CATEGORY', 'Categories', `Saved category: ${payload.name}`);
      setShowCategoryModal(false);
      setActionSuccess(`Category "${payload.name}" saved successfully.`);
      setCategories(updated);
      // Auto-assign to product creator modal if open
      setProdCategory(payload.categoryId);
      setProdCategoryName(payload.name);
      onRefreshProducts();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const updated = await CategoryService.deleteCategory(categoryId, adminEmail, adminUid);
      await CMSService.logActivity(adminUid, adminEmail, 'DELETE_CATEGORY', 'Categories', `Deleted category ID: ${categoryId}`);
      setActionSuccess('Category removed successfully.');
      setCategories(updated);
      onRefreshProducts();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete category.');
    }
  };

  // ---------------- PRODUCT HANDLERS ----------------
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSlug('');
    setProdDesc('');
    const defaultCat = categories[0] || { categoryId: 'wearables', name: 'Smart Wearables' };
    setProdCategory(defaultCat.categoryId);
    setProdCategoryName(defaultCat.name);
    setProdBasePrice(600);
    setProdMaxIncrease(150);
    setProdStock(50);
    setProdImageUrl(BUNDLED_IMAGES.smartwatch);
    setProdAdditionalImages([]);
    setShowProductModal(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSlug(p.slug);
    setProdDesc(p.description);
    setProdCategory(p.categoryId);
    setProdCategoryName(p.categoryName);
    setProdBasePrice(p.adminBasePrice);
    setProdMaxIncrease(p.maxAffiliateIncrease);
    setProdStock(p.stockQuantity);
    const [firstImg, ...restImgs] = p.imageUrls || [];
    setProdImageUrl(firstImg || DEFAULT_FALLBACK_IMAGE);
    setProdAdditionalImages(restImgs || []);
    setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await ImageService.uploadImage(file);
      setProdImageUrl(dataUrl);
      setActionSuccess('Main product image loaded successfully!');
    } catch (err: any) {
      setActionError(err.message || 'Failed to read image file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await ImageService.uploadImage(files[i]);
        newUrls.push(url);
      }
      setProdAdditionalImages(prev => [...prev, ...newUrls]);
      setActionSuccess(`Added ${newUrls.length} gallery photo(s)!`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to read image files.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setActionError('Product name is required.');
      return;
    }

    const productId = editingProduct ? editingProduct.productId : `prod_${Date.now()}`;
    const cleanSlug = prodSlug.trim() || prodName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');

    // Find category name
    const foundCat = categories.find(c => c.categoryId === prodCategory);
    const categoryName = foundCat ? foundCat.name : prodCategoryName;

    // Resolve main and additional image URLs without overriding user uploads
    const finalImageUrl = ImageService.resolveProductImage(prodImageUrl.trim(), prodCategory);
    const resolvedAdditional = prodAdditionalImages
      .map(u => ImageService.resolveProductImage(u.trim(), prodCategory))
      .filter(u => u && u.trim().length > 0);

    const combinedImages = Array.from(new Set([finalImageUrl, ...resolvedAdditional]));

    const productPayload: Product = {
      productId,
      name: prodName.trim(),
      slug: cleanSlug,
      description: prodDesc.trim(),
      categoryId: prodCategory,
      categoryName,
      adminBasePrice: Number(prodBasePrice),
      maxAffiliateIncrease: Number(prodMaxIncrease),
      stockQuantity: Number(prodStock),
      imageUrls: combinedImages,
      isActive: editingProduct ? editingProduct.isActive : true,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Persist to Firestore first as source of truth
    try {
      await setDoc(doc(db, 'products', productId), productPayload);
      await CMSService.logActivity(adminUid, adminEmail, 'SAVE_PRODUCT', 'Products', `Saved product: ${prodName}`).catch(() => {});

      // Persist to local storage cache
      saveSingleProductLocally(productPayload);

      // Update in-memory state
      setProductList(prev => {
        const idx = prev.findIndex(p => p.productId === productId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = productPayload;
          return updated;
        }
        return [productPayload, ...prev];
      });

      setShowProductModal(false);
      setActionSuccess(`Product "${prodName}" saved successfully.`);
      onRefreshProducts();
      fetchAllData();
    } catch (err: any) {
      console.error('Failed to save product to database:', err);
      setActionError(err.message || 'Failed to save product to database.');
    }
  };

  const handleToggleProductActive = async (p: Product) => {
    try {
      await updateDoc(doc(db, 'products', p.productId), {
        isActive: !p.isActive,
        updatedAt: new Date().toISOString(),
      });
      const updatedProd = {
        ...p,
        isActive: !p.isActive,
        updatedAt: new Date().toISOString(),
      };
      saveSingleProductLocally(updatedProd);
      setProductList(prev => prev.map(prod => prod.productId === p.productId ? updatedProd : prod));
      await CMSService.logActivity(adminUid, adminEmail, 'TOGGLE_PRODUCT', 'Products', `Toggled ${p.name}`).catch(() => {});
      onRefreshProducts();
    } catch (err: any) {
      console.error('Failed to update product status:', err);
      setActionError(err.message || 'Failed to toggle product status in database.');
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (!confirm(`Are you sure you want to delete "${p.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'products', p.productId));
      deleteSingleProductLocally(p.productId);
      setProductList(prev => prev.filter(prod => prod.productId !== p.productId));
      await CMSService.logActivity(adminUid, adminEmail, 'DELETE_PRODUCT', 'Products', `Deleted ${p.name}`).catch(() => {});
      setActionSuccess(`Product "${p.name}" deleted successfully.`);
      onRefreshProducts();
    } catch (err: any) {
      console.error('Failed to delete product from database:', err);
      setActionError(err.message || 'Failed to delete product from database.');
    }
  };

  // ---------------- OTHER CMS HANDLERS ----------------
  const handleSaveHomepageCMS = async () => {
    setSavingCMS(true);
    setActionError(null);
    try {
      await CMSService.saveHomepageConfig(homepageCMS, adminEmail, adminUid);
      setActionSuccess('Homepage CMS published successfully! Frontend reflects changes immediately.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to save homepage CMS.');
    } finally {
      setSavingCMS(false);
    }
  };

  const handleSaveHeaderConfig = async () => {
    setSavingCMS(true);
    try {
      await CMSService.saveHeaderConfig(headerConfig, adminEmail, adminUid);
      setActionSuccess('Header & Navigation updated.');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSavingCMS(false);
    }
  };

  const handleSaveFooterConfig = async () => {
    setSavingCMS(true);
    try {
      await CMSService.saveFooterConfig(footerConfig, adminEmail, adminUid);
      setActionSuccess('Footer configuration updated.');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSavingCMS(false);
    }
  };

  const handleSaveThemeConfig = async () => {
    setSavingCMS(true);
    try {
      await CMSService.saveThemeConfig(themeConfig, adminEmail, adminUid);
      setActionSuccess('Theme & Appearance saved.');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSavingCMS(false);
    }
  };

  const handleSaveSEOSettings = async () => {
    setSavingCMS(true);
    try {
      await CMSService.saveSEOSettings(seoSettings, adminEmail, adminUid);
      setActionSuccess('SEO and meta tags saved.');
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSavingCMS(false);
    }
  };

  // ---------------- PAGE HANDLERS WITH AUTO-SLUG ----------------
  const handlePageTitleChange = (val: string) => {
    setPageTitle(val);
    if (!pageIsSlugCustom) {
      const candidate = generateSlug(val);
      const unique = resolveUniqueSlug(candidate, customPages.map(p => p.slug), editingPage?.slug);
      setPageSlug(unique);
    }
  };

  const handlePageSlugChange = (val: string) => {
    setPageSlug(val);
    setPageIsSlugCustom(true);
  };

  const handleRegeneratePageSlug = () => {
    const candidate = generateSlug(pageTitle);
    const unique = resolveUniqueSlug(candidate, customPages.map(p => p.slug), editingPage?.slug);
    setPageSlug(unique);
    setPageIsSlugCustom(false);
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle.trim()) {
      setActionError('Page title is required.');
      return;
    }
    try {
      const baseSlug = normalizeSlug(pageSlug) || generateSlug(pageTitle);
      const uniqueSlug = resolveUniqueSlug(baseSlug, customPages.map(p => p.slug), editingPage?.slug);

      const payload: CustomPage = {
        pageId: editingPage?.pageId || uniqueSlug,
        slug: uniqueSlug,
        title: pageTitle.trim(),
        content: pageContent,
        featuredImageUrl: pageFeaturedImage.trim() || undefined,
        seoTitle: pageSeoTitle.trim() || undefined,
        metaTitle: pageSeoTitle.trim() || undefined,
        metaDescription: pageMetaDesc.trim() || undefined,
        isPublished: pagePublished,
        showInHeader: pageShowInHeader,
        showInFooter: pageShowInFooter,
        order: editingPage ? editingPage.order : customPages.length + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail,
      };

      await CMSService.savePage(payload, adminEmail, adminUid);
      setShowPageModal(false);
      setActionSuccess(`Page "${payload.title}" saved successfully (/pages/${payload.slug}).`);
      const updated = await CMSService.getPages();
      setCustomPages(updated);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save page.');
    }
  };

  const handleDeletePage = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete page "/pages/${slug}"? This cannot be undone.`)) return;
    try {
      await CMSService.deletePage(slug, adminEmail, adminUid);
      setActionSuccess(`Page "/pages/${slug}" deleted.`);
      const updated = await CMSService.getPages();
      setCustomPages(updated);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete page.');
    }
  };

  const handleCopyPageUrl = (slug: string) => {
    const { fullUrl } = buildPublicUrl('page', slug);
    navigator.clipboard.writeText(fullUrl).then(() => {
      setPageCopiedSlug(slug);
      setTimeout(() => setPageCopiedSlug(null), 2500);
    });
  };

  // ---------------- BLOG POST HANDLERS WITH AUTO-SLUG ----------------
  const handlePostTitleChange = (val: string) => {
    setPostTitle(val);
    if (!postIsSlugCustom) {
      const candidate = generateSlug(val);
      const unique = resolveUniqueSlug(candidate, blogPosts.map(p => p.slug), editingBlogPost?.slug);
      setPostSlug(unique);
    }
  };

  const handlePostSlugChange = (val: string) => {
    setPostSlug(val);
    setPostIsSlugCustom(true);
  };

  const handleRegeneratePostSlug = () => {
    const candidate = generateSlug(postTitle);
    const unique = resolveUniqueSlug(candidate, blogPosts.map(p => p.slug), editingBlogPost?.slug);
    setPostSlug(unique);
    setPostIsSlugCustom(false);
  };

  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) {
      setActionError('Post title is required.');
      return;
    }
    try {
      const baseSlug = normalizeSlug(postSlug) || generateSlug(postTitle);
      const uniqueSlug = resolveUniqueSlug(baseSlug, blogPosts.map(p => p.slug), editingBlogPost?.slug);
      const postId = editingBlogPost?.postId || `post_${Date.now()}`;

      const payload: BlogPost = {
        postId,
        slug: uniqueSlug,
        title: postTitle.trim(),
        bodyContent: postBodyContent,
        excerpt: postExcerpt.trim() || undefined,
        featuredImageUrl: postFeaturedImage.trim() || undefined,
        author: postAuthor.trim() || 'RONVEX Editorial',
        publicationDate: postPublicationDate || new Date().toISOString().split('T')[0],
        category: postCategory.trim() || 'Guides',
        tags: postTags ? postTags.split(',').map(t => t.trim()).filter(Boolean) : [],
        seoTitle: postSeoTitle.trim() || undefined,
        metaDescription: postMetaDesc.trim() || undefined,
        isPublished: postPublished,
        createdAt: editingBlogPost ? editingBlogPost.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail,
      };

      await BlogService.savePost(payload, adminEmail, adminUid);
      setShowBlogPostModal(false);
      setActionSuccess(`Blog post "${payload.title}" saved successfully (/blog/${payload.slug}).`);
      const updated = await BlogService.getPosts();
      setBlogPosts(updated);
    } catch (err: any) {
      setActionError(err.message || 'Failed to save blog post.');
    }
  };

  const handleDeleteBlogPost = async (postId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete post "${title}"?`)) return;
    try {
      await BlogService.deletePost(postId, adminEmail, adminUid);
      setActionSuccess(`Blog post removed.`);
      const updated = await BlogService.getPosts();
      setBlogPosts(updated);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete blog post.');
    }
  };

  const handleCopyPostUrl = (slug: string) => {
    const { fullUrl } = buildPublicUrl('post', slug);
    navigator.clipboard.writeText(fullUrl).then(() => {
      setPostCopiedSlug(slug);
      setTimeout(() => setPostCopiedSlug(null), 2500);
    });
  };

  const handleGenerateSitemap = () => {
    const xml = generateSitemapXml(productList, customPages, blogPosts);
    setSitemapXmlContent(xml);
    setShowSitemapModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newCoupon: Coupon = {
        couponId: `coup_${Date.now()}`,
        code: couponCode.trim().toUpperCase(),
        discountType: couponType,
        discountAmount: Number(couponAmount),
        minOrderAmount: Number(couponMinOrder),
        startDate: new Date().toISOString().split('T')[0],
        endDate: couponEndDate,
        usageCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await CMSService.saveCoupon(newCoupon, adminEmail, adminUid);
      setShowCouponModal(false);
      setActionSuccess(`Coupon ${newCoupon.code} created.`);
      const c = await CMSService.getCoupons();
      setCoupons(c);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleSaveMediaAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const asset: MediaAsset = {
        id: `med_${Date.now()}`,
        title: mediaTitle.trim(),
        url: mediaUrl.trim(),
        category: mediaCategory,
        altText: mediaTitle.trim(),
        uploadedAt: new Date().toISOString(),
        uploadedBy: adminEmail,
      };
      await CMSService.saveMediaAsset(asset, adminEmail, adminUid);
      setShowMediaModal(false);
      setActionSuccess(`Media asset "${asset.title}" added to library.`);
      const m = await CMSService.getMediaAssets();
      setMediaAssets(m);
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await OrderService.updateOrderStatus({
        orderId: selectedOrder.orderId,
        newStatus: orderNewStatus,
        changedBy: adminUid,
        changedByName: adminRecord?.displayName || adminEmail,
        note: statusNote.trim() || undefined,
        courier: courierTracking.trim()
          ? {
              company: courierCompany,
              trackingNumber: courierTracking.trim(),
            }
          : undefined,
      });
      await CMSService.logActivity(adminUid, adminEmail, 'UPDATE_ORDER_STATUS', 'Orders', `Updated order #${selectedOrder.orderNumber}`);
      setSelectedOrder(null);
      setActionSuccess(`Order #${selectedOrder.orderNumber} updated to ${orderNewStatus}.`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update order status');
    }
  };

  const handleApproveApplication = async () => {
    if (!selectedApp) return;
    try {
      await AffiliateService.approveApplication({
        applicationId: selectedApp.applicationId,
        affiliateSlug: assignedSlug.trim(),
        reviewedBy: adminRecord?.displayName || adminEmail,
        reviewNote: reviewNote.trim() || 'Approved partner',
      });
      await CMSService.logActivity(adminUid, adminEmail, 'APPROVE_AFFILIATE', 'Affiliates', `Approved affiliate: ${assignedSlug}`);
      setSelectedApp(null);
      setActionSuccess(`Affiliate approved with storefront slug: @${assignedSlug.trim()}`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve application');
    }
  };

  const handleMarkPayoutPaid = async () => {
    if (!selectedPayout || !paymentRefCode.trim()) return;
    try {
      await PayoutService.markPayoutPaid({
        payoutId: selectedPayout.payoutId,
        adminUid,
        paymentReference: paymentRefCode.trim(),
        notes: `Transfer confirmed via ${selectedPayout.paymentMethod.toUpperCase()}`,
      });
      await CMSService.logActivity(adminUid, adminEmail, 'MARK_PAYOUT_PAID', 'Finance', `Processed payout ${selectedPayout.payoutId}`);
      setSelectedPayout(null);
      setActionSuccess(`Payout marked as PAID. Reference: ${paymentRefCode.trim()}`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to process payout');
    }
  };

  // Metrics
  const totalRevenue = orders.filter(o => o.orderStatus === 'DELIVERED').reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING').length;
  const pendingApps = applications.filter(a => a.applicationStatus === 'PENDING').length;
  const pendingPayouts = payouts.filter(p => p.status === 'REQUESTED' || p.status === 'APPROVED').length;
  const totalAffiliates = affiliates.length;

  // Filtered Orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      orderSearch === '' ||
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerDetails.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerDetails.phone.includes(orderSearch);
    const matchesStatus = orderStatusFilter === 'ALL' || o.orderStatus === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Products
  const filteredProducts = productList.filter(p =>
    productSearch === '' ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Grouped Navigation for the 25 modules
  const navSections = [
    {
      group: 'Overview & Analytics',
      items: [
        { id: 'overview' as AdminTab, label: 'Executive Overview', icon: Layout },
      ],
    },
    {
      group: 'Website CMS & Builder',
      items: [
        { id: 'website_editor' as AdminTab, label: 'Website Editor / CMS', icon: Globe },
        { id: 'homepage_builder' as AdminTab, label: 'Homepage Builder', icon: Sliders },
        { id: 'pages_content' as AdminTab, label: 'Pages & Content', icon: FileText, badge: customPages.length },
        { id: 'blog_posts' as AdminTab, label: 'Blog Posts', icon: BookOpen, badge: blogPosts.length },
        { id: 'header_nav' as AdminTab, label: 'Header & Navigation', icon: Navigation },
        { id: 'footer_editor' as AdminTab, label: 'Footer Editor', icon: Columns },
        { id: 'theme_appearance' as AdminTab, label: 'Theme & Appearance', icon: Palette },
        { id: 'media_library' as AdminTab, label: 'Media & Images', icon: ImageIcon },
        { id: 'seo_settings' as AdminTab, label: 'SEO Settings', icon: Tag },
      ],
    },
    {
      group: 'E-Commerce & Catalog',
      items: [
        { id: 'products' as AdminTab, label: 'Products', icon: Package, badge: productList.length },
        { id: 'categories' as AdminTab, label: 'Categories', icon: Filter, badge: categories.length },
        { id: 'orders' as AdminTab, label: 'Orders', icon: ShoppingBag, badge: pendingOrders > 0 ? pendingOrders : undefined },
        { id: 'customers' as AdminTab, label: 'Customers', icon: Users },
        { id: 'delivery_status' as AdminTab, label: 'Delivery & Status', icon: Truck },
        { id: 'coupons' as AdminTab, label: 'Coupons & Promos', icon: Percent },
      ],
    },
    {
      group: 'Affiliates & Commissions',
      items: [
        { id: 'applications' as AdminTab, label: 'Affiliate Applications', icon: UserCheck, badge: pendingApps > 0 ? pendingApps : undefined },
        { id: 'affiliates' as AdminTab, label: 'Affiliate Directory', icon: Users, badge: totalAffiliates },
        { id: 'affiliate_storefronts' as AdminTab, label: 'Affiliate Storefronts', icon: ExternalLink },
        { id: 'commissions' as AdminTab, label: 'Commissions', icon: DollarSign },
        { id: 'targets_bonuses' as AdminTab, label: 'Sales Targets & Bonuses', icon: Target },
        { id: 'payouts' as AdminTab, label: 'Payout Requests', icon: Wallet, badge: pendingPayouts > 0 ? pendingPayouts : undefined },
      ],
    },
    {
      group: 'System & Governance',
      items: [
        { id: 'contact_messages' as AdminTab, label: 'Contact Messages', icon: Mail },
        { id: 'admin_users' as AdminTab, label: 'Admin Users & Roles', icon: ShieldCheck },
        { id: 'activity_logs' as AdminTab, label: 'Activity Logs', icon: History },
        { id: 'general_settings' as AdminTab, label: 'General Settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* Top Admin Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="flex items-center gap-2 hover:opacity-85 transition-opacity text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-serif font-black text-sm">
              R
            </div>
            <div>
              <span className="font-extrabold font-serif tracking-tight text-white text-base">RONVEX</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] tracking-wider uppercase text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                Operations Hub
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Public Store</span>
          </button>

          {onOpenDiagnostics && (
            <button
              type="button"
              onClick={onOpenDiagnostics}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Diagnostic Tests</span>
            </button>
          )}

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">
                {adminRecord?.displayName || 'Administrator'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentUser.email}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Secure Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace (Sidebar + Workspace Container) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {navSections.map(sec => (
              <div key={sec.group}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
                  {sec.group}
                </div>
                <div className="space-y-1">
                  {sec.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setActionSuccess(null);
                          setActionError(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                          isActive
                            ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Workspace Area */}
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6 lg:p-8 space-y-6">
          {/* Notification Banners */}
          {actionSuccess && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{actionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionSuccess(null)}
                className="text-xs text-emerald-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {actionError && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-800/80 text-rose-200 rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{actionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="text-xs text-rose-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Platform Operations Dashboard</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Real-time transaction health, affiliate commissions, and content management
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchAllData}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Realtime Stats</span>
                </button>
              </div>

              {/* Metric KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-medium">Delivered Gross Revenue</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                    ৳{totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Confirmed delivered orders</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-medium">Active Catalog Products</div>
                  <div className="text-2xl font-bold text-white mt-2">
                    {productList.length} Items
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {productList.filter(p => p.isActive).length} published online
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-medium">Affiliate Applications</div>
                  <div className="text-2xl font-bold text-amber-400 mt-2">
                    {pendingApps} Pending
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{totalAffiliates} active partners</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-medium">Weekly Payout Queue</div>
                  <div className="text-2xl font-bold text-blue-400 mt-2">
                    {pendingPayouts} Pending
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Wednesday manual settlements</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={openAddProductModal}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-2xl text-left transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Add New Product</div>
                    <div className="text-[11px] text-slate-400">Expand catalog offering</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={openAddCategoryModal}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-2xl text-left transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Add New Category</div>
                    <div className="text-[11px] text-slate-400">Organize merchandise</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('homepage_builder')}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-2xl text-left transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Customize Homepage</div>
                    <div className="text-[11px] text-slate-400">Update live storefront CMS</div>
                  </div>
                </button>
              </div>

              {/* Recent Orders quick table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Recent Customer Orders</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    View All Orders →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                      <tr>
                        <th className="p-3">Order #</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Total</th>
                        <th className="p-3">Method</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Affiliate Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.orderId} className="hover:bg-slate-900/50">
                          <td className="p-3 font-mono font-bold text-white">{o.orderNumber}</td>
                          <td className="p-3">{o.customerDetails.fullName} ({o.customerDetails.phone})</td>
                          <td className="p-3 font-mono text-emerald-400">৳{o.total.toLocaleString()}</td>
                          <td className="p-3 font-mono">{o.paymentMethod}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold rounded-md">
                              {o.orderStatus}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">
                            {o.affiliateSlug ? `@${o.affiliateSlug}` : 'Direct Retail'}
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No orders recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. WEBSITE EDITOR / CMS */}
          {activeTab === 'website_editor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Website Content Management System</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Control live customer-facing storefront content, announcements, and promotional copy.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateHome()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Storefront</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveHomepageCMS}
                    disabled={savingCMS}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-2 shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingCMS ? 'Publishing...' : 'Publish Live to Website'}</span>
                  </button>
                </div>
              </div>

              {/* Publishing Status Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-xl flex items-center justify-center text-emerald-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Public Storefront Status</span>
                      <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-700/60">
                        {homepageCMS.isPublished ? 'LIVE & PUBLISHED' : 'DRAFT MODE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Last published: {new Date(homepageCMS.updatedAt).toLocaleString()} by {homepageCMS.updatedBy || 'Super Admin'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHomepageCMS({ ...homepageCMS, isPublished: !homepageCMS.isPublished });
                    }}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                      homepageCMS.isPublished
                        ? 'bg-amber-950/60 border-amber-800/80 text-amber-300 hover:bg-amber-900/50'
                        : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/50'
                    }`}
                  >
                    {homepageCMS.isPublished ? 'Switch to Draft Mode' : 'Set to Live Published'}
                  </button>
                </div>
              </div>

              {/* CMS Navigation Jump Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('homepage_builder')}
                  className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-left hover:border-emerald-600 transition-colors group"
                >
                  <Sliders className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Homepage Builder</div>
                  <p className="text-xs text-slate-400 mt-1">Edit Hero banners, headlines, featured items, and trust badges</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('pages_content')}
                  className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-left hover:border-emerald-600 transition-colors group"
                >
                  <FileText className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Pages & Content</div>
                  <p className="text-xs text-slate-400 mt-1">Manage About Us, Terms, Privacy, FAQ, and Shipping policies</p>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('header_nav')}
                  className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-left hover:border-emerald-600 transition-colors group"
                >
                  <Navigation className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-bold text-white">Navigation & Footer</div>
                  <p className="text-xs text-slate-400 mt-1">Customize menus, announcement banners, contact info, and links</p>
                </button>
              </div>
            </div>
          )}

          {/* 3. HOMEPAGE BUILDER */}
          {activeTab === 'homepage_builder' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Homepage Visual Builder</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Edit hero typography, banner images, promotional sections, and partner callouts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveHomepageCMS}
                  disabled={savingCMS}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCMS ? 'Saving...' : 'Save & Publish Homepage'}</span>
                </button>
              </div>

              {/* Hero Section */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">Hero Section</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Badge Text</label>
                    <input
                      type="text"
                      value={homepageCMS.hero.badgeText}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, badgeText: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Subtitle / Brand Moniker</label>
                    <input
                      type="text"
                      value={homepageCMS.hero.subtitle}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, subtitle: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Primary Hero Headline</label>
                    <input
                      type="text"
                      value={homepageCMS.hero.title}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, title: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-serif text-sm"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Description Paragraph</label>
                    <textarea
                      rows={3}
                      value={homepageCMS.hero.description}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, description: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Primary CTA Button Label</label>
                    <input
                      type="text"
                      value={homepageCMS.hero.primaryButtonText}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, primaryButtonText: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Primary CTA Target URL</label>
                    <input
                      type="text"
                      value={homepageCMS.hero.primaryButtonUrl}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, primaryButtonUrl: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Secondary Button Label</label>
                    <input
                      type="text"
                      value={homepageCMS.hero.secondaryButtonText}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, secondaryButtonText: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Secondary Button Target URL</label>
                    <input
                      type="text"
                      value={homepageCMS.hero.secondaryButtonUrl}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        hero: { ...homepageCMS.hero, secondaryButtonUrl: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Promotional Banner Bar */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h2 className="text-sm font-bold text-white">Top Announcement & Free Delivery Banner</h2>
                  <input
                    type="checkbox"
                    checked={homepageCMS.promoBanner.enabled}
                    onChange={e => setHomepageCMS({
                      ...homepageCMS,
                      promoBanner: { ...homepageCMS.promoBanner, enabled: e.target.checked },
                    })}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Banner Text</label>
                    <input
                      type="text"
                      value={homepageCMS.promoBanner.text}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        promoBanner: { ...homepageCMS.promoBanner, text: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Highlighted Accent Text</label>
                    <input
                      type="text"
                      value={homepageCMS.promoBanner.highlightText}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        promoBanner: { ...homepageCMS.promoBanner, highlightText: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Affiliate Promotion Block */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
                  Affiliate Program Promotional Section
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Badge</label>
                    <input
                      type="text"
                      value={homepageCMS.affiliatePromo.badge}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        affiliatePromo: { ...homepageCMS.affiliatePromo, badge: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={homepageCMS.affiliatePromo.title}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        affiliatePromo: { ...homepageCMS.affiliatePromo, title: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-serif"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={homepageCMS.affiliatePromo.description}
                      onChange={e => setHomepageCMS({
                        ...homepageCMS,
                        affiliatePromo: { ...homepageCMS.affiliatePromo, description: e.target.value },
                      })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. PAGES & CONTENT */}
          {activeTab === 'pages_content' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Pages & Policies Management</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage static policy pages, About Us, Contact, and custom information pages with automatic SEO slugs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPage(null);
                    setPageTitle('');
                    setPageSlug('');
                    setPageIsSlugCustom(false);
                    setPageContent('');
                    setPageFeaturedImage('');
                    setPageSeoTitle('');
                    setPageMetaDesc('');
                    setPagePublished(true);
                    setPageShowInFooter(true);
                    setPageShowInHeader(false);
                    setShowPageModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Page</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Page Title</th>
                      <th className="p-3.5">Public URL & Slug</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Placement</th>
                      <th className="p-3.5">Last Updated</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customPages.map(page => {
                      const urls = buildPublicUrl('page', page.slug);
                      const isCopied = pageCopiedSlug === page.slug;
                      return (
                        <tr key={page.slug} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{page.title}</div>
                            {page.seoTitle && page.seoTitle !== page.title && (
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">
                                SEO: {page.seoTitle}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-mono text-emerald-400 text-xs">
                              <span>/pages/{page.slug}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyPageUrl(page.slug)}
                                title="Copy public link"
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            <div className="text-[10px] text-slate-500">Public Route</div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                page.isPublished
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {page.isPublished ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {page.showInFooter && page.showInHeader
                              ? 'Header & Footer'
                              : page.showInFooter
                              ? 'Footer Only'
                              : page.showInHeader
                              ? 'Header Only'
                              : 'Hidden / Standalone'}
                          </td>
                          <td className="p-3.5 text-slate-500 text-[11px]">
                            {new Date(page.updatedAt || Date.now()).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyPageUrl(page.slug)}
                              title="Copy URL"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors inline-block"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={`#pages/${page.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Preview Live Page"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors inline-block"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPage(page);
                                setPageTitle(page.title);
                                setPageSlug(page.slug);
                                setPageIsSlugCustom(true);
                                setPageContent(page.content);
                                setPageFeaturedImage(page.featuredImageUrl || '');
                                setPageSeoTitle(page.seoTitle || page.metaTitle || '');
                                setPageMetaDesc(page.metaDescription || '');
                                setPagePublished(page.isPublished);
                                setPageShowInFooter(page.showInFooter);
                                setPageShowInHeader(page.showInHeader || false);
                                setShowPageModal(true);
                              }}
                              title="Edit Page"
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors inline-block"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePage(page.slug)}
                              title="Delete Page"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors inline-block"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4.5. BLOG POSTS MANAGEMENT */}
          {activeTab === 'blog_posts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Blog Posts & Articles</h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Publish guides, reviews, and e-commerce articles with automatic SEO URL slugs, drafts, and rich metadata
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="#blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Public Blog</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBlogPost(null);
                      setPostTitle('');
                      setPostSlug('');
                      setPostIsSlugCustom(false);
                      setPostExcerpt('');
                      setPostBodyContent('');
                      setPostFeaturedImage('');
                      setPostAuthor('RONVEX Editorial');
                      setPostPublicationDate(new Date().toISOString().split('T')[0]);
                      setPostCategory('Guides');
                      setPostTags('Smartwatch, Audio, Bangladesh');
                      setPostSeoTitle('');
                      setPostMetaDesc('');
                      setPostPublished(true);
                      setShowBlogPostModal(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Post</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={postSearch}
                    onChange={e => setPostSearch(e.target.value)}
                    placeholder="Search posts by title, excerpt, or tag..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={postFilterCategory}
                    onChange={e => setPostFilterCategory(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Guides">Guides</option>
                    <option value="Product Focus">Product Focus</option>
                    <option value="Affiliate Tips">Affiliate Tips</option>
                    <option value="Company News">Company News</option>
                  </select>
                </div>
              </div>

              {/* Blog Posts Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Article</th>
                      <th className="p-3.5">Public URL & Slug</th>
                      <th className="p-3.5">Category & Author</th>
                      <th className="p-3.5">Publication Date</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {blogPosts
                      .filter(post => {
                        const matchesSearch =
                          postSearch === '' ||
                          post.title.toLowerCase().includes(postSearch.toLowerCase()) ||
                          (post.excerpt && post.excerpt.toLowerCase().includes(postSearch.toLowerCase()));
                        const matchesCategory =
                          postFilterCategory === 'ALL' || post.category === postFilterCategory;
                        return matchesSearch && matchesCategory;
                      })
                      .map(post => {
                        const isCopied = postCopiedSlug === post.slug;
                        return (
                          <tr key={post.postId} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                {post.featuredImageUrl ? (
                                  <img
                                    src={post.featuredImageUrl}
                                    alt={post.title}
                                    className="w-12 h-10 object-cover rounded-lg bg-slate-900 shrink-0 border border-slate-800"
                                  />
                                ) : (
                                  <div className="w-12 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800 text-slate-500">
                                    <BookOpen className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-white max-w-sm truncate">{post.title}</div>
                                  {post.excerpt && (
                                    <div className="text-[10px] text-slate-400 line-clamp-1 max-w-sm mt-0.5">
                                      {post.excerpt}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5 font-mono text-emerald-400 text-xs">
                                <span className="max-w-[160px] truncate">/blog/{post.slug}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyPostUrl(post.slug)}
                                  title="Copy public link"
                                  className="p-1 text-slate-400 hover:text-white transition-colors"
                                >
                                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded text-[10px] font-medium">
                                {post.category || 'General'}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1">{post.author}</div>
                            </td>
                            <td className="p-3.5 text-slate-400 text-[11px]">
                              {new Date(post.publicationDate || post.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  post.isPublished
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {post.isPublished ? 'PUBLISHED' : 'DRAFT'}
                              </span>
                            </td>
                            <td className="p-3.5 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyPostUrl(post.slug)}
                                title="Copy URL"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors inline-block"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <a
                                href={`#blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Preview Live Article"
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors inline-block"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBlogPost(post);
                                  setPostTitle(post.title);
                                  setPostSlug(post.slug);
                                  setPostIsSlugCustom(true);
                                  setPostExcerpt(post.excerpt || '');
                                  setPostBodyContent(post.bodyContent);
                                  setPostFeaturedImage(post.featuredImageUrl || '');
                                  setPostAuthor(post.author || 'RONVEX Editorial');
                                  setPostPublicationDate(post.publicationDate || new Date().toISOString().split('T')[0]);
                                  setPostCategory(post.category || 'Guides');
                                  setPostTags(post.tags ? post.tags.join(', ') : '');
                                  setPostSeoTitle(post.seoTitle || '');
                                  setPostMetaDesc(post.metaDescription || '');
                                  setPostPublished(post.isPublished);
                                  setShowBlogPostModal(true);
                                }}
                                title="Edit Post"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors inline-block"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlogPost(post.postId, post.title)}
                                title="Delete Post"
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors inline-block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. HEADER & NAVIGATION */}
          {activeTab === 'header_nav' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Header & Navigation Menu</h1>
                  <p className="text-xs text-slate-400 mt-1">Configure global top bar, brand wordmark, and menu links</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveHeaderConfig}
                  disabled={savingCMS}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Header Config</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Brand Wordmark</label>
                    <input
                      type="text"
                      value={headerConfig.brandName}
                      onChange={e => setHeaderConfig({ ...headerConfig, brandName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={headerConfig.supportPhone}
                      onChange={e => setHeaderConfig({ ...headerConfig, supportPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Top Announcement Notice</label>
                    <input
                      type="text"
                      value={headerConfig.topNoticeText}
                      onChange={e => setHeaderConfig({ ...headerConfig, topNoticeText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="text-xs font-bold text-white mb-3">Navigation Menu Links</h3>
                  <div className="space-y-2">
                    {headerConfig.navItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-slate-500 text-xs font-mono">{idx + 1}</span>
                        <input
                          type="text"
                          value={item.label}
                          onChange={e => {
                            const updated = [...headerConfig.navItems];
                            updated[idx].label = e.target.value;
                            setHeaderConfig({ ...headerConfig, navItems: updated });
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="Menu Label"
                        />
                        <input
                          type="text"
                          value={item.url}
                          onChange={e => {
                            const updated = [...headerConfig.navItems];
                            updated[idx].url = e.target.value;
                            setHeaderConfig({ ...headerConfig, navItems: updated });
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                          placeholder="Destination #hash or /url"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. FOOTER EDITOR */}
          {activeTab === 'footer_editor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Footer Editor</h1>
                  <p className="text-xs text-slate-400 mt-1">Configure footer text, address, columns, and copyright notice</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveFooterConfig}
                  disabled={savingCMS}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Footer</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">About Text</label>
                    <textarea
                      rows={2}
                      value={footerConfig.aboutText}
                      onChange={e => setFooterConfig({ ...footerConfig, aboutText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Physical Address</label>
                    <input
                      type="text"
                      value={footerConfig.address}
                      onChange={e => setFooterConfig({ ...footerConfig, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Copyright Text</label>
                    <input
                      type="text"
                      value={footerConfig.copyrightText}
                      onChange={e => setFooterConfig({ ...footerConfig, copyrightText: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 7. THEME & APPEARANCE */}
          {activeTab === 'theme_appearance' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Theme & Appearance</h1>
                  <p className="text-xs text-slate-400 mt-1">Configure brand color palette, font styles, and header accents</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveThemeConfig}
                  disabled={savingCMS}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Theme</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Primary Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.primaryColor}
                        onChange={e => setThemeConfig({ ...themeConfig, primaryColor: e.target.value })}
                        className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeConfig.primaryColor}
                        onChange={e => setThemeConfig({ ...themeConfig, primaryColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Accent Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeConfig.accentColor}
                        onChange={e => setThemeConfig({ ...themeConfig, accentColor: e.target.value })}
                        className="w-8 h-8 rounded-lg bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={themeConfig.accentColor}
                        onChange={e => setThemeConfig({ ...themeConfig, accentColor: e.target.value })}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Heading Typography</label>
                    <select
                      value={themeConfig.fontFamily}
                      onChange={e => setThemeConfig({ ...themeConfig, fontFamily: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                    >
                      <option value="serif">Playfair / Classic Luxury Serif</option>
                      <option value="sans">Inter / Clean Modern Sans</option>
                      <option value="mono">JetBrains / Technical Mono</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 8. MEDIA & IMAGES */}
          {activeTab === 'media_library' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Media & Image Assets</h1>
                  <p className="text-xs text-slate-400 mt-1">Manage image URLs for product listings, marketing banners, and badges</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMediaTitle('');
                    setMediaUrl('');
                    setMediaCategory('product');
                    setShowMediaModal(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Image Asset</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {mediaAssets.map(asset => (
                  <div key={asset.id} className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group">
                    <div className="h-40 bg-slate-900 overflow-hidden relative">
                      <img
                        src={ImageService.resolveProductImage(asset.url, asset.category)}
                        alt={asset.altText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => {
                          (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />
                      <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-xs text-[10px] font-mono text-slate-200 px-2 py-0.5 rounded-full uppercase">
                        {asset.category}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="text-xs font-semibold text-white truncate">{asset.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">{asset.url}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. SEO SETTINGS */}
          {activeTab === 'seo_settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">SEO & Search Optimization</h1>
                  <p className="text-xs text-slate-400 mt-1">Configure search engine titles, descriptions, and OpenGraph share previews</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateSitemap}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>View / Export XML Sitemap</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSEOSettings}
                    disabled={savingCMS}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save SEO Settings</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Global Meta Title</label>
                  <input
                    type="text"
                    value={seoSettings.metaTitle}
                    onChange={e => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Meta Description</label>
                  <textarea
                    rows={3}
                    value={seoSettings.metaDescription}
                    onChange={e => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Keywords</label>
                  <input
                    type="text"
                    value={seoSettings.keywords}
                    onChange={e => setSeoSettings({ ...seoSettings, keywords: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 10. PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Product Catalog Management</h1>
                  <p className="text-xs text-slate-400 mt-1">Manage admin base pricing, maximum affiliate margin caps, and stock</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search catalog..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={openAddProductModal}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Catalog Product</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Admin Base Price</th>
                      <th className="p-3">Affiliate Max Bonus</th>
                      <th className="p-3">Max Retail</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map(p => (
                      <tr key={p.productId} className="hover:bg-slate-900/50">
                        <td className="p-3 flex items-center gap-3">
                          <img
                            src={ImageService.resolveProductImage(p.imageUrls?.[0], p.categoryId)}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-xl bg-slate-900 border border-slate-800 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(p.categoryId);
                            }}
                          />
                          <div>
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">/{p.slug}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">
                            {p.categoryName}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-white">৳{p.adminBasePrice}</td>
                        <td className="p-3 font-mono text-emerald-400">+৳{p.maxAffiliateIncrease}</td>
                        <td className="p-3 font-mono text-slate-300">৳{p.adminBasePrice + p.maxAffiliateIncrease}</td>
                        <td className="p-3 font-mono">{p.stockQuantity}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(p)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                            }`}
                          >
                            {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg inline-block"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-950/40 rounded-lg inline-block"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No products found. Click "Add Catalog Product" above to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 11. CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Product Categories</h1>
                  <p className="text-xs text-slate-400 mt-1">Create and manage storefront merchandise categories</p>
                </div>
                <button
                  type="button"
                  onClick={openAddCategoryModal}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(cat => {
                  const assignedCount = productList.filter(p => p.categoryId === cat.categoryId).length;
                  return (
                    <div key={cat.categoryId} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
                            Slug: {cat.slug}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cat.isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-900 text-slate-500'
                            }`}
                          >
                            {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white">{cat.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cat.description || 'No description provided.'}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          <strong className="text-white font-mono">{assignedCount}</strong> products
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCategoryModal(cat)}
                            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.categoryId)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 hover:bg-rose-950/40 rounded-lg"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 12. ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Customer Orders</h1>
                  <p className="text-xs text-slate-400 mt-1">Review orders, verify customer deliveries, and courier trackings</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Order #</th>
                      <th className="p-3">Customer Details</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Total Amount</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Order Status</th>
                      <th className="p-3">Partner Ref</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredOrders.map(order => (
                      <tr key={order.orderId} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-white">{order.orderNumber}</td>
                        <td className="p-3">
                          <div className="font-semibold text-white">{order.customerDetails.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{order.customerDetails.phone}</div>
                        </td>
                        <td className="p-3">{order.customerDetails.district}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">৳{order.total.toLocaleString()}</td>
                        <td className="p-3">
                          <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold rounded">
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">
                          {order.affiliateSlug ? `@${order.affiliateSlug}` : 'Retail'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderNewStatus(order.orderStatus);
                              setCourierCompany(order.courier?.company || 'Pathao Courier');
                              setCourierTracking(order.courier?.trackingNumber || '');
                              setStatusNote('');
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 13. CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Customer Directory</h1>
                <p className="text-xs text-slate-400 mt-1">Registered clients and verified order placements</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3">Contact Phone</th>
                      <th className="p-3">Address</th>
                      <th className="p-3">District</th>
                      <th className="p-3">Total Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {Array.from(new Set(orders.map(o => o.customerDetails.phone))).map(phone => {
                      const custOrders = orders.filter(o => o.customerDetails.phone === phone);
                      const latest = custOrders[0];
                      return (
                        <tr key={phone} className="hover:bg-slate-900/50">
                          <td className="p-3 font-semibold text-white">{latest.customerDetails.fullName}</td>
                          <td className="p-3 font-mono text-emerald-400">{phone}</td>
                          <td className="p-3 text-slate-400">{latest.customerDetails.address}</td>
                          <td className="p-3">{latest.customerDetails.district}</td>
                          <td className="p-3 font-mono font-bold text-white">{custOrders.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 14. AFFILIATE APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Affiliate Applications</h1>
                <p className="text-xs text-slate-400 mt-1">Review applicant profiles and grant custom storefront slugs</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Applicant Name</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Marketing Experience</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {applications.map(app => (
                      <tr key={app.applicationId} className="hover:bg-slate-900/50">
                        <td className="p-3 font-semibold text-white">{app.fullName}</td>
                        <td className="p-3 font-mono">{app.phone}</td>
                        <td className="p-3 font-mono text-slate-400">{app.email}</td>
                        <td className="p-3 text-slate-400 max-w-xs truncate">{app.marketingExperience || 'None specified'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            app.applicationStatus === 'PENDING' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {app.applicationStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {app.applicationStatus === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedApp(app);
                                setAssignedSlug(app.fullName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'));
                                setReviewNote('Approved partner with verified social following');
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 15. AFFILIATES */}
          {activeTab === 'affiliates' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Affiliate Partner Directory</h1>
                <p className="text-xs text-slate-400 mt-1">Verified partner network, payout accounts, and storefront links</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {affiliates.map(aff => (
                  <div key={aff.affiliateId} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400 font-bold">@{aff.affiliateSlug}</span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-bold rounded">
                        {aff.accountStatus}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{aff.displayName}</div>
                      <div className="text-xs text-slate-400">{aff.email}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-900 text-xs text-slate-500 space-y-1">
                      <div>Payout Method: <strong className="text-slate-300 uppercase">{aff.payoutMethod || 'bKash'}</strong></div>
                      <div>Account: <span className="font-mono text-slate-300">{aff.payoutAccountNumber || '017XXXXXXXX'}</span></div>
                    </div>
                    <a
                      href={`#store/${aff.affiliateSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Partner Storefront</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 16. AFFILIATE STOREFRONTS */}
          {activeTab === 'affiliate_storefronts' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Affiliate Storefronts</h1>
                <p className="text-xs text-slate-400 mt-1">Dedicated storefront landing pages for approved partners</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <p className="text-xs text-slate-300">
                  Every approved affiliate partner receives a dedicated storefront URL at <code className="text-emerald-400 font-mono">#store/:slug</code>. When shoppers purchase via this storefront, pricing engine automatically applies partner-selected margins and binds 30-day attribution.
                </p>

                <div className="space-y-2">
                  {affiliates.map(a => (
                    <div key={a.affiliateId} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-white">{a.displayName}</div>
                        <div className="text-[11px] font-mono text-slate-400">#store/{a.affiliateSlug}</div>
                      </div>
                      <a
                        href={`#store/${a.affiliateSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <span>Visit Store</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 17. COMMISSIONS */}
          {activeTab === 'commissions' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Affiliate Commissions Ledger</h1>
                <p className="text-xs text-slate-400 mt-1">Audited commissions from delivered orders</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Order Number</th>
                      <th className="p-3">Affiliate ID</th>
                      <th className="p-3">Commission Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Generated Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {commissions.map(c => (
                      <tr key={c.commissionId} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-white">{c.orderNumber || c.orderId}</td>
                        <td className="p-3 font-mono text-slate-400">{c.affiliateId}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">৳{c.amount}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold rounded">
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {commissions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No commissions generated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 18. TARGETS & BONUSES */}
          {activeTab === 'targets_bonuses' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Monthly Sales Targets & Bonuses</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Default target: ৳100,000 delivered sales = ৳800 bonus reward
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Monthly Sales Target</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">৳100,000</div>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Target Bonus Reward</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">৳800</div>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400">Qualifying Window</div>
                    <div className="text-xl font-bold text-slate-200 mt-1">Calendar Month</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 19. PAYOUT REQUESTS */}
          {activeTab === 'payouts' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Wednesday Payout Settlements</h1>
                <p className="text-xs text-slate-400 mt-1">Manual disbursement queue via bKash, Nagad, and Bank</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Payout ID</th>
                      <th className="p-3">Affiliate</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Account Number</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payouts.map(p => (
                      <tr key={p.payoutId} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono font-bold text-white">{p.payoutId}</td>
                        <td className="p-3">{p.affiliateName || p.affiliateId}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">৳{p.requestedAmount}</td>
                        <td className="p-3 font-mono uppercase">{p.paymentMethod}</td>
                        <td className="p-3 font-mono">{p.payoutDetails.accountNumber}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'PAID' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {p.status !== 'PAID' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPayout(p);
                                setPaymentRefCode(`TRX_${Date.now()}`);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                            >
                              Process Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payouts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">
                          No pending payout requests.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 20. DELIVERY & ORDER STATUS */}
          {activeTab === 'delivery_status' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Delivery Logistics & Courier Tracking</h1>
                <p className="text-xs text-slate-400 mt-1">Configure courier partners (Pathao, Steadfast) and tracking numbers</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">Inside Dhaka Delivery Charge</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">৳80</div>
                    <div className="text-[11px] text-slate-500 mt-1">Standard timeline: 24-48 hours</div>
                  </div>
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="text-xs text-slate-400 font-medium">Outside Dhaka Delivery Charge</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">৳150</div>
                    <div className="text-[11px] text-slate-500 mt-1">Steadfast / Pathao Nationwide Courier</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 21. COUPONS & PROMOTIONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Coupons & Promo Codes</h1>
                  <p className="text-xs text-slate-400 mt-1">Create promotional discount codes with custom rules</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCouponModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Coupon</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {coupons.map(coup => (
                  <div key={coup.couponId} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono font-black text-emerald-400 tracking-wider">{coup.code}</span>
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-bold rounded">
                        {coup.discountType === 'PERCENTAGE' ? `${coup.discountAmount}% OFF` : `৳${coup.discountAmount} OFF`}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Minimum Order: <strong className="text-white font-mono">৳{coup.minOrderAmount}</strong>
                    </div>
                    <div className="text-xs text-slate-500">
                      Valid until: {coup.endDate} · Used: {coup.usageCount} times
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 22. CONTACT MESSAGES */}
          {activeTab === 'contact_messages' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white">Customer Support Inquiries</h1>
                <p className="text-xs text-slate-400 mt-1">Direct inquiries submitted via the public Contact Us page</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">From</th>
                      <th className="p-3">Email & Phone</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {contactMessages.map(msg => (
                      <tr key={msg.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-semibold text-white">{msg.fullName}</td>
                        <td className="p-3 font-mono text-slate-400">{msg.email} {msg.phone ? `(${msg.phone})` : ''}</td>
                        <td className="p-3 font-medium text-slate-200">{msg.subject}</td>
                        <td className="p-3 text-slate-400 max-w-sm truncate">{msg.message}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-bold rounded">
                            {msg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {contactMessages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No customer contact messages received yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 23. ADMIN USERS & PERMISSIONS */}
          {activeTab === 'admin_users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Admin Users & Access Control</h1>
                  <p className="text-xs text-slate-400 mt-1">Authorized operator registry stored in Firestore</p>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Administrator</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {adminUsers.map(u => (
                      <tr key={u.uid} className="hover:bg-slate-900/50">
                        <td className="p-3 font-semibold text-white">{u.displayName}</td>
                        <td className="p-3 font-mono text-emerald-400">{u.email}</td>
                        <td className="p-3 font-mono text-xs uppercase text-slate-300">{u.role}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[10px] font-bold rounded">
                            {u.isActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 24. ACTIVITY LOGS */}
          {activeTab === 'activity_logs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">Security & Audit Activity Logs</h1>
                  <p className="text-xs text-slate-400 mt-1">Immutable trace of all administrative operations</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const logs = await CMSService.getActivityLogs(50);
                    setActivityLogs(logs);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-xl"
                >
                  Refresh Logs
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Module</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activityLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{log.action}</td>
                        <td className="p-3 text-slate-300">{log.module}</td>
                        <td className="p-3 font-mono text-slate-400">{log.adminEmail}</td>
                        <td className="p-3 text-slate-300">{log.details}</td>
                      </tr>
                    ))}
                    {activityLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 25. GENERAL SETTINGS */}
          {activeTab === 'general_settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold font-serif text-white">General Platform Settings</h1>
                  <p className="text-xs text-slate-400 mt-1">Configure global store constants, currency symbols, and delivery rules</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await setDoc(doc(db, 'settings', 'platform'), platformSettings);
                      await CMSService.logActivity(adminUid, adminEmail, 'UPDATE_SETTINGS', 'Settings', 'Updated platform general settings');
                      setActionSuccess('Platform settings saved successfully.');
                    } catch (err: any) {
                      setActionError(err.message);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-xl flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Currency Code</label>
                    <input
                      type="text"
                      value={platformSettings.currency}
                      onChange={e => setPlatformSettings({ ...platformSettings, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Currency Symbol</label>
                    <input
                      type="text"
                      value={platformSettings.currencySymbol}
                      onChange={e => setPlatformSettings({ ...platformSettings, currencySymbol: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Delivery Charge Inside Dhaka (৳)</label>
                    <input
                      type="number"
                      value={platformSettings.deliveryChargeInsideDhaka}
                      onChange={e => setPlatformSettings({ ...platformSettings, deliveryChargeInsideDhaka: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Delivery Charge Outside Dhaka (৳)</label>
                    <input
                      type="number"
                      value={platformSettings.deliveryChargeOutsideDhaka}
                      onChange={e => setPlatformSettings({ ...platformSettings, deliveryChargeOutsideDhaka: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Free Delivery Threshold (৳)</label>
                    <input
                      type="number"
                      value={platformSettings.freeDeliveryThreshold}
                      onChange={e => setPlatformSettings({ ...platformSettings, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Attribution Window (Days)</label>
                    <input
                      type="number"
                      value={platformSettings.attributionWindowDays}
                      onChange={e => setPlatformSettings({ ...platformSettings, attributionWindowDays: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Product Add / Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
            <h3 className="text-base font-bold text-white mb-4">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
            </h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Product Title *</label>
                <input
                  type="text"
                  value={prodName}
                  onChange={e => {
                    setProdName(e.target.value);
                    if (!editingProduct) {
                      setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Apex Horizon Titanium Smartwatch"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={prodSlug}
                    onChange={e => setProdSlug(e.target.value)}
                    placeholder="e.g. apex-horizon-smartwatch"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-400">Category *</label>
                    <button
                      type="button"
                      onClick={() => openAddCategoryModal()}
                      className="text-[10px] text-emerald-400 hover:underline"
                    >
                      + New Category
                    </button>
                  </div>
                  <select
                    value={prodCategory}
                    onChange={e => {
                      const selCat = categories.find(c => c.categoryId === e.target.value);
                      setProdCategory(e.target.value);
                      if (selCat) setProdCategoryName(selCat.name);
                    }}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    {categories.map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Admin Base (৳) *</label>
                  <input
                    type="number"
                    value={prodBasePrice}
                    onChange={e => setProdBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Max Bonus Cap (৳) *</label>
                  <input
                    type="number"
                    value={prodMaxIncrease}
                    onChange={e => setProdMaxIncrease(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Stock Units *</label>
                  <input
                    type="number"
                    value={prodStock}
                    onChange={e => setProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>

              {/* Product Image Section with Multi-Photo Gallery, Presets, and File Upload */}
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Product Photography & Multi-Angle Gallery
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {1 + prodAdditionalImages.length} photo(s) total
                  </span>
                </div>

                {/* Primary Image */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400">Primary / Cover Photo *</span>
                  <div className="flex gap-4 items-start">
                    <div className="w-20 h-24 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      <img
                        src={ImageService.resolveProductImage(prodImageUrl, prodCategory)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={e => {
                          (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={prodImageUrl}
                        onChange={e => setProdImageUrl(e.target.value)}
                        placeholder="Paste main image URL (https://... or preset)"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                      />

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Cover</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleProductImageUpload}
                          />
                        </label>
                        <span className="text-[11px] text-slate-500">JPG, PNG, WEBP</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Gallery Photos */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400">Additional Gallery Photos (Angles & Details)</span>
                    <label className="cursor-pointer text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>+ Upload Photos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleAdditionalImagesUpload}
                      />
                    </label>
                  </div>

                  {/* Thumbnail Row of Additional Photos */}
                  {prodAdditionalImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-1">
                      {prodAdditionalImages.map((extraUrl, idx) => (
                        <div
                          key={idx}
                          className="relative w-16 h-20 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden group/img flex items-center justify-center p-0.5"
                        >
                          <img
                            src={ImageService.resolveProductImage(extraUrl, prodCategory)}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setProdAdditionalImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full opacity-80 group-hover/img:opacity-100 transition-opacity"
                            title="Remove Photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick URL adder for extra photo */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="additionalPhotoUrlInput"
                      placeholder="Add another image URL (https://...)"
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.currentTarget.value || '').trim();
                          if (val) {
                            setProdAdditionalImages(prev => [...prev, val]);
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('additionalPhotoUrlInput') as HTMLInputElement | null;
                        if (input && input.value.trim()) {
                          setProdAdditionalImages(prev => [...prev, input.value.trim()]);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Preset image quick clickers */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick Curated Image Presets:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRODUCT_IMAGE_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setProdImageUrl(preset.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                          prodImageUrl === preset.url
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  placeholder="Detail build materials, warranty, battery, and key technical specifications..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Add / Edit Modal (z-[70] so it sits above product modal) */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-3">
              {editingCategory ? 'Edit Product Category' : 'Add New Product Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={catName}
                  onChange={e => {
                    setCatName(e.target.value);
                    if (!editingCategory) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Wireless Audio, Smart Living"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Category Slug</label>
                <input
                  type="text"
                  value={catSlug}
                  onChange={e => setCatSlug(e.target.value)}
                  placeholder="e.g. wireless-audio"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  placeholder="Brief summary of items in this collection..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={catIsActive}
                  onChange={e => setCatIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0"
                />
                <label htmlFor="catActive" className="text-xs text-slate-300">
                  Category is active and visible in catalog filters
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- CUSTOM PAGE MODAL ---------------- */}
      {showPageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingPage ? 'Edit Custom Page' : 'Create New Custom Page'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Static and informational documentation with SEO metadata and draft control
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPageModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Page Title *
                </label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={e => handlePageTitleChange(e.target.value)}
                  placeholder="e.g. Warranty & Quality Assurance"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              {/* Slug URL with auto-generation and live preview */}
              <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    URL Slug
                  </label>
                  <button
                    type="button"
                    onClick={handleRegeneratePageSlug}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    title="Regenerate slug from current title"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Regenerate from Title</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono select-none">/pages/</span>
                  <input
                    type="text"
                    value={pageSlug}
                    onChange={e => handlePageSlugChange(e.target.value)}
                    placeholder="warranty-quality-assurance"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                {/* Live URL Preview */}
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <span className="text-slate-500">Live Preview:</span>
                  <span className="font-mono text-emerald-400">
                    {buildPublicUrl('page', pageSlug || 'my-page').hashPath}
                  </span>
                  {pageIsSlugCustom && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-amber-300 rounded ml-auto">
                      Custom slug
                    </span>
                  )}
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Featured Header Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={pageFeaturedImage}
                  onChange={e => setPageFeaturedImage(e.target.value)}
                  placeholder="https://... or /src/assets/images/..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Page Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Page Content (Markdown / Formatted Text) *
                </label>
                <textarea
                  rows={8}
                  value={pageContent}
                  onChange={e => setPageContent(e.target.value)}
                  placeholder="## Heading&#10;&#10;Write your documentation or policy content here..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-600 leading-relaxed"
                  required
                />
              </div>

              {/* SEO Title & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    SEO Title (Browser & Social Cards)
                  </label>
                  <input
                    type="text"
                    value={pageSeoTitle}
                    onChange={e => setPageSeoTitle(e.target.value)}
                    placeholder="Defaults to page title"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    value={pageMetaDesc}
                    onChange={e => setPageMetaDesc(e.target.value)}
                    placeholder="1-2 sentences for Google search snippet"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Placements and Publication checkboxes */}
              <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pagePublishedCheck"
                    checked={pagePublished}
                    onChange={e => setPagePublished(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="pagePublishedCheck" className="text-xs text-white font-semibold">
                    Publish this page immediately (visible to visitors)
                  </label>
                </div>
                {!pagePublished && (
                  <p className="text-[11px] text-amber-400 pl-5">
                    Page will be saved as Draft. Visitors cannot access it.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-800/80">
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={pageShowInFooter}
                      onChange={e => setPageShowInFooter(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>Show link in footer customer service links</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={pageShowInHeader}
                      onChange={e => setPageShowInHeader(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span>Show in top header menu</span>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPageModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  {editingPage ? 'Update Page' : 'Save & Publish Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- BLOG POST MODAL ---------------- */}
      {showBlogPostModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingBlogPost ? 'Edit Blog Article' : 'Write New Blog Article'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Publish buyer’s guides, reviews, and tech stories with automatic SEO slugs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlogPostModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBlogPost} className="space-y-4">
              {/* Article Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={e => handlePostTitleChange(e.target.value)}
                  placeholder="e.g. Top 5 ANC Earbuds For Commuters in Dhaka"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 font-serif"
                  required
                />
              </div>

              {/* Automatic Slug URL and Live Preview */}
              <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Article URL Slug
                  </label>
                  <button
                    type="button"
                    onClick={handleRegeneratePostSlug}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                    title="Regenerate slug from current article title"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Regenerate from Title</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono select-none">/blog/</span>
                  <input
                    type="text"
                    value={postSlug}
                    onChange={e => handlePostSlugChange(e.target.value)}
                    placeholder="top-5-anc-earbuds-for-commuters-in-dhaka"
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-600"
                    required
                  />
                </div>

                {/* Live URL Preview */}
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <span className="text-slate-500">Live Preview:</span>
                  <span className="font-mono text-emerald-400">
                    {buildPublicUrl('post', postSlug || 'my-article').hashPath}
                  </span>
                  {postIsSlugCustom && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-amber-300 rounded ml-auto">
                      Custom slug
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata Row: Category, Author, Publication Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={postCategory}
                    onChange={e => setPostCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-600"
                  >
                    <option value="Guides">Guides</option>
                    <option value="Product Focus">Product Focus</option>
                    <option value="Affiliate Tips">Affiliate Tips</option>
                    <option value="Company News">Company News</option>
                    <option value="Tech Reviews">Tech Reviews</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={postAuthor}
                    onChange={e => setPostAuthor(e.target.value)}
                    placeholder="e.g. RONVEX Editorial"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={postPublicationDate}
                    onChange={e => setPostPublicationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Featured Image URL */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Featured Cover Image URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={postFeaturedImage}
                    onChange={e => setPostFeaturedImage(e.target.value)}
                    placeholder="https://... or /src/assets/images/..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setPostFeaturedImage(BUNDLED_IMAGES.smartwatch)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded-xl"
                  >
                    Preset 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostFeaturedImage(BUNDLED_IMAGES.earbuds)}
                    className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 rounded-xl"
                  >
                    Preset 2
                  </button>
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Excerpt (Summary for Search & Card Previews)
                </label>
                <textarea
                  rows={2}
                  value={postExcerpt}
                  onChange={e => setPostExcerpt(e.target.value)}
                  placeholder="A concise 1-2 sentence teaser about the article..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Main Body Content */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Article Body (Markdown / Text) *
                </label>
                <textarea
                  rows={9}
                  value={postBodyContent}
                  onChange={e => setPostBodyContent(e.target.value)}
                  placeholder="## Introduction&#10;&#10;Write the full article body with markdown headers, lists, and takeaways..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-600 leading-relaxed"
                  required
                />
              </div>

              {/* Tags & SEO fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={postTags}
                    onChange={e => setPostTags(e.target.value)}
                    placeholder="Smartwatch, Bluetooth, Guide"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">SEO Title (Optional)</label>
                  <input
                    type="text"
                    value={postSeoTitle}
                    onChange={e => setPostSeoTitle(e.target.value)}
                    placeholder="Custom HTML title tag"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Meta Description</label>
                  <input
                    type="text"
                    value={postMetaDesc}
                    onChange={e => setPostMetaDesc(e.target.value)}
                    placeholder="Search snippet description"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Draft toggle */}
              <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Publishing Status</div>
                  <div className="text-[11px] text-slate-400">
                    {postPublished
                      ? 'Post will immediately go live on the public blog.'
                      : 'Saved as Draft (hidden from visitors until published).'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="postPublishedCheck"
                    checked={postPublished}
                    onChange={e => setPostPublished(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="postPublishedCheck" className="text-xs text-slate-300">
                    Publish Live
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBlogPostModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  {editingBlogPost ? 'Update Article' : 'Save & Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- XML SITEMAP MODAL ---------------- */}
      {showSitemapModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">XML Sitemap (Sitemap.xml)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamic sitemap index of active products, published custom pages, and public articles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSitemapModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                <div>
                  <span className="font-semibold">Sitemap Compiled:</span>{' '}
                  {productList.filter(p => p.isActive).length} Products,{' '}
                  {customPages.filter(p => p.isPublished).length} Pages,{' '}
                  {blogPosts.filter(p => p.isPublished).length} Blog Posts.
                  <div className="text-[10px] text-emerald-400 mt-0.5">Drafts and unpublished items are excluded.</div>
                </div>
              </div>

              <textarea
                rows={12}
                readOnly
                value={sitemapXmlContent}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 font-mono select-all focus:outline-none"
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-500">Standard sitemap.xml format</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(sitemapXmlContent);
                      setSitemapCopied(true);
                      setTimeout(() => setSitemapCopied(false), 2000);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {sitemapCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{sitemapCopied ? 'Copied!' : 'Copy Sitemap XML'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([sitemapXmlContent], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'sitemap.xml';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Download sitemap.xml
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-3">Create Promotional Coupon</h3>
            <form onSubmit={handleSaveCoupon} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH20"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Type</label>
                  <select
                    value={couponType}
                    onChange={e => setCouponType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Discount Amount</label>
                  <input
                    type="number"
                    value={couponAmount}
                    onChange={e => setCouponAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Minimum Order Amount (৳)</label>
                <input
                  type="number"
                  value={couponMinOrder}
                  onChange={e => setCouponMinOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCouponModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-3">Add Media Image Asset</h3>
            <form onSubmit={handleSaveMediaAsset} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Asset Title</label>
                <input
                  type="text"
                  value={mediaTitle}
                  onChange={e => setMediaTitle(e.target.value)}
                  placeholder="e.g. Titan Gen-2 Studio Shot"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder="https://... or /images/..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Category</label>
                <select
                  value={mediaCategory}
                  onChange={e => setMediaCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="product">Product</option>
                  <option value="banner">Banner</option>
                  <option value="marketing">Marketing</option>
                  <option value="logo">Logo / Badge</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMediaModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Transition Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-1">
              Transition Order #{selectedOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Update delivery status and assign courier tracking details.
            </p>
            <form onSubmit={handleUpdateOrderStatus} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">New Order Status</label>
                <select
                  value={orderNewStatus}
                  onChange={e => setOrderNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="RETURNED">RETURNED</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Courier Company</label>
                <select
                  value={courierCompany}
                  onChange={e => setCourierCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Pathao Courier">Pathao Courier</option>
                  <option value="Steadfast Courier">Steadfast Courier</option>
                  <option value="Paperfly">Paperfly</option>
                  <option value="RedX">RedX Logistics</option>
                  <option value="RONVEX Express Hub">RONVEX Express Hub</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Courier Consignment / Tracking #</label>
                <input
                  type="text"
                  value={courierTracking}
                  onChange={e => setCourierTracking(e.target.value)}
                  placeholder="e.g. PTH-982341BD"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Transition Note (Optional)</label>
                <input
                  type="text"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched from Dhanmondi hub"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Application Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-1">
              Approve Partner: {selectedApp.fullName}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Assign a unique storefront slug (e.g. @slug) to activate their partner store.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Storefront Slug</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-slate-500">@</span>
                  <input
                    type="text"
                    value={assignedSlug}
                    onChange={e => setAssignedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Approval Note</label>
                <input
                  type="text"
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveApplication}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Process Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-1">
              Confirm Wednesday Settlement
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Disbursing <strong>৳{selectedPayout.requestedAmount}</strong> via {selectedPayout.paymentMethod.toUpperCase()} to {selectedPayout.payoutDetails.accountNumber}.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Bank / MFS Reference Code *</label>
                <input
                  type="text"
                  value={paymentRefCode}
                  onChange={e => setPaymentRefCode(e.target.value)}
                  placeholder="e.g. BKASH_TRX_992138"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkPayoutPaid}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
                >
                  Mark as Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
