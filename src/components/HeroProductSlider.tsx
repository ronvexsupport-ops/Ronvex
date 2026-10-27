import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Tag } from 'lucide-react';
import { Product } from '../types';
import { ImageService } from '../services/imageService';
import { PricingEngine } from '../services/pricingEngine';

interface HeroProductSliderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: string, param?: string) => void;
}

export const HeroProductSlider: React.FC<HeroProductSliderProps> = ({
  products,
  onSelectProduct,
  onNavigate,
}) => {
  // 1. Filter products marked with checkmark for hero slider
  const checkedProducts = products.filter(p => p.isActive && p.featuredInHeroSlider);

  // Fallback to active catalog items if none is explicitly checkmarked yet
  const slides = checkedProducts.length > 0
    ? checkedProducts
    : products.filter(p => p.isActive).slice(0, 4);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide transition every 4.5 seconds (pauses when user hovers over the slider)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  // Keep index within bounds if slide count changes
  useEffect(() => {
    if (currentIndex >= slides.length && slides.length > 0) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  if (slides.length === 0) {
    return (
      <div className="relative min-h-[460px] lg:min-h-full bg-slate-900 flex items-center justify-center p-8 text-slate-400 text-xs">
        No products available to showcase.
      </div>
    );
  }

  const currentProduct = slides[currentIndex] || slides[0];
  const imageUrl = ImageService.resolveProductImage(
    currentProduct.imageUrls?.[0],
    currentProduct.categoryId
  );

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };

  // Determine offer title: custom offer title, or attractive default offer badge
  const displayOfferTitle = currentProduct.heroOfferTitle?.trim() ||
    `Special Offer · ${PricingEngine.formatBDT(currentProduct.adminBasePrice)}`;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative min-h-[480px] sm:min-h-[540px] lg:min-h-full w-full flex flex-col justify-between overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800/80 group select-none"
    >
      {/* Full-Bleed Product Image covering the entire space */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
        <img
          key={currentProduct.productId}
          src={imageUrl}
          alt={currentProduct.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top sm:object-center transition-transform duration-700 ease-out group-hover:scale-105 animate-fade-in"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(currentProduct.categoryId);
          }}
        />

        {/* Artistic Gradient Overlays for Guaranteed High Contrast & Readability */}
        {/* Top Scrim */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />
        {/* Left Blend Scrim matching Hero Left section */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent pointer-events-none hidden lg:block" />
        {/* Bottom Rich Scrim for Glass Card */}
        <div className="absolute inset-x-0 bottom-0 h-80 sm:h-96 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />
      </div>

      {/* Top Header Row (Floating): Category Badge, Slide Counter & Arrow Controls */}
      <div className="relative z-20 p-5 sm:p-7 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-950/75 text-slate-100 backdrop-blur-md border border-white/20 shadow-md">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentProduct.categoryName || 'Featured Collection'}</span>
          </span>
          {checkedProducts.length > 0 && (
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/85 border border-emerald-500/40 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs hidden sm:inline-block">
              Selected Item
            </span>
          )}
        </div>

        {/* Carousel controls */}
        {slides.length > 1 && (
          <div className="flex items-center gap-1.5 bg-slate-950/75 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-md">
            <span className="text-xs font-mono text-slate-200 px-1 font-bold">
              {currentIndex + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Middle Interactive Zone */}
      <div
        onClick={() => onSelectProduct(currentProduct)}
        className="flex-1 w-full relative z-10 cursor-pointer min-h-[120px]"
        title={`View ${currentProduct.name}`}
      />

      {/* Bottom Floating Glassmorphic Card: Offer Title, Product Title, Price & Shop Now Button */}
      <div className="relative z-20 p-5 sm:p-7 space-y-3.5">
        <div className="bg-slate-950/80 backdrop-blur-xl border border-white/15 p-4 sm:p-6 rounded-2xl shadow-2xl space-y-3.5 ring-1 ring-black/40">
          {/* Offer Title Banner */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[280px] sm:max-w-md">{displayOfferTitle}</span>
            </span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelectProduct(currentProduct)}
            className="text-lg sm:text-2xl font-bold font-serif text-white tracking-tight line-clamp-1 cursor-pointer hover:text-emerald-300 transition-colors"
          >
            {currentProduct.name}
          </h3>

          {/* Pricing & CTA */}
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
                {PricingEngine.formatBDT(currentProduct.adminBasePrice)}
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                VAT & Taxes Included
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectProduct(currentProduct)}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-xl hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Slide Indicator Dots */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 pt-1">
            {slides.map((s, idx) => (
              <button
                key={s.productId}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-8 h-2 bg-emerald-400 shadow-sm'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
