import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProductReview, ProductRatingSummary } from '../types';

const REVIEWS_STORAGE_PREFIX = 'ronvex_reviews_';
const VOTED_REVIEWS_KEY = 'ronvex_voted_reviews';

// Starter authentic reviews for initial catalog items
const STARTER_REVIEWS: Record<string, Omit<ProductReview, 'reviewId' | 'createdAt'>[]> = {
  // Pakistani Lawn Suit
  defaultLawn: [
    {
      productId: '',
      productName: 'Embroidered Lawn Collection',
      rating: 5,
      title: 'Exquisite embroidery & authentic fabric quality!',
      comment:
        'The lawn fabric is incredibly breathable and lightweight. The zari & resham threadwork on the neckline and sleeves is neat and luxurious. Dupatta is full length and prints are identical to the product catalog photos.',
      authorName: 'Nusrat Jahan',
      verifiedPurchase: true,
      helpfulCount: 18,
    },
    {
      productId: '',
      productName: 'Embroidered Lawn Collection',
      rating: 5,
      title: 'Received within 24 hours in Dhaka!',
      comment:
        'Delivery was remarkably fast and COD parcel was checked before payment. Color is vibrant magenta, exactly as pictured on model. Definitely ordering another 3-piece suit from Jazmin collection.',
      authorName: 'Sadia Rahman',
      verifiedPurchase: true,
      helpfulCount: 9,
    },
    {
      productId: '',
      productName: 'Embroidered Lawn Collection',
      rating: 4,
      title: 'Great craftsmanship and generous fabric cut',
      comment:
        'More than enough fabric provided for custom stitching and bell sleeves. High quality lawn that softened even more after first delicate cold wash. Very pleased with the brand authenticity.',
      authorName: 'Farhana Akter',
      verifiedPurchase: true,
      helpfulCount: 4,
    },
  ],
  // Electronics & Gadgets
  defaultTech: [
    {
      productId: '',
      productName: 'RONVEX Lifestyle Tech',
      rating: 5,
      title: 'Outstanding build quality and fast charging',
      comment:
        'Exceeded my expectations! Battery life lasts comfortably for 2 full days of heavy usage. Premium aluminum feel and clean packaging.',
      authorName: 'Tanvir Hossain',
      verifiedPurchase: true,
      helpfulCount: 12,
    },
    {
      productId: '',
      productName: 'RONVEX Lifestyle Tech',
      rating: 5,
      title: 'Best purchase in this price range',
      comment:
        'Crystal clear acoustics, seamless Bluetooth pairing with iOS and Android, and solid customer warranty support.',
      authorName: 'Mahmudul Hasan',
      verifiedPurchase: true,
      helpfulCount: 7,
    },
  ],
};

export class ReviewService {
  /**
   * Fetches reviews for a given product ID from Firestore with fallback to cached/starter reviews.
   */
  static async getReviews(productId: string, productName?: string): Promise<ProductReview[]> {
    if (!productId) return [];

    let firestoreReviews: ProductReview[] = [];

    try {
      const reviewsCol = collection(db, 'reviews');
      const q = query(reviewsCol, where('productId', '==', productId));
      const snapshot = await getDocs(q);

      firestoreReviews = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          reviewId: docSnap.id,
          productId: data.productId || productId,
          productName: data.productName || productName || '',
          rating: Number(data.rating) || 5,
          title: data.title || '',
          comment: data.comment || '',
          authorName: data.authorName || 'Verified Shopper',
          authorEmail: data.authorEmail || '',
          verifiedPurchase: data.verifiedPurchase !== false,
          helpfulCount: Number(data.helpfulCount) || 0,
          createdAt: data.createdAt || new Date().toISOString(),
        } as ProductReview;
      });

      // Sort descending by date
      firestoreReviews.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (err) {
      console.warn('Could not load reviews directly from Firestore, falling back to cache:', err);
    }

    // Check local storage for any locally added reviews
    const cachedStr = localStorage.getItem(`${REVIEWS_STORAGE_PREFIX}${productId}`);
    const localCachedReviews: ProductReview[] = cachedStr ? JSON.parse(cachedStr) : [];

    // Merge Firestore reviews and local reviews by reviewId
    const reviewMap = new Map<string, ProductReview>();
    localCachedReviews.forEach(r => reviewMap.set(r.reviewId, r));
    firestoreReviews.forEach(r => reviewMap.set(r.reviewId, r));

    let finalReviews = Array.from(reviewMap.values());

    // If no reviews exist yet for this product, provide realistic starter reviews
    if (finalReviews.length === 0) {
      const isTech =
        (productName && /watch|pod|audio|charger|phone|headset/i.test(productName)) ||
        /gadget|tech|electronics/i.test(productId);
      const starters = isTech ? STARTER_REVIEWS.defaultTech : STARTER_REVIEWS.defaultLawn;

      finalReviews = starters.map((starter, idx) => ({
        ...starter,
        reviewId: `starter_${productId}_${idx}`,
        productId,
        productName: productName || 'Catalog Ensemble',
        createdAt: new Date(Date.now() - (idx * 2 + 1) * 86400000 * 3).toISOString(),
      }));

      // Cache starter set in localStorage
      localStorage.setItem(
        `${REVIEWS_STORAGE_PREFIX}${productId}`,
        JSON.stringify(finalReviews)
      );
    }

    return finalReviews.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Submits a new review to Firestore and updates local cache immediately.
   */
  static async addReview(
    input: Omit<ProductReview, 'reviewId' | 'createdAt'>
  ): Promise<ProductReview> {
    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    const newReview: ProductReview = {
      reviewId,
      productId: input.productId,
      productName: input.productName || '',
      rating: Math.max(1, Math.min(5, Math.round(input.rating))),
      title: input.title.trim(),
      comment: input.comment.trim(),
      authorName: input.authorName.trim() || 'Verified Customer',
      authorEmail: input.authorEmail ? input.authorEmail.trim() : '',
      verifiedPurchase: input.verifiedPurchase ?? true,
      helpfulCount: 0,
      createdAt,
    };

    // Sanitize for Firestore
    const firestoreData: Record<string, unknown> = {
      reviewId: newReview.reviewId,
      productId: newReview.productId,
      productName: newReview.productName,
      rating: newReview.rating,
      title: newReview.title,
      comment: newReview.comment,
      authorName: newReview.authorName,
      verifiedPurchase: newReview.verifiedPurchase,
      helpfulCount: newReview.helpfulCount,
      createdAt: newReview.createdAt,
    };

    if (newReview.authorEmail) {
      firestoreData.authorEmail = newReview.authorEmail;
    }

    // Save to Firestore
    try {
      const reviewDocRef = doc(db, 'reviews', reviewId);
      await setDoc(reviewDocRef, firestoreData);
    } catch (err) {
      console.warn('Firestore write warning (caching locally):', err);
    }

    // Update local cache
    try {
      const cachedStr = localStorage.getItem(`${REVIEWS_STORAGE_PREFIX}${input.productId}`);
      const list: ProductReview[] = cachedStr ? JSON.parse(cachedStr) : [];
      list.unshift(newReview);
      localStorage.setItem(`${REVIEWS_STORAGE_PREFIX}${input.productId}`, JSON.stringify(list));
    } catch (err) {
      console.error('Failed to update local storage review cache:', err);
    }

    return newReview;
  }

  /**
   * Vote a review as helpful, incrementing helpfulCount in Firestore and local state.
   */
  static async voteHelpful(reviewId: string, productId: string): Promise<boolean> {
    const votedReviews: string[] = JSON.parse(
      localStorage.getItem(VOTED_REVIEWS_KEY) || '[]'
    );

    if (votedReviews.includes(reviewId)) {
      return false; // Already voted
    }

    // Mark as voted in localStorage
    votedReviews.push(reviewId);
    localStorage.setItem(VOTED_REVIEWS_KEY, JSON.stringify(votedReviews));

    // Try updating in Firestore
    try {
      if (!reviewId.startsWith('starter_')) {
        const reviewDocRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewDocRef, {
          helpfulCount: increment(1),
        });
      }
    } catch (err) {
      console.warn('Could not increment helpfulCount on Firestore:', err);
    }

    // Also update local cache
    try {
      const cachedStr = localStorage.getItem(`${REVIEWS_STORAGE_PREFIX}${productId}`);
      if (cachedStr) {
        const list: ProductReview[] = JSON.parse(cachedStr);
        const item = list.find(r => r.reviewId === reviewId);
        if (item) {
          item.helpfulCount = (item.helpfulCount || 0) + 1;
          localStorage.setItem(`${REVIEWS_STORAGE_PREFIX}${productId}`, JSON.stringify(list));
        }
      }
    } catch {
      // non-blocking
    }

    return true;
  }

  /**
   * Check if the user has already voted on a review
   */
  static hasVotedHelpful(reviewId: string): boolean {
    const votedReviews: string[] = JSON.parse(
      localStorage.getItem(VOTED_REVIEWS_KEY) || '[]'
    );
    return votedReviews.includes(reviewId);
  }

  /**
   * Calculate summary metrics from an array of reviews
   */
  static calculateRatingSummary(reviews: ProductReview[]): ProductRatingSummary {
    if (!reviews || reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        starDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const starDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number } = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalScore = 0;

    reviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      starDistribution[star] = (starDistribution[star] || 0) + 1;
      totalScore += r.rating;
    });

    const averageRating = Number((totalScore / reviews.length).toFixed(1));

    return {
      averageRating,
      totalReviews: reviews.length,
      starDistribution,
    };
  }
}
