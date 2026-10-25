import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onNavigateHome }) => {
  const { loginWithEmail, registerWithEmail, sendPasswordReset, currentUser, isAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Initial Account Setup mode (for first-time primary admin initialization)
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [setupDisplayName, setSetupDisplayName] = useState('RONVEX Executive Admin');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      if (isSetupMode) {
        await registerWithEmail(email.trim(), password, setupDisplayName.trim() || 'RONVEX Executive Admin');
        setInfoMsg('Account created successfully. Authenticating administrative console...');
      } else {
        await loginWithEmail(email.trim(), password);
      }
      onSuccess();
    } catch (err: any) {
      console.error('Admin Auth Error:', err);
      let message = 'Failed to authenticate. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid administrator email or password. Verify credentials or use password reset.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Please switch to Standard Login mode.';
      } else if (err.code === 'auth/weak-password') {
        message = 'The password must be at least 6 characters long.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily suspended due to multiple failed attempts. Reset your password or wait a few minutes.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your administrator email address.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    try {
      await sendPasswordReset(resetEmail.trim());
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setResetError(err.message || 'Failed to dispatch password recovery email.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Top back button */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Storefront</span>
        </button>
        <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
          RONVEX Security Enclave
        </span>
      </div>

      {/* Main card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold font-serif text-white tracking-tight">
            {isSetupMode ? 'Create Initial Admin' : 'Admin Operations Control'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isSetupMode
              ? 'Provision the primary administrator account for ronvex.support@gmail.com'
              : 'Secure access for authorized RONVEX operators & editors'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-rose-950/70 border border-rose-800/60 text-rose-200 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="mb-5 p-3 bg-emerald-950/70 border border-emerald-800/60 text-emerald-200 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed">{infoMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {isSetupMode && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Administrator Full Name
              </label>
              <input
                type="text"
                value={setupDisplayName}
                onChange={e => setSetupDisplayName(e.target.value)}
                placeholder="e.g. Master Administrator"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ronvex.support@gmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                required
                autoComplete="email"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Default authorized administrative email: <span className="font-mono text-slate-400">ronvex.support@gmail.com</span>
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              {!isSetupMode && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating with Firebase...</span>
              </>
            ) : isSetupMode ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Initialize Admin Account</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Access Control Center</span>
              </>
            )}
          </button>
        </form>

        {/* Initial setup toggle helper */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSetupMode(!isSetupMode);
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isSetupMode
              ? 'Already have credentials? Return to Standard Login'
              : 'First time setup? Create primary ronvex.support@gmail.com account'}
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-white mb-1">
              Reset Administrator Password
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered administrator email. Firebase will send a secure password recovery link.
            </p>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-xs mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
                <p>Recovery link dispatched! Please check your email inbox and spam folder.</p>
              </div>
            ) : (
              <form onSubmit={handleSendReset} className="space-y-3">
                {resetError && (
                  <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded-lg border border-rose-800/50">
                    {resetError}
                  </p>
                )}
                <div>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="ronvex.support@gmail.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  {resetLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Send Recovery Email</span>
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setResetSuccess(false);
                setResetError(null);
              }}
              className="w-full mt-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
