import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, testFirestoreConnection } from './services/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Product, ProductCategory, Order } from './types';
import { bootstrapDatabase, INITIAL_PRODUCTS, getLocalProducts, saveLocalProducts } from './services/seedData';
import { CategoryService, DEFAULT_CATEGORIES } from './services/categoryService';
import { AttributionEngine } from './services/pricingEngine';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { DiagnosticModal } from './components/DiagnosticModal';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { AffiliateStorefrontPage } from './pages/AffiliateStorefrontPage';
import { AffiliateRegisterPage } from './pages/AffiliateRegisterPage';
import { AffiliateStatusPage } from './pages/AffiliateStatusPage';
import { AffiliateDashboardPage } from './pages/AffiliateDashboardPage';
import { AdminPortalPage } from './pages/AdminPortalPage';
import { CustomContentPage } from './pages/CustomContentPage';

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
  const [categories, setCategories] = useState<ProductCategory[]>(DEFAULT_CATEGORIES);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Initialize and load products & categories with dual cache persistence
  const loadCatalog = async () => {
    try {
      await bootstrapDatabase();
      const [prodSnap, catList] = await Promise.all([
        getDocs(collection(db, 'products')),
        CategoryService.getCategories(),
      ]);
      const local = getLocalProducts();
      let mergedProducts = local.length > 0 ? [...local] : [...INITIAL_PRODUCTS];

      if (!prodSnap.empty) {
        const firestoreProducts = prodSnap.docs.map(d => d.data() as Product);
        const prodMap = new Map<string, Product>();
        for (const p of INITIAL_PRODUCTS) prodMap.set(p.productId, p);
        for (const p of local) prodMap.set(p.productId, p);
        for (const p of firestoreProducts) prodMap.set(p.productId, p);
        mergedProducts = Array.from(prodMap.values());
      }
      setProducts(mergedProducts);
      saveLocalProducts(mergedProducts);

      if (catList && catList.length > 0) {
        setCategories(catList);
      }
    } catch (err) {
      console.warn('Catalog load fallback to local/initial cache:', err);
      const local = getLocalProducts();
      setProducts(local.length > 0 ? local : INITIAL_PRODUCTS);
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

      // Check specific top-level routes first to avoid route shadowing
      if (hash === 'affiliate/register' || hash === 'affiliate-register' || hash === 'register') {
        setCurrentView('affiliate-register');
        setViewParam(undefined);
      } else if (hash === 'affiliate/dashboard' || hash === 'affiliate-dashboard') {
        setCurrentView('affiliate-dashboard');
        setViewParam(undefined);
      } else if (hash.startsWith('affiliate/status') || hash.startsWith('affiliate-status')) {
        const parts = hash.split('/');
        setCurrentView('affiliate-status');
        if (parts.length > 2) setViewParam(parts[2]);
        else setViewParam(undefined);
      } else if (hash === 'shop') {
        setCurrentView('shop');
        setViewParam(undefined);
      } else if (hash === 'track-order') {
        setCurrentView('track-order');
        setViewParam(undefined);
      } else if (hash === 'admin' || hash === 'admin-portal') {
        setCurrentView('admin-portal');
        setViewParam(undefined);
      } else if (hash.startsWith('store/')) {
        const slug = hash.replace('store/', '');
        setCurrentView('affiliate-storefront');
        setViewParam(slug);
      } else if (hash.startsWith('affiliate/')) {
        const slug = hash.replace('affiliate/', '');
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
      } else if (hash.startsWith('page/')) {
        const slug = hash.replace('page/', '');
        setCurrentView('page');
        setViewParam(slug);
      } else if (hash.startsWith('product/')) {
        const slug = hash.replace('product/', '');
        const p = products.find(prod => prod.slug === slug);
        if (p) {
          setSelectedProduct(p);
          setCurrentView('product-detail');
        }
      } else if (!hash || hash === 'home') {
        setCurrentView('home');
        setViewParam(undefined);
      }
    };

    parseUrl();
    window.addEventListener('hashchange', parseUrl);
    return () => window.removeEventListener('hashchange', parseUrl);
  }, [setActiveAttribution]);

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
    else if (targetView === 'affiliate-storefront' && param) window.location.hash = `store/${param}`;
    else if (targetView === 'track-order') window.location.hash = 'track-order';
    else if (targetView === 'affiliate-status') window.location.hash = param ? `affiliate/status/${param}` : 'affiliate/status';
    else if (targetView === 'affiliate-register') window.location.hash = 'affiliate/register';
    else if (targetView === 'affiliate-dashboard') window.location.hash = 'affiliate/dashboard';
    else if (targetView === 'admin-portal') window.location.hash = 'admin';
    else if (targetView === 'page' && param) window.location.hash = `page/${param}`;
  };

  const handleSelectProduct = (product: Product, customPrice?: number) => {
    setSelectedProduct(product);
    setCustomPriceForSelected(customPrice);
    setCurrentView('product-detail');
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

        {currentView === 'product-detail' && selectedProduct && (
          <ProductDetailPage
            product={selectedProduct}
            allProducts={products}
            customSellingPrice={customPriceForSelected}
            onBack={() => handleNavigate('shop')}
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
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
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
