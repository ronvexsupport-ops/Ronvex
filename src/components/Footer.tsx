import React from 'react';
import { ShieldCheck, Truck, RotateCcw, PhoneCall } from 'lucide-react';
import { useCms } from '../context/CmsContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenDiagnostics?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenDiagnostics }) => {
  const { cms } = useCms();
  const f = cms?.footer;

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
              <div className="text-xs text-slate-400 mt-0.5">{f?.hours || 'Saturday to Thursday 9:00 AM – 8:00 PM (Dhaka Time)'}.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="text-xl font-bold font-serif text-white tracking-tight">{f?.brandName || 'RONVEX'}</div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {f?.description ||
              'Leading modern e-commerce and affiliate ecosystem in Bangladesh. Engineered with transparent affiliate pricing, automated margin attribution, and reliable nationwide fulfillment.'}
          </p>
          <div className="text-xs text-slate-500 pt-2 space-y-1">
            <div>{f?.address || 'Level 8, Motijheel C/A, Dhaka 1000, Bangladesh'}</div>
            <div>{f?.email || 'ronvex.support@gmail.com'} · {f?.phone || '+880 1700-000000'}</div>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Shop & Categories</div>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">
                All Products
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'wearables')} className="hover:text-white transition-colors">
                Smart Wearables
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'audio')} className="hover:text-white transition-colors">
                Audio Hardware
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('shop', 'lifestyle')} className="hover:text-white transition-colors">
                Bags & Lifestyle
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('track-order')} className="hover:text-white transition-colors">
                Order Tracking
              </button>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Company & CMS Pages</div>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('page', 'about-us')}
                className="hover:text-white transition-colors text-left"
              >
                About RONVEX
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('page', 'affiliate-agreement')}
                className="hover:text-white transition-colors text-left"
              >
                Affiliate Agreement
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('page', 'shipping-delivery')}
                className="hover:text-white transition-colors text-left"
              >
                Shipping & Delivery Policy
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('page', 'faqs')}
                className="hover:text-white transition-colors text-left"
              >
                Frequently Asked Questions
              </button>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Affiliate Partners & Admin</div>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('affiliate-register')}
                className="hover:text-white transition-colors text-left"
              >
                Join Affiliate Program
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('affiliate-status')}
                className="hover:text-white transition-colors text-left"
              >
                Application Status
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('affiliate-dashboard')}
                className="hover:text-white transition-colors text-left"
              >
                Partner Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('admin-portal')} className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                Admin Control Center
              </button>
            </li>
            {onOpenDiagnostics && (
              <li>
                <button
                  onClick={onOpenDiagnostics}
                  className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Diagnostics & Unit Tests</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>{f?.copyright || `© ${new Date().getFullYear()} RONVEX Technologies Ltd. All rights reserved.`}</div>
          <div className="flex items-center gap-4">
            <span className="text-slate-600">{f?.deliveryDistricts || 'Dhaka · Chattogram · Sylhet · Rajshahi · Khulna'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
