import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, User, ShoppingBag } from 'lucide-react';
import { Product, Affiliate } from '../types';
import { AffiliateService } from '../services/affiliateService';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { AttributionEngine } from '../services/pricingEngine';

interface AffiliateStorefrontPageProps {
  affiliateSlug: string;
  products: Product[];
  onSelectProduct: (product: Product, customPrice?: number) => void;
  onNavigate: (view: string) => void;
}

export const AffiliateStorefrontPage: React.FC<AffiliateStorefrontPageProps> = ({
  affiliateSlug,
  products,
  onSelectProduct,
  onNavigate,
}) => {
  const { setActiveAttribution } = useCart();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadAffiliateData() {
      setLoading(true);
      setNotFound(false);
      try {
        const aff = await AffiliateService.getAffiliateBySlug(affiliateSlug);
        if (aff) {
          setAffiliate(aff);
          // Record attribution in local engine and cart context
          AttributionEngine.recordAttribution(aff.affiliateId, aff.affiliateSlug);
          setActiveAttribution({
            affiliateId: aff.affiliateId,
            affiliateSlug: aff.affiliateSlug,
            timestamp: Date.now(),
          });

          // Load affiliate's custom prices
          const prices = await AffiliateService.getAffiliatePrices(aff.affiliateId);
          setCustomPrices(prices);
        } else {
          // If demo slug 'techdeals-bd', provide immediate preview
          if (affiliateSlug === 'techdeals-bd') {
            const demoAff: Affiliate = {
              affiliateId: 'demo_affiliate_uid',
              uid: 'demo_affiliate_uid',
              affiliateSlug: 'techdeals-bd',
              displayName: 'TechDeals BD Store',
              email: 'partner.rahim@ronvex.com',
              accountStatus: 'APPROVED',
              bio: 'Official partner store curated with Bangladesh technology specials.',
              createdAt: new Date().toISOString(),
            };
            setAffiliate(demoAff);
            AttributionEngine.recordAttribution(demoAff.affiliateId, demoAff.affiliateSlug);
            setActiveAttribution({
              affiliateId: demoAff.affiliateId,
              affiliateSlug: demoAff.affiliateSlug,
              timestamp: Date.now(),
            });
            // Custom prices (e.g. smartwatch base 600 -> selling 700)
            setCustomPrices({
              prod_smartwatch_titanium: 700,
              prod_earbuds_anc: 1550,
            });
          } else {
            setNotFound(true);
          }
        }
      } catch (err) {
        console.error('Error fetching affiliate storefront:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadAffiliateData();
  }, [affiliateSlug, setActiveAttribution]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center text-xs text-slate-500">
        Loading partner storefront...
      </div>
    );
  }

  if (notFound || !affiliate) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold font-serif text-slate-900">Partner Storefront Not Found</h2>
        <p className="text-xs text-slate-500">
          The affiliate link or storefront slug "/affiliate/{affiliateSlug}" is either invalid or inactive.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
        >
          Browse Main RONVEX Store
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Partner Banner Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-white">RONVEX Partner Network</span>
            <span>·</span>
            <span>Verified Storefront</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-white">
            {affiliate.displayName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {affiliate.bio || 'Curated electronics and lifestyle essentials selected exclusively for our community. All orders include official warranty and nationwide Cash on Delivery.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Attribution Active: Automatic Order Snapshot</span>
            </div>
            <span>·</span>
            <span>Partner Slug: @{affiliate.affiliateSlug}</span>
          </div>
        </div>
      </div>

      {/* Catalog Grid with Partner's Permitted Pricing */}
      <div className="space-y-6">
        <div className="flex justify-between items-baseline border-b border-slate-200 pb-3">
          <h2 className="text-lg font-bold text-slate-950 font-serif">
            Curated Products ({products.filter(p => p.isActive).length})
          </h2>
          <span className="text-xs text-slate-500">
            Prices configured by {affiliate.displayName}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products
            .filter(p => p.isActive)
            .map(product => {
              const customPrice = customPrices[product.productId];
              return (
                <ProductCard
                  key={product.productId}
                  product={product}
                  customSellingPrice={customPrice}
                  isAffiliateView={true}
                  onSelect={p => onSelectProduct(p, customPrice)}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
};
