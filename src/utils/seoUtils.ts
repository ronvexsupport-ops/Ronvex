/**
 * SEO, Meta Tags & Sitemap Utility for RONVEX
 * Updates browser document title, description, canonical, and OpenGraph social share cards.
 */

import { Product, CustomPage, BlogPost } from '../types';

export interface PageMetaOptions {
  title?: string;
  seoTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalPath?: string;
  type?: 'website' | 'article' | 'product';
}

const DEFAULT_BRAND = 'RONVEX';
const DEFAULT_DESCRIPTION = 'Shop smartwatches, premium wireless earbuds, and precision tech with cash on delivery across Bangladesh. Join the RONVEX Affiliate Program.';
const DEFAULT_IMAGE = '/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg';

function getMetaTag(attributeName: string, attributeValue: string): HTMLMetaElement {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  return element;
}

function getCanonicalTag(): HTMLLinkElement {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }
  return element;
}

/**
 * Dynamically applies SEO title, meta description, canonical link, and OpenGraph tags.
 */
export function applySEO(options: PageMetaOptions): void {
  if (typeof document === 'undefined') return;

  const baseTitle = options.seoTitle || options.title;
  let resolvedTitle = `${DEFAULT_BRAND} | Premium Lifestyle Tech & Affiliate Platform`;
  if (baseTitle) {
    resolvedTitle = baseTitle.includes(DEFAULT_BRAND) ? baseTitle : `${baseTitle} | ${DEFAULT_BRAND}`;
  }

  const resolvedDescription = options.metaDescription || DEFAULT_DESCRIPTION;
  const origin = window.location.origin;
  const canonicalUrl = options.canonicalPath ? `${origin}${options.canonicalPath}` : window.location.href;
  const resolvedImage = options.ogImage || (options.ogImage?.startsWith('http') ? options.ogImage : `${origin}${DEFAULT_IMAGE}`);

  // 1. Title
  document.title = resolvedTitle;

  // 2. Meta description
  getMetaTag('name', 'description').content = resolvedDescription;

  // 3. OpenGraph Tags
  getMetaTag('property', 'og:title').content = resolvedTitle;
  getMetaTag('property', 'og:description').content = resolvedDescription;
  getMetaTag('property', 'og:type').content = options.type || 'website';
  getMetaTag('property', 'og:url').content = canonicalUrl;
  if (resolvedImage) {
    getMetaTag('property', 'og:image').content = resolvedImage;
  }
  getMetaTag('property', 'og:site_name').content = DEFAULT_BRAND;

  // 4. Twitter Cards
  getMetaTag('name', 'twitter:card').content = 'summary_large_image';
  getMetaTag('name', 'twitter:title').content = resolvedTitle;
  getMetaTag('name', 'twitter:description').content = resolvedDescription;
  if (resolvedImage) {
    getMetaTag('name', 'twitter:image').content = resolvedImage;
  }

  // 5. Canonical Link
  getCanonicalTag().href = canonicalUrl;
}

/**
 * Generates an XML sitemap string containing published products, pages, and blog posts.
 * Excludes drafts and unpublished content.
 */
export function generateSitemapXml(
  products: Product[] = [],
  pages: CustomPage[] = [],
  posts: BlogPost[] = [],
  baseUrl?: string
): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://ronvex.com');
  const now = new Date().toISOString().split('T')[0];

  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: string }> = [
    { loc: `${origin}/`, lastmod: now, changefreq: 'daily', priority: '1.0' },
    { loc: `${origin}/#shop`, lastmod: now, changefreq: 'daily', priority: '0.9' },
    { loc: `${origin}/#blog`, lastmod: now, changefreq: 'weekly', priority: '0.8' },
    { loc: `${origin}/#track-order`, lastmod: now, changefreq: 'monthly', priority: '0.5' },
    { loc: `${origin}/#affiliate/register`, lastmod: now, changefreq: 'weekly', priority: '0.7' },
  ];

  // Published Products
  products.filter(p => p.isActive).forEach(p => {
    urls.push({
      loc: `${origin}/#product/${p.slug || p.productId}`,
      lastmod: p.updatedAt ? p.updatedAt.split('T')[0] : now,
      changefreq: 'weekly',
      priority: '0.8',
    });
  });

  // Published Pages (exclude drafts!)
  pages.filter(p => p.isPublished).forEach(p => {
    urls.push({
      loc: `${origin}/#pages/${p.slug}`,
      lastmod: p.updatedAt ? p.updatedAt.split('T')[0] : now,
      changefreq: 'monthly',
      priority: '0.6',
    });
  });

  // Published Blog Posts (exclude drafts!)
  posts.filter(p => p.isPublished).forEach(p => {
    urls.push({
      loc: `${origin}/#blog/${p.slug}`,
      lastmod: p.updatedAt ? p.updatedAt.split('T')[0] : now,
      changefreq: 'monthly',
      priority: '0.7',
    });
  });

  const urlElements = urls
    .map(
      u => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
