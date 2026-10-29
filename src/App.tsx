import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, testFirestoreConnection } from './services/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { CompareProvider } from './context/CompareContext';
import { Product, ProductCategory, Order } from './types';
import { bootstrapDatabase, INITIAL_PRODUCTS, getLocalProducts, saveLocalProducts } from './services/seedData';
import { CategoryService, DEFAULT_CATEGORIES, getLocalCategories } from './services/categoryService';
import { AttributionEngine } from './services/pricingEngine';
import { CMSService } from './services/cmsService';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { DiagnosticModal } from './components/DiagnosticModal';
import { WhatsAppButton } from './components/WhatsAppButton';
import { CompareFloatingBar } from './components/CompareFloatingBar';
import { CompareModal } from './components/CompareModal';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { WishlistPage } from './pages/WishlistPage';
import { AffiliateStorefrontPage } from './pages/AffiliateStorefrontPage';
import { AffiliateRegisterPage } from './pages/AffiliateRegisterPage';
import { AffiliateStatusPage } from './pages/AffiliateStatusPage';
import { AffiliateDashboardPage } from './pages/AffiliateDashboardPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { CustomContentPage } from './pages/CustomContentPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { BlogListPage } from './pages/BlogListPage';

function AppContent() {
  const { setActiveAttribution } = useCart();
  const { isAffiliate } = useAuth();
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customPriceForSelected, setCustomPriceForSelected] = useState<number | undefined>(undefined);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    const local = getLocalProducts();
    return local.length > 0 ? local : INITIAL_PRODUCTS;
  });
  const [categories, setCategories] = useState<ProductCategory[]>(() => getLocalCategories());
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Initialize and load products & categories directly from Firestore
  const loadCatalog = async () => {
    try {
      await bootstrapDatabase();
      const [prodSnap, catList] = await Promise.all([
        getDocs(collection(db, 'products')),
        CategoryService.getCategories(),
      ]);

      if (!prodSnap.empty) {
        const firestoreProducts = prodSnap.docs.map(d => d.data() as Product);
        setProducts(firestoreProducts);
        saveLocalProducts(firestoreProducts);
      } else {
        const local = getLocalProducts();
        setProducts(local.length > 0 ? local : INITIAL_PRODUCTS);
      }

      if (catList && catList.length > 0) {
        setCategories(catList);
      }

      // Initialize site logo & browser favicon branding
      await CMSService.getHeaderConfig().catch(() => {});
    } catch (err) {
      console.warn('Catalog load fallback to local/initial cache:', err);
      const local = getLocalProducts();
      setProducts(local.length > 0 ? local : INITIAL_PRODUCTS);
      setCategories(getLocalCategories());
      CMSService.getHeaderConfig().catch(() => {});
    }
  };

  useEffect(() => {
    loadCatalog();

    // Check URL hash & query string attribution
    const parseUrl = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const search = window.location.search;

      // Check ?ref=AFFILIATE_SLUG in search
      const params = new URLSearchParams(search);
      const refParam = params.get('ref');
      if (refParam) {
        AttributionEngine.recordAttribution(refParam, refParam);
        setActiveAttribution({
          affiliateId: refParam,
          affiliateSlug: refParam,
          timestamp: Date.now(),
        });
      }

      // Check URL hash or direct pathname fallback
      let route = hash;
      if (!route) {
        const rawPath = window.location.pathname.replace(/^\//, '');
        if (rawPath) route = rawPath;
      }

      // Check specific top-level routes first to avoid route shadowing
      if (route === 'affiliate/register' || route === 'affiliate-register' || route === 'register') {
        setCurrentView('affiliate-register');
        setViewParam(undefined);
      } else if (route === 'affiliate/dashboard' || route === 'affiliate-dashboard') {
        setCurrentView('affiliate-dashboard');
        setViewParam(undefined);
      } else if (route.startsWith('affiliate/status') || route.startsWith('affiliate-status')) {
        const parts = route.split('/');
        setCurrentView('affiliate-status');
        if (parts.length > 2) setViewParam(parts[2]);
        else setViewParam(undefined);
      } else if (route === 'shop') {
        setCurrentView('shop');
        setViewParam(undefined);
      } else if (route === 'blog') {
        setCurrentView('blog');
        setViewParam(undefined);
      } else if (route.startsWith('blog/')) {
        const slug = route.replace('blog/', '');
        setCurrentView('blog-post');
        setViewParam(slug);
      } else if (route === 'track-order') {
        setCurrentView('track-order');
        setViewParam(undefined);
      } else if (route === 'wishlist' || route === 'my-wishlist') {
        setCurrentView('wishlist');
        setViewParam(undefined);
      } else if (route === 'admin' || route === 'admin-portal') {
        setCurrentView('admin-portal');
        setViewParam(undefined);
      } else if (route.startsWith('store/')) {
        const slug = route.replace('store/', '');
        setCurrentView('affiliate-storefront');
        setViewParam(slug);
      } else if (route.startsWith('affiliate/')) {
        const slug = route.replace('affiliate/', '');
        if (slug === 'register') {
          setCurrentView('affiliate-register');
          setViewParam(undefined);
        } else if (slug === 'dashboard') {
          setCurrentView('affiliate-dashboard');
          setViewParam(undefined);
        } else if (slug.startsWith('status')) {
          setCurrentView('affiliate-status');
          const parts = slug.split('/');
          if (parts.length > 1) setViewParam(parts[1]);
          else setViewParam(undefined);
        } else {
          setCurrentView('affiliate-storefront');
          setViewParam(slug);
        }
      } else if (route.startsWith('pages/')) {
        const slug = route.replace('pages/', '');
        setCurrentView('page');
        setViewParam(slug);
      } else if (route.startsWith('page/')) {
        const slug = route.replace('page/', '');
        setCurrentView('page');
        setViewParam(slug);
      } else if (route.startsWith('product/')) {
        const slug = route.replace('product/', '');
        setCurrentView('product-detail');
        setViewParam(slug);
        const p = products.find(prod => prod.slug === slug || prod.productId === slug);
        if (p) {
          setSelectedProduct(p);
        }
      } else if (!route || route === 'home') {
        setCurrentView('home');
        setViewParam(undefined);
      }
    };

    parseUrl();
    window.addEventListener('hashchange', parseUrl);
    window.addEventListener('popstate', parseUrl);
    return () => {
      window.removeEventListener('hashchange', parseUrl);
      window.removeEventListener('popstate', parseUrl);
    };
  }, [setActiveAttribution, products]);

  // Synchronize product detail view when products load, viewParam changes, or product data is edited
  useEffect(() => {
    if (currentView === 'product-detail' && products.length > 0) {
      const targetIdentifier = viewParam || selectedProduct?.slug || selectedProduct?.productId;
      if (targetIdentifier) {
        const match = products.find(p => p.slug === targetIdentifier || p.productId === targetIdentifier);
        if (match) {
          setSelectedProduct(match);
        }
      }
    }
  }, [currentView, viewParam, products]);

  const handleNavigate = (view: string, param?: string) => {
    let targetView = view;
    if (targetView === 'affiliate-portal') {
      targetView = isAffiliate ? 'affiliate-dashboard' : 'affiliate-register';
    }

    setCurrentView(targetView);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update hash for deep-linking
    if (targetView === 'home') window.location.hash = '';
    else if (targetView === 'shop') window.location.hash = param ? `shop?category=${param}` : 'shop';
    else if (targetView === 'product-detail' && param) window.location.hash = `product/${param}`;
    else if (targetView === 'affiliate-storefront' && param) window.location.hash = `store/${param}`;
    else if (targetView === 'track-order') window.location.hash = 'track-order';
    else if (targetView === 'wishlist') window.location.hash = 'wishlist';
    else if (targetView === 'affiliate-status') window.location.hash = param ? `affiliate/status/${param}` : 'affiliate/status';
    else if (targetView === 'affiliate-register') window.location.hash = 'affiliate/register';
    else if (targetView === 'affiliate-dashboard') window.location.hash = 'affiliate/dashboard';
    else if (targetView === 'admin-portal') window.location.hash = 'admin';
    else if (targetView === 'page' && param) window.location.hash = `pages/${param}`;
    else if (targetView === 'blog') window.location.hash = 'blog';
    else if (targetView === 'blog-post' && param) window.location.hash = `blog/${param}`;
  };

  const handleSelectProduct = (product: Product, customPrice?: number) => {
    const slug = product.slug || product.productId;
    setSelectedProduct(product);
    setCustomPriceForSelected(customPrice);
    setCurrentView('product-detail');
    setViewParam(slug);
    window.location.hash = `product/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (order: Order) => {
    setConfirmedOrder(order);
    setCurrentView('order-confirmation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const affiliateSlugForNavbar = currentView === 'affiliate-storefront' ? viewParam : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-slate-900 selection:text-white">
      {/* Top Header */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        categories={categories}
        affiliateStorefrontSlug={affiliateSlugForNavbar}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            products={products}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'shop' && (
          <ShopPage
            products={products}
            categories={categories}
            initialCategory={viewParam}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'product-detail' && (
          selectedProduct ? (
            <ProductDetailPage
              product={selectedProduct}
              allProducts={products}
              customSellingPrice={customPriceForSelected}
              onBack={() => handleNavigate('shop')}
              onSelectProduct={handleSelectProduct}
              onNavigate={handleNavigate}
            />
          ) : (
            <div className="max-w-4xl mx-auto px-4 py-24 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
              <p className="text-sm font-medium text-slate-700">Loading product details...</p>
              <button
                type="button"
                onClick={() => handleNavigate('shop')}
                className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Return to Shop
              </button>
            </div>
          )
        )}

        {currentView === 'checkout' && (
          <CheckoutPage
            onBack={() => handleNavigate('shop')}
            onOrderSuccess={handleOrderSuccess}
          />
        )}

        {currentView === 'order-confirmation' && confirmedOrder && (
          <OrderConfirmationPage
            order={confirmedOrder}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'track-order' && (
          <TrackOrderPage initialOrderNumber={viewParam} />
        )}

        {currentView === 'wishlist' && (
          <WishlistPage
            onNavigate={handleNavigate}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'affiliate-storefront' && (
          <AffiliateStorefrontPage
            affiliateSlug={viewParam || 'techdeals-bd'}
            products={products}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'affiliate-register' && (
          <AffiliateRegisterPage onNavigate={handleNavigate} />
        )}

        {currentView === 'affiliate-status' && (
          <AffiliateStatusPage onNavigate={handleNavigate} initialQuery={viewParam} />
        )}

        {currentView === 'affiliate-dashboard' && (
          <AffiliateDashboardPage
            products={products}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin-portal' && (
          <AdminPortalPage
            products={products}
            onRefreshProducts={loadCatalog}
            onOpenDiagnostics={() => setShowDiagnostics(true)}
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {currentView === 'page' && (
          <CustomContentPage
            slug={viewParam || 'about-us'}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'blog' && (
          <BlogListPage onNavigate={handleNavigate} />
        )}

        {currentView === 'blog-post' && (
          <BlogPostPage
            slug={viewParam || ''}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer onNavigate={handleNavigate} />

      {/* Diagnostic & Testing Modal */}
      <DiagnosticModal
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
      />

      {/* Footer */}
      <Footer
        onNavigate={handleNavigate}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
      />

      {/* Floating Product Comparison Dock */}
      <CompareFloatingBar onSelectProduct={handleSelectProduct} />

      {/* Side-by-Side Product Comparison Modal */}
      <CompareModal allProducts={products} onSelectProduct={handleSelectProduct} />

      {/* Floating WhatsApp Action Button on Every Page */}
      <WhatsAppButton phoneNumber="01954868068" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CompareProvider>
            <AppContent />
          </CompareProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
