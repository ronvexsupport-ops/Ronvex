import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AppUser, UserRole, AccountStatus, Affiliate, AdminUserRecord } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  affiliateProfile: Affiliate | null;
  adminRecord: AdminUserRecord | null;
  loading: boolean;
  isAdmin: boolean;
  isAffiliate: boolean;
  isPendingAffiliate: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  claimInitialAdminIfEligible: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [affiliateProfile, setAffiliateProfile] = useState<Affiliate | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminUserRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state and verify admin status securely
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      if (user) {
        try {
          // 1. Check /admins/{uid}
          const adminDocRef = doc(db, 'admins', user.uid);
          const adminSnap = await getDoc(adminDocRef);

          const isPrimaryAdminEmail = user.email?.toLowerCase() === 'ronvex.support@gmail.com';

          let resolvedAdminRecord: AdminUserRecord | null = null;

          if (adminSnap.exists()) {
            const data = adminSnap.data() as AdminUserRecord;
            if (data.isActive) {
              resolvedAdminRecord = data;
            }
          } else if (isPrimaryAdminEmail) {
            // Auto-provision primary super admin document
            resolvedAdminRecord = {
              uid: user.uid,
              email: user.email || 'ronvex.support@gmail.com',
              displayName: user.displayName || 'RONVEX Executive Admin',
              role: 'super_admin',
              isActive: true,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            };
            try {
              await setDoc(adminDocRef, resolvedAdminRecord);
            } catch (seedErr) {
              console.warn('Admin self-registration warning:', seedErr);
            }
          }

          setAdminRecord(resolvedAdminRecord);

          // 2. Fetch or initialize User Profile in /users/{uid}
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          let resolvedRole: UserRole = resolvedAdminRecord ? 'admin' : 'customer';
          let resolvedStatus: AccountStatus = 'active';

          if (userSnap.exists()) {
            const data = userSnap.data();
            resolvedRole = resolvedAdminRecord ? 'admin' : (data.role || 'customer');
            resolvedStatus = data.accountStatus || 'active';
          } else {
            const newUser: AppUser = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || (resolvedAdminRecord ? 'RONVEX Admin' : 'Customer'),
              role: resolvedRole,
              accountStatus: resolvedStatus,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, newUser);
            } catch (uErr) {
              console.warn('User profile creation warning:', uErr);
            }
          }

          setAppUser({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || (resolvedAdminRecord ? 'RONVEX Admin' : 'Customer'),
            role: resolvedRole,
            accountStatus: resolvedStatus,
            createdAt: userSnap.exists() ? userSnap.data().createdAt : new Date().toISOString(),
          });

          // 3. Check if affiliate profile exists
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
        setAppUser(null);
        setAffiliateProfile(null);
        setAdminRecord(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const registerWithEmail = async (email: string, pass: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName,
      role: 'customer',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
    });
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    setAppUser(null);
    setAffiliateProfile(null);
    setAdminRecord(null);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  const claimInitialAdminIfEligible = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    const user = auth.currentUser;
    if (user.email?.toLowerCase() === 'ronvex.support@gmail.com') {
      const record: AdminUserRecord = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'RONVEX Executive Admin',
        role: 'super_admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'admins', user.uid), record);
      setAdminRecord(record);
      return true;
    }
    return false;
  };

  const isAdmin = Boolean(
    (currentUser?.email?.toLowerCase() === 'ronvex.support@gmail.com') ||
    (adminRecord && adminRecord.isActive)
  );

  const isAffiliate = Boolean(
    (appUser?.role === 'affiliate' && appUser?.accountStatus === 'active') ||
    (affiliateProfile && affiliateProfile.accountStatus === 'APPROVED')
  );

  const isPendingAffiliate = Boolean(
    appUser?.role === 'affiliate' && appUser?.accountStatus === 'pending'
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        appUser,
        affiliateProfile,
        adminRecord,
        loading,
        isAdmin,
        isAffiliate,
        isPendingAffiliate,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        sendPasswordReset,
        logout,
        claimInitialAdminIfEligible,
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
