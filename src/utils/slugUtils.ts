/**
 * Slug generation and uniqueness utility for RONVEX CMS.
 * Handles English, Bengali, and Unicode characters safely for SEO-friendly URLs.
 */

// Bengali to English / Latin transliteration mapping
const BENGALI_CHAR_MAP: Record<string, string> = {
  // Independent Vowels
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  // Dependent Vowel Signs (Kar)
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  // Consonants
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'y', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't',
  // Modifiers
  'ং': 'ng', 'ঃ': 'h', 'ঁ': '', '্': '',
  // Bengali Digits
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

/**
 * Transliterates Bengali text into phonetic Latin equivalent.
 */
export function transliterateBengali(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (BENGALI_CHAR_MAP[char] !== undefined) {
      result += BENGALI_CHAR_MAP[char];
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * Automatically derives a clean, SEO-friendly URL slug from any title.
 * Supports English, Bengali, and Unicode characters.
 */
export function generateSlug(title: string): string {
  if (!title || typeof title !== 'string') return '';

  // 1. First transliterate Bengali characters if present
  let processed = transliterateBengali(title.trim());

  // 2. Normalize unicode diacritics (e.g. accented Latin chars)
  processed = processed.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // 3. Lowercase
  processed = processed.toLowerCase();

  // 4. Replace spaces, underscores, and consecutive special characters with single hyphen
  // Allows alphanumeric letters and numbers
  processed = processed
    .replace(/[^\p{L}\p{N}]+/gu, '-') // Replace any non-letter, non-number with hyphens
    .replace(/-+/g, '-')              // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '');         // Trim leading and trailing hyphens

  // If still empty (e.g., input was only symbols)
  if (!processed) {
    return `item-${Date.now().toString(36)}`;
  }

  return processed;
}

/**
 * Validates and normalizes manually entered slugs.
 */
export function normalizeSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') return '';
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensures slug uniqueness among a collection of existing slugs.
 * If collision occurs with another document, automatically appends -2, -3, etc.
 * 
 * @param candidateSlug The slug to test
 * @param existingSlugs Array of currently occupied slugs
 * @param currentDocSlug Optional slug of the document currently being edited (allows keeping own slug)
 */
export function resolveUniqueSlug(
  candidateSlug: string,
  existingSlugs: string[],
  currentDocSlug?: string
): string {
  const base = normalizeSlug(candidateSlug) || 'item';
  const slugSet = new Set(existingSlugs.map(s => s.toLowerCase()));

  // If this candidate belongs to the document itself, it's valid
  if (currentDocSlug && base === currentDocSlug.toLowerCase()) {
    return base;
  }

  // If it's not taken, return it
  if (!slugSet.has(base)) {
    return base;
  }

  // Otherwise, find the next available numeric suffix
  // e.g. about-us-2, about-us-3
  let counter = 2;
  while (slugSet.has(`${base}-${counter}`)) {
    counter++;
  }

  return `${base}-${counter}`;
}

/**
 * Returns formatted preview URL and full canonical URL for pages or posts.
 */
export function buildPublicUrl(type: 'page' | 'post', slug: string, baseOrigin?: string): {
  relativePath: string;
  hashPath: string;
  fullUrl: string;
} {
  const cleanSlug = normalizeSlug(slug);
  const origin = baseOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://ronvex.com');

  if (type === 'page') {
    return {
      relativePath: `/pages/${cleanSlug}`,
      hashPath: `/#pages/${cleanSlug}`,
      fullUrl: `${origin}/#pages/${cleanSlug}`,
    };
  }

  return {
    relativePath: `/blog/${cleanSlug}`,
    hashPath: `/#blog/${cleanSlug}`,
    fullUrl: `${origin}/#blog/${cleanSlug}`,
  };
}
