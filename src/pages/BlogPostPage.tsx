import React, { useState, useEffect } from 'react';
import {
  Calendar,
  User,
  Clock,
  ArrowLeft,
  Share2,
  Check,
  Tag,
  AlertCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { BlogService } from '../services/blogService';
import { BlogPost } from '../types';
import { applySEO } from '../utils/seoUtils';
import { buildPublicUrl } from '../utils/slugUtils';
import { useAuth } from '../context/AuthContext';

interface BlogPostPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, onNavigate }) => {
  const { isAdmin } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPost = async () => {
      setLoading(true);
      try {
        const found = await BlogService.getPostBySlug(slug);
        if (isMounted) {
          if (found && (found.isPublished || isAdmin)) {
            setPost(found);
            applySEO({
              title: found.title,
              seoTitle: found.seoTitle,
              metaDescription: found.metaDescription || found.excerpt,
              ogImage: found.featuredImageUrl,
              canonicalPath: `/blog/${found.slug}`,
              type: 'article',
            });
          } else {
            setPost(null);
          }
        }
      } catch (err) {
        console.warn('Error loading blog post:', err);
        if (isMounted) setPost(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPost();
    return () => {
      isMounted = false;
    };
  }, [slug, isAdmin]);

  const handleCopyLink = () => {
    if (!post) return;
    const urls = buildPublicUrl('post', post.slug);
    navigator.clipboard.writeText(urls.fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const calculateReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold font-serif text-slate-900 mb-2">Article Not Found</h1>
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
          The publication you are looking for does not exist, has been removed, or is currently unpublished.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('blog')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse All Articles</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  const readingMinutes = calculateReadingTime(post.bodyContent);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Draft banner notice if viewing unreleased post as admin */}
      {!post.isPublished && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Draft Mode:</strong> This post is currently unpublished and only visible to administrators.
          </span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => onNavigate('blog')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-700 shadow-xs transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Share Article</span>
            </>
          )}
        </button>
      </div>

      {/* Header section */}
      <header className="mb-8">
        {post.category && (
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">
            {post.category}
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-serif text-slate-950 tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed mb-6">
            {post.excerpt}
          </p>
        )}

        {/* Metadata bar */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 border-y border-slate-200 py-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
              {post.author ? post.author.charAt(0).toUpperCase() : 'R'}
            </div>
            <span className="font-semibold text-slate-800">{post.author || 'RONVEX Editorial'}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <time dateTime={post.publicationDate}>
              {new Date(post.publicationDate || post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{readingMinutes} min read</span>
          </div>
        </div>
      </header>

      {/* Featured hero image if provided */}
      {post.featuredImageUrl && (
        <div className="mb-10 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 max-h-[460px]">
          <img
            src={post.featuredImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main post body content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs mb-10">
        <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
          {post.bodyContent}
        </div>

        {/* Post Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            {post.tags.map(tag => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Share & Back Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold font-serif text-slate-900">Found this helpful?</h3>
          <p className="text-xs text-slate-500 mt-0.5">Share with your friends and fellow tech enthusiasts.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Article Link'}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('blog')}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            More Articles
          </button>
        </div>
      </div>
    </article>
  );
};
