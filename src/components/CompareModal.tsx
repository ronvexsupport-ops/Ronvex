import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeftRight,
  ShoppingBag,
  Trash2,
  Check,
  Star,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useCompare, MAX_COMPARE_ITEMS } from '../context/CompareContext';
import { useCart } from '../context/CartContext';
import { PricingEngine } from '../services/pricingEngine';
import { ImageService } from '../services/imageService';
import { Product } from '../types';

interface CompareModalProps {
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({ allProducts, onSelectProduct }) => {
  const {
    compareProducts,
    removeFromCompare,
    clearCompare,
    addToCompare,
    isCompareModalOpen,
    closeCompareModal,
    compareCount,
  } = useCompare();

  const { addToCart } = useCart();
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [showAddSelector, setShowAddSelector] = useState(false);
  const [addedItemNotices, setAddedItemNotices] = useState<Record<string, boolean>>({});

  // Keyboard navigation - close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCompareModalOpen) {
        closeCompareModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCompareModalOpen, closeCompareModal]);

  if (!isCompareModalOpen) {
    return null;
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1, product.adminBasePrice);
    setAddedItemNotices(prev => ({ ...prev, [product.productId]: true }));
    setTimeout(() => {
      setAddedItemNotices(prev => ({ ...prev, [product.productId]: false }));
    }, 2000);
  };

  const handleViewProduct = (product: Product) => {
    closeCompareModal();
    onSelectProduct(product);
  };

  // Products available to add to comparison
  const availableToAdd = allProducts.filter(
    p => !compareProducts.some(cp => cp.productId === p.productId) && p.isActive
  );

  // Helper to test if values differ across compared products
  const areValuesDifferent = (extractor: (p: Product) => any): boolean => {
    if (compareProducts.length <= 1) return false;
    const firstVal = extractor(compareProducts[0]);
    return compareProducts.some(p => extractor(p) !== firstVal);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in"
      onClick={closeCompareModal}
    >
      <div
        className="relative bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="compare-modal-title" className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                  Product Specifications & Price Comparison
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {compareCount} of {MAX_COMPARE_ITEMS} items
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Examine technical attributes, pricing breakdowns, and fabric details side-by-side.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Highlight Differences Toggle */}
            {compareCount > 1 && (
              <label className="hidden sm:inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={highlightDifferences}
                  onChange={e => setHighlightDifferences(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs">Highlight Differences</span>
              </label>
            )}

            {/* Clear All */}
            {compareCount > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer hidden md:flex items-center gap-1"
                title="Clear all compared items"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={closeCompareModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Close comparison (Esc)"
              aria-label="Close comparison modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 scrollbar-thin">
          {compareCount === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No products to compare</h3>
              <p className="text-xs text-slate-500 mb-6">
                Select up to 3 products from our catalog to compare prices, fabric details, and specifications side-by-side.
              </p>
              <button
                type="button"
                onClick={closeCompareModal}
                className="px-6 py-2.5 rounded-full bg-slate-950 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="min-w-[640px]">
              {/* Product Cards Top Grid */}
              <div className="grid grid-cols-12 gap-4 pb-6 border-b border-slate-200">
                {/* Column 0: Label Header placeholder */}
                <div className="col-span-3 flex flex-col justify-end pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Product Overview
                </div>

                {/* Columns for Compared Products */}
                {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                  const product = compareProducts[idx];
                  if (product) {
                    const img = ImageService.resolveProductImage(
                      product.imageUrls?.[0],
                      product.categoryId
                    );
                    const originalPrice =
                      product.originalPrice && product.originalPrice > product.adminBasePrice
                        ? product.originalPrice
                        : undefined;
                    const discountPercent =
                      product.discountPercent ||
                      (originalPrice
                        ? Math.round(
                            ((originalPrice - product.adminBasePrice) / originalPrice) * 100
                          )
                        : undefined);

                    return (
                      <div
                        key={product.productId}
                        className="col-span-3 flex flex-col justify-between bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 relative group hover:border-purple-300 transition-all shadow-2xs"
                      >
                        {/* Remove Action Button */}
                        <button
                          type="button"
                          onClick={() => removeFromCompare(product.productId)}
                          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white shadow-xs transition-colors z-10 cursor-pointer"
                          title="Remove from comparison"
                          aria-label={`Remove ${product.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Image Showcase */}
                        <button
                          type="button"
                          onClick={() => handleViewProduct(product)}
                          className="relative aspect-3/4 w-full rounded-lg overflow-hidden bg-white mb-2.5 cursor-pointer block text-left"
                        >
                          <img
                            src={img}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={e => {
                              (e.target as HTMLImageElement).src =
                                ImageService.getCategoryFallback(product.categoryId);
                            }}
                          />
                          {discountPercent && discountPercent > 0 && (
                            <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                              -{discountPercent}%
                            </div>
                          )}
                        </button>

                        {/* Brand & Title */}
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {product.brand || product.categoryName || 'RONVEX'}
                          </div>
                          <h4
                            onClick={() => handleViewProduct(product)}
                            className="text-xs font-bold text-slate-900 hover:text-purple-700 transition-colors cursor-pointer line-clamp-2 leading-tight mt-0.5"
                            title={product.name}
                          >
                            {product.name}
                          </h4>

                          {/* Pricing */}
                          <div className="flex items-baseline gap-1.5 mt-2">
                            <span className="text-sm sm:text-base font-bold text-slate-950 font-mono">
                              BDT {product.adminBasePrice.toLocaleString()}
                            </span>
                            {originalPrice && (
                              <span className="text-xs text-slate-400 line-through font-mono">
                                BDT {originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions: Add to Cart and View */}
                        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stockQuantity === 0}
                            className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {addedItemNotices[product.productId] ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-300">Added to Cart!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleViewProduct(product)}
                            className="w-full py-1.5 text-[11px] font-semibold text-purple-700 hover:text-purple-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>View Full Details</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot
                  return (
                    <div
                      key={`empty-slot-${idx}`}
                      className="col-span-3 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50/30"
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Compare Another Item</span>
                      <p className="text-[11px] text-slate-400 mt-1 mb-3">
                        Slot {idx + 1} of {MAX_COMPARE_ITEMS} available
                      </p>

                      {showAddSelector ? (
                        <div className="w-full max-h-48 overflow-y-auto space-y-1 text-left bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                          <div className="flex items-center justify-between pb-1 mb-1 border-b text-[10px] text-slate-400 font-bold uppercase">
                            <span>Select Product:</span>
                            <button
                              type="button"
                              onClick={() => setShowAddSelector(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              ✕
                            </button>
                          </div>
                          {availableToAdd.length === 0 ? (
                            <div className="text-[11px] text-slate-400 p-2 text-center">
                              No more products available
                            </div>
                          ) : (
                            availableToAdd.slice(0, 10).map(item => (
                              <button
                                key={item.productId}
                                type="button"
                                onClick={() => {
                                  addToCompare(item);
                                  setShowAddSelector(false);
                                }}
                                className="w-full text-left p-1.5 hover:bg-purple-50 rounded flex items-center gap-2 text-xs text-slate-800 cursor-pointer"
                              >
                                <img
                                  src={ImageService.resolveProductImage(
                                    item.imageUrls?.[0],
                                    item.categoryId
                                  )}
                                  alt={item.name}
                                  className="w-7 h-7 object-cover rounded shrink-0"
                                />
                                <div className="truncate flex-1">
                                  <div className="font-medium truncate">{item.name}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    BDT {item.adminBasePrice.toLocaleString()}
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowAddSelector(true)}
                          className="px-3.5 py-1.5 rounded-lg border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Choose Product</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detailed Technical Specifications Table */}
              <div className="mt-6 space-y-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Detailed Specifications
                </h3>

                {/* 1. Price Breakdown */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.adminBasePrice)
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">Store Price (BDT)</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 font-mono font-bold text-slate-900">
                        {product ? `৳${product.adminBasePrice.toLocaleString()}.00` : '—'}
                      </div>
                    );
                  })}
                </div>

                {/* 2. Original Regular Price */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.originalPrice || p.adminBasePrice)
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">Regular / Original Price</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 font-mono text-slate-500">
                        {product?.originalPrice ? (
                          <span className="line-through">৳{product.originalPrice.toLocaleString()}.00</span>
                        ) : product ? (
                          'No discount'
                        ) : (
                          '—'
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3. Brand & Designer */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.brand || 'JAZMIN')
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">Brand / Designer House</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 font-medium text-slate-900 uppercase">
                        {product?.brand || (product ? 'JAZMIN' : '—')}
                      </div>
                    );
                  })}
                </div>

                {/* 4. Category */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.categoryName)
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">Category</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 text-slate-800">
                        {product?.categoryName || '—'}
                      </div>
                    );
                  })}
                </div>

                {/* 5. SKU Number */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.sku || p.productId)
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">SKU Number</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 font-mono text-[11px] text-slate-600 uppercase">
                        {product?.sku || product?.productId || '—'}
                      </div>
                    );
                  })}
                </div>

                {/* 6. Stitching / Silhouette */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.stitchingType || 'Unstitched')
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">Stitching / Type</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 text-slate-800">
                        {product ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 border border-slate-200">
                            {product.stitchingType || 'Unstitched'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 7. Piece Count & Fabric */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.categoryId)
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">Fabric & Ensemble</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 text-slate-700 leading-snug">
                        {product ? (
                          <span>
                            Pure Premium Lawn · 3-Piece Complete (Shirt, Dupatta & Trousers)
                          </span>
                        ) : (
                          '—'
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 8. Stock & Availability */}
                <div
                  className={`grid grid-cols-12 py-3 px-3 rounded-lg text-xs transition-colors ${
                    highlightDifferences && areValuesDifferent(p => p.stockQuantity)
                      ? 'bg-purple-50/80 font-medium'
                      : 'border-b border-slate-100 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="col-span-3 font-semibold text-slate-600">Stock Availability</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    if (!product) return <div key={idx} className="col-span-3 text-slate-400">—</div>;
                    const inStock = product.stockQuantity > 0;
                    return (
                      <div key={idx} className="col-span-3">
                        <span
                          className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                            inStock ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              inStock ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {inStock ? `In Stock (${product.stockQuantity} units)` : 'Out of Stock'}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 9. Verified Reviews Rating */}
                <div className="grid grid-cols-12 py-3 px-3 rounded-lg text-xs border-b border-slate-100 hover:bg-slate-50/60">
                  <div className="col-span-3 font-semibold text-slate-600">Customer Rating</div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 flex items-center gap-1 text-slate-800">
                        {product ? (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-bold">4.9</span>
                            <span className="text-slate-400 text-[11px]">(18 reviews)</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 10. Shipping & Delivery */}
                <div className="grid grid-cols-12 py-3 px-3 rounded-lg text-xs border-b border-slate-100 hover:bg-slate-50/60">
                  <div className="col-span-3 font-semibold text-slate-600 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nationwide Delivery</span>
                  </div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 text-slate-600">
                        {product ? 'Dhaka 24-48h · Outside 48-72h' : '—'}
                      </div>
                    );
                  })}
                </div>

                {/* 11. Payment Option */}
                <div className="grid grid-cols-12 py-3 px-3 rounded-lg text-xs border-b border-slate-100 hover:bg-slate-50/60">
                  <div className="col-span-3 font-semibold text-slate-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Payment Methods</span>
                  </div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 text-slate-600">
                        {product ? 'Cash on Delivery (COD) + bKash' : '—'}
                      </div>
                    );
                  })}
                </div>

                {/* 12. Return Policy */}
                <div className="grid grid-cols-12 py-3 px-3 rounded-lg text-xs border-b border-slate-100 hover:bg-slate-50/60">
                  <div className="col-span-3 font-semibold text-slate-600 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Exchange Guarantee</span>
                  </div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 text-slate-600">
                        {product ? '7-Day Easy Doorstep Exchange' : '—'}
                      </div>
                    );
                  })}
                </div>

                {/* 13. Authenticity Guarantee */}
                <div className="grid grid-cols-12 py-3 px-3 rounded-lg text-xs border-b border-slate-100 hover:bg-slate-50/60">
                  <div className="col-span-3 font-semibold text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Authenticity</span>
                  </div>
                  {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, idx) => {
                    const product = compareProducts[idx];
                    return (
                      <div key={idx} className="col-span-3 text-slate-800 font-medium">
                        {product ? '100% Genuine Designer Assurance' : '—'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Prices include nationwide COD guarantee</span>
          </div>
          <button
            type="button"
            onClick={closeCompareModal}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
