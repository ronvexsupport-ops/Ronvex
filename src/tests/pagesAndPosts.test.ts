import {
  generateSlug,
  normalizeSlug,
  resolveUniqueSlug,
  buildPublicUrl,
  transliterateBengali,
} from '../utils/slugUtils';
import { generateSitemapXml } from '../utils/seoUtils';
import { CustomPage, BlogPost, Product } from '../types';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failedCount++;
  }
}

console.log('=== RUNNING PAGES & POSTS CMS AUTOMATED TESTS ===\n');

// 1. Slug Generation for English Titles
const slug1 = generateSlug('About Us');
assert(slug1 === 'about-us', `English title: "About Us" -> "${slug1}" (expected "about-us")`);

const slug2 = generateSlug('Contact RONVEX');
assert(slug2 === 'contact-ronvex', `English title: "Contact RONVEX" -> "${slug2}" (expected "contact-ronvex")`);

const slug3 = generateSlug('Best Products Imported from Pakistan');
assert(slug3 === 'best-products-imported-from-pakistan', `English title: "Best Products Imported from Pakistan" -> "${slug3}"`);

const slug4 = generateSlug('⚡ Summer Sale: 2026 Wearables & Audio Specials! --- 50% Off');
assert(slug4 === 'summer-sale-2026-wearables-audio-specials-50-off', `Special chars and emojis: "${slug4}"`);

// 2. Bengali & Unicode Slug Handling
const bengaliTitle = 'সেরা গ্যাজেট বাংলাদেশ';
const bengaliSlug = generateSlug(bengaliTitle);
assert(bengaliSlug.length > 0, `Bengali title produces non-empty slug: "${bengaliSlug}"`);
assert(!bengaliSlug.includes(' '), `Bengali slug has no spaces: "${bengaliSlug}"`);
assert(!bengaliSlug.startsWith('-') && !bengaliSlug.endsWith('-'), `Bengali slug trimmed: "${bengaliSlug}"`);

// 3. Duplicate Slug Detection & Incrementation
const existing = ['about-us', 'about-us-2', 'contact-ronvex'];
const dup1 = resolveUniqueSlug('about-us', existing);
assert(dup1 === 'about-us-3', `Duplicate detected: "about-us" with ["about-us", "about-us-2"] -> "${dup1}" (expected "about-us-3")`);

const nonDup = resolveUniqueSlug('fresh-page', existing);
assert(nonDup === 'fresh-page', `Non-duplicate: "fresh-page" -> "${nonDup}"`);

// Own slug preservation when editing existing document
const ownSlug = resolveUniqueSlug('about-us', existing, 'about-us');
assert(ownSlug === 'about-us', `Own slug preserved during edit: "${ownSlug}"`);

// 4. Normalization of manually typed slugs
const manualClean = normalizeSlug('  My-Custom_URL / / page!!  ');
assert(manualClean === 'my-custom-url-page', `Manual slug normalized: "${manualClean}"`);

// 5. Public URL Generation
const pageUrl = buildPublicUrl('page', 'about-us', 'https://ronvex.com');
assert(pageUrl.relativePath === '/pages/about-us', `Relative path: "${pageUrl.relativePath}"`);
assert(pageUrl.hashPath === '/#pages/about-us', `Hash path: "${pageUrl.hashPath}"`);
assert(pageUrl.fullUrl === 'https://ronvex.com/#pages/about-us', `Full URL: "${pageUrl.fullUrl}"`);

const postUrl = buildPublicUrl('post', 'best-smartwatches-in-bangladesh-2026', 'https://ronvex.com');
assert(postUrl.relativePath === '/blog/best-smartwatches-in-bangladesh-2026', `Post relative path: "${postUrl.relativePath}"`);
assert(postUrl.fullUrl === 'https://ronvex.com/#blog/best-smartwatches-in-bangladesh-2026', `Post full URL: "${postUrl.fullUrl}"`);

// 6. XML Sitemap Excludes Drafts & Includes Published
const testProducts: Product[] = [
  {
    productId: 'p1',
    name: 'Titan Smartwatch',
    slug: 'titan-smartwatch',
    description: '',
    categoryId: 'wearables',
    categoryName: 'Wearables',
    imageUrls: [],
    adminBasePrice: 600,
    maxAffiliateIncrease: 150,
    stockQuantity: 10,
    isActive: true,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    productId: 'p2',
    name: 'Inactive Watch',
    slug: 'inactive-watch',
    description: '',
    categoryId: 'wearables',
    categoryName: 'Wearables',
    imageUrls: [],
    adminBasePrice: 600,
    maxAffiliateIncrease: 150,
    stockQuantity: 0,
    isActive: false, // Inactive!
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
];

const testPages: CustomPage[] = [
  {
    pageId: 'about-us',
    slug: 'about-us',
    title: 'About Us',
    content: 'Content',
    isPublished: true, // Published
    showInHeader: false,
    showInFooter: true,
    order: 1,
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    pageId: 'draft-policy',
    slug: 'draft-policy',
    title: 'Draft Policy',
    content: 'Unfinished',
    isPublished: false, // DRAFT!
    showInHeader: false,
    showInFooter: false,
    order: 2,
    updatedAt: '2026-03-01T00:00:00Z',
  },
];

const testPosts: BlogPost[] = [
  {
    postId: 'post_1',
    slug: 'published-guide',
    title: 'Published Guide',
    bodyContent: 'Guide content',
    author: 'Author',
    publicationDate: '2026-03-01',
    isPublished: true, // Published
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    postId: 'post_draft',
    slug: 'secret-upcoming-release',
    title: 'Secret Upcoming Release',
    bodyContent: 'Top secret',
    author: 'Author',
    publicationDate: '2026-03-01',
    isPublished: false, // DRAFT!
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-01T00:00:00Z',
  },
];

const sitemap = generateSitemapXml(testProducts, testPages, testPosts, 'https://ronvex.com');

assert(sitemap.includes('<urlset'), 'Sitemap has <urlset>');
assert(sitemap.includes('https://ronvex.com/#product/titan-smartwatch'), 'Active product included in sitemap');
assert(!sitemap.includes('inactive-watch'), 'Inactive product EXCLUDED from sitemap');
assert(sitemap.includes('https://ronvex.com/#pages/about-us'), 'Published page included in sitemap');
assert(!sitemap.includes('draft-policy'), 'Draft page EXCLUDED from sitemap');
assert(sitemap.includes('https://ronvex.com/#blog/published-guide'), 'Published post included in sitemap');
assert(!sitemap.includes('secret-upcoming-release'), 'Draft post EXCLUDED from sitemap');

console.log(`\n=== RESULTS: ${passedCount} PASSED, ${failedCount} FAILED ===`);
if (failedCount > 0) process.exit(1);
