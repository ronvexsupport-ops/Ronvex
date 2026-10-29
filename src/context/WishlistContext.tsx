import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'ronvex_wishlist_items';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistProducts));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlistProducts]);

  const wishlistIds = wishlistProducts.map(p => p.productId);

  const isInWishlist = (productId: string): boolean => {
    return wishlistProducts.some(p => p.productId === productId);
  };

  const addToWishlist = (product: Product) => {
    setWishlistProducts(prev => {
      if (prev.some(p => p.productId === product.productId)) {
        return prev;
      }
      return [product, ...prev];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlistProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const toggleWishlist = (product: Product) => {
    setWishlistProducts(prev => {
      const exists = prev.some(p => p.productId === product.productId);
      if (exists) {
        return prev.filter(p => p.productId !== product.productId);
      } else {
        return [product, ...prev];
      }
    });
  };

  const clearWishlist = () => {
    setWishlistProducts([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistCount: wishlistProducts.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
