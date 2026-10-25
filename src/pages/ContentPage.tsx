import React from 'react';
import { ArrowLeft, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface ContentPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ContentPage: React.FC<ContentPageProps> = ({ slug, onNavigate }) => {
  const { getPageBySlug } = useCms();
  const page = getPageBySlug(slug);

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 font-serif">Page Not Found</h1>
        <p className="text-xs text-slate-500">The requested content page is currently unavailable or under revision.</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Breadcrumb / Back button */}
      <div>
        <button
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-[11px] font-semibold">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Verified RONVEX Content</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-slate-950">
          {page.title}
        </h1>
        {page.subtitle && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            {page.subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
          <Clock className="w-3 h-3" />
          <span>Last revised: {new Date(page.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-sans shadow-xs">
        {page.content}
      </div>

      {/* Helpful Action Links */}
      <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <div className="font-semibold text-slate-900">Have questions about our operations or partnerships?</div>
          <div className="text-slate-500 mt-0.5">Reach out to our executive support team or apply to join our partner program.</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigate('affiliate-register')}
            className="px-4 py-2 bg-slate-950 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Join Affiliate Program
          </button>
        </div>
      </div>
    </div>
  );
};
