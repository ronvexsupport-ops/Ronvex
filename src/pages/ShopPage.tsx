import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Product, ProductCategory } from '../types';
import { ProductCard } from '../components/ProductCard';

interface ShopPageProps {
  products: Product[];
  categories?: ProductCategory[];
  initialCategory?: string;
  onSelectProduct: (product: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories: categoriesProp,
  initialCategory,
  onSelectProduct,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  // Compute dynamic category list combining defined categories and product-assigned categories
  const categoryTabs = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [{ id: 'all', name: 'All Collections' }];
    const seen = new Set<string>(['all']);

    // 1. From Firestore / passed categories
    if (categoriesProp && categoriesProp.length > 0) {
      categoriesProp
        .filter(c => c.isActive !== false)
        .forEach(c => {
          const key = c.categoryId.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            list.push({ id: c.categoryId, name: c.name });
          }
        });
    }

    // 2. From currently loaded products (ensures no product category is ever missing)
    products.forEach(p => {
      const catId = (p.categoryId || '').toLowerCase();
      if (catId && !seen.has(catId)) {
        seen.add(catId);
        list.push({ id: p.categoryId, name: p.categoryName || p.categoryId });
      }
    });

    return list;
  }, [categoriesProp, products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.isActive)
      .filter(p => {
        if (selectedCategory !== 'all') {
          const sel = selectedCategory.toLowerCase();
          const pCatId = (p.categoryId || '').toLowerCase();
          const pCatName = (p.categoryName || '').toLowerCase();
          const pCatSlug = pCatName.replace(/[^a-z0-9_-]+/g, '-');

          const matches = pCatId === sel || pCatName === sel || pCatSlug === sel;
          if (!matches) {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.adminBasePrice - b.adminBasePrice;
        if (sortBy === 'price-desc') return b.adminBasePrice - a.adminBasePrice;
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">RONVEX Direct Storefront</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 font-serif mt-1">
            Complete Product Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {filteredProducts.length} verified products available for instant order dispatch.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-colors"
          />
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Dynamic Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-full overflow-x-auto">
          {categoryTabs.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-white text-slate-950 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-slate-800">No products match your search or filter</p>
          <p className="text-xs text-slate-500">Try adjusting your keyword or choosing another category.</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.productId}
              product={product}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
