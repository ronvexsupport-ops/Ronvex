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
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Share2,
  Heart,
  Award,
  Lock,
  MessageCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw as ResetIcon,
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
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Normalize images
  const rawImages =
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : [DEFAULT_FALLBACK_IMAGE];

  const resolvedImages = rawImages.map(url =>
    ImageService.resolveProductImage(url, product.categoryId)
  );

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedNotice, setAddedNotice] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Accordion state - default open Description, matching reference
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');

  // Interactive Hover Zoom State
  const [isHoverZooming, setIsHoverZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Lightbox Modal Zoom State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initOffsetX: number; initOffsetY: number }>({
    startX: 0,
    startY: 0,
    initOffsetX: 0,
    initOffsetY: 0,
  });

  const displayPrice = customSellingPrice !== undefined ? customSellingPrice : product.adminBasePrice;
  const currentImage = resolvedImages[activeImageIndex] || resolvedImages[0];

  // Pricing calculations
  const originalPrice = product.originalPrice && product.originalPrice > displayPrice
    ? product.originalPrice
    : undefined;

  const discountPercent = product.discountPercent || (originalPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : undefined);

  // Dynamic SEO setup
  useEffect(() => {
    if (!product) return;
    const cleanSlug = product.slug || product.productId;
    applySEO({
      title: product.name,
      seoTitle: `${product.name} | ${product.brand || 'RONVEX'}`,
      metaDescription: product.description
        ? product.description.slice(0, 160)
        : `Shop ${product.name} at RONVEX. Authentic luxury quality.`,
      ogImage: resolvedImages[0],
      canonicalPath: `/product/${cleanSlug}`,
      type: 'product',
    });
  }, [product, resolvedImages]);

  // Reset index when product changes
  useEffect(() => {
    setActiveImageIndex(0);
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setQuantity(1);
  }, [product.productId]);

  // Keyboard navigation for image controls
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomCoords({ x, y });
  };

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

  const handleOrderNow = () => {
    addToCart(product, quantity, displayPrice);
    onNavigate('checkout');
  };

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

  const toggleAccordion = (section: string) => {
    setOpenAccordion(prev => (prev === section ? null : section));
  };

  // WhatsApp Pre-filled message
  const whatsappNumber = '8801700000000';
  const whatsappMessage = encodeURIComponent(
    `Hello! I am interested in purchasing:\n\n*${product.name}*\nBrand: ${product.brand || 'JAZMIN'}\nSKU: ${product.sku || product.productId}\nPrice: BDT ${displayPrice.toLocaleString()}\n\nCould you please confirm availability and delivery?`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const related = allProducts
    .filter(p => p.productId !== product.productId && (p.categoryId === product.categoryId || p.isActive))
    .slice(0, 4);

  return (
    <div className="bg-white min-h-screen text-slate-900 pb-20">
      {/* Top Banner Notice (Matches Pakistani Lawn / SJ Closet style) */}
      <div className="bg-black text-white text-[11px] sm:text-xs font-semibold tracking-widest py-2 px-4 uppercase text-center flex items-center justify-center gap-4 overflow-x-auto whitespace-nowrap">
        <span>NEW ARRIVALS — SHOP THE LATEST</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">CASH ON DELIVERY AVAILABLE</span>
        <span className="hidden md:inline">·</span>
        <span className="hidden md:inline">NATIONWIDE EXPRESS DISPATCH</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* Breadcrumb Navigation matching screenshot */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-6 flex-wrap">
          <nav className="flex items-center gap-1.5 font-medium">
            <button
              onClick={onBack}
              className="hover:text-slate-950 transition-colors cursor-pointer"
            >
              Home
            </button>
            <span className="text-slate-400">›</span>
            <button
              onClick={onBack}
              className="hover:text-slate-950 transition-colors cursor-pointer capitalize"
            >
              {product.brand || product.categoryName || 'Jazmin'}
            </button>
            <span className="text-slate-400">›</span>
            <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-md">
              {product.name}
            </span>
          </nav>

          <button
            type="button"
            onClick={handleCopyProductLink}
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors"
            title="Share Product"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Main Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: Gallery with Vertical Thumbnails & Hero Image Showcase */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Vertical Thumbnail Strip (Desktop left column, mobile horizontal row) */}
            {resolvedImages.length > 1 && (
              <div className="flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto md:max-h-[680px] shrink-0 py-1 scrollbar-thin">
                {resolvedImages.map((imgUrl, idx) => {
                  const isActive = idx === activeImageIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-22 sm:w-20 sm:h-28 rounded-md overflow-hidden border transition-all shrink-0 bg-slate-50 cursor-pointer ${
                        isActive
                          ? 'border-slate-950 ring-2 ring-slate-950/20 shadow-sm'
                          : 'border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt={`Angle ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(product.categoryId);
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main Showcase Hero Image */}
            <div className="flex-1 min-w-0">
              <div
                ref={imageContainerRef}
                onMouseEnter={() => setIsHoverZooming(true)}
                onMouseLeave={() => setIsHoverZooming(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setIsLightboxOpen(true)}
                className="group relative aspect-3/4 sm:aspect-4/5 w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden cursor-zoom-in flex items-center justify-center shadow-xs"
              >
                {/* Discount Percentage Pill in Top Left (e.g. -16%) matching screenshot */}
                {discountPercent && discountPercent > 0 && (
                  <div className="absolute top-4 left-4 z-10 bg-black text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide shadow-sm pointer-events-none">
                    -{discountPercent}%
                  </div>
                )}

                {/* Primary Image with Magnification */}
                <img
                  src={currentImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  style={{
                    transformOrigin: isHoverZooming ? `${zoomCoords.x}% ${zoomCoords.y}%` : 'center center',
                    transform: isHoverZooming ? 'scale(1.75)' : 'scale(1)',
                  }}
                  className="w-full h-full object-cover select-none transition-transform duration-200 ease-out"
                  onError={e => {
                    (e.target as HTMLImageElement).src = ImageService.getCategoryFallback(product.categoryId);
                  }}
                />

                {/* Bottom Right Carousel Navigation Buttons (< and >) in white circles */}
                {resolvedImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
                    <button
                      type="button"
                      aria-label="Previous image"
                      onClick={e => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      className="w-9 h-9 rounded-full bg-white text-slate-800 hover:text-slate-950 flex items-center justify-center shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
                      className="w-9 h-9 rounded-full bg-white text-slate-800 hover:text-slate-950 flex items-center justify-center shadow-md border border-slate-200 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile photo indicator dots */}
              {resolvedImages.length > 1 && (
                <div className="flex md:hidden items-center justify-center gap-1.5 mt-3">
                  {resolvedImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImageIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === activeImageIndex ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300'
                      }`}
                      aria-label={`Jump to photo ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Product Attributes, Pricing, Actions & Accordions */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-12">
            {/* Brand Title in Uppercase (e.g. JAZMIN) */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                {product.brand || 'JAZMIN'}
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-950 font-serif mt-1">
                {product.name}
              </h1>

              {/* SKU */}
              <div className="text-xs font-mono text-slate-500 mt-1 uppercase">
                SKU: {product.sku || product.productId}
              </div>
            </div>

            {/* Pricing Section with Strike-through */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-950 font-mono tracking-tight">
                BDT {displayPrice.toLocaleString()}.00
              </span>
              {originalPrice && (
                <span className="line-through text-slate-400 font-mono text-base sm:text-lg">
                  BDT {originalPrice.toLocaleString()}.00
                </span>
              )}
            </div>

            {/* Variant / Stitching Attribute Pill (e.g. Unstitched) */}
            <div>
              <span className="inline-block px-4 py-1 text-xs font-medium text-slate-800 bg-slate-100/90 border border-slate-300 rounded-full">
                {product.stitchingType || 'Unstitched'}
              </span>
            </div>

            {/* Stock Urgency indicator matching screenshot (Only 1 left in stock) */}
            <div className="text-xs font-medium text-amber-600">
              {product.stockUrgencyText ||
                (product.stockQuantity <= 3 && product.stockQuantity > 0
                  ? `Only ${product.stockQuantity} left in stock`
                  : product.stockQuantity > 0
                  ? `${product.stockQuantity} in stock · Ready for dispatch`
                  : 'Currently Out of Stock')}
            </div>

            {/* Quantity Selector, Add to cart, and Wishlist Row */}
            <div className="space-y-2 pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                QUANTITY
              </label>

              <div className="flex items-center gap-3">
                {/* Stepper with rounded pill */}
                <div className="inline-flex items-center border border-slate-300 rounded-full bg-white px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-1.5 text-slate-600 hover:text-slate-950 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-mono font-bold text-slate-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))}
                    disabled={quantity >= product.stockQuantity}
                    className="p-1.5 text-slate-600 hover:text-slate-950 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-slate-900 text-slate-900 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to cart</span>
                    </>
                  )}
                </button>

                {/* Wishlist Heart Icon */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  aria-label="Add to wishlist"
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    isWishlisted
                      ? 'border-rose-500 bg-rose-50 text-rose-600'
                      : 'border-slate-300 text-slate-600 hover:border-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Prominent Vivid Purple "Order now" CTA matching screenshot */}
            <div>
              <button
                type="button"
                onClick={handleOrderNow}
                disabled={product.stockQuantity === 0}
                className="w-full py-3.5 px-6 rounded-full font-bold text-sm sm:text-base text-white bg-[#9333ea] hover:bg-[#8326db] active:scale-[0.99] transition-all shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Order now</span>
              </button>
            </div>

            {/* 3 Value Propositions with Clean Line Icons matching screenshot */}
            <div className="grid grid-cols-3 gap-2 pt-2 pb-2 text-center text-xs text-slate-700">
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg">
                <Truck className="w-5 h-5 text-slate-800 stroke-[1.5]" />
                <span className="text-[11px] font-medium leading-tight">Nationwide Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-slate-800 stroke-[1.5]" />
                <span className="text-[11px] font-medium leading-tight">Safe Payment</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg">
                <Award className="w-5 h-5 text-slate-800 stroke-[1.5]" />
                <span className="text-[11px] font-medium leading-tight">Assured Quality</span>
              </div>
            </div>

            {/* 4 Collapsible Accordions matching screenshot */}
            <div className="space-y-2 pt-1 text-xs">
              {/* 1. Description Accordion */}
              <div className="border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => toggleAccordion('description')}
                  className="w-full py-3.5 px-1 flex items-center justify-between font-semibold text-slate-900 hover:text-slate-700 transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs sm:text-sm">Description</span>
                  <span className="text-slate-500 text-base font-mono">
                    {openAccordion === 'description' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'description' && (
                  <div className="pb-4 px-1 text-slate-600 leading-relaxed text-xs space-y-2 animate-fade-in">
                    <p>{product.description}</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      <li>3-Piece Complete Suit (Shirt, Dupatta & Trousers).</li>
                      <li>High quality pure lawn fabric with detailed finish.</li>
                      <li>Includes verified brand authenticity packaging.</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 2. Disclaimer Accordion */}
              <div className="border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => toggleAccordion('disclaimer')}
                  className="w-full py-3.5 px-1 flex items-center justify-between font-semibold text-slate-900 hover:text-slate-700 transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs sm:text-sm">Disclaimer</span>
                  <span className="text-slate-500 text-base font-mono">
                    {openAccordion === 'disclaimer' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'disclaimer' && (
                  <div className="pb-4 px-1 text-slate-600 leading-relaxed text-xs animate-fade-in">
                    <p>
                      {product.disclaimer ||
                        'Product color may slightly vary due to photographic lighting sources or your device monitor settings. Dry clean only recommended. Do not bleach.'}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Return & Exchange Accordion */}
              <div className="border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => toggleAccordion('return')}
                  className="w-full py-3.5 px-1 flex items-center justify-between font-semibold text-slate-900 hover:text-slate-700 transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs sm:text-sm">Return & Exchange</span>
                  <span className="text-slate-500 text-base font-mono">
                    {openAccordion === 'return' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'return' && (
                  <div className="pb-4 px-1 text-slate-600 leading-relaxed text-xs animate-fade-in">
                    <p>
                      {product.returnPolicy ||
                        'Any product purchased online can be exchanged within 7 days from the delivery date, provided it is unused, unwashed, with all original tags attached and packaging intact.'}
                    </p>
                  </div>
                )}
              </div>

              {/* 4. Shipping Policy Accordion */}
              <div className="border-t border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full py-3.5 px-1 flex items-center justify-between font-semibold text-slate-900 hover:text-slate-700 transition-colors text-left cursor-pointer"
                >
                  <span className="text-xs sm:text-sm">Shipping Policy</span>
                  <span className="text-slate-500 text-base font-mono">
                    {openAccordion === 'shipping' ? '−' : '+'}
                  </span>
                </button>
                {openAccordion === 'shipping' && (
                  <div className="pb-4 px-1 text-slate-600 leading-relaxed text-xs animate-fade-in">
                    <p>
                      {product.shippingPolicy ||
                        'Nationwide delivery across all 64 districts in Bangladesh. Inside Dhaka: 24–48 hours (৳80). Outside Dhaka: 48–72 hours (৳150). Cash on delivery available at your doorstep with parcel verification before final payment.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like / Related Catalog Section */}
        {related.length > 0 && (
          <div className="mt-20 pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recommended For You
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-950 mt-1">
                  Similar Designer Ensembles
                </h2>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 transition-colors"
              >
                View Full Collection →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map(rel => (
                <ProductCard
                  key={rel.productId}
                  product={rel}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating WhatsApp Action Button in Bottom-Right Corner (matching reference screenshot) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer ring-4 ring-white/30"
        title="Chat with our stylist on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 fill-white text-[#25D366]" />
      </a>

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
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
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
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
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
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <ResetIcon className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-white/20 mx-1" />

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white transition-colors cursor-pointer"
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
                className="absolute left-6 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
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
                className="absolute right-6 z-20 w-12 h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
