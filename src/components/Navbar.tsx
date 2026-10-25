import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, User, ShieldCheck, TrendingUp, LogOut, ChevronDown, Menu, X, ArrowRight, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CMSService, DEFAULT_HEADER_CONFIG } from '../services/cmsService';
import { HeaderConfig } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  affiliateStorefrontSlug?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, affiliateStorefrontSlug }) => {
  const { itemCount, setIsCartOpen, activeAttribution } = useCart();
  const { currentUser, appUser, adminRecord, isAdmin, isAffiliate, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG);

  useEffect(() => {
    const fetchHeader = async () => {
      try {
        const config = await CMSService.getHeaderConfig();
        if (config) setHeaderConfig(config);
      } catch (e) {
        console.warn('Navbar: Error loading header config:', e);
      }
    };
    fetchHeader();
  }, []);

  const handleMobileNav = (view: string, param?: string) => {
    setShowMobileMenu(false);
    onNavigate(view, param);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner for Affiliate Storefront or Global Announcement */}
      {affiliateStorefrontSlug ? (
        <div className="bg-slate-900 text-white text-xs py-1.5 px-4 text-center">
          <span className="font-medium">Special Partner Storefront</span>
          <span className="mx-2 text-slate-400">·</span>
          <span>Curated pricing & exclusive verified deals through RONVEX</span>
        </div>
      ) : (
        headerConfig.topNoticeEnabled && headerConfig.topNoticeText && (
          <div className="bg-slate-900 text-white text-xs py-1.5 px-4 text-center">
            <span>{headerConfig.topNoticeText}</span>
          </div>
        )
      )}

      {/* 3-Zone Header Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-xl font-extrabold tracking-tight text-slate-950 font-serif hover:opacity-85 transition-opacity text-left"
          >
            {headerConfig.brandName || 'RONVEX'}
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

        {/* Zone 3: Primary Action & Authentication Controls */}
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

          {/* Real Authentication Account / Admin Menu */}
          <div className="relative">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {isAdmin ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span className="hidden sm:inline font-medium">
                  {adminRecord?.displayName || appUser?.displayName || (isAdmin ? 'Admin' : 'Account')}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('admin-portal')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Admin Sign In"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Admin Access</span>
              </button>
            )}

            {showUserMenu && currentUser && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900 truncate">
                    {adminRecord?.displayName || appUser?.displayName || 'User'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('admin-portal');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold">Operations Hub</div>
                      <div className="text-[10px] text-slate-500">Website CMS & Management</div>
                    </div>
                  </button>
                )}

                {isAffiliate && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onNavigate('affiliate-dashboard');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-semibold">Affiliate Dashboard</div>
                      <div className="text-[10px] text-slate-500">Earnings & Storefront</div>
                    </div>
                  </button>
                )}

                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                      onNavigate('home');
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

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
                Operations Hub (Admin)
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
