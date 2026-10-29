import React from 'react';
import { ArrowLeftRight, X, Trash2, Eye } from 'lucide-react';
import { useCompare, MAX_COMPARE_ITEMS } from '../context/CompareContext';
import { PricingEngine } from '../services/pricingEngine';
import { ImageService } from '../services/imageService';
import { Product } from '../types';

interface CompareFloatingBarProps {
  onSelectProduct?: (product: Product) => void;
}

export const CompareFloatingBar: React.FC<CompareFloatingBarProps> = ({ onSelectProduct }) => {
  const {
    compareProducts,
    removeFromCompare,
    clearCompare,
    openCompareModal,
    compareCount,
    compareNotification,
    clearCompareNotification,
  } = useCompare();

  if (compareCount === 0 && !compareNotification) {
    return null;
  }

  return (
    <>
      {/* Floating Comparison Notification Toast */}
      {compareNotification && (
        <div className="fixed bottom-24 sm:bottom-26 left-1/2 -translate-x-1/2 z-50 animate-bounce-subtle pointer-events-auto">
          <div className="bg-slate-900 text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-xl border border-slate-700/80 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>{compareNotification}</span>
            <button
              onClick={clearCompareNotification}
              className="text-slate-400 hover:text-white p-0.5 rounded-full ml-1"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Dock Bar */}
      {compareCount > 0 && (
        <div
          role="region"
          aria-label="Product Comparison Tray"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-2rem)] sm:max-w-xl md:max-w-2xl w-full px-2"
        >
          <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 p-2.5 sm:p-3 flex items-center justify-between gap-3 sm:gap-4 transition-all">
            {/* Left: Product Slots */}
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-0.5 scrollbar-none">
              {Array.from({ length: MAX_COMPARE_ITEMS }).map((_, index) => {
                const product = compareProducts[index];
                if (product) {
                  const img = ImageService.resolveProductImage(
                    product.imageUrls?.[0],
                    product.categoryId
                  );
                  return (
                    <div
                      key={product.productId}
                      className="relative group w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-slate-900 border border-white/15 overflow-hidden shrink-0 flex items-center justify-center"
                      title={`${product.name} - BDT ${product.adminBasePrice.toLocaleString()}`}
                    >
                      <img
                        src={img}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            ImageService.getCategoryFallback(product.categoryId);
                        }}
                      />
                      {/* Remove Button on hover */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          removeFromCompare(product.productId);
                        }}
                        className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white hover:text-rose-400 cursor-pointer"
                        title="Remove from comparison"
                        aria-label={`Remove ${product.name} from comparison`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty-${index}`}
                    className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl border border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center text-[10px] text-slate-400 shrink-0 select-none"
                    title={`Slot ${index + 1} of ${MAX_COMPARE_ITEMS}: Select another product to compare`}
                  >
                    <span className="font-mono text-xs text-slate-400">+</span>
                    <span className="hidden sm:inline text-[9px] text-slate-400 leading-none">Slot {index + 1}</span>
                  </div>
                );
              })}

              <div className="hidden md:flex flex-col text-left pl-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />
                  <span>Compare Products</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {compareCount} of {MAX_COMPARE_ITEMS} items selected
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={clearCompare}
                className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer hidden sm:flex items-center gap-1"
                title="Clear comparison list"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={openCompareModal}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/30 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer whitespace-nowrap"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
                <span>Compare Now ({compareCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
