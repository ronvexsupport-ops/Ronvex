// Preset brand assets and SVG generation utilities for RONVEX

export interface BrandingPreset {
  id: string;
  name: string;
  description: string;
  category: 'favicon' | 'logo';
  previewDataUri: string;
}

// Inline crisp SVG Favicons
export const PRESET_FAVICONS: BrandingPreset[] = [
  {
    id: 'emerald_crest',
    name: 'Emerald Hex Monogram (Default)',
    description: 'Deep obsidian badge with emerald neon border and serif R',
    category: 'favicon',
    previewDataUri:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#090d16" />
          <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="#059669" stroke-width="2.5" stroke-opacity="0.8" />
          <path d="M22 17h12c6 0 10 3.5 10 8.5 0 3.8-2.5 6.8-6.5 7.8L44 47H36l-5.5-12H28v12H22V17zm6 6v7h6c2.5 0 4.5-1.2 4.5-3.5S36.5 23 34 23h-6z" fill="#ffffff" />
          <circle cx="43" cy="19" r="3.5" fill="#10b981" />
        </svg>`
      ),
  },
  {
    id: 'luxury_gold',
    name: 'Ronvex Gold Crown Monogram',
    description: 'Ultra-luxurious warm gold crest for high-end lifestyle',
    category: 'favicon',
    previewDataUri:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="14" fill="#000000" />
          <rect x="3" y="3" width="58" height="58" rx="11" fill="none" stroke="#d97706" stroke-width="2" />
          <path d="M22 18h11.5c5.8 0 9.5 3.3 9.5 8 0 3.6-2.3 6.4-6.2 7.3L43 46H35.5L30.5 35H27.5v11H22V18zm5.5 5.5v6.5h6c2.5 0 4-1.2 4-3.2s-1.5-3.3-4-3.3h-6z" fill="#fef3c7" />
          <polygon points="41,16 43,21 48,21 44,24 45.5,29 41,26 36.5,29 38,24 34,21 39,21" fill="#f59e0b" />
        </svg>`
      ),
  },
  {
    id: 'minimal_white',
    name: 'Minimalist Clean White',
    description: 'High-contrast monochrome for ultra-clean modern look',
    category: 'favicon',
    previewDataUri:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <rect width="64" height="64" rx="16" fill="#0f172a" />
          <path d="M21 17h12.5c6.5 0 10.5 3.6 10.5 9 0 4-2.8 7.2-7 8.2L44 47H36l-6-11.5H27v11.5H21V17zm6 6v7h6.5c2.8 0 4.5-1.5 4.5-3.5S36.3 23 33.5 23H27z" fill="#ffffff" />
        </svg>`
      ),
  },
  {
    id: 'electric_cyan',
    name: 'Cyber Cyan Dynamic',
    description: 'Bold tech electric cyan highlight for smart gadgets',
    category: 'favicon',
    previewDataUri:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06b6d4" />
              <stop offset="100%" stop-color="#3b82f6" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="#050811" />
          <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="url(#cyanGrad)" stroke-width="2.5" />
          <path d="M22 17h12c6 0 10 3.5 10 8.5 0 3.8-2.5 6.8-6.5 7.8L44 47H36l-5.5-12H28v12H22V17zm6 6v7h6c2.5 0 4.5-1.2 4.5-3.5S36.5 23 34 23h-6z" fill="#ffffff" />
          <circle cx="43" cy="19" r="4" fill="url(#cyanGrad)" />
        </svg>`
      ),
  },
];

// Preset brand logos
export const PRESET_LOGOS: BrandingPreset[] = [
  {
    id: 'ronvex_emblem_dark',
    name: 'RONVEX Serif Emblem (Dark / Navy)',
    description: 'Classic luxury serif typography with emerald diamond crest',
    category: 'logo',
    previewDataUri:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" height="60">
          <rect x="2" y="8" width="44" height="44" rx="10" fill="#090d16" />
          <rect x="3" y="9" width="42" height="42" rx="9" fill="none" stroke="#059669" stroke-width="2" />
          <path d="M16 19h8c4.2 0 7 2.4 7 5.8 0 2.6-1.7 4.7-4.4 5.3L31 39h-5.2l-3.8-8H20v8h-4V19zm4 4.2v4.8h4c1.7 0 3-.9 3-2.4s-1.3-2.4-3-2.4h-4z" fill="#ffffff" />
          <circle cx="31" cy="20" r="2.5" fill="#10b981" />
          <text x="56" y="38" font-family="'Playfair Display', Georgia, serif" font-size="27" font-weight="800" letter-spacing="3" fill="#0f172a">RONVEX</text>
        </svg>`
      ),
  },
  {
    id: 'ronvex_gold_crest_logo',
    name: 'RONVEX Gold Sovereign (Light on Dark)',
    description: 'Gold crown badge with serif wordmark in warm ivory',
    category: 'logo',
    previewDataUri:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" height="60">
          <rect x="2" y="8" width="44" height="44" rx="10" fill="#000000" />
          <rect x="3" y="9" width="42" height="42" rx="9" fill="none" stroke="#d97706" stroke-width="2" />
          <path d="M16 19h8c4 0 6.5 2.3 6.5 5.5 0 2.5-1.6 4.4-4.2 5L30 39h-5l-3.5-7.5H20v7.5h-4V19zm4 4v4.5h4c1.7 0 2.8-.8 2.8-2.2s-1.1-2.3-2.8-2.3h-4z" fill="#fef3c7" />
          <polygon points="29,17 30.5,20.5 34,20.5 31,22.5 32,26 29,24 26,26 27,22.5 24,20.5 27.5,20.5" fill="#f59e0b" />
          <text x="56" y="38" font-family="'Playfair Display', Georgia, serif" font-size="27" font-weight="800" letter-spacing="3" fill="#1e293b">RONVEX</text>
        </svg>`
      ),
  },
  {
    id: 'ronvex_minimal_sans',
    name: 'RONVEX Pure Minimalist (Geometric)',
    description: 'Contemporary sans-serif typography with high precision dot',
    category: 'logo',
    previewDataUri:
      'data:image/svg+xml,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 50" height="50">
          <text x="0" y="35" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="29" font-weight="800" letter-spacing="4" fill="#090d16">RONVEX</text>
          <circle cx="166" cy="31" r="4" fill="#059669" />
        </svg>`
      ),
  },
];

/**
 * Generate a custom SVG monogram favicon
 */
export function generateCustomMonogramSvg(
  letter: string,
  bgColor: string = '#090d16',
  textColor: string = '#ffffff',
  accentColor: string = '#10b981'
): string {
  const char = (letter || 'R').trim().toUpperCase().charAt(0) || 'R';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="${bgColor}" />
    <rect x="2" y="2" width="60" height="60" rx="12" fill="none" stroke="${accentColor}" stroke-width="2.5" stroke-opacity="0.8" />
    <text x="32" y="44" font-family="'Playfair Display', Georgia, serif" font-size="34" font-weight="800" text-anchor="middle" fill="${textColor}">${char}</text>
    <circle cx="45" cy="18" r="3.5" fill="${accentColor}" />
  </svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/**
 * Dynamically updates the browser tab favicon and touch icons
 */
export function updateDocumentFavicon(faviconUrl?: string, appleTouchUrl?: string) {
  if (typeof document === 'undefined') return;

  const resolvedFavicon = faviconUrl || PRESET_FAVICONS[0].previewDataUri;
  const resolvedAppleTouch = appleTouchUrl || resolvedFavicon;

  // 1. Standard Favicon <link rel="icon">
  let faviconLink = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }
  faviconLink.id = 'dynamic-favicon';
  faviconLink.href = resolvedFavicon;
  if (resolvedFavicon.startsWith('data:image/svg+xml')) {
    faviconLink.type = 'image/svg+xml';
  } else if (resolvedFavicon.endsWith('.ico')) {
    faviconLink.type = 'image/x-icon';
  } else if (resolvedFavicon.endsWith('.png')) {
    faviconLink.type = 'image/png';
  }

  // 2. Apple Touch Icon <link rel="apple-touch-icon">
  let appleTouchLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!appleTouchLink) {
    appleTouchLink = document.createElement('link');
    appleTouchLink.rel = 'apple-touch-icon';
    document.head.appendChild(appleTouchLink);
  }
  appleTouchLink.id = 'dynamic-apple-icon';
  appleTouchLink.href = resolvedAppleTouch;
}
