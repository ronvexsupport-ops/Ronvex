import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { PricingEngine } from '../services/pricingEngine';
import { useCart } from '../context/CartContext';
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
  const displayPrice = customSellingPrice !== undefined ? customSellingPrice : product.adminBasePrice;
  const imageUrl = ImageService.resolveProductImage(product.imageUrls?.[0], product.categoryId);

  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all duration-200">
      {/* Product Image Frame (65-75% height focus) */}
      <div
        onClick={() => onSelect(product)}
        className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer"
      >
        <img
          src={imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(product.categoryId);
          }}
        />
        {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-[11px] font-medium text-amber-700 px-2 py-0.5 rounded shadow-sm">
            Only {product.stockQuantity} remaining
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Clean Unboxed Metadata with · separator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span>{product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}</span>
          </div>

          <h3
            onClick={() => onSelect(product)}
            className="text-sm font-semibold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-bold text-slate-950 font-mono tabular-nums">
              {PricingEngine.formatBDT(displayPrice)}
            </div>
            {isAffiliateView && customSellingPrice !== undefined && (
              <div className="text-[10px] text-emerald-700 font-medium">
                Affiliate Margin: +{PricingEngine.formatBDT(PricingEngine.calculateAffiliateMargin(displayPrice, product.adminBasePrice))}
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1, displayPrice)}
            disabled={product.stockQuantity === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              product.stockQuantity > 0
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};
