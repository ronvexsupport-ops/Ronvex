import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { AffiliateService } from '../services/affiliateService';
import { useAuth } from '../context/AuthContext';

interface AffiliateRegisterPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AffiliateRegisterPage: React.FC<AffiliateRegisterPageProps> = ({ onNavigate }) => {
  const { registerWithEmail, currentUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [marketingExperience, setMarketingExperience] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<{
    applicationId: string;
    email: string;
    fullName: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreedToTerms) {
      setErrorMessage('শর্তাবলী গ্রহণ করতে হবে: অনুগ্রহ করে RONVEX অ্যাফিলিয়েট প্রোগ্রামের শর্তাবলীতে সম্মতি জানান।');
      return;
    }
    if (phone.replace(/\D/g, '').length < 11) {
      setErrorMessage('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (যেমন: 017XXXXXXXX)।');
      return;
    }
    if (!currentUser && password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setIsSubmitting(true);
    try {
      let uid = currentUser?.uid;

      if (!uid) {
        // Register user account via Firebase auth with affiliate role & pending status
        const newUser = await registerWithEmail(
          email.trim(),
          password,
          fullName.trim(),
          'affiliate',
          'pending'
        );
        uid = newUser.uid;
      }

      const application = await AffiliateService.submitApplication({
        uid,
        fullName,
        email,
        phone,
        marketingExperience,
        socialLinks,
      });

      setSubmittedApplication({
        applicationId: application.applicationId,
        email: application.email,
        fullName: application.fullName,
      });
    } catch (err: any) {
      console.error('Affiliate application submission error:', err);
      setErrorMessage(
        'আবেদন জমা দিতে সমস্যা হয়েছে। অনুগ্রহ করে আপনার তথ্য পরীক্ষা করে আবার চেষ্টা করুন। (' + (err.message || 'Error') + ')'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedApplication) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-lg text-center space-y-8 animate-fade-in">
          {/* Brand Icon & Status Badge */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-200 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            {/* Prominent Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-300 text-amber-900 rounded-full font-bold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <span>Pending Approval</span>
            </div>
          </div>

          {/* Exact Required Bengali Message */}
          <div className="space-y-4 text-slate-800 leading-relaxed font-sans text-sm sm:text-base text-left bg-slate-50 border border-slate-200/80 rounded-2xl p-6">
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

          {/* Application Reference Meta Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs bg-slate-100/70 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider">আবেদনকারী / Applicant</span>
              <span className="font-semibold text-slate-900">{submittedApplication.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider">ইমেইল / Registered Email</span>
              <span className="font-mono text-slate-800">{submittedApplication.email}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider">অ্যাপ্লিকেশন আইডি / Application ID</span>
              <span className="font-mono text-slate-800">{submittedApplication.applicationId}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] uppercase tracking-wider">বর্তমান অবস্থা / Status</span>
              <span className="font-semibold text-amber-800">Pending Approval</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('affiliate-status', submittedApplication.email)}
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Overview Program Highlight */}
      <div className="bg-slate-950 text-white rounded-2xl p-8 space-y-4">
        <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          RONVEX Partner Network
        </div>
        <h1 className="text-3xl font-extrabold font-serif tracking-tight">
          Earn Direct Margins on Every Delivered Sale
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Set custom retail prices within admin limits, promote products using custom tracking links, and receive automated weekly payouts every Wednesday via bKash, Nagad, or Bank Transfer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div>
            <div className="text-amber-400 font-bold font-mono text-sm">৳100,000 Target</div>
            <div className="text-slate-400 mt-0.5">Monthly delivered target qualifies for ৳800 performance bonus</div>
          </div>
          <div>
            <div className="text-emerald-400 font-bold font-mono text-sm">Weekly Payouts</div>
            <div className="text-slate-400 mt-0.5">Disbursed directly every Wednesday (no minimum payout threshold)</div>
          </div>
          <div>
            <div className="text-blue-400 font-bold font-mono text-sm">30-Day Attribution</div>
            <div className="text-slate-400 mt-0.5">First-party snapshot preserves customer attribution</div>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-serif">
            Join Affiliate Program · Member Application
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in your applicant profile. All submissions start in PENDING status until verified by administration.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rahim Chowdhury"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (bKash/Nagad preferred) *
              </label>
              <input
                type="tel"
                required
                placeholder="017XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="rahim@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            {!currentUser && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Social Media / Channels / Website (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. facebook.com/techpage, youtube.com/@techreviews"
              value={socialLinks}
              onChange={e => setSocialLinks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Marketing Strategy or Target Audience (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Tell us briefly how you plan to promote RONVEX products..."
              value={marketingExperience}
              onChange={e => setMarketingExperience(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={e => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span>
                I agree to the RONVEX Affiliate Program Terms, including server-side price validation, weekly manual payouts, and zero tolerance for self-referral abuse.
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigate('affiliate-status')}
              className="text-xs text-slate-600 hover:text-slate-950 underline underline-offset-4"
            >
              Already applied? Check status
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              {isSubmitting ? <span>Submitting...</span> : <span>Submit Application</span>}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
