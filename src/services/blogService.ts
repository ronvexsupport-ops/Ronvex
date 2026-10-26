import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { BlogPost } from '../types';
import { CMSService } from './cmsService';

const BLOG_POSTS_LOCAL_KEY = 'ronvex_blog_posts_cache';

export const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    postId: 'post_1',
    slug: 'best-smartwatches-in-bangladesh-2026',
    title: 'Best Smartwatches in Bangladesh: 2026 Buyer’s Guide',
    excerpt: 'Explore top-performing AMOLED smartwatches with Bluetooth calling, health tracking, and IP68 waterproof ratings for Bangladeshi lifestyle.',
    bodyContent: `## Navigating Smart Wearables in 2026

Smartwatches have evolved from simple step trackers into indispensable personal assistants. Whether you are navigating Dhaka traffic, monitoring daily fitness, or handling business calls on the go, choosing the right smartwatch makes all the difference.

### 1. Display Clarity Under Direct Sunlight
With Bangladesh's bright tropical climate, AMOLED displays with at least 600 nits peak brightness are essential. Look for always-on display features and scratch-resistant curved glass.

### 2. Reliable Bluetooth Calling
A dedicated microphone with environmental noise cancellation ensures your voice comes through clearly even on busy streets like Mirpur Road or Karwan Bazar.

### 3. Battery Life & Standby
Nobody wants a watch that dies by 4 PM. Opt for models delivering a minimum of 5 to 7 days of typical usage on a single charge.

### The RONVEX Titan Difference
Engineered specifically for everyday durability, the **RONVEX Titan AMOLED Smartwatch** combines aircraft-grade zinc alloy, continuous SpO2 biometric monitoring, and comprehensive IP68 water resistance.`,
    featuredImageUrl: '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg',
    author: 'RONVEX Editorial',
    publicationDate: '2026-03-15',
    isPublished: true,
    category: 'Guides',
    tags: ['Smartwatch', 'Bangladesh', 'Tech Guide', 'Wearables'],
    seoTitle: 'Best Smartwatches in Bangladesh 2026 | RONVEX Guide',
    metaDescription: 'Find the best smartwatches in Bangladesh with AMOLED displays, Bluetooth calling, and nationwide cash on delivery.',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
    updatedBy: 'RONVEX Editorial',
  },
  {
    postId: 'post_2',
    slug: 'aerobeat-pro-ultimate-anc-audio-experience',
    title: 'AeroBeat Pro: The Ultimate ANC Wireless Audio Experience',
    excerpt: 'Discover how active noise cancellation and custom 13mm dynamic drivers bring studio-grade sound to your daily commute.',
    bodyContent: `## Immersive Sound Engineered for Daily Commutes

Whether you are traveling on the metro rail or working in a bustling café, ambient noise can ruin your listening experience. The **AeroBeat Pro** was engineered from the ground up to solve this.

### Dual-Mic Hybrid ANC
By capturing noise from both outside and inside the acoustic chamber, AeroBeat Pro counters up to 35dB of low-frequency rumble, letting your favorite tracks take center stage.

### Ultra-Low Latency for Mobile Gaming
With a dedicated 45ms gaming mode, audio and visual cues sync seamlessly for competitive mobile gaming sessions.

### Ergonomic Featherweight Design
Each earbud weighs just 4.1 grams, contoured to sit snugly inside the ear canal for hours of fatigue-free listening.`,
    featuredImageUrl: '/src/assets/images/ronvex_lifestyle_audio_1792837016254.jpg',
    author: 'Acoustics Team',
    publicationDate: '2026-03-20',
    isPublished: true,
    category: 'Product Focus',
    tags: ['Earbuds', 'ANC', 'Audio', 'RONVEX'],
    seoTitle: 'AeroBeat Pro ANC Wireless Earbuds | Deep Dive',
    metaDescription: 'Read the in-depth review of AeroBeat Pro hybrid active noise cancellation wireless earbuds with 13mm drivers.',
    createdAt: '2026-03-20T12:00:00.000Z',
    updatedAt: '2026-03-20T12:00:00.000Z',
    updatedBy: 'RONVEX Editorial',
  },
];

function getLocalPosts(): BlogPost[] {
  try {
    const raw = localStorage.getItem(BLOG_POSTS_LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return INITIAL_BLOG_POSTS;
}

function setLocalPosts(posts: BlogPost[]): void {
  try {
    localStorage.setItem(BLOG_POSTS_LOCAL_KEY, JSON.stringify(posts));
  } catch (e) {
    // ignore
  }
}

export class BlogService {
  /**
   * Fetches all blog posts (both published and drafts) from Firestore.
   */
  static async getPosts(): Promise<BlogPost[]> {
    try {
      const snap = await getDocs(collection(db, 'posts'));
      if (!snap.empty) {
        const posts = snap.docs.map(d => d.data() as BlogPost);
        posts.sort((a, b) => (b.publicationDate || b.createdAt).localeCompare(a.publicationDate || a.createdAt));
        setLocalPosts(posts);
        return posts;
      }
    } catch (err) {
      console.warn('BlogService: Error loading posts from Firestore, checking local cache:', err);
    }
    return getLocalPosts();
  }

  /**
   * Fetches only published blog posts for public visitors.
   */
  static async getPublishedPosts(): Promise<BlogPost[]> {
    const all = await this.getPosts();
    return all.filter(p => p.isPublished);
  }

  /**
   * Fetches a single post by slug from Firestore.
   */
  static async getPostBySlug(slug: string): Promise<BlogPost | null> {
    const cleanSlug = slug.toLowerCase().trim();
    try {
      // 1. Direct doc lookup if doc ID is slug or postId
      const snapDirect = await getDoc(doc(db, 'posts', cleanSlug));
      if (snapDirect.exists()) {
        return snapDirect.data() as BlogPost;
      }

      // 2. Scan posts collection
      const snap = await getDocs(collection(db, 'posts'));
      if (!snap.empty) {
        const found = snap.docs
          .map(d => d.data() as BlogPost)
          .find(p => p.slug.toLowerCase() === cleanSlug);
        if (found) return found;
      }
    } catch (err) {
      console.warn('BlogService: Error fetching post by slug:', err);
    }

    // 3. Fallback to local cache
    const local = getLocalPosts();
    return local.find(p => p.slug.toLowerCase() === cleanSlug) || null;
  }

  /**
   * Saves or updates a blog post persistently in Firestore.
   */
  static async savePost(post: BlogPost, adminEmail: string, adminUid: string): Promise<void> {
    const payload: BlogPost = {
      ...post,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail,
    };

    // Use postId as Firestore document identifier
    const docId = post.postId || `post_${Date.now()}`;
    payload.postId = docId;

    // Persist to Firestore first
    await setDoc(doc(db, 'posts', docId), payload);

    // Update local cache
    const current = getLocalPosts();
    const map = new Map<string, BlogPost>();
    for (const p of current) map.set(p.postId, p);
    map.set(docId, payload);
    const updated = Array.from(map.values()).sort(
      (a, b) => (b.publicationDate || b.createdAt).localeCompare(a.publicationDate || a.createdAt)
    );
    setLocalPosts(updated);

    await CMSService.logActivity(
      adminUid,
      adminEmail,
      'SAVE_BLOG_POST',
      'Blog CMS',
      `Saved blog post: "${payload.title}" (slug: /${payload.slug}) [${payload.isPublished ? 'PUBLISHED' : 'DRAFT'}]`
    ).catch(() => {});
  }

  /**
   * Deletes a blog post from Firestore.
   */
  static async deletePost(postId: string, adminEmail: string, adminUid: string): Promise<void> {
    await deleteDoc(doc(db, 'posts', postId));

    const current = getLocalPosts();
    const updated = current.filter(p => p.postId !== postId);
    setLocalPosts(updated);

    await CMSService.logActivity(
      adminUid,
      adminEmail,
      'DELETE_BLOG_POST',
      'Blog CMS',
      `Deleted post ID: ${postId}`
    ).catch(() => {});
  }
}
