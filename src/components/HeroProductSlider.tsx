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
  // Filter products marked with checkmark for hero slider
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
      <div className="relative min-h-[480px] lg:min-h-full bg-slate-900 flex items-center justify-center p-8 text-slate-400 text-xs">
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
      className="relative min-h-[500px] sm:min-h-[560px] lg:min-h-full w-full flex flex-col justify-between overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-800/80 group select-none"
    >
      {/* 100% Visible Full-Bleed Product Image with NO dark container obstruction */}
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

        {/* Ultra-subtle, soft gradient feathering only at extreme edges to keep 100% of the image vivid and visible */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Top Header Row (Directly over image, no black card): Category Badge & Slide Controls */}
      <div className="relative z-20 p-5 sm:p-7 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/40 text-white backdrop-blur-md border border-white/20 shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>{currentProduct.categoryName || 'Featured Collection'}</span>
          </span>
          {checkedProducts.length > 0 && (
            <span className="text-[11px] font-semibold text-emerald-300 bg-black/40 border border-emerald-400/40 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hidden sm:inline-block">
              Selected Item
            </span>
          )}
        </div>

        {/* Carousel controls */}
        {slides.length > 1 && (
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-md">
            <span className="text-xs font-mono text-white px-1 font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {currentIndex + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Middle Clickable Area directly viewing product */}
      <div
        onClick={() => onSelectProduct(currentProduct)}
        className="flex-1 w-full relative z-10 cursor-pointer min-h-[160px]"
        title={`View ${currentProduct.name}`}
      />

      {/* Bottom Content Appearing Directly Over The Image Without Any Black Box */}
      <div className="relative z-20 p-5 sm:p-8 space-y-3">
        {/* Offer Title Banner directly over image */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 backdrop-blur-xs shadow-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-md">{displayOfferTitle}</span>
          </span>
        </div>

        {/* Product Title directly over image with clean shadow */}
        <h3
          onClick={() => onSelectProduct(currentProduct)}
          className="text-2xl sm:text-3xl font-extrabold font-serif text-white tracking-tight line-clamp-2 cursor-pointer hover:text-emerald-300 transition-colors drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]"
        >
          {currentProduct.name}
        </h3>

        {/* Price & Shop Now Button directly over image */}
        <div className="pt-1 flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums tracking-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)]">
              {PricingEngine.formatBDT(currentProduct.adminBasePrice)}
            </div>
            <div className="text-xs text-white/95 font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              VAT & Taxes Included
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectProduct(currentProduct)}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-[0_8px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_10px_25px_rgba(16,185,129,0.6)] transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shop Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slide Indicator Dots directly over image */}
        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {slides.map((s, idx) => (
              <button
                key={s.productId}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all rounded-full cursor-pointer shadow-md ${
                  idx === currentIndex
                    ? 'w-8 h-2 bg-emerald-400 shadow-emerald-500/50'
                    : 'w-2 h-2 bg-white/60 hover:bg-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
