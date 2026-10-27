import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  ChevronDown,
  RotateCcw as ResetIcon,
  Share2,
  Copy,
} from 'lucide-react';
import { Product } from '../types';
import { PricingEngine } from '../services/pricingEngine';
import { useCart } from '../context/CartContext';
import { ImageService, DEFAULT_FALLBACK_IMAGE } from '../services/imageService';
import { ProductCard } from '../components/ProductCard';
import { applySEO } from '../utils/seoUtils';

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

  // Normalize image list: ensure at least one image and resolve all URLs
  const rawImages = (product.imageUrls && product.imageUrls.length > 0)
    ? product.imageUrls
    : [DEFAULT_FALLBACK_IMAGE];

  const resolvedImages = rawImages.map(url =>
    ImageService.resolveProductImage(url, product.categoryId)
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedNotice, setAddedNotice] = useState(false);

  // Interactive Hover Zoom State
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Lightbox Modal Zoom State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1); // 1 = fit, 1.5, 2, 2.5
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initOffsetX: number; initOffsetY: number }>({
    startX: 0,
    startY: 0,
    initOffsetX: 0,
    initOffsetY: 0,
  });

  // Accordion open/close states (matching reference sjcloset.com style)
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');

  const displayPrice = customSellingPrice !== undefined ? customSellingPrice : product.adminBasePrice;
  const currentImage = resolvedImages[activeImageIndex] || resolvedImages[0];

  const [copiedLink, setCopiedLink] = useState(false);

  // Apply dynamic document title, meta tags, and canonical link
  useEffect(() => {
    if (!product) return;
    const cleanSlug = product.slug || product.productId;
    applySEO({
      title: product.name,
      seoTitle: `${product.name} | RONVEX`,
      metaDescription: product.description ? product.description.slice(0, 160) : `Shop ${product.name} at RONVEX. Authentic premium quality.`,
      ogImage: resolvedImages[0],
      canonicalPath: `/product/${cleanSlug}`,
      type: 'product',
    });
  }, [product, resolvedImages]);

  const handleCopyProductLink = async () => {
    try {
      const cleanSlug = product.slug || product.productId;
      const fullUrl = `${window.location.origin}/#product/${cleanSlug}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  // Keep index within bounds if product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, [product.productId]);

  // Keyboard navigation for slider and lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeImageIndex, resolvedImages.length]);

  const handlePrevImage = () => {
    setActiveImageIndex(prev => (prev === 0 ? resolvedImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => (prev === resolvedImages.length - 1 ? 0 : prev + 1));
  };

  // Hover zoom coordinate calculation
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomCoords({ x, y });
  };

  // Lightbox Pan & Drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (lightboxZoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initOffsetX: panOffset.x,
      initOffsetY: panOffset.y,
    };
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || lightboxZoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPanOffset({
      x: dragStartRef.current.initOffsetX + dx,
      y: dragStartRef.current.initOffsetY + dy,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

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
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb / Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Gallery Section (7 cols) - Vertical Thumbnails on Left + Full Image Showcase */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Vertical Thumbnail Strip (Left Column on md+) */}
          {resolvedImages.length > 1 && (
            <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[640px] shrink-0 scrollbar-thin py-1">
              {resolvedImages.map((imgUrl, idx) => {
                const isActive = idx === activeImageIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-22 sm:w-20 sm:h-28 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-slate-50 flex items-center justify-center ${
                      isActive
                        ? 'border-slate-950 ring-2 ring-slate-950/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-400 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-1"
                      onError={e => {
                        (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(product.categoryId);
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Full-Image Showcase */}
          <div className="flex-1 min-w-0">
            <div
              ref={imageContainerRef}
              onMouseEnter={() => setIsHoverZooming(true)}
              onMouseLeave={() => setIsHoverZooming(false)}
              onMouseMove={handleMouseMove}
              onClick={() => setIsLightboxOpen(true)}
              className="group relative aspect-3/4 sm:aspect-4/5 w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden cursor-zoom-in flex items-center justify-center p-2 shadow-xs"
            >
              {/* Image with Interactive Hover Zoom */}
              <img
                src={currentImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                style={{
                  transformOrigin: isHoverZooming ? `${zoomCoords.x}% ${zoomCoords.y}%` : 'center center',
                  transform: isHoverZooming ? 'scale(1.85)' : 'scale(1)',
                }}
                className="w-full h-full object-contain select-none transition-transform duration-200 ease-out"
                onError={e => {
                  (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(product.categoryId);
                }}
              />

              {/* Top-Right Zoom Hint Badge */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Click to Zoom</span>
              </div>

              {/* Photo Counter Badge */}
              {resolvedImages.length > 1 && (
                <div className="absolute top-3 left-3 bg-slate-900/75 backdrop-blur-md text-white text-[11px] font-mono px-2 py-0.5 rounded-md pointer-events-none">
                  {activeImageIndex + 1} / {resolvedImages.length}
                </div>
              )}

              {/* Slide Navigation Buttons (< and >) - Styled like the reference screenshot bottom right */}
              {resolvedImages.length > 1 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    aria-label="Previous image"
                    onClick={e => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 hover:text-slate-950 flex items-center justify-center shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next image"
                    onClick={e => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-slate-800 hover:text-slate-950 flex items-center justify-center shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
              <ZoomIn className="w-3 h-3" />
              <span>Hover to magnify details or click to open full-screen lightbox</span>
            </p>
          </div>
        </div>

        {/* Purchase & Specifications Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Header & Meta */}
          <div className="space-y-2 border-b border-slate-200 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">{product.categoryName || 'General Catalog'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-400">SKU: {product.productId}</span>
                <span aria-hidden="true">·</span>
                <span className={product.stockQuantity > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                  {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of Stock'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyProductLink}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="Copy unique link to this product"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-serif">
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

          {/* Quick Specifications / Description */}
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
                  type="button"
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
                  type="button"
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
                type="button"
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
                type="button"
                onClick={handleBuyNow}
                disabled={product.stockQuantity === 0}
                className="py-3 px-4 bg-slate-950 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md"
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
              <span><strong>Returns:</strong> 7-day replacement on verified manufacturing defects.</span>
            </div>
          </div>

          {/* Accordion */}
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden text-xs">
            {/* Description Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
                className="w-full py-3 px-4 flex items-center justify-between font-semibold text-slate-900 hover:bg-slate-50 transition-colors text-left"
              >
                <span>Description & Features</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'description' ? 'rotate-180' : ''}`} />
              </button>
              {openAccordion === 'description' && (
                <div className="p-4 bg-slate-50/50 text-slate-600 leading-relaxed border-t border-slate-100">
                  {product.description}
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>100% Genuine product with verified brand authenticity.</li>
                    <li>Premium high-grade materials crafted for durability and performance.</li>
                    <li>Carefully inspected prior to express dispatch.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen High-Resolution Lightbox Zoom Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 select-none animate-fade-in"
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
        >
          {/* Top Bar with Title, Slide indicator, Zoom controls & Close */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 text-white z-20">
            <div>
              <h4 className="text-sm font-semibold truncate max-w-xs sm:max-w-md">{product.name}</h4>
              <p className="text-[11px] text-slate-400">
                Photo {activeImageIndex + 1} of {resolvedImages.length} · {Math.round(lightboxZoom * 100)}%
              </p>
            </div>

            {/* Zoom Controls & Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.5))}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(prev => Math.max(1, prev - 0.5));
                  if (lightboxZoom <= 1.5) setPanOffset({ x: 0, y: 0 });
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Reset Zoom"
              >
                <ResetIcon className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-white/20 mx-1" />

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors"
                title="Close Lightbox (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Full-Resolution Display Canvas */}
          <div
            className="flex-1 flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing p-4"
            onMouseDown={handleMouseDown}
          >
            {/* Prev Image Button */}
            {resolvedImages.length > 1 && (
              <button
                type="button"
                aria-label="Previous image"
                onClick={e => {
                  e.stopPropagation();
                  handlePrevImage();
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="absolute left-6 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* High Resolution Image Container */}
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${lightboxZoom})`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              className="max-h-[85vh] max-w-[85vw] flex items-center justify-center"
            >
              <img
                src={currentImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="max-h-[85vh] max-w-[85vw] object-contain pointer-events-none drop-shadow-2xl"
              />
            </div>

            {/* Next Image Button */}
            {resolvedImages.length > 1 && (
              <button
                type="button"
                aria-label="Next image"
                onClick={e => {
                  e.stopPropagation();
                  handleNextImage();
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="absolute right-6 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {resolvedImages.length > 1 && (
            <div className="flex items-center justify-center gap-3 py-2 z-20">
              {resolvedImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`w-14 h-18 rounded-lg overflow-hidden border-2 transition-all bg-black/40 ${
                    idx === activeImageIndex
                      ? 'border-white scale-110 shadow-lg'
                      : 'border-white/30 hover:border-white/70 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complementary / Related Products */}
      {related.length > 0 && (
        <section className="pt-12 border-t border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-950 font-serif">
              Complementary Hardware & Recommendations
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950"
            >
              Browse All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
