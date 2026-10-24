import React, { useState } from 'react';
import { ShoppingBag, Search, User, ShieldCheck, TrendingUp, LogOut, CheckCircle, ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PricingEngine } from '../services/pricingEngine';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  affiliateStorefrontSlug?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, affiliateStorefrontSlug }) => {
  const { itemCount, setIsCartOpen, activeAttribution } = useCart();
  const { appUser, isAdmin, isAffiliate, logout, loginAsDemoAdmin, loginAsDemoAffiliate, isDemoMode } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleMobileNav = (view: string, param?: string) => {
    setShowMobileMenu(false);
    onNavigate(view, param);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner for Affiliate Storefront or Global Announcement */}
      {affiliateStorefrontSlug && (
        <div className="bg-slate-900 text-white text-xs py-1.5 px-4 text-center">
          <span className="font-medium">Special Partner Storefront</span>
          <span className="mx-2 text-slate-400">·</span>
          <span>Curated pricing & exclusive verified deals through RONVEX</span>
        </div>
      )}

      {/* Strict 3-Zone Header Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-xl font-extrabold tracking-tight text-slate-950 font-serif hover:opacity-85 transition-opacity text-left"
          >
            RONVEX
          </button>
          {activeAttribution && !affiliateStorefrontSlug && (
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono tracking-tight bg-slate-100 px-2 py-0.5 rounded">
              Ref: {activeAttribution.affiliateSlug}
            </span>
          )}
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className={`whitespace-nowrap transition-colors hover:text-slate-950 ${
              currentView === 'shop' ? 'text-slate-950 font-semibold underline underline-offset-8' : ''
            }`}
          >
            Catalog
          </button>
          <button
            type="button"
            onClick={() => onNavigate('shop', 'wearables')}
            className="whitespace-nowrap transition-colors hover:text-slate-950"
          >
            Wearables
          </button>
          <button
            type="button"
            onClick={() => onNavigate('shop', 'audio')}
            className="whitespace-nowrap transition-colors hover:text-slate-950"
          >
            Audio
          </button>
          <button
            type="button"
            onClick={() => onNavigate('track-order')}
            className={`whitespace-nowrap transition-colors hover:text-slate-950 ${
              currentView === 'track-order' ? 'text-slate-950 font-semibold underline underline-offset-8' : ''
            }`}
          >
            Track Order
          </button>
          <button
            type="button"
            onClick={() => onNavigate(isAffiliate ? 'affiliate-dashboard' : 'affiliate-register')}
            className={`whitespace-nowrap transition-colors hover:text-slate-950 ${
              currentView === 'affiliate-register' || currentView === 'affiliate-dashboard' ? 'text-slate-950 font-semibold underline underline-offset-8' : ''
            }`}
          >
            {isAffiliate ? 'Affiliate Portal' : 'Join Affiliate Program'}
          </button>
        </nav>

        {/* Zone 3: Primary Action & Context Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Join Affiliate Program Header Button for visitors */}
          {!isAffiliate && (
            <button
              type="button"
              onClick={() => onNavigate('affiliate-register')}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <span>Join Affiliate Program</span>
            </button>
          )}

          {/* Quick Role Switcher for Testing & Demonstration */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Switch user role or access diagnostic tools"
            >
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">
                {appUser ? (isAdmin ? 'Admin' : isAffiliate ? 'Affiliate' : 'Customer') : 'Role Demo'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">Platform Persona Switch</p>
                  <p className="text-[11px] text-slate-500">Test roles & admin privileges</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoAdmin();
                    setShowRoleMenu(false);
                    onNavigate('admin-portal');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">Administrator View</div>
                    <div className="text-[10px] text-slate-500">ronvex.support@gmail.com</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loginAsDemoAffiliate();
                    setShowRoleMenu(false);
                    onNavigate('affiliate-dashboard');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                >
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Affiliate Partner View</div>
                    <div className="text-[10px] text-slate-500">Slug: techdeals-bd</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRoleMenu(false);
                    onNavigate('affiliate-register');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                >
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="font-medium">Join Affiliate Program</div>
                    <div className="text-[10px] text-slate-500">Applicant registration form</div>
                  </div>
                </button>

                {appUser && (
                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                        onNavigate('home');
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin shortcut button if logged in as Admin */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigate('admin-portal')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 text-slate-700 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-100"
            aria-label="View Shopping Bag"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-slate-900 text-white text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center tabular-nums">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 text-slate-700 hover:text-slate-950 transition-colors rounded-lg hover:bg-slate-100 md:hidden"
            aria-label="Open Navigation Menu"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 animate-fade-in shadow-lg">
          <div className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <button
              type="button"
              onClick={() => handleMobileNav('shop')}
              className="text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              Catalog
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav('shop', 'wearables')}
              className="text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              Wearables
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav('shop', 'audio')}
              className="text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              Audio
            </button>
            <button
              type="button"
              onClick={() => handleMobileNav('track-order')}
              className="text-left py-2 px-3 hover:bg-slate-50 rounded-lg"
            >
              Track Order
            </button>

            {/* Mobile "Join Affiliate Program" Button */}
            <button
              type="button"
              onClick={() => handleMobileNav('affiliate-register')}
              className="w-full text-left py-2.5 px-3 bg-slate-950 text-white rounded-xl text-xs font-semibold flex items-center justify-between mt-2"
            >
              <span>Join Affiliate Program</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleMobileNav('affiliate-status')}
              className="text-left py-2 px-3 text-xs text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              Check Affiliate Application Status
            </button>

            {isAffiliate && (
              <button
                type="button"
                onClick={() => handleMobileNav('affiliate-dashboard')}
                className="text-left py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg"
              >
                Enter Affiliate Dashboard
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleMobileNav('admin-portal')}
                className="text-left py-2 px-3 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg"
              >
                Admin Console
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
