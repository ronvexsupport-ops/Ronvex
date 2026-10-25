import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Copy,
  ExternalLink,
  Sliders,
  Wallet,
  AlertCircle,
  HelpCircle,
  Target,
  Store,
  UserCheck,
  ShoppingBag,
  Share2,
  QrCode,
  ArrowRight,
  Filter,
  Check,
  Building,
  Smartphone,
  Info,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import {
  Product,
  Order,
  Commission,
  MonthlyAffiliateStat,
  Payout,
  PayoutMethod,
  Affiliate,
} from '../types';
import { PricingEngine, DEFAULT_PLATFORM_SETTINGS } from '../services/pricingEngine';
import { AffiliateService } from '../services/affiliateService';
import { PayoutService } from '../services/payoutService';
import { OrderService } from '../services/orderService';

interface AffiliateDashboardPageProps {
  products: Product[];
  onNavigate: (view: string, param?: string) => void;
}

type TabType = 'overview' | 'mystore' | 'pricing' | 'orders' | 'commissions' | 'payouts' | 'profile';

export const AffiliateDashboardPage: React.FC<AffiliateDashboardPageProps> = ({
  products,
  onNavigate,
}) => {
  const { appUser, affiliateProfile, isAffiliate, isPendingAffiliate } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const [orders, setOrders] = useState<Order[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [balanceSummary, setBalanceSummary] = useState({
    totalEarned: 0,
    pendingCommission: 0,
    payableCommission: 0,
    inFlightPayouts: 0,
    availablePayableBalance: 0,
    totalPaid: 0,
  });
  const [monthlyStat, setMonthlyStat] = useState<MonthlyAffiliateStat | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  // Price adjustment state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [proposedPriceInput, setProposedPriceInput] = useState<number>(0);
  const [priceUpdateSuccess, setPriceUpdateSuccess] = useState<string | null>(null);
  const [priceUpdateError, setPriceUpdateError] = useState<string | null>(null);

  // Payout request modal / form state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Profile Settings form state
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profilePayoutMethod, setProfilePayoutMethod] = useState<PayoutMethod>('bkash');
  const [profilePayoutAccount, setProfilePayoutAccount] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Filter state for orders
  const [orderFilter, setOrderFilter] = useState<'all' | 'delivered' | 'pending' | 'cancelled'>('all');

  // Quick Referral Link Generator selected product
  const [selectedReferralProductId, setSelectedReferralProductId] = useState<string>(
    products[0]?.productId || ''
  );

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const affiliateId = affiliateProfile?.affiliateId || appUser?.uid || 'demo_affiliate_uid';
  const affiliateSlug = affiliateProfile?.affiliateSlug || 'techdeals-bd';
  const effectiveDisplayName = affiliateProfile?.displayName || appUser?.displayName || 'TechDeals BD';

  // Initialize profile form values when profile changes
  useEffect(() => {
    if (affiliateProfile) {
      setProfileDisplayName(affiliateProfile.displayName || '');
      setProfilePhone(affiliateProfile.phone || appUser?.phone || '');
      setProfileBio(affiliateProfile.bio || '');
      setProfilePayoutMethod(affiliateProfile.payoutMethod || 'bkash');
      setProfilePayoutAccount(affiliateProfile.payoutAccountNumber || affiliateProfile.phone || '');
    } else if (appUser) {
      setProfileDisplayName(appUser.displayName || '');
      setProfilePhone(appUser.phone || '');
    }
  }, [affiliateProfile, appUser]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Load orders attributed to this affiliate
        const orderQ = query(collection(db, 'orders'), where('affiliateId', '==', affiliateId));
        const orderSnap = await getDocs(orderQ);
        const loadedOrders = orderSnap.docs.map(d => d.data() as Order);
        setOrders(loadedOrders);

        // 2. Load custom prices
        const prices = await AffiliateService.getAffiliatePrices(affiliateId);
        setCustomPrices(prices);

        // 3. Load balance summary
        const summary = await PayoutService.getAffiliateBalanceSummary(affiliateId);
        setBalanceSummary(summary);

        // 4. Load commissions
        const commQ = query(collection(db, 'commissions'), where('affiliateId', '==', affiliateId));
        const commSnap = await getDocs(commQ);
        setCommissions(commSnap.docs.map(d => d.data() as Commission));

        // 5. Load monthly stats
        const yearMonth = OrderService.getBangladeshYearMonth();
        const statSnap = await getDocs(
          query(
            collection(db, 'monthlyAffiliateStats'),
            where('affiliateId', '==', affiliateId),
            where('yearMonth', '==', yearMonth)
          )
        );
        if (!statSnap.empty) {
          setMonthlyStat(statSnap.docs[0].data() as MonthlyAffiliateStat);
        } else {
          const deliveredTotal = loadedOrders
            .filter(o => o.orderStatus === 'DELIVERED')
            .reduce((sum, o) => sum + o.subtotal, 0);

          setMonthlyStat({
            id: `${affiliateId}_${yearMonth}`,
            affiliateId,
            yearMonth,
            eligibleDeliveredSales: deliveredTotal,
            targetAmount: DEFAULT_PLATFORM_SETTINGS.defaultMonthlyTarget,
            bonusAmount: DEFAULT_PLATFORM_SETTINGS.defaultMonthlyBonus,
            bonusStatus: deliveredTotal >= DEFAULT_PLATFORM_SETTINGS.defaultMonthlyTarget ? 'QUALIFIED' : 'IN_PROGRESS',
            updatedAt: new Date().toISOString(),
          });
        }

        // 6. Load payout requests
        const payoutQ = query(collection(db, 'payouts'), where('affiliateId', '==', affiliateId));
        const payoutSnap = await getDocs(payoutQ);
        setPayouts(payoutSnap.docs.map(d => d.data() as Payout));
      } catch (err) {
        console.error('Error loading affiliate dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [affiliateId]);

  // Handle saving new selling price
  const handleSavePrice = async (product: Product) => {
    setPriceUpdateError(null);
    setPriceUpdateSuccess(null);

    const validation = PricingEngine.validateAffiliatePrice(
      product.adminBasePrice,
      product.maxAffiliateIncrease,
      proposedPriceInput
    );

    if (!validation.valid) {
      setPriceUpdateError(validation.reason || 'Invalid price');
      return;
    }

    try {
      await AffiliateService.setCustomProductPrice({
        affiliateId,
        productId: product.productId,
        proposedPrice: proposedPriceInput,
      });

      setCustomPrices(prev => ({
        ...prev,
        [product.productId]: proposedPriceInput,
      }));
      setPriceUpdateSuccess(`Price updated to ৳${proposedPriceInput}. Your gross margin is +৳${proposedPriceInput - product.adminBasePrice}.`);
      setEditingProductId(null);
      showToast('বিক্রয়মূল্য সফলভাবে আপডেট করা হয়েছে');
    } catch (err: any) {
      setPriceUpdateError(err.message || 'Failed to update custom price.');
    }
  };

  // Handle submitting payout request (No minimum payout threshold!)
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccess(null);

    if (payoutAmount <= 0) {
      setPayoutError('Payout request amount must be greater than ৳0.');
      return;
    }

    if (payoutAmount > balanceSummary.availablePayableBalance) {
      setPayoutError(`Amount exceeds your available payable balance of ৳${balanceSummary.availablePayableBalance}.`);
      return;
    }

    if (!accountNumber.trim()) {
      setPayoutError('Please provide your destination account number.');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const newPayout = await PayoutService.requestPayout({
        affiliateId,
        affiliateName: effectiveDisplayName,
        affiliateEmail: affiliateProfile?.email || appUser?.email,
        requestedAmount: payoutAmount,
        paymentMethod: payoutMethod,
        payoutDetails: {
          accountNumber: accountNumber.trim(),
        },
      });

      setPayouts(prev => [newPayout, ...prev]);
      setPayoutSuccess(`Payout request of ৳${payoutAmount} submitted successfully. Disbursed next Wednesday.`);
      setShowPayoutModal(false);
      showToast(`৳${payoutAmount} পে-আউট রিকোয়েস্ট সফলভাবে জমা হয়েছে`);

      // Refresh balance
      const summary = await PayoutService.getAffiliateBalanceSummary(affiliateId);
      setBalanceSummary(summary);
    } catch (err: any) {
      setPayoutError(err.message || 'Failed to submit payout request.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Handle saving Profile & Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileDisplayName.trim()) {
      setProfileError('Display Name / Store Name cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await AffiliateService.updateAffiliateProfile(affiliateId, {
        displayName: profileDisplayName.trim(),
        phone: profilePhone.trim(),
        bio: profileBio.trim(),
        payoutMethod: profilePayoutMethod,
        payoutAccountNumber: profilePayoutAccount.trim(),
      });

      setProfileSuccess('Profile and payout settings updated successfully.');
      showToast('প্রোফাইল এবং পে-আউট তথ্য সফলভাবে সংরক্ষিত হয়েছে');
    } catch (err: any) {
      console.error('Failed to update affiliate profile:', err);
      setProfileError(err.message || 'Failed to update profile settings.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Storefront URLs
  const storeUrlAlias = `${window.location.origin}/#/store/${affiliateSlug}`;
  const affiliateUrlAlias = `${window.location.origin}/#/affiliate/${affiliateSlug}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} লিংক ক্লিপবোর্ডে কপি হয়েছে!`);
  };

  // Order counts & metrics
  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'PENDING').length;
  const deliveredOrdersCount = orders.filter(o => o.orderStatus === 'DELIVERED').length;
  const cancelledOrdersCount = orders.filter(o => o.orderStatus === 'CANCELLED' || o.orderStatus === 'RETURNED').length;
  const grossAttributedSales = orders.reduce((sum, o) => sum + o.subtotal, 0);

  const targetCompletionPct = monthlyStat
    ? Math.min(100, Math.round((monthlyStat.eligibleDeliveredSales / monthlyStat.targetAmount) * 100))
    : 0;

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    if (orderFilter === 'delivered') return order.orderStatus === 'DELIVERED';
    if (orderFilter === 'pending') return order.orderStatus === 'PENDING' || order.orderStatus === 'PROCESSING' || order.orderStatus === 'SHIPPED';
    if (orderFilter === 'cancelled') return order.orderStatus === 'CANCELLED' || order.orderStatus === 'RETURNED';
    return true;
  });

  // Check gatekeeping state
  const isApproved = affiliateProfile?.accountStatus === 'APPROVED' || (appUser?.role === 'affiliate' && appUser?.accountStatus === 'active');
  const isPending = isPendingAffiliate || appUser?.accountStatus === 'pending' || affiliateProfile?.accountStatus === 'PENDING';
  const isRejected = appUser?.accountStatus === 'rejected';
  const isSuspended = appUser?.accountStatus === 'suspended' || affiliateProfile?.accountStatus === 'SUSPENDED';

  // GATEKEEPING RENDER: If applicant is PENDING
  if (isPending) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-8 animate-fade-in">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200">
              <Clock className="w-8 h-8 animate-spin" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-300 text-amber-900 rounded-full font-bold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Pending Approval</span>
            </div>
          </div>

          <div className="space-y-4 text-slate-800 leading-relaxed font-sans text-sm sm:text-base text-left bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <p className="font-bold text-slate-950 text-base sm:text-lg">
              ধন্যবাদ! RONVEX Affiliate Program-এ যোগ দেওয়ার জন্য আপনার আবেদনটি সফলভাবে জমা হয়েছে।
            </p>
            <p className="text-slate-700">
              আমাদের অ্যাডমিন টিম আপনার আবেদন যাচাই করছে। আপনার অ্যাকাউন্ট অনুমোদিত হলে আপনি অ্যাফিলিয়েট পোর্টালে প্রবেশ করতে পারবেন।
            </p>
            <div className="p-3 bg-amber-100/60 border border-amber-200 rounded-xl text-amber-950 font-medium text-xs sm:text-sm">
              অনুগ্রহ করে অপেক্ষা করুন। আপনার আবেদনের অবস্থা <strong className="font-bold">Pending Approval</strong>।
            </div>
            <p className="font-medium text-slate-900 pt-1">
              RONVEX-এর সঙ্গে আপনার অনলাইন আয়ের যাত্রা শুরু করার জন্য ধন্যবাদ!
            </p>
          </div>

          {/* Locked Sensitive Notice */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-left text-xs text-slate-600 flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block mb-0.5">সিকিউরিটি ও অ্যাক্সেস সীমাবদ্ধতা</span>
              <p>অ্যাকাউন্ট অনুমোদিত না হওয়া পর্যন্ত সক্রিয় ট্র্যাকিং লিংক তৈরি, কাস্টম বিক্রয়মূল্য নির্ধারণ এবং পে-আউট রিকোয়েস্ট লক রাখা হয়েছে। অনুমোদন সম্পন্ন হলে সব ফিচার স্বয়ংক্রিয়ভাবে সক্রিয় হবে।</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('affiliate-status', appUser?.email || '')}
              className="flex-1 py-3 px-5 bg-slate-950 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <span>আবেদনের অবস্থা দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 py-3 px-5 bg-slate-100 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-200"
            >
              হোমপেজে ফিরে যান
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GATEKEEPING RENDER: If applicant is REJECTED
  if (isRejected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif text-slate-900">Application Declined</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            আপনার অ্যাফিলিয়েট আবেদনটি পর্যালোচনার পর এই মুহূর্তে অনুমোদন করা সম্ভব হয়নি। কোনো জিজ্ঞাসা থাকলে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন: <strong className="font-mono">ronvex.support@gmail.com</strong>
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  // GATEKEEPING RENDER: If applicant is SUSPENDED
  if (isSuspended) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif text-slate-900">Account Suspended</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            আপনার অ্যাফিলিয়েট অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। অ্যাকাউন্টের স্ট্যাটাস পুনঃযাচাইয়ের জন্য অ্যাডমিন সাপোর্টে যোগাযোগ করুন।
          </p>
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  // GATEKEEPING RENDER: If not logged in as affiliate (offer login or demo switch)
  if (!isApproved) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
          <Store className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif text-slate-900">Affiliate Portal Access</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Please register as an affiliate partner or check your application review status to enter the dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('affiliate-status')}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Check Application Status
          </button>
          <button
            type="button"
            onClick={() => onNavigate('affiliate-register')}
            className="flex-1 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Apply to Become an Affiliate
          </button>
        </div>
      </div>
    );
  }

  // RENDER: FULL 7-SECTION AFFILIATE PORTAL (APPROVED)
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header / Welcome Lockup */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Affiliate Partner Portal
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Approved Partner</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950 mt-1">
            Welcome, {effectiveDisplayName}
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
            <span>Store Slug: <strong className="text-slate-800 font-mono">@{affiliateSlug}</strong></span>
            <span>·</span>
            <span>Payout Day: <strong className="text-slate-800">Every Wednesday</strong></span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">No Minimum Payout Threshold</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('affiliate-storefront', affiliateSlug)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <Store className="w-3.5 h-3.5 text-slate-600" />
            <span>Open My Store</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={() => copyToClipboard(storeUrlAlias, 'My Store')}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy Store URL</span>
          </button>

          <button
            onClick={() => {
              setPayoutAmount(balanceSummary.availablePayableBalance > 0 ? balanceSummary.availablePayableBalance : 0);
              setShowPayoutModal(true);
            }}
            disabled={balanceSummary.availablePayableBalance <= 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 disabled:opacity-40 transition-colors shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Request Payout ({PricingEngine.formatBDT(balanceSummary.availablePayableBalance)})</span>
          </button>
        </div>
      </div>

      {/* Complete 7-Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs scrollbar-none">
        {[
          { id: 'overview', label: 'Dashboard', icon: TrendingUp },
          { id: 'mystore', label: 'My Store', icon: Store },
          { id: 'pricing', label: 'Products & Pricing', icon: Sliders },
          { id: 'orders', label: `Orders & Sales (${orders.length})`, icon: Package },
          { id: 'commissions', label: `Earnings & Commission (${commissions.length})`, icon: DollarSign },
          { id: 'payouts', label: `Payouts (${payouts.length})`, icon: Wallet },
          { id: 'profile', label: 'Profile & Settings', icon: UserCheck },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION A: DASHBOARD (OVERVIEW) */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Prominent Wednesday Notice */}
          <div className="p-4 bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Weekly Wednesday Manual Payouts</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Every Wednesday, the administrator manually disburses each affiliate's entire available payable balance via bKash, Nagad, or Bank Transfer. There is <strong>no minimum payout threshold</strong> (whether ৳50, ৳200, ৳500, or ৳1,500+).
              </p>
            </div>
            <button
              onClick={() => setActiveTab('payouts')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shrink-0 transition-colors"
            >
              Inspect Payout Rules
            </button>
          </div>

          {/* 8 Primary Financial & Order KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Attributed Sales
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {PricingEngine.formatBDT(grossAttributedSales)}
              </div>
              <p className="text-[10px] text-slate-400">Total volume across {orders.length} customer orders</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Delivered Sales
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-800 tabular-nums">
                {PricingEngine.formatBDT(monthlyStat?.eligibleDeliveredSales || 0)}
              </div>
              <p className="text-[10px] text-emerald-700">{deliveredOrdersCount} delivered & verified orders</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pending Orders
              </span>
              <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
                {pendingOrdersCount}
              </div>
              <p className="text-[10px] text-slate-400">Processing or awaiting courier delivery</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Cancelled Orders
              </span>
              <div className="text-2xl font-bold font-mono text-slate-600 tabular-nums">
                {cancelledOrdersCount}
              </div>
              <p className="text-[10px] text-slate-400">Cancelled or returned (no commission)</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Earned Commission
              </span>
              <div className="text-2xl font-bold font-mono text-slate-950 tabular-nums">
                {PricingEngine.formatBDT(balanceSummary.totalEarned)}
              </div>
              <p className="text-[10px] text-slate-400">Lifetime gross earned commissions</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pending Commission
              </span>
              <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
                {PricingEngine.formatBDT(balanceSummary.pendingCommission)}
              </div>
              <p className="text-[10px] text-slate-400">Awaiting customer delivery verification</p>
            </div>

            <div className="p-5 bg-white border-2 border-emerald-500/40 rounded-2xl space-y-1 bg-emerald-50/20 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Available Payable Balance
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Ready</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 tabular-nums">
                {PricingEngine.formatBDT(balanceSummary.availablePayableBalance)}
              </div>
              <p className="text-[10px] text-slate-500">Payable every Wednesday (No minimum)</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Paid Payout
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {PricingEngine.formatBDT(balanceSummary.totalPaid)}
              </div>
              <p className="text-[10px] text-slate-400">Disbursed to date via bKash/Nagad/Bank</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Quick Management Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => onNavigate('affiliate-storefront', affiliateSlug)}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left space-y-1 transition-colors"
              >
                <Store className="w-4 h-4 text-slate-700" />
                <span className="block text-xs font-semibold text-slate-900">Open Store</span>
                <span className="block text-[10px] text-slate-500">View public shop</span>
              </button>

              <button
                onClick={() => copyToClipboard(storeUrlAlias, 'Store URL')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left space-y-1 transition-colors"
              >
                <Copy className="w-4 h-4 text-slate-700" />
                <span className="block text-xs font-semibold text-slate-900">Copy Store URL</span>
                <span className="block text-[10px] text-slate-500">Share with audience</span>
              </button>

              <button
                onClick={() => setActiveTab('pricing')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left space-y-1 transition-colors"
              >
                <Sliders className="w-4 h-4 text-slate-700" />
                <span className="block text-xs font-semibold text-slate-900">Set Prices</span>
                <span className="block text-[10px] text-slate-500">Configure margins</span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left space-y-1 transition-colors"
              >
                <Package className="w-4 h-4 text-slate-700" />
                <span className="block text-xs font-semibold text-slate-900">View Orders</span>
                <span className="block text-[10px] text-slate-500">Track fulfillment</span>
              </button>

              <button
                onClick={() => {
                  setPayoutAmount(balanceSummary.availablePayableBalance > 0 ? balanceSummary.availablePayableBalance : 0);
                  setShowPayoutModal(true);
                }}
                disabled={balanceSummary.availablePayableBalance <= 0}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left space-y-1 transition-colors disabled:opacity-40"
              >
                <Wallet className="w-4 h-4 text-slate-700" />
                <span className="block text-xs font-semibold text-slate-900">Request Payout</span>
                <span className="block text-[10px] text-slate-500">Withdraw earnings</span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left space-y-1 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-slate-700" />
                <span className="block text-xs font-semibold text-slate-900">Settings</span>
                <span className="block text-[10px] text-slate-500">Profile & Payouts</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Feed / Attributed Orders Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Recent Attributed Activity
                </h3>
                <p className="text-[11px] text-slate-500">Recent customer purchases originating from your affiliate links</p>
              </div>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-semibold text-slate-700 hover:text-slate-950 underline underline-offset-4"
              >
                View All Orders
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <span className="font-semibold text-xs text-slate-800 block">No attributed orders yet</span>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Share your personal store link or product referral links on Facebook, YouTube, or WhatsApp to generate your first sale!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('mystore')}
                  className="px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Visit My Store & Share
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {orders.slice(0, 5).map(order => (
                  <div key={order.orderId} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : order.orderStatus === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-800'
                            : order.orderStatus === 'CANCELLED' || order.orderStatus === 'RETURNED'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')} · {order.customerDetails.district}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total</span>
                        <span className="font-mono font-semibold text-slate-900">{PricingEngine.formatBDT(order.total)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Your Margin</span>
                        <span className="font-mono font-bold text-emerald-700">+{PricingEngine.formatBDT(order.affiliateMarginTotal || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Target Spotlight */}
          <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <Target className="w-4 h-4" />
                <span>Monthly Target: ৳100,000 for ৳800 Performance Bonus</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Reach ৳100,000 in delivered sales within the current calendar month ({OrderService.getBangladeshYearMonth()}) to receive an extra ৳800 bonus credited straight to your payable balance.
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-white tabular-nums">
                  {PricingEngine.formatBDT(monthlyStat?.eligibleDeliveredSales || 0)} / ৳100,000
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {targetCompletionPct}% Completed ({PricingEngine.formatBDT(Math.max(0, 100000 - (monthlyStat?.eligibleDeliveredSales || 0)))} remaining)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: MY STORE / PERSONAL LANDING PAGE */}
      {activeTab === 'mystore' && (
        <div className="space-y-8 animate-fade-in">
          {/* Branded Storefront Banner Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md">
            <div className="max-w-3xl space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-white">RONVEX Verified Partner Store</span>
                <span>·</span>
                <span>Slug: @{affiliateSlug}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-white">
                {effectiveDisplayName}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {affiliateProfile?.bio || 'Curated electronics and lifestyle essentials selected exclusively for our community. All orders include official warranty and nationwide Cash on Delivery.'}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs">
                <button
                  onClick={() => onNavigate('affiliate-storefront', affiliateSlug)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Live Storefront</span>
                </button>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors"
                >
                  Edit Store Tagline & Name
                </button>
              </div>
            </div>
          </div>

          {/* Store URL Sharing Box (Both /store/:slug and /affiliate/:slug supported) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-serif">
                Public Storefront URLs & Attribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Both store URL formats are fully supported and link directly to your curated catalog with 30-day attribution tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary /store/:slug */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Primary Store Route (/store/:slug)</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">Recommended</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={storeUrlAlias}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                  <button
                    onClick={() => copyToClipboard(storeUrlAlias, '/store URL')}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Legacy /affiliate/:slug alias */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Affiliate Alias Route (/affiliate/:slug)</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">Compatible</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={affiliateUrlAlias}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                  <button
                    onClick={() => copyToClipboard(affiliateUrlAlias, '/affiliate URL')}
                    className="px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Product Referral Link Generator */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Quick Product Referral Link Generator
            </h3>
            <p className="text-xs text-slate-500">
              Select any specific product to generate a direct deep link with your affiliate tracking attached:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={selectedReferralProductId}
                onChange={e => setSelectedReferralProductId(e.target.value)}
                className="w-full sm:w-80 px-3 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-medium"
              >
                {products.filter(p => p.isActive).map(p => (
                  <option key={p.productId} value={p.productId}>
                    {p.name} ({PricingEngine.formatBDT(customPrices[p.productId] || p.adminBasePrice)})
                  </option>
                ))}
              </select>

              {(() => {
                const prod = products.find(p => p.productId === selectedReferralProductId);
                const deepLink = prod ? `${window.location.origin}/#/store/${affiliateSlug}?product=${prod.slug}` : storeUrlAlias;

                return (
                  <div className="flex-1 w-full flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={deepLink}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-800"
                    />
                    <button
                      onClick={() => copyToClipboard(deepLink, prod?.name || 'Product')}
                      className="px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Product Link</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Active Products List in Store */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Active Storefront Products ({products.filter(p => p.isActive).length})
              </h3>
              <button
                onClick={() => setActiveTab('pricing')}
                className="text-xs text-slate-600 hover:text-slate-950 underline underline-offset-4"
              >
                Change Selling Prices
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.filter(p => p.isActive).map(prod => {
                const currentPrice = customPrices[prod.productId] || prod.adminBasePrice;
                const margin = currentPrice - prod.adminBasePrice;
                const prodLink = `${window.location.origin}/#/store/${affiliateSlug}?product=${prod.slug}`;

                return (
                  <div key={prod.productId} className="p-4 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrls[0]}
                          alt={prod.name}
                          className="w-14 h-14 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-xs text-slate-900 line-clamp-1">{prod.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Base: {PricingEngine.formatBDT(prod.adminBasePrice)}
                          </div>
                          <div className="text-xs font-bold font-mono text-slate-900 mt-0.5">
                            Selling: {PricingEngine.formatBDT(currentPrice)}
                          </div>
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg text-[11px] flex justify-between items-center text-emerald-900">
                        <span>Margin per sale:</span>
                        <strong className="font-mono text-xs">+{PricingEngine.formatBDT(margin)}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(prodLink, prod.name)}
                      className="w-full py-2 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Product Link</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: PRODUCTS & PRICING */}
      {activeTab === 'pricing' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Product Pricing & Margin Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set custom retail prices within admin-approved bounds. The difference between your selling price and the admin base price is your gross affiliate profit margin.
            </p>
          </div>

          {priceUpdateSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{priceUpdateSuccess}</span>
            </div>
          )}

          {priceUpdateError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{priceUpdateError}</span>
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Admin Base Price</th>
                  <th className="p-3">Max Allowed Increase</th>
                  <th className="p-3">Permitted Selling Range</th>
                  <th className="p-3">Your Selling Price</th>
                  <th className="p-3">Affiliate Profit Margin</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.filter(p => p.isActive).map(product => {
                  const currentPrice = customPrices[product.productId] !== undefined
                    ? customPrices[product.productId]
                    : product.adminBasePrice;

                  const margin = PricingEngine.calculateAffiliateMargin(currentPrice, product.adminBasePrice);
                  const isEditing = editingProductId === product.productId;
                  const prodLink = `${window.location.origin}/#/store/${affiliateSlug}?product=${product.slug}`;

                  return (
                    <tr key={product.productId} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">
                        {product.name}
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-700 tabular-nums">
                        {PricingEngine.formatBDT(product.adminBasePrice)}
                      </td>
                      <td className="p-3 font-mono text-slate-600 tabular-nums">
                        +{PricingEngine.formatBDT(product.maxAffiliateIncrease)}
                      </td>
                      <td className="p-3 text-[11px] text-slate-500 font-mono tabular-nums">
                        {PricingEngine.formatBDT(product.adminBasePrice)} – {PricingEngine.formatBDT(product.adminBasePrice + product.maxAffiliateIncrease)}
                      </td>
                      <td className="p-3 font-mono tabular-nums">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              min={product.adminBasePrice}
                              max={product.adminBasePrice + product.maxAffiliateIncrease}
                              value={proposedPriceInput}
                              onChange={e => setProposedPriceInput(Number(e.target.value))}
                              className="w-24 p-1.5 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:border-slate-900"
                            />
                            <div className="text-[10px] text-emerald-700 font-mono">
                              Margin: +৳{Math.max(0, proposedPriceInput - product.adminBasePrice)}
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-950">
                            {PricingEngine.formatBDT(currentPrice)}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-700 tabular-nums">
                        +{PricingEngine.formatBDT(margin)}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSavePrice(product)}
                              className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProductId(product.productId);
                                setProposedPriceInput(currentPrice);
                              }}
                              className="px-2.5 py-1 border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-100"
                            >
                              Set Price
                            </button>
                            <button
                              onClick={() => copyToClipboard(prodLink, product.name)}
                              title="Copy product link"
                              className="p-1 border border-slate-200 text-slate-500 hover:text-slate-900 rounded"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION D: ORDERS & SALES */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Attributed Customer Orders ({orders.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Read-only transparent view of orders placed via your affiliate store or referral links.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'all', label: `All (${orders.length})` },
                { id: 'delivered', label: `Delivered (${deliveredOrdersCount})` },
                { id: 'pending', label: `In Transit (${pendingOrdersCount})` },
                { id: 'cancelled', label: `Cancelled (${cancelledOrdersCount})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    orderFilter === f.id
                      ? 'bg-white text-slate-950 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Explanation Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="font-semibold text-slate-800 block">Pending / Shipped</span>
              <p className="text-slate-500">Order placed and dispatched. Commission remains in Pending until delivered.</p>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="font-semibold text-emerald-900 block">Delivered & Verified</span>
              <p className="text-emerald-800">Delivered successfully. Commission becomes Eligible & Payable on Wednesday.</p>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
              <span className="font-semibold text-rose-900 block">Cancelled / Returned</span>
              <p className="text-rose-800">Customer rejected or returned parcel. Commission is reversed per policy.</p>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No orders found matching the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Customer Area</th>
                    <th className="p-3">Items & Qty</th>
                    <th className="p-3">Total Value</th>
                    <th className="p-3">Order Status</th>
                    <th className="p-3">Courier Tracking</th>
                    <th className="p-3">Your Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => {
                    const maskedPhone = order.customerDetails.phone.replace(/(\d{3})\d{5}(\d{3})/, '$1*****$2');

                    return (
                      <tr key={order.orderId} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {order.orderNumber}
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-slate-700">
                          {order.customerDetails.district} ({maskedPhone})
                        </td>
                        <td className="p-3 text-slate-600">
                          {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                        </td>
                        <td className="p-3 font-mono font-semibold text-slate-900 tabular-nums">
                          {PricingEngine.formatBDT(order.total)}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              order.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : order.orderStatus === 'SHIPPED'
                                ? 'bg-blue-50 text-blue-800'
                                : order.orderStatus === 'CANCELLED' || order.orderStatus === 'RETURNED'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600">
                          {order.courier?.trackingNumber ? (
                            <span>{order.courier.company}: {order.courier.trackingNumber}</span>
                          ) : (
                            <span className="text-slate-400">Standard Delivery</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-700 tabular-nums">
                          +{PricingEngine.formatBDT(order.affiliateMarginTotal || 0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION E: EARNINGS & COMMISSION */}
      {activeTab === 'commissions' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Earnings & Commission Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent per-order commission ledger showing real-time lifecycle status (Pending, Payable, Paid, or Reversed).
            </p>
          </div>

          {/* Status Breakdown Guidance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <span className="font-bold text-amber-900 block">Pending</span>
              <p className="text-amber-800">Order placed or in transit. Awaiting customer receipt.</p>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
              <span className="font-bold text-emerald-900 block">Eligible / Payable</span>
              <p className="text-emerald-800">Delivered successfully. Automatically disbursed on Wednesday.</p>
            </div>
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="font-bold text-blue-900 block">Paid</span>
              <p className="text-blue-800">Disbursed by administrator with official payment reference.</p>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
              <span className="font-bold text-rose-900 block">Reversed</span>
              <p className="text-rose-800">Order returned or cancelled by customer. Commission voided.</p>
            </div>
          </div>

          {commissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No commission entries recorded yet. Orders will generate commission entries automatically upon placement.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Commission ID</th>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Lifecycle Status</th>
                    <th className="p-3">Payout ID / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map(c => (
                    <tr key={c.commissionId} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono font-bold text-slate-900">{c.commissionId}</td>
                      <td className="p-3 font-mono text-slate-700">{c.orderNumber || c.orderId}</td>
                      <td className="p-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-mono font-bold text-emerald-700 tabular-nums">
                        +{PricingEngine.formatBDT(c.amount)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            c.status === 'PAID'
                              ? 'bg-blue-50 text-blue-800'
                              : c.status === 'PAYABLE' || c.status === 'ELIGIBLE'
                              ? 'bg-emerald-50 text-emerald-800'
                              : c.status === 'REVERSED'
                              ? 'bg-rose-50 text-rose-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {c.payoutId || (c.status === 'PAYABLE' ? 'Scheduled next Wednesday' : '—')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECTION F: PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Affiliate Payout Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Weekly manual payouts processed every Wednesday. No minimum payout threshold.
              </p>
            </div>

            <button
              onClick={() => {
                setPayoutAmount(balanceSummary.availablePayableBalance > 0 ? balanceSummary.availablePayableBalance : 0);
                setShowPayoutModal(true);
              }}
              disabled={balanceSummary.availablePayableBalance <= 0}
              className="px-4 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Request Payout ({PricingEngine.formatBDT(balanceSummary.availablePayableBalance)})</span>
            </button>
          </div>

          {/* Official Wednesday Payout Notice as Specified in Objective */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-slate-900 text-sm block">
              Weekly Wednesday Payouts:
            </span>
            <p>
              Every Wednesday, the administrator manually pays each affiliate their entire available payable balance, regardless of the amount. There is no minimum payout threshold.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200">Balance ৳50 → Pay ৳50</div>
              <div className="bg-white p-2 rounded border border-slate-200">Balance ৳200 → Pay ৳200</div>
              <div className="bg-white p-2 rounded border border-slate-200">Balance ৳499 → Pay ৳499</div>
              <div className="bg-white p-2 rounded border border-slate-200">Balance ৳1,500+ → Pay Full</div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Available Payable Balance</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                {PricingEngine.formatBDT(balanceSummary.availablePayableBalance)}
              </div>
              <span className="text-[10px] text-emerald-600 block">Eligible to withdraw now</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In-Flight / Processing</span>
              <div className="text-2xl font-bold font-mono text-slate-700 tabular-nums">
                {PricingEngine.formatBDT(balanceSummary.inFlightPayouts)}
              </div>
              <span className="text-[10px] text-slate-400 block">Requested or being processed</span>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Disbursed (Paid)</span>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {PricingEngine.formatBDT(balanceSummary.totalPaid)}
              </div>
              <span className="text-[10px] text-slate-400 block">Lifetime paid to your accounts</span>
            </div>
          </div>

          {/* Payout History Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Payout History & Status ({payouts.length})
            </h3>

            {payouts.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 text-xs">
                No payout requests recorded yet. You can request a payout for any positive available balance without any minimum limit.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Payout ID</th>
                      <th className="p-3">Date Requested</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method & Destination</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date Processed</th>
                      <th className="p-3">Payment Reference (TxID)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payouts.map(p => (
                      <tr key={p.payoutId} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono font-bold text-slate-900">{p.payoutId}</td>
                        <td className="p-3 text-slate-500">{new Date(p.requestedAt).toLocaleDateString()}</td>
                        <td className="p-3 font-mono font-bold text-slate-950 tabular-nums">
                          {PricingEngine.formatBDT(p.requestedAmount)}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold uppercase text-slate-800">{p.paymentMethod}</span>: {p.payoutDetails.accountNumber}
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              p.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-800'
                                : p.status === 'APPROVED'
                                ? 'bg-blue-50 text-blue-800'
                                : p.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {p.processedAt ? new Date(p.processedAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="p-3 font-mono text-slate-700">
                          {p.paymentReference || 'Pending Wednesday disbursement'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION G: PROFILE & SETTINGS */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Affiliate Profile & Account Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your public store branding and default payout channels. Role and approval status are managed by RONVEX administrators.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Locked Registration Details (Read-Only) */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Verified System Identifiers (Read-Only)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">System Role</span>
                <span className="font-semibold text-slate-900 uppercase">Affiliate Member</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Approval Status</span>
                <span className="font-semibold text-emerald-700 uppercase">Approved</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Registered Email</span>
                <span className="font-mono text-slate-800">{affiliateProfile?.email || appUser?.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Storefront Slug</span>
                <span className="font-mono text-slate-800">@{affiliateSlug}</span>
              </div>
            </div>
          </div>

          {/* Editable Profile & Payout Settings Form */}
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display Name / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileDisplayName}
                  onChange={e => setProfileDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Displayed on your public store and customer receipts</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Phone Number (bKash/Nagad preferred)
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={e => setProfilePhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Used for urgent SMS and verification</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storefront Bio / Customer Tagline
              </label>
              <textarea
                rows={3}
                value={profileBio}
                onChange={e => setProfileBio(e.target.value)}
                placeholder="Brief intro for your public storefront..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            {/* Default Payout Channel Settings */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
                Preferred Weekly Payout Method & Account
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Payout Channel
                  </label>
                  <select
                    value={profilePayoutMethod}
                    onChange={e => setProfilePayoutMethod(e.target.value as PayoutMethod)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="bkash">bKash Mobile Wallet</option>
                    <option value="nagad">Nagad Mobile Wallet</option>
                    <option value="bank">Direct Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Account Number / Bank Details
                  </label>
                  <input
                    type="text"
                    value={profilePayoutAccount}
                    onChange={e => setProfilePayoutAccount(e.target.value)}
                    placeholder={profilePayoutMethod === 'bank' ? 'Bank Name, Branch, A/C: 1100...' : '017XXXXXXXX'}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="py-2.5 px-6 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs flex items-center gap-2"
              >
                {isSavingProfile ? <span>Saving Changes...</span> : <span>Save Settings</span>}
                <Check className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Request Weekly Disbursement</h3>
                <span className="text-[11px] text-emerald-700 font-medium">No minimum threshold required</span>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {payoutError && (
              <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
                {payoutError}
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Requested Amount (৳) — Max Available: {PricingEngine.formatBDT(balanceSummary.availablePayableBalance)}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={balanceSummary.availablePayableBalance}
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums text-xs focus:outline-none focus:border-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  You can withdraw any positive balance down to ৳1.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payout Channel *
                </label>
                <select
                  value={payoutMethod}
                  onChange={e => setPayoutMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs cursor-pointer"
                >
                  <option value="bkash">bKash Mobile Wallet</option>
                  <option value="nagad">Nagad Mobile Wallet</option>
                  <option value="bank">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {payoutMethod === 'bank' ? 'Bank Name, Branch & Account Number *' : 'Wallet Number (e.g. 017XXXXXXXX) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={payoutMethod === 'bank' ? 'e.g. City Bank, Gulshan Branch, A/C: 1100XXXX' : '017XXXXXXXX'}
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                Disbursements are processed manually every Wednesday. Once completed, the official payment reference (TxID) will appear in your ledger.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="px-4 py-2 bg-slate-950 text-white rounded-lg font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmittingPayout ? 'Submitting...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
