import React, { useState, useEffect } from 'react';
import { Search, Clock, CheckCircle2, XCircle, AlertTriangle, ArrowRight, ShieldCheck, Home } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { AffiliateApplication } from '../types';

interface AffiliateStatusPageProps {
  onNavigate: (view: string, param?: string) => void;
  initialQuery?: string;
}

export const AffiliateStatusPage: React.FC<AffiliateStatusPageProps> = ({ onNavigate, initialQuery }) => {
  const [emailQuery, setEmailQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<AffiliateApplication | null>(null);

  const lookupApplication = async (searchVal: string) => {
    const term = searchVal.trim();
    if (!term) return;

    setLoading(true);
    setError(null);
    setApplication(null);

    try {
      // 1. If term looks like an application ID or UID
      if (term.startsWith('app_') || term.startsWith('aff_app_')) {
        const directDoc = await getDoc(doc(db, 'affiliateApplications', term));
        if (directDoc.exists()) {
          setApplication(directDoc.data() as AffiliateApplication);
          setLoading(false);
          return;
        }
      }

      // 2. Query by email
      const q = query(
        collection(db, 'affiliateApplications'),
        where('email', '==', term.toLowerCase())
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        setApplication(snap.docs[0].data() as AffiliateApplication);
      } else {
        // 3. Fallback check by applicationId query
        const qId = query(
          collection(db, 'affiliateApplications'),
          where('applicationId', '==', term)
        );
        const snapId = await getDocs(qId);
        if (!snapId.empty) {
          setApplication(snapId.docs[0].data() as AffiliateApplication);
        } else if (term.includes('rahim') || term.includes('partner') || term === 'techdeals-bd') {
          // Demo fallback
          setApplication({
            applicationId: 'app_demo_1',
            uid: 'demo_affiliate_uid',
            fullName: 'Rahim Chowdhury',
            email: 'partner.rahim@ronvex.com',
            phone: '01711223344',
            applicationStatus: 'APPROVED',
            submittedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Admin (ronvex.support@gmail.com)',
            reviewNote: 'Verified influencer channel in Bangladesh technology sector.',
          });
        } else {
          setError('এই ইমেইল বা আইডি দিয়ে কোনো আবেদন খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।');
        }
      }
    } catch (err: any) {
      console.error('Error looking up application:', err);
      setError('আবেদনের তথ্য অনুসন্ধান করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      lookupApplication(initialQuery);
    }
  }, [initialQuery]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    lookupApplication(emailQuery);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950">
          আবেদনের বর্তমান অবস্থা / Application Status
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          আপনার নিবন্ধিত ইমেইল ঠিকানা অথবা অ্যাপ্লিকেশন আইডি প্রবেশ করিয়ে আপনার আবেদনের বর্তমান অবস্থা (Pending, Approved, বা Review) যাচাই করুন।
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              নিবন্ধিত ইমেইল অথবা অ্যাপ্লিকেশন আইডি / Registered Email or Application ID *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. rahim@example.com অথবা app_aff_..."
                value={emailQuery}
                onChange={e => setEmailQuery(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-950 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <span>অনুসন্ধান করা হচ্ছে...</span> : <span>আবেদনের অবস্থা অনুসন্ধান করুন</span>}
          </button>
        </form>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => onNavigate('affiliate-register')}
            className="text-xs text-slate-600 hover:text-slate-950 underline underline-offset-4"
          >
            এখনও আবেদন করেননি? Join Affiliate Program (নতুন আবেদন করুন)
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>

      {application && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="text-base font-bold text-slate-900">{application.fullName}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{application.email}</div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {application.applicationStatus === 'PENDING' && (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 text-amber-800 border border-amber-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span>Pending Approval</span>
                </span>
              )}
              {application.applicationStatus === 'APPROVED' && (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approved Partner</span>
                </span>
              )}
              {application.applicationStatus === 'REJECTED' && (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 text-rose-800 border border-rose-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Declined</span>
                </span>
              )}
              {application.applicationStatus === 'SUSPENDED' && (
                <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-600" />
                  <span>Suspended</span>
                </span>
              )}
            </div>
          </div>

          {/* Bengali Explanation Card */}
          {application.applicationStatus === 'PENDING' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-950 leading-relaxed">
              <div className="font-bold text-sm text-amber-900">
                আপনার আবেদনটি বর্তমানে পর্যালোচনায় রয়েছে (Pending Approval)
              </div>
              <p>
                আমাদের অ্যাডমিন টিম আপনার দেওয়া বিবরণ ও মার্কেটিং চ্যানেলগুলো যাচাই করছে। আবেদন অনুমোদিত হলে আপনি আপনার নিজস্ব অ্যাফিলিয়েট স্টোরফ্রন্ট এবং পূর্ণাঙ্গ ড্যাশবোর্ডে প্রবেশ করতে পারবেন।
              </p>
              <p className="text-[11px] text-amber-800">
                জরুরি প্রয়োজনে অ্যাডমিন সাপোর্টে যোগাযোগ করুন: <span className="font-mono font-semibold">ronvex.support@gmail.com</span>
              </p>
            </div>
          )}

          {application.applicationStatus === 'APPROVED' && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs text-emerald-950 leading-relaxed">
              <div className="font-bold text-sm text-emerald-900">
                অভিনন্দন! আপনার অ্যাফিলিয়েট অ্যাকাউন্ট অনুমোদিত হয়েছে।
              </div>
              <p>
                আপনি এখন RONVEX পার্টনার নেটওয়ার্কের একজন সক্রিয় সদস্য। নিচের বাটনে ক্লিক করে সরাসরি আপনার অ্যাফিলিয়েট পোর্টাল ও স্টোরে প্রবেশ করুন।
              </p>
            </div>
          )}

          {application.applicationStatus === 'REJECTED' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-950 leading-relaxed">
              <div className="font-bold text-sm text-rose-900">
                আবেদনটি গ্রহণ করা সম্ভব হয়নি
              </div>
              <p>
                আমাদের কমপ্লায়েন্স নীতিমালার শর্ত পূরণ না হওয়ায় এই মুহূর্তে আপনার আবেদনটি বাতিল করা হয়েছে।
              </p>
            </div>
          )}

          {/* Meta Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px]">জমা দেওয়ার তারিখ / Submitted Date</span>
              <span className="font-mono text-slate-800">
                {new Date(application.submittedAt).toLocaleDateString()} ({new Date(application.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">অ্যাপ্লিকেশন আইডি / Application ID</span>
              <span className="font-mono text-slate-800">{application.applicationId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">ফোন নম্বর / Mobile</span>
              <span className="font-mono text-slate-800">{application.phone}</span>
            </div>
            {application.reviewedAt && (
              <div>
                <span className="text-slate-500 block text-[11px]">পর্যালোচনার তারিখ / Reviewed Date</span>
                <span className="font-mono text-slate-800">
                  {new Date(application.reviewedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {application.reviewNote && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <span className="font-semibold text-slate-800 block mb-0.5">অ্যাডমিন মন্তব্য / Admin Feedback:</span>
              <p className="text-slate-600">{application.reviewNote}</p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {application.applicationStatus === 'APPROVED' ? (
              <button
                onClick={() => onNavigate('affiliate-dashboard')}
                className="flex-1 py-3 px-4 bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2"
              >
                <span>অ্যাফিলিয়েট ড্যাশবোর্ডে প্রবেশ করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => lookupApplication(emailQuery)}
                className="flex-1 py-2.5 px-4 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                আবেদনের অবস্থা রিফ্রেশ করুন
              </button>
            )}

            <button
              onClick={() => onNavigate('home')}
              className="py-2.5 px-4 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>হোমপেজে ফিরে যান</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
