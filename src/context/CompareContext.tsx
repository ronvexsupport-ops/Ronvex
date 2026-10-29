import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../types';

export const MAX_COMPARE_ITEMS = 3;

interface CompareContextType {
  compareProducts: Product[];
  compareIds: string[];
  isInCompare: (productId: string) => boolean;
  toggleCompare: (product: Product) => boolean;
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  openCompareModal: () => void;
  closeCompareModal: () => void;
  compareCount: number;
  maxItems: number;
  compareNotification: string | null;
  clearCompareNotification: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const COMPARE_STORAGE_KEY = 'ronvex_compare_items';

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareProducts, setCompareProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_COMPARE_ITEMS);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareNotification, setCompareNotification] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareProducts));
    } catch (e) {
      console.warn('Failed to save compare items to localStorage:', e);
    }
  }, [compareProducts]);

  const showNotification = useCallback((message: string) => {
    setCompareNotification(message);
    const timer = setTimeout(() => {
      setCompareNotification(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const clearCompareNotification = () => setCompareNotification(null);

  const compareIds = compareProducts.map(p => p.productId);

  const isInCompare = useCallback(
    (productId: string): boolean => {
      return compareProducts.some(p => p.productId === productId);
    },
    [compareProducts]
  );

  const addToCompare = useCallback(
    (product: Product): boolean => {
      if (compareProducts.some(p => p.productId === product.productId)) {
        showNotification(`"${product.name}" is already in your comparison list.`);
        return false;
      }

      if (compareProducts.length >= MAX_COMPARE_ITEMS) {
        showNotification(
          `Comparison limit reached (max ${MAX_COMPARE_ITEMS} items). Remove an item to add this one.`
        );
        return false;
      }

      setCompareProducts(prev => [...prev, product]);
      showNotification(`Added "${product.name}" to comparison (${compareProducts.length + 1}/${MAX_COMPARE_ITEMS}).`);
      return true;
    },
    [compareProducts, showNotification]
  );

  const removeFromCompare = useCallback((productId: string) => {
    setCompareProducts(prev => prev.filter(p => p.productId !== productId));
  }, []);

  const toggleCompare = useCallback(
    (product: Product): boolean => {
      if (isInCompare(product.productId)) {
        removeFromCompare(product.productId);
        showNotification(`Removed "${product.name}" from comparison.`);
        return false;
      } else {
        return addToCompare(product);
      }
    },
    [isInCompare, removeFromCompare, addToCompare, showNotification]
  );

  const clearCompare = useCallback(() => {
    setCompareProducts([]);
    showNotification('Cleared all products from comparison.');
  }, [showNotification]);

  const openCompareModal = useCallback(() => setIsCompareModalOpen(true), []);
  const closeCompareModal = useCallback(() => setIsCompareModalOpen(false), []);

  return (
    <CompareContext.Provider
      value={{
        compareProducts,
        compareIds,
        isInCompare,
        toggleCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isCompareModalOpen,
        setIsCompareModalOpen,
        openCompareModal,
        closeCompareModal,
        compareCount: compareProducts.length,
        maxItems: MAX_COMPARE_ITEMS,
        compareNotification,
        clearCompareNotification,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
