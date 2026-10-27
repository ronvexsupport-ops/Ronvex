import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Zap, Award, Sparkles, Truck, CreditCard, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Product, HomepageCMSConfig } from '../types';
import { ProductCard } from '../components/ProductCard';
import { HeroProductSlider } from '../components/HeroProductSlider';
import { CMSService, DEFAULT_HOMEPAGE_CMS } from '../services/cmsService';
import { applySEO } from '../utils/seoUtils';

interface HomePageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ products, onSelectProduct, onNavigate }) => {
  const [cms, setCms] = useState<HomepageCMSConfig>(DEFAULT_HOMEPAGE_CMS);

  useEffect(() => {
    applySEO({
      title: 'RONVEX',
      seoTitle: 'RONVEX | Premium Lifestyle Tech & E-Commerce Platform',
      metaDescription: 'Shop authentic smartwatches, lawn suits, and precision electronics with Cash on Delivery across Bangladesh.',
      canonicalPath: '/',
    });

    const fetchCMS = async () => {
      try {
        const config = await CMSService.getHomepageConfig();
        if (config) {
          setCms(config);
        }
      } catch (err) {
        console.warn('Error fetching homepage CMS, using defaults:', err);
      }
    };
    fetchCMS();
  }, []);

  const featuredLimit = cms.featuredSection.displayCount || 4;
  const featuredProducts = products.filter(p => p.isActive).slice(0, featuredLimit);

  const handleCtaClick = (url: string) => {
    if (!url) {
      onNavigate('shop');
      return;
    }
    const clean = url.replace(/^#\/?/, '');
    if (clean.includes('affiliate/register') || clean === 'affiliate-register' || clean === 'register') {
      onNavigate('affiliate-register');
    } else if (clean.startsWith('shop')) {
      const parts = clean.split('?category=');
      if (parts.length > 1) {
        onNavigate('shop', parts[1]);
      } else {
        onNavigate('shop');
      }
    } else if (clean.startsWith('page/')) {
      onNavigate('page', clean.replace('page/', ''));
    } else {
      onNavigate(clean || 'shop');
    }
  };

  return (
    <div className="space-y-16">
      {/* Top Promotional Announcement Banner if enabled */}
      {cms.promoBanner.enabled && (
        <div className="bg-slate-900 text-white text-xs py-2 px-4 text-center border-b border-slate-800">
          <span>{cms.promoBanner.text} </span>
          <span className="font-bold text-emerald-400">{cms.promoBanner.highlightText} </span>
          {cms.promoBanner.linkText && (
            <button
              type="button"
              onClick={() => handleCtaClick(cms.promoBanner.linkUrl)}
              className="ml-2 text-slate-300 underline hover:text-white transition-colors"
            >
              {cms.promoBanner.linkText} →
            </button>
          )}
        </div>
      )}

      {/* Hero Section */}
      {cms.hero.enabled && (
        <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[520px]">
            {/* Hero Left Content */}
            <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between z-10 space-y-6">
              <div className="space-y-4">
                {/* Badge text */}
                <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                  {cms.hero.badgeText}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-white text-balance leading-tight">
                  {cms.hero.title}
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                  {cms.hero.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleCtaClick(cms.hero.primaryButtonUrl)}
                  className="flex items-center gap-2 px-6 py-3.5 bg-white text-slate-950 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <span>{cms.hero.primaryButtonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('affiliate-register')}
                  className="px-6 py-3.5 bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition-colors"
                >
                  {cms.hero.secondaryButtonText}
                </button>
              </div>

              {/* Quiet trust markers */}
              <div className="pt-6 border-t border-slate-800/80 flex items-center gap-6 text-xs text-slate-400">
                <div>
                  <span className="font-bold text-white font-mono tabular-nums">100%</span> Authentic Warranty
                </div>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <div>
                  <span className="font-bold text-white font-mono tabular-nums">64</span> Districts Covered
                </div>
                <span aria-hidden="true" className="text-slate-700">·</span>
                <div>Cash on Delivery</div>
              </div>
            </div>

            {/* Hero Right Featured Products Auto Slider */}
            <HeroProductSlider
              products={products}
              onSelectProduct={onSelectProduct}
              onNavigate={onNavigate}
            />
          </div>
        </section>
      )}

      {/* Featured Collection Section */}
      {cms.featuredSection.enabled && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Curated Highlights</div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-serif mt-1">
                {cms.featuredSection.title}
              </h2>
              {cms.featuredSection.subtitle && (
                <p className="text-xs text-slate-500 mt-1">{cms.featuredSection.subtitle}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-slate-700 transition-colors self-start sm:self-auto"
            >
              <span>View All ({products.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2-column mobile, 4-column desktop grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6">
            {featuredProducts.map(product => (
              <ProductCard
                key={product.productId}
                product={product}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* Trust Badges / Value Props */}
      {cms.trustBadges && cms.trustBadges.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cms.trustBadges.map(badge => (
              <div key={badge.id} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
                  {badge.iconName === 'Truck' && <Truck className="w-4 h-4" />}
                  {badge.iconName === 'ShieldCheck' && <ShieldCheck className="w-4 h-4" />}
                  {badge.iconName === 'CreditCard' && <CreditCard className="w-4 h-4" />}
                  {badge.iconName === 'TrendingUp' && <TrendingUp className="w-4 h-4" />}
                </div>
                <h4 className="text-sm font-bold text-slate-900">{badge.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{badge.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Brand Craftsmanship & Affiliate Network Section */}
      {cms.affiliatePromo.enabled && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                {cms.affiliatePromo.badge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight">
                {cms.affiliatePromo.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {cms.affiliatePromo.description}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('affiliate-register')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950/40 inline-flex items-center gap-2"
                >
                  <span>{cms.affiliatePromo.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                Partner Benefits & Highlights
              </h4>
              {cms.affiliatePromo.bulletPoints?.map((bp, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bp}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
