// Comprehensive SKU Auto-Generation and Uniqueness Engine

export type SkuPattern = 'SJ_SEQUENCE' | 'BRAND_NUMBER' | 'CATEGORY_BRAND' | 'RONVEX_CODE';

export interface SkuSuggestion {
  pattern: SkuPattern;
  label: string;
  sku: string;
  description: string;
}

/**
 * Extracts a concise 2-4 letter uppercase prefix from a brand name
 */
export function getBrandPrefix(brand?: string): string {
  if (!brand || !brand.trim()) return 'SJ';
  const clean = brand.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    // E.g. "SJ CLOSET" -> "SJ", "SANA SAFINAZ" -> "SS", "GUL AHMED" -> "GA"
    const initials = words.map(w => w[0]).join('');
    if (initials.length >= 2 && initials.length <= 4) return initials;
  }

  if (words[0]) {
    // E.g. "JAZMIN" -> "JAZ", "RONVEX" -> "RNV", "SAPPHIRE" -> "SAPH"
    const first = words[0];
    if (first.length <= 4) return first;
    // Strip vowels after first letter if long (e.g. "RONVEX" -> "RNVX" -> "RNV")
    const withoutInnerVowels = first[0] + first.slice(1).replace(/[AEIOU]/g, '');
    if (withoutInnerVowels.length >= 3) return withoutInnerVowels.slice(0, 3);
    return first.slice(0, 3);
  }

  return 'SJ';
}

/**
 * Extracts a concise 2-4 letter uppercase code from category name or ID
 */
export function getCategoryPrefix(categoryName?: string, categoryId?: string): string {
  const source = (categoryName || categoryId || '').toLowerCase();
  if (source.includes('lawn') || source.includes('women') || source.includes('cloth') || source.includes('dress') || source.includes('suit')) {
    return 'LAWN';
  }
  if (source.includes('wear') || source.includes('watch')) {
    return 'WEAR';
  }
  if (source.includes('audio') || source.includes('ear') || source.includes('head')) {
    return 'AUD';
  }
  if (source.includes('life') || source.includes('bag') || source.includes('access')) {
    return 'LIFE';
  }
  if (categoryName && categoryName.trim()) {
    const clean = categoryName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean.slice(0, 4) || 'CAT';
  }
  return 'GEN';
}

/**
 * Finds the highest sequential number for an "SJ00xx" or "[PREFIX]00xx" pattern among existing SKUs
 */
export function findHighestSequenceNumber(prefix: string, existingSkus: string[]): number {
  let highest = 0;
  const regex = new RegExp(`^${prefix}[-_]?0*(\\d+)$`, 'i');

  for (const s of existingSkus) {
    if (!s) continue;
    const match = s.trim().match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > highest) {
        highest = num;
      }
    }
  }

  return highest;
}

/**
 * Checks whether an SKU is already used by another product (case-insensitive)
 */
export function isSkuUnique(sku: string, existingSkus: string[], currentProductSku?: string): boolean {
  if (!sku || !sku.trim()) return false;
  const target = sku.trim().toUpperCase();
  const current = (currentProductSku || '').trim().toUpperCase();

  return !existingSkus.some(existing => {
    if (!existing) return false;
    const e = existing.trim().toUpperCase();
    if (current && e === current) return false; // Ignore current product's existing SKU
    return e === target;
  });
}

/**
 * Generates an automated, guaranteed-unique SKU according to selected pattern
 */
export function generateAutoSku(options: {
  brand?: string;
  categoryName?: string;
  categoryId?: string;
  existingSkus?: string[];
  pattern?: SkuPattern;
}): string {
  const {
    brand = 'JAZMIN',
    categoryName = "Women's Clothing",
    categoryId = 'women-clothing',
    existingSkus = [],
    pattern = 'SJ_SEQUENCE',
  } = options;

  const brandCode = getBrandPrefix(brand);
  const catCode = getCategoryPrefix(categoryName, categoryId);
  const cleanExisting = existingSkus.map(s => (s || '').trim().toUpperCase());

  let candidate = '';

  switch (pattern) {
    case 'SJ_SEQUENCE': {
      // Classic reference pattern matching "SJ0025", "SJ0026", etc.
      const highest = findHighestSequenceNumber('SJ', cleanExisting);
      const nextSeq = highest > 0 ? highest + 1 : 26;
      candidate = `SJ${String(nextSeq).padStart(4, '0')}`;
      break;
    }

    case 'BRAND_NUMBER': {
      // E.g. "JAZ-1026" or "SJ-1026"
      const highest = findHighestSequenceNumber(brandCode, cleanExisting);
      const nextSeq = highest > 0 ? highest + 1 : 1001;
      candidate = `${brandCode}-${String(nextSeq).padStart(4, '0')}`;
      break;
    }

    case 'CATEGORY_BRAND': {
      // E.g. "LAWN-JAZ-01" or "WEAR-RNV-01"
      const prefix = `${catCode}-${brandCode}`;
      const highest = findHighestSequenceNumber(prefix, cleanExisting);
      const nextSeq = highest > 0 ? highest + 1 : 1;
      candidate = `${prefix}-${String(nextSeq).padStart(2, '0')}`;
      break;
    }

    case 'RONVEX_CODE': {
      // E.g. "RNV-LAWN-831" or "RNV-0492"
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      candidate = `RNV-${catCode}-${randomPart}`;
      break;
    }

    default: {
      const highest = findHighestSequenceNumber('SJ', cleanExisting);
      candidate = `SJ${String(highest > 0 ? highest + 1 : 26).padStart(4, '0')}`;
    }
  }

  // Safety: If by any chance collision occurs, append incremental integer
  let finalSku = candidate;
  let counter = 1;
  while (cleanExisting.includes(finalSku.toUpperCase())) {
    finalSku = `${candidate}-${counter}`;
    counter++;
  }

  return finalSku;
}

/**
 * Returns 4 instant SKU presets for the admin UI to choose from
 */
export function getSkuSuggestions(options: {
  brand?: string;
  categoryName?: string;
  categoryId?: string;
  existingSkus?: string[];
}): SkuSuggestion[] {
  const { brand = 'JAZMIN', categoryName = "Women's Clothing", categoryId = 'women-clothing', existingSkus = [] } = options;

  return [
    {
      pattern: 'SJ_SEQUENCE',
      label: 'SJ Sequence',
      sku: generateAutoSku({ brand, categoryName, categoryId, existingSkus, pattern: 'SJ_SEQUENCE' }),
      description: 'Classic sequential code (e.g. SJ0026)',
    },
    {
      pattern: 'BRAND_NUMBER',
      label: 'Brand Code',
      sku: generateAutoSku({ brand, categoryName, categoryId, existingSkus, pattern: 'BRAND_NUMBER' }),
      description: 'Brand prefix with sequential ID',
    },
    {
      pattern: 'CATEGORY_BRAND',
      label: 'Category + Brand',
      sku: generateAutoSku({ brand, categoryName, categoryId, existingSkus, pattern: 'CATEGORY_BRAND' }),
      description: 'Category and brand combination',
    },
    {
      pattern: 'RONVEX_CODE',
      label: 'RONVEX Series',
      sku: generateAutoSku({ brand, categoryName, categoryId, existingSkus, pattern: 'RONVEX_CODE' }),
      description: 'Storefront catalog series code',
    },
  ];
}
