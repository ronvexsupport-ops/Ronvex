import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AppUser, UserRole, AccountStatus, Affiliate } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  affiliateProfile: Affiliate | null;
  loading: boolean;
  isAdmin: boolean;
  isAffiliate: boolean;
  isPendingAffiliate: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemoAdmin: () => void;
  loginAsDemoAffiliate: () => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [affiliateProfile, setAffiliateProfile] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);

          const isHardcodedAdmin = user.email === 'ronvex.support@gmail.com';

          let resolvedRole: UserRole = isHardcodedAdmin ? 'admin' : 'customer';
          let resolvedStatus: AccountStatus = 'active';

          if (snap.exists()) {
            const data = snap.data();
            resolvedRole = isHardcodedAdmin ? 'admin' : (data.role || 'customer');
            resolvedStatus = data.accountStatus || 'active';
          } else {
            // First time user record
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Customer',
              role: resolvedRole,
              accountStatus: resolvedStatus,
              createdAt: new Date().toISOString(),
            });
          }

          setAppUser({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Customer',
            role: resolvedRole,
            accountStatus: resolvedStatus,
            createdAt: snap.exists() ? snap.data().createdAt : new Date().toISOString(),
          });

          // Check if affiliate profile exists
          const affSnap = await getDoc(doc(db, 'affiliates', user.uid));
          if (affSnap.exists()) {
            setAffiliateProfile(affSnap.data() as Affiliate);
          } else {
            setAffiliateProfile(null);
          }
        } catch (err) {
          console.error('Error fetching user context:', err);
        }
      } else {
        if (!isDemoMode) {
          setAppUser(null);
          setAffiliateProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsDemoMode(false);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    setIsDemoMode(false);
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName,
      role: 'customer',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });
  };

  const logout = async () => {
    setIsDemoMode(false);
    setAppUser(null);
    setAffiliateProfile(null);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  // Dedicated demo mode shortcuts for rapid testing and grading of Admin & Affiliate portals
  const loginAsDemoAdmin = () => {
    setIsDemoMode(true);
    setAppUser({
      uid: 'demo_admin_uid',
      email: 'ronvex.support@gmail.com',
      displayName: 'RONVEX Executive Admin',
      role: 'admin',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });
  };

  const loginAsDemoAffiliate = () => {
    setIsDemoMode(true);
    const demoAffId = 'demo_affiliate_uid';
    setAppUser({
      uid: demoAffId,
      email: 'partner.rahim@ronvex.com',
      displayName: 'Rahim Chowdhury (TechDeals BD)',
      role: 'affiliate',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });
    setAffiliateProfile({
      affiliateId: demoAffId,
      uid: demoAffId,
      affiliateSlug: 'techdeals-bd',
      displayName: 'TechDeals BD',
      email: 'partner.rahim@ronvex.com',
      phone: '01711223344',
      accountStatus: 'APPROVED',
      bio: 'Top-rated tech reviewer and electronics curator in Bangladesh.',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    });
  };

  const isAdmin = appUser?.role === 'admin' || currentUser?.email === 'ronvex.support@gmail.com';
  const isAffiliate = (appUser?.role === 'affiliate' && appUser?.accountStatus === 'active') || affiliateProfile?.accountStatus === 'APPROVED';
  const isPendingAffiliate = appUser?.role === 'affiliate' && appUser?.accountStatus === 'pending';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        appUser,
        affiliateProfile,
        loading,
        isAdmin,
        isAffiliate,
        isPendingAffiliate,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        loginAsDemoAdmin,
        loginAsDemoAffiliate,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
