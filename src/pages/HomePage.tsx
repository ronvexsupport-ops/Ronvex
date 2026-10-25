import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Award, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ products, onSelectProduct, onNavigate }) => {
  const featuredProducts = products.filter(p => p.isActive).slice(0, 4);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[520px]">
          {/* Hero Left Content */}
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-between z-10 space-y-6">
            <div className="space-y-4">
              {/* Quiet Unboxed Metadata */}
              <div className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                Autumn 2026 Collection · Dhaka Verified
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-serif text-white text-balance leading-tight">
                Refined consumer essentials, built to last.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
                Discover titanium wearables, studio-grade acoustics, and executive commuter accessories. Backed by transparent pricing, authorized affiliate partnerships, and nationwide cash on delivery.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('shop')}
                className="flex items-center gap-2 px-6 py-3.5 bg-white text-slate-950 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-100 transition-colors"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('affiliate-register')}
                className="px-6 py-3.5 bg-slate-900 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition-colors"
              >
                Join Affiliate Program
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

          {/* Hero Right Visual Banner */}
          <div className="relative min-h-[300px] lg:min-h-full bg-slate-900 overflow-hidden">
            <img
              src="/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg"
              alt="RONVEX Curated Essentials"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:hidden" />
          </div>
        </div>
      </section>

      {/* Featured Collection Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">Curated Highlights</div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 font-serif mt-1">
              Featured Flagship Releases
            </h2>
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-slate-700 transition-colors self-start sm:self-auto"
          >
            <span>View All ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4-column responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map(product => (
            <ProductCard
              key={product.productId}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Brand Craftsmanship & Affiliate Network Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">01. Uncompromising Build Quality</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every unit in the RONVEX collection undergo strict quality inspection before dispatch. From titanium casings to graphene sound drivers, we source directly from authorized fabrication lines.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">02. Transparent Affiliate Ecosystem</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Approved partners configure permitted retail prices, share custom storefront links, and earn clear margins on every delivered order. No hidden reductions or delayed payouts.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('affiliate-register')}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-900 hover:text-slate-700 underline underline-offset-4"
            >
              <span>Join Affiliate Program</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">03. Weekly Wednesday Payouts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Affiliate earnings are disbursed directly via bKash, Nagad, or direct bank transfer every Wednesday for your entire available payable balance, with no minimum threshold.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
