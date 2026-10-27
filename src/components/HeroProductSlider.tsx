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
      <div className="relative min-h-[360px] lg:min-h-full bg-slate-900 flex items-center justify-center p-8 text-slate-400 text-xs">
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
      className="relative min-h-[440px] sm:min-h-[480px] lg:min-h-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col justify-between p-6 sm:p-8 lg:p-10 overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800/80 group"
    >
      {/* Decorative ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row of Slider: Category Badge, Slide Counter & Arrow Controls */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 backdrop-blur-md border border-white/10 shadow-xs">
            <Tag className="w-3 h-3 text-emerald-400" />
            <span>{currentProduct.categoryName || 'Featured Collection'}</span>
          </span>
          {checkedProducts.length > 0 && (
            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full hidden sm:inline-block">
              Selected Item
            </span>
          )}
        </div>

        {/* Carousel controls */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 px-1 select-none">
              {currentIndex + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Center Image Showcase (Full image containment, 0% cropping) */}
      <div
        onClick={() => onSelectProduct(currentProduct)}
        className="relative z-10 my-4 sm:my-6 w-full h-56 sm:h-72 lg:h-80 flex items-center justify-center p-2 cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
        title={`Click to view ${currentProduct.name}`}
      >
        <img
          key={currentProduct.productId}
          src={imageUrl}
          alt={currentProduct.name}
          referrerPolicy="no-referrer"
          className="max-h-full max-w-full w-auto h-auto object-contain select-none filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.7)] animate-fade-in"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(currentProduct.categoryId);
          }}
        />
      </div>

      {/* Bottom Section: Offer Title, Product Title, Price & Shop Now Button */}
      <div className="relative z-10 space-y-4">
        {/* Offer Title Banner */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
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
        <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              {PricingEngine.formatBDT(currentProduct.adminBasePrice)}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              VAT & Taxes Included
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectProduct(currentProduct)}
            className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shop Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slide Indicator Dots */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {slides.map((s, idx) => (
              <button
                key={s.productId}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 h-1.5 bg-emerald-400'
                    : 'w-1.5 h-1.5 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
