import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, RotateCcw, Check, Plus, Minus } from 'lucide-react';
import { Product } from '../types';
import { PricingEngine } from '../services/pricingEngine';
import { useCart } from '../context/CartContext';
import { DEFAULT_FALLBACK_IMAGE } from '../services/imageService';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onNavigate: (view: string) => void;
  customSellingPrice?: number;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  onBack,
  onSelectProduct,
  onNavigate,
  customSellingPrice,
}) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>(
    product.imageUrls?.[0] || DEFAULT_FALLBACK_IMAGE
  );
  const [addedNotice, setAddedNotice] = useState(false);

  const displayPrice = customSellingPrice !== undefined ? customSellingPrice : product.adminBasePrice;

  const handleAddToCart = () => {
    addToCart(product, quantity, displayPrice);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, displayPrice);
    onNavigate('checkout');
  };

  const related = allProducts
    .filter(p => p.productId !== product.productId && (p.categoryId === product.categoryId || p.isActive))
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Catalog</span>
      </button>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-4/3 w-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
            <img
              src={selectedImage}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
              }}
            />
          </div>

          {/* Thumbnails if multiple */}
          {product.imageUrls && product.imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors shrink-0 ${
                    selectedImage === url ? 'border-slate-900' : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contiguous Purchase Module (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-2 border-b border-slate-200 pb-5">
            {/* Clean unboxed metadata */}
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{product.categoryName}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">{product.productId}</span>
              <span aria-hidden="true">·</span>
              <span className={product.stockQuantity > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                {product.stockQuantity > 0 ? `${product.stockQuantity} Units In Stock` : 'Out of Stock'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-serif">
              {product.name}
            </h1>

            {/* Price display */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-slate-950 font-mono tabular-nums">
                {PricingEngine.formatBDT(displayPrice)}
              </span>
              <span className="text-xs text-slate-500">VAT & Taxes Included</span>
            </div>
          </div>

          {/* Product Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Overview & Specifications
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Quantity Selector & Action CTAs */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-mono font-bold text-slate-900 tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  disabled={quantity >= product.stockQuantity}
                  className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stockQuantity === 0}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-900 text-slate-950 rounded-xl font-semibold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stockQuantity === 0}
                className="py-3 px-4 bg-slate-950 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Buy Now (COD)
              </button>
            </div>
          </div>

          {/* Delivery & Payment Micro-Assurance */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-slate-700 shrink-0" />
              <span><strong>Cash on Delivery:</strong> Pay only after inspecting parcel at your doorstep.</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
              <span><strong>Dhaka:</strong> 24-48 hrs (৳80) · <strong>Outside Dhaka:</strong> 48-72 hrs (৳150)</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-slate-700 shrink-0" />
              <span><strong>Returns:</strong> 7-day hassle-free replacement on verified manufacturing defects.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="pt-12 border-t border-slate-200 space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-slate-950 font-serif">
            Complementary Hardware
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {related.map(relProduct => (
              <ProductCard
                key={relProduct.productId}
                product={relProduct}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
