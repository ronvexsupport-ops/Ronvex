import { Product, PlatformSettings, AttributionData } from '../types';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  currency: 'BDT',
  currencySymbol: '৳',
  defaultMonthlyTarget: 100000, // ৳100,000
  defaultMonthlyBonus: 800, // ৳800
  minimumPayout: 0, // No minimum payout threshold
  payoutScheduleDay: 'Wednesday',
  attributionWindowDays: 30,
  deliveryChargeInsideDhaka: 80,
  deliveryChargeOutsideDhaka: 150,
  freeDeliveryThreshold: 3500,
  returnWindowDays: 7,
};

export class PricingEngine {
  /**
   * Calculates the maximum permitted affiliate selling price
   */
  public static calculateMaxSellingPrice(basePrice: number, maxIncrease: number): number {
    return Math.round((basePrice + maxIncrease) * 100) / 100;
  }

  /**
   * Validates if a proposed affiliate selling price conforms to pricing limits
   */
  public static validateAffiliatePrice(
    basePrice: number,
    maxIncrease: number,
    proposedPrice: number
  ): { valid: boolean; reason?: string } {
    const minPrice = basePrice;
    const maxPrice = this.calculateMaxSellingPrice(basePrice, maxIncrease);

    if (typeof proposedPrice !== 'number' || isNaN(proposedPrice)) {
      return { valid: false, reason: 'Proposed selling price must be a valid number.' };
    }

    if (proposedPrice < minPrice) {
      return {
        valid: false,
        reason: `Selling price (${proposedPrice}) cannot be lower than the admin base price (${minPrice} BDT).`,
      };
    }

    if (proposedPrice > maxPrice) {
      return {
        valid: false,
        reason: `Selling price (${proposedPrice}) exceeds the maximum permitted selling price (${maxPrice} BDT).`,
      };
    }

    return { valid: true };
  }

  /**
   * Calculates gross affiliate margin
   * Gross Affiliate Margin = Accepted Selling Price - Admin Base Price
   */
  public static calculateAffiliateMargin(sellingPrice: number, basePrice: number): number {
    const margin = sellingPrice - basePrice;
    return Math.max(0, Math.round(margin * 100) / 100);
  }

  /**
   * Calculates delivery charge based on district and cart subtotal
   */
  public static calculateDeliveryCharge(
    district: string,
    subtotal: number,
    settings: PlatformSettings = DEFAULT_PLATFORM_SETTINGS
  ): number {
    if (subtotal >= settings.freeDeliveryThreshold) {
      return 0;
    }

    const isDhaka = district.trim().toLowerCase() === 'dhaka';
    return isDhaka ? settings.deliveryChargeInsideDhaka : settings.deliveryChargeOutsideDhaka;
  }

  /**
   * Formats BDT currency value cleanly
   */
  public static formatBDT(amount: number): string {
    return `৳${Math.round(amount).toLocaleString('en-BD')}`;
  }
}

const ATTRIBUTION_STORAGE_KEY = 'ronvex_affiliate_attribution';

export class AttributionEngine {
  /**
   * Store or update affiliate attribution
   */
  public static recordAttribution(affiliateId: string, affiliateSlug: string): void {
    if (!affiliateId || !affiliateSlug) return;
    const payload: AttributionData = {
      affiliateId,
      affiliateSlug,
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Storage unavailable
    }
  }

  /**
   * Retrieves active attribution if within validity window (default 30 days)
   */
  public static getActiveAttribution(windowDays: number = 30): AttributionData | null {
    try {
      const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (!raw) return null;
      const data: AttributionData = JSON.parse(raw);
      const elapsedDays = (Date.now() - data.timestamp) / (1000 * 60 * 60 * 24);
      if (elapsedDays <= windowDays) {
        return data;
      }
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clears attribution after order completion or manual reset
   */
  public static clearAttribution(): void {
    try {
      localStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
    } catch {
      // noop
    }
  }
}
