import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  User,
  Clock,
  ArrowRight,
  BookOpen,
  Filter,
  Loader2,
} from 'lucide-react';
import { BlogService } from '../services/blogService';
import { BlogPost } from '../types';
import { applySEO } from '../utils/seoUtils';

interface BlogListPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const BlogListPage: React.FC<BlogListPageProps> = ({ onNavigate }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    applySEO({
      title: 'Blog & Editorial',
      seoTitle: 'RONVEX Blog | Guides, Tech Insights & Product Reviews',
      metaDescription:
        'Read the latest guides, in-depth reviews, and tips on smartwatches, wireless audio, and e-commerce affiliate entrepreneurship in Bangladesh.',
      canonicalPath: '/blog',
      type: 'website',
    });

    const loadPosts = async () => {
      setLoading(true);
      try {
        const published = await BlogService.getPublishedPosts();
        setPosts(published);
      } catch (err) {
        console.warn('Error loading published blog posts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  const categories = Array.from(
    new Set(posts.map(p => p.category).filter((c): c is string => Boolean(c)))
  );

  const filteredPosts = posts.filter(post => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
          RONVEX Insights
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-slate-950 tracking-tight mb-4">
          Articles, Guides & Stories
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          In-depth product breakdowns, buyer’s guides, wearable tech maintenance, and partner tips directly from our engineering and marketing specialists.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="max-w-4xl mx-auto mb-10 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search guides, earbuds, smartwatches, tutorials..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-slate-900 transition-colors shadow-xs"
          />
        </div>

        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-950 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              All Topics
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-950 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content list */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading publications...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xs">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">No articles found</h3>
          <p className="text-xs text-slate-500 mb-4">
            Try adjusting your search terms or selecting a different category.
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs font-semibold text-emerald-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map(post => {
            const readTime = calculateReadingTime(post.bodyContent);
            return (
              <article
                key={post.postId}
                onClick={() => onNavigate('blog-post', post.slug)}
                className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
              >
                {/* Thumbnail */}
                {post.featuredImageUrl && (
                  <div className="aspect-16/9 bg-slate-100 overflow-hidden relative">
                    <img
                      src={post.featuredImageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {post.category && (
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase rounded-md tracking-wider">
                        {post.category}
                      </span>
                    )}
                  </div>
                )}

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.publicationDate || post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {readTime} min read
                      </span>
                    </div>

                    <h2 className="text-base font-bold font-serif text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">By {post.author || 'RONVEX'}</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Read Story</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
