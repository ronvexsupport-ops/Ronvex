import React, { useState, useEffect } from 'react';
import { ShieldCheck, Truck, RotateCcw, PhoneCall } from 'lucide-react';
import { CMSService, DEFAULT_FOOTER_CONFIG } from '../services/cmsService';
import { FooterConfig } from '../types';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenDiagnostics?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenDiagnostics }) => {
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const config = await CMSService.getFooterConfig();
        if (config) setFooterConfig(config);
      } catch (e) {
        console.warn('Footer: Error loading footer config:', e);
      }
    };
    fetchFooter();
  }, []);

  const handleLinkClick = (url: string) => {
    if (!url) return;
    const clean = url.replace(/^#\/?/, '');
    if (clean.includes('affiliate/register') || clean === 'affiliate-register' || clean === 'register') {
      onNavigate('affiliate-register');
    } else if (clean.includes('affiliate/status') || clean === 'affiliate-status') {
      onNavigate('affiliate-status');
    } else if (clean.includes('affiliate/dashboard') || clean === 'affiliate-dashboard') {
      onNavigate('affiliate-dashboard');
    } else if (clean.startsWith('pages/')) {
      onNavigate('page', clean.replace('pages/', ''));
    } else if (clean.startsWith('page/')) {
      onNavigate('page', clean.replace('page/', ''));
    } else if (clean.startsWith('blog/')) {
      onNavigate('blog-post', clean.replace('blog/', ''));
    } else if (clean === 'blog') {
      onNavigate('blog');
    } else if (clean.startsWith('shop')) {
      const parts = clean.split('?category=');
      if (parts.length > 1) {
        onNavigate('shop', parts[1]);
      } else {
        onNavigate('shop');
      }
    } else if (clean === 'track-order') {
      onNavigate('track-order');
    } else if (clean === 'admin' || clean === 'admin-portal') {
      onNavigate('admin-portal');
    } else {
      onNavigate(clean);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 mt-20">
      {/* Trust & Guarantee Strip */}
      <div className="border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Nationwide COD</div>
              <div className="text-xs text-slate-400 mt-0.5">Cash on delivery across all 64 districts in Bangladesh.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Authentic Hardware</div>
              <div className="text-xs text-slate-400 mt-0.5">100% manufacturer verified with official warranty coverage.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">7-Day Inspection</div>
              <div className="text-xs text-slate-400 mt-0.5">Hassle-free replacement policy for defect or transit damage.</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <PhoneCall className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Dedicated Support</div>
              <div className="text-xs text-slate-400 mt-0.5">Saturday to Thursday 9:00 AM – 8:00 PM (Dhaka Time).</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="text-xl font-bold font-serif text-white tracking-tight">RONVEX</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {footerConfig.aboutText}
          </p>
          <div className="text-xs text-slate-500 pt-2 space-y-1">
            <div>{footerConfig.address}</div>
            <div>{footerConfig.email} · {footerConfig.phone}</div>
          </div>
        </div>

        {footerConfig.columns.map(col => (
          <div key={col.id}>
            <div className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              {col.title}
            </div>
            <ul className="space-y-2 text-xs">
              {col.links.map((link, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleLinkClick(link.url)}
                    className="hover:text-white transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Operations & Access</div>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('admin-portal')}
                className="hover:text-white transition-colors"
              >
                Operations Hub (Admin)
              </button>
            </li>
            {onOpenDiagnostics && (
              <li>
                <button
                  type="button"
                  onClick={onOpenDiagnostics}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>Run Business & Payout Tests</span>
                </button>
              </li>
            )}
            <li>
              <span className="text-slate-500">Firestore: Realtime Connected</span>
            </li>
            <li>
              <span className="text-slate-500">Weekly Payouts: Every Wednesday</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>{footerConfig.copyrightText || `© ${new Date().getFullYear()} RONVEX Technologies Ltd. All rights reserved.`}</div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">Dhaka · Chattogram · Sylhet · Rajshahi · Khulna</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
