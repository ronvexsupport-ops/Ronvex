import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, ArrowLeft, Loader2, Share2, Check } from 'lucide-react';
import { CMSService, INITIAL_CUSTOM_PAGES } from '../services/cmsService';
import { CustomPage } from '../types';
import { applySEO } from '../utils/seoUtils';
import { buildPublicUrl } from '../utils/slugUtils';
import { useAuth } from '../context/AuthContext';

interface CustomContentPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const CustomContentPage: React.FC<CustomContentPageProps> = ({ slug, onNavigate }) => {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Contact form state if on contact page
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadPage = async () => {
      setLoading(true);
      try {
        const found = await CMSService.getPageBySlug(slug);
        if (isMounted) {
          if (found && (found.isPublished || isAdmin)) {
            setPage(found);
            applySEO({
              title: found.title,
              seoTitle: found.seoTitle || found.metaTitle,
              metaDescription: found.metaDescription,
              ogImage: found.featuredImageUrl,
              canonicalPath: `/pages/${found.slug}`,
              type: 'website',
            });
          } else {
            setPage(null);
          }
        }
      } catch (err) {
        console.warn('Error loading custom page:', err);
        if (isMounted) setPage(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPage();
    return () => {
      isMounted = false;
    };
  }, [slug, isAdmin]);

  const handleCopyLink = () => {
    if (!page) return;
    const urls = buildPublicUrl('page', page.slug);
    navigator.clipboard.writeText(urls.fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setSubmitError('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await CMSService.submitContactMessage({
        fullName: contactName.trim(),
        email: contactEmail.trim(),
        phone: contactPhone.trim() || undefined,
        subject: contactSubject.trim() || 'General Inquiry',
        message: contactMessage.trim(),
      });
      setSubmitSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactSubject('');
      setContactMessage('');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading page content...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold font-serif text-slate-900 mb-2">Page Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">The requested page could not be located or is currently unpublished.</p>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Draft banner notice if viewing draft as admin */}
      {!page.isPublished && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Draft Mode:</strong> This page is currently unpublished and not visible to public visitors.
          </span>
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-slate-950 tracking-tight">
            {page.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Last updated: {new Date(page.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyLink}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-700 shadow-xs transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      {page.featuredImageUrl && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 shadow-xs max-h-[380px] bg-slate-100">
          <img src={page.featuredImageUrl} alt={page.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
          {page.content}
        </div>

        {/* If this is the contact page, show interactive contact form */}
        {(slug === 'contact' || slug === 'contact-us' || slug === 'contact-ronvex') && (
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h2 className="text-lg font-bold font-serif text-slate-900 mb-2">Send Us a Direct Message</h2>
            <p className="text-xs text-slate-500 mb-6">
              Have a question about a product, bulk distribution, or partner support? Leave a message below.
            </p>

            {submitSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-semibold">Thank you! Your message has been received.</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Our support team will review your inquiry and reach out shortly.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="e.g. tanvir@gmail.com"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={e => setContactSubject(e.target.value)}
                      placeholder="e.g. Order Inquiry / Warranty Question"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message *</label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    placeholder="Write your message here..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
