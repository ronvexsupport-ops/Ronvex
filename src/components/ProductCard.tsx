import React from 'react';
import { ShoppingBag, ArrowRight, Heart, Star, ArrowLeftRight } from 'lucide-react';
import { Product } from '../types';
import { PricingEngine } from '../services/pricingEngine';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { ImageService, DEFAULT_FALLBACK_IMAGE } from '../services/imageService';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  customSellingPrice?: number;
  isAffiliateView?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  customSellingPrice,
  isAffiliateView,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, toggleCompare } = useCompare();
  const isWishlisted = isInWishlist(product.productId);
  const isCompared = isInCompare(product.productId);
  const displayPrice = customSellingPrice !== undefined ? customSellingPrice : product.adminBasePrice;
  const imageUrl = ImageService.resolveProductImage(product.imageUrls?.[0], product.categoryId);

  const originalPrice = product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : undefined;
  const discountPercent = product.discountPercent || (originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : undefined);

  const productHref = `/#product/${product.slug || product.productId}`;

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(product);
  };

  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200">
      {/* Product Image Frame (Full Image Visibility, 3:4 portrait) */}
      <a
        href={productHref}
        onClick={handleCardClick}
        className="relative aspect-3/4 w-full bg-slate-50/90 overflow-hidden cursor-pointer flex items-center justify-center p-2 block"
      >
        <img
          src={imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain object-center group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(product.categoryId);
          }}
        />
        {discountPercent && discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-black text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
            -{discountPercent}%
          </div>
        )}
        {!discountPercent && product.stockQuantity <= 5 && product.stockQuantity > 0 && (
          <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-[10px] font-medium text-amber-700 px-2 py-0.5 rounded shadow-sm">
            Only {product.stockQuantity} remaining
          </div>
        )}
        {/* Wishlist Heart Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full transition-all duration-200 z-20 cursor-pointer shadow-xs ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 scale-105'
              : 'bg-white/80 hover:bg-white text-slate-500 hover:text-rose-600'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
          aria-label={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Compare Toggle Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleCompare(product);
          }}
          className={`absolute top-10.5 right-2.5 p-1.5 rounded-full transition-all duration-200 z-20 cursor-pointer shadow-xs ${
            isCompared
              ? 'bg-purple-600 text-white scale-105 shadow-purple-600/30'
              : 'bg-white/80 hover:bg-white text-slate-500 hover:text-purple-600'
          }`}
          title={isCompared ? 'Remove from comparison' : 'Compare product (up to 3)'}
          aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>

        {product.imageUrls && product.imageUrls.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md flex items-center gap-1">
            <span>+{product.imageUrls.length} photos</span>
          </div>
        )}
      </a>

      {/* Product Content Details */}
      <div className="p-2.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 sm:gap-3">
        <div>
          {/* Brand or Category & Star Rating */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1 gap-1">
            <span className="font-semibold uppercase tracking-wider text-slate-700 truncate">{product.brand || product.categoryName}</span>
            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px] shrink-0">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>4.9</span>
            </div>
          </div>

          <h3 className="line-clamp-2 min-h-[2.2rem] sm:min-h-0">
            <a
              href={productHref}
              onClick={handleCardClick}
              className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors cursor-pointer block leading-tight sm:leading-snug"
            >
              {product.name}
            </a>
          </h3>

          <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-bold text-slate-950 font-mono tabular-nums">
                {PricingEngine.formatBDT(displayPrice)}
              </span>
              {originalPrice && (
                <span className="text-xs text-slate-400 line-through font-mono">
                  {PricingEngine.formatBDT(originalPrice)}
                </span>
              )}
            </div>
            {isAffiliateView && customSellingPrice !== undefined && (
              <div className="text-[9px] sm:text-[10px] text-emerald-700 font-medium">
                Margin: +{PricingEngine.formatBDT(PricingEngine.calculateAffiliateMargin(displayPrice, product.adminBasePrice))}
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1, displayPrice)}
            disabled={product.stockQuantity === 0}
            className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-lg transition-colors whitespace-nowrap w-full sm:w-auto cursor-pointer ${
              product.stockQuantity > 0
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
