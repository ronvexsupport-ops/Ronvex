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
  ZoomIn,
  ZoomOut,
  RotateCcw as ResetIcon,
  Star,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  User,
  Sparkles,
} from 'lucide-react';
import { Product, ProductReview, ProductRatingSummary } from '../types';
import { PricingEngine } from '../services/pricingEngine';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ImageService, DEFAULT_FALLBACK_IMAGE } from '../services/imageService';
import { ReviewService } from '../services/reviewService';
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
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.productId);
  const [quantity, setQuantity] = useState(1);

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

  // Reviews & Rating System State
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [votedReviewIds, setVotedReviewIds] = useState<Set<string>>(new Set());

  // Form Fields
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAuthorName, setReviewAuthorName] = useState('');
  const [reviewAuthorEmail, setReviewAuthorEmail] = useState('');
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);

  // Review Filter & Sort State
  const [reviewFilterRating, setReviewFilterRating] = useState<number | 'ALL'>('ALL');
  const [reviewSortBy, setReviewSortBy] = useState<'NEWEST' | 'HIGHEST' | 'HELPFUL'>('NEWEST');

  const reviewsSectionRef = useRef<HTMLDivElement>(null);

  // Load reviews on product mount or change
  useEffect(() => {
    let isMounted = true;
    setIsLoadingReviews(true);
    ReviewService.getReviews(product.productId, product.name).then(res => {
      if (isMounted) {
        setReviews(res);
        setIsLoadingReviews(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [product.productId, product.name]);

  // Derived rating metrics
  const ratingSummary: ProductRatingSummary = ReviewService.calculateRatingSummary(reviews);

  const scrollToReviews = () => {
    if (reviewsSectionRef.current) {
      reviewsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewFormError('Please select a star rating from 1 to 5.');
      return;
    }
    if (!reviewTitle.trim()) {
      setReviewFormError('Please provide a short headline for your review.');
      return;
    }
    if (!reviewComment.trim()) {
      setReviewFormError('Please write your review feedback.');
      return;
    }
    if (!reviewAuthorName.trim()) {
      setReviewFormError('Please enter your name.');
      return;
    }

    setReviewFormError(null);
    setIsSubmittingReview(true);

    try {
      const created = await ReviewService.addReview({
        productId: product.productId,
        productName: product.name,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
        authorName: reviewAuthorName.trim(),
        authorEmail: reviewAuthorEmail.trim() || undefined,
        verifiedPurchase: true,
      });

      setReviews(prev => [created, ...prev]);
      setReviewTitle('');
      setReviewComment('');
      setReviewAuthorEmail('');
      setIsReviewFormOpen(false);
      setReviewSuccessMsg('Thank you! Your review and rating have been posted successfully.');
      setTimeout(() => setReviewSuccessMsg(null), 5000);
    } catch {
      setReviewFormError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    if (votedReviewIds.has(reviewId) || ReviewService.hasVotedHelpful(reviewId)) {
      return;
    }
    const success = await ReviewService.voteHelpful(reviewId, product.productId);
    if (success) {
      setVotedReviewIds(prev => new Set(prev).add(reviewId));
      setReviews(prev =>
        prev.map(r => (r.reviewId === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r))
      );
    }
  };

  // Filtered and sorted reviews
  const filteredReviews = reviews
    .filter(r => (reviewFilterRating === 'ALL' ? true : Math.round(r.rating) === reviewFilterRating))
    .sort((a, b) => {
      if (reviewSortBy === 'HIGHEST') {
        return b.rating - a.rating;
      }
      if (reviewSortBy === 'HELPFUL') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

  const related = allProducts
    .filter(p => p.productId !== product.productId && (p.categoryId === product.categoryId || p.isActive))
    .slice(0, 4);

  return (
    <div className="bg-white min-h-screen text-slate-900 pb-20">
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

              {/* Star Rating Summary */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        star <= Math.round(ratingSummary.averageRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="text-xs font-semibold text-slate-700 hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="font-bold text-slate-950 font-mono">
                    {ratingSummary.totalReviews > 0 ? ratingSummary.averageRating.toFixed(1) : '5.0'}
                  </span>
                  <span className="text-slate-500">
                    ({ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </button>
                <span className="text-slate-300 text-xs">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewFormOpen(true);
                    scrollToReviews();
                  }}
                  className="text-xs font-medium text-purple-700 hover:text-purple-900 underline underline-offset-2 cursor-pointer"
                >
                  Write a review
                </button>
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
                  onClick={() => toggleWishlist(product)}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
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

        {/* ========================================================================= */}
        {/* CUSTOMER REVIEWS & RATINGS SECTION */}
        {/* ========================================================================= */}
        <section ref={reviewsSectionRef} id="customer-reviews" className="mt-16 pt-10 border-t border-slate-200">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  Verified Customer Feedback
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? 'Review' : 'Reviews'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950">
                Customer Reviews & Ratings
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Real feedback from customers who purchased and styled this ensemble.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsReviewFormOpen(prev => !prev);
                setReviewFormError(null);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isReviewFormOpen ? 'Close Review Form' : 'Write a Customer Review'}</span>
            </button>
          </div>

          {/* Success Notification Alert */}
          {reviewSuccessMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs sm:text-sm font-medium">{reviewSuccessMsg}</div>
            </div>
          )}

          {/* Expandable Write a Review Form */}
          {isReviewFormOpen && (
            <div className="mb-10 bg-slate-50/80 border-2 border-purple-100 rounded-2xl p-5 sm:p-8 shadow-xs animate-fade-in">
              <div className="max-w-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      Share Your Experience
                    </h3>
                    <p className="text-xs text-slate-500">
                      Reviewing: <span className="font-semibold text-slate-800">{product.name}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsReviewFormOpen(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  {/* Interactive Star Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Overall Rating <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => {
                          const activeLevel = reviewHoverRating || reviewRating;
                          const isFilled = star <= activeLevel;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              onMouseEnter={() => setReviewHoverRating(star)}
                              onMouseLeave={() => setReviewHoverRating(0)}
                              className="p-1 text-slate-300 hover:scale-115 transition-transform cursor-pointer focus:outline-hidden"
                              title={`${star} star`}
                            >
                              <Star
                                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                                  isFilled ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 ml-2">
                        {reviewHoverRating === 5 || (!reviewHoverRating && reviewRating === 5)
                          ? '5 Stars — Exceptional Quality & Authentic Fabric'
                          : reviewHoverRating === 4 || (!reviewHoverRating && reviewRating === 4)
                          ? '4 Stars — Very Good, Highly Recommended'
                          : reviewHoverRating === 3 || (!reviewHoverRating && reviewRating === 3)
                          ? '3 Stars — Average / Satisfactory'
                          : reviewHoverRating === 2 || (!reviewHoverRating && reviewRating === 2)
                          ? '2 Stars — Below Expectations'
                          : '1 Star — Disappointed'}
                      </span>
                    </div>
                  </div>

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Your Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={reviewAuthorName}
                        onChange={e => setReviewAuthorName(e.target.value)}
                        placeholder="e.g. Farhana Rahman"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Email Address <span className="text-slate-400 font-normal">(Optional, private)</span>
                      </label>
                      <input
                        type="email"
                        value={reviewAuthorEmail}
                        onChange={e => setReviewAuthorEmail(e.target.value)}
                        placeholder="e.g. farhana@example.com"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-slate-900 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Review Headline / Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Review Headline <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      placeholder="e.g. Vibrant lawn colors and exquisitely detailed embroidery"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {/* Review Text Comments */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Detailed Review <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      placeholder="Tell other shoppers about the lawn fabric feel, embroidery stitch accuracy, dupatta drape, sizing accuracy, and delivery experience..."
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 text-slate-900 placeholder:text-slate-400 leading-relaxed"
                    />
                  </div>

                  {/* Form Error Banner */}
                  {reviewFormError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                      {reviewFormError}
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="px-6 py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-sm cursor-pointer transition-all flex items-center gap-2"
                    >
                      {isSubmittingReview ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Publishing Review...</span>
                        </>
                      ) : (
                        <span>Publish Review</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsReviewFormOpen(false)}
                      className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rating Summary Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 sm:p-6 mb-8">
            {/* Left Card: Score & Stars */}
            <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start md:border-r md:border-slate-200 md:pr-6 text-center md:text-left">
              <div className="text-4xl sm:text-5xl font-black text-slate-950 font-mono tracking-tight">
                {ratingSummary.totalReviews > 0 ? ratingSummary.averageRating.toFixed(1) : '5.0'}
                <span className="text-xl sm:text-2xl text-slate-400 font-normal"> / 5.0</span>
              </div>

              <div className="flex items-center gap-1 text-amber-400 my-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(ratingSummary.averageRating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="text-xs font-semibold text-slate-700">
                Based on {ratingSummary.totalReviews} verified customer {ratingSummary.totalReviews === 1 ? 'review' : 'reviews'}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>98% of buyers recommend this product</span>
              </div>
            </div>

            {/* Middle Card: Rating Distribution Breakdown */}
            <div className="md:col-span-5 space-y-2 flex flex-col justify-center md:px-2">
              {[5, 4, 3, 2, 1].map(starNum => {
                const count = ratingSummary.starDistribution[starNum as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage =
                  ratingSummary.totalReviews > 0
                    ? Math.round((count / ratingSummary.totalReviews) * 100)
                    : 0;
                const isSelected = reviewFilterRating === starNum;

                return (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() =>
                      setReviewFilterRating(prev => (prev === starNum ? 'ALL' : starNum))
                    }
                    className={`group w-full flex items-center gap-3 text-xs text-left cursor-pointer transition-colors p-1 rounded-md ${
                      isSelected ? 'bg-purple-100/60 font-semibold' : 'hover:bg-slate-200/50'
                    }`}
                    title={`Filter by ${starNum} star reviews`}
                  >
                    <span className="w-12 text-slate-700 shrink-0 font-medium flex items-center gap-1">
                      <span>{starNum}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>

                    {/* Bar */}
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <span className="w-16 text-right font-mono text-[11px] text-slate-500 shrink-0 tabular-nums">
                      {percentage}% ({count})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Card: Customer Guarantees & Quick CTA */}
            <div className="md:col-span-3 flex flex-col justify-center items-center md:items-start text-center md:text-left md:border-l md:border-slate-200 md:pl-6 space-y-3 pt-4 md:pt-0 border-t md:border-t-0 border-slate-200">
              <div className="text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span className="font-semibold text-slate-900">100% Genuine Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>7-Day Easy Exchange</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-700 shrink-0" />
                  <span>Doorstep Parcel Check</span>
                </div>
              </div>

              {!isReviewFormOpen && (
                <button
                  type="button"
                  onClick={() => setIsReviewFormOpen(true)}
                  className="w-full mt-2 py-2 px-4 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-900 text-xs font-bold transition-all shadow-2xs hover:bg-slate-50 cursor-pointer"
                >
                  Rate This Ensemble
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills & Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
            {/* Filter by Stars */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setReviewFilterRating('ALL')}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer shrink-0 ${
                  reviewFilterRating === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({ratingSummary.totalReviews})
              </button>
              {[5, 4, 3, 2, 1].map(starNum => {
                const count = ratingSummary.starDistribution[starNum as 1 | 2 | 3 | 4 | 5] || 0;
                if (count === 0 && reviewFilterRating !== starNum) return null;
                const isSelected = reviewFilterRating === starNum;
                return (
                  <button
                    key={starNum}
                    type="button"
                    onClick={() => setReviewFilterRating(starNum)}
                    className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                      isSelected
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{starNum}★</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs text-slate-400 font-medium">Sort by:</span>
              <select
                value={reviewSortBy}
                onChange={e =>
                  setReviewSortBy(e.target.value as 'NEWEST' | 'HIGHEST' | 'HELPFUL')
                }
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:border-purple-600 cursor-pointer"
              >
                <option value="NEWEST">Most Recent</option>
                <option value="HIGHEST">Highest Rating</option>
                <option value="HELPFUL">Most Helpful</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {isLoadingReviews ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading authentic customer reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                No reviews found for this rating filter
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting "All" to view all customer reviews.
              </p>
              <button
                type="button"
                onClick={() => setReviewFilterRating('ALL')}
                className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-300 hover:border-slate-400 text-slate-800 cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map(rev => {
                const isVoted =
                  votedReviewIds.has(rev.reviewId) || ReviewService.hasVotedHelpful(rev.reviewId);
                const initials = rev.authorName
                  ? rev.authorName
                      .split(' ')
                      .map(p => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'VC';

                const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={rev.reviewId}
                    className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 transition-colors shadow-2xs"
                  >
                    {/* Top Row: User Avatar, Name, Verified Badge, Date */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-700 to-indigo-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {initials}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {rev.authorName}
                            </span>
                            {rev.verifiedPurchase && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified Buyer</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{formattedDate}</div>
                        </div>
                      </div>

                      {/* Helpful Button in top-right or bottom */}
                      <button
                        type="button"
                        onClick={() => handleVoteHelpful(rev.reviewId)}
                        disabled={isVoted}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          isVoted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                        title={isVoted ? 'You marked this helpful' : 'Mark this review as helpful'}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${isVoted ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                        <span>{isVoted ? 'Helpful' : 'Helpful'}</span>
                        <span className="font-mono text-[11px]">({rev.helpfulCount || 0})</span>
                      </button>
                    </div>

                    {/* Star Rating & Headline */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {rev.title}
                      </h4>
                    </div>

                    {/* Review Body */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {rev.comment}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
