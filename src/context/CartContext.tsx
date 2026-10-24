import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, AttributionData } from '../types';
import { AttributionEngine } from '../services/pricingEngine';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, customSellingPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  subtotal: number;
  itemCount: number;
  activeAttribution: AttributionData | null;
  setActiveAttribution: (attr: AttributionData | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ronvex_shopping_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeAttribution, setActiveAttribution] = useState<AttributionData | null>(() => {
    return AttributionEngine.getActiveAttribution(30);
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // noop
    }
  }, [items]);

  const addToCart = (product: Product, quantity = 1, customSellingPrice?: number) => {
    const finalPrice = customSellingPrice !== undefined ? customSellingPrice : product.adminBasePrice;

    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.product.productId === product.productId);
      if (existingIndex > -1) {
        const next = [...prev];
        const updatedQty = Math.min(
          next[existingIndex].quantity + quantity,
          product.stockQuantity
        );
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: updatedQty,
          sellingPrice: finalPrice,
          affiliateId: activeAttribution?.affiliateId || null,
        };
        return next;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: Math.min(quantity, product.stockQuantity),
            sellingPrice: finalPrice,
            affiliateId: activeAttribution?.affiliateId || null,
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(i => i.product.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.product.productId === productId) {
          return {
            ...item,
            quantity: Math.min(quantity, item.product.stockQuantity),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // noop
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        subtotal,
        itemCount,
        activeAttribution,
        setActiveAttribution,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
