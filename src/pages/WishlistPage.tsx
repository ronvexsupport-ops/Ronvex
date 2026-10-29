import React from 'react';
import { Heart, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { PricingEngine } from '../services/pricingEngine';
import { ImageService, DEFAULT_FALLBACK_IMAGE } from '../services/imageService';

interface WishlistPageProps {
  onNavigate: (view: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate, onSelectProduct }) => {
  const { wishlistProducts, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart } = useCart();

  const handleAddAllToCart = () => {
    wishlistProducts.forEach(product => {
      if (product.stockQuantity > 0) {
        addToCart(product, 1);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & Return to Shop */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>

          {wishlistCount > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear your entire wishlist?')) {
                  clearWishlist();
                }
              }}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {/* Page Title & Count Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
                  My Wishlist
                </h1>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-bold text-xs rounded-full">
                  {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Your saved collection of Pakistani luxury apparel, tech essentials, and curated favorites.
              </p>
            </div>
          </div>

          {wishlistCount > 0 && (
            <button
              onClick={handleAddAllToCart}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add All to Cart</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {wishlistCount === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-xs space-y-4 my-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-400">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-serif">Your wishlist is currently empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore our collections to save your favorite suits, watches, audio gear, and lifestyle products for later.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('shop')}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {wishlistProducts.map(product => {
              const displayPrice = product.adminBasePrice;
              const originalPrice = product.originalPrice && product.originalPrice > displayPrice ? product.originalPrice : undefined;
              const discountPercent = product.discountPercent || (originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : undefined);
              const imageUrl = ImageService.resolveProductImage(product.imageUrls?.[0], product.categoryId);

              return (
                <div
                  key={product.productId}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="relative aspect-3/4 w-full bg-slate-50 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={e => {
                        (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(product.categoryId);
                      }}
                    />

                    {/* Discount badge */}
                    {discountPercent && discountPercent > 0 && (
                      <span className="absolute top-2.5 left-2.5 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                        -{discountPercent}%
                      </span>
                    )}

                    {/* Remove from wishlist button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(product.productId);
                      }}
                      className="absolute top-2.5 right-2.5 p-2 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full shadow-sm transition-all cursor-pointer z-10"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        <span>{product.brand || product.categoryName}</span>
                        {product.sku && (
                          <>
                            <span>·</span>
                            <span className="font-mono">SKU: {product.sku}</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectProduct(product)}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-slate-700 transition-colors text-left line-clamp-2 cursor-pointer leading-snug"
                      >
                        {product.name}
                      </button>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-slate-950 font-mono">
                          {PricingEngine.formatBDT(displayPrice)}
                        </span>
                        {originalPrice && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {PricingEngine.formatBDT(originalPrice)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => addToCart(product, 1)}
                          disabled={product.stockQuantity === 0}
                          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            product.stockQuantity > 0
                              ? 'bg-slate-900 hover:bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{product.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectProduct(product)}
                          className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          title="View Product Details"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
