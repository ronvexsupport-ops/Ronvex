import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  AffiliateApplication,
  Affiliate,
  AffiliateProductPrice,
  Product,
  PayoutMethod,
} from '../types';
import { PricingEngine } from './pricingEngine';

export class AffiliateService {
  /**
   * Submits a new affiliate application with PENDING status
   */
  public static async submitApplication(params: {
    uid: string;
    fullName: string;
    email: string;
    phone: string;
    marketingExperience?: string;
    socialLinks?: string;
  }): Promise<AffiliateApplication> {
    const applicationId = `app_${params.uid}`;
    const application: AffiliateApplication = {
      applicationId,
      uid: params.uid,
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      phone: params.phone.trim(),
      marketingExperience: params.marketingExperience || '',
      socialLinks: params.socialLinks || '',
      applicationStatus: 'PENDING',
      submittedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'affiliateApplications', applicationId), application);

      // Update user account status
      await setDoc(
        doc(db, 'users', params.uid),
        {
          uid: params.uid,
          email: params.email.trim().toLowerCase(),
          displayName: params.fullName.trim(),
          phone: params.phone.trim(),
          role: 'affiliate',
          accountStatus: 'pending',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return application;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `affiliateApplications/${applicationId}`);
    }
  }

  /**
   * Retrieves an applicant's current status
   */
  public static async getApplicationByUid(uid: string): Promise<AffiliateApplication | null> {
    try {
      const snap = await getDoc(doc(db, 'affiliateApplications', `app_${uid}`));
      if (!snap.exists()) return null;
      return snap.data() as AffiliateApplication;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `affiliateApplications/app_${uid}`);
    }
  }

  /**
   * Admin approves an affiliate application, creates their public storefront profile and sets role
   */
  public static async approveApplication(params: {
    applicationId: string;
    affiliateSlug: string;
    reviewedBy: string;
    reviewNote?: string;
  }): Promise<void> {
    const nowIso = new Date().toISOString();
    const cleanSlug = params.affiliateSlug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    try {
      await runTransaction(db, async transaction => {
        const appRef = doc(db, 'affiliateApplications', params.applicationId);
        const appSnap = await transaction.get(appRef);

        if (!appSnap.exists()) {
          throw new Error('Application not found.');
        }

        const appData = appSnap.data() as AffiliateApplication;

        // Ensure slug is unique
        const existingSlugQuery = query(
          collection(db, 'affiliates'),
          where('affiliateSlug', '==', cleanSlug)
        );
        const existingSlugSnap = await getDocs(existingSlugQuery);
        const conflict = existingSlugSnap.docs.find(d => d.id !== appData.uid);
        if (conflict) {
          throw new Error(`Affiliate slug "${cleanSlug}" is already taken by another affiliate.`);
        }

        // Update application
        transaction.update(appRef, {
          applicationStatus: 'APPROVED',
          reviewedAt: nowIso,
          reviewedBy: params.reviewedBy,
          reviewNote: params.reviewNote || 'Approved by administrator',
        });

        // Create or update affiliate record
        const affiliateRef = doc(db, 'affiliates', appData.uid);
        const affiliateData: Affiliate = {
          affiliateId: appData.uid,
          uid: appData.uid,
          affiliateSlug: cleanSlug,
          displayName: appData.fullName,
          email: appData.email,
          phone: appData.phone,
          accountStatus: 'APPROVED',
          createdAt: appData.submittedAt,
          approvedAt: nowIso,
        };
        transaction.set(affiliateRef, affiliateData);

        // Update user document
        const userRef = doc(db, 'users', appData.uid);
        transaction.set(
          userRef,
          {
            role: 'affiliate',
            accountStatus: 'active',
            updatedAt: nowIso,
          },
          { merge: true }
        );
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `affiliateApplications/${params.applicationId}`);
    }
  }

  /**
   * Admin rejects an affiliate application
   */
  public static async rejectApplication(params: {
    applicationId: string;
    reviewedBy: string;
    reviewNote?: string;
  }): Promise<void> {
    try {
      const appRef = doc(db, 'affiliateApplications', params.applicationId);
      const appSnap = await getDoc(appRef);
      if (!appSnap.exists()) throw new Error('Application not found.');
      const appData = appSnap.data() as AffiliateApplication;

      await updateDoc(appRef, {
        applicationStatus: 'REJECTED',
        reviewedAt: new Date().toISOString(),
        reviewedBy: params.reviewedBy,
        reviewNote: params.reviewNote || 'Application declined.',
      });

      await updateDoc(doc(db, 'users', appData.uid), {
        accountStatus: 'rejected',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `affiliateApplications/${params.applicationId}`);
    }
  }

  /**
   * Admin suspends an affiliate
   */
  public static async suspendAffiliate(affiliateId: string, reason?: string): Promise<void> {
    const nowIso = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'affiliates', affiliateId), {
        accountStatus: 'SUSPENDED',
        updatedAt: nowIso,
      });
      await updateDoc(doc(db, 'users', affiliateId), {
        accountStatus: 'suspended',
        updatedAt: nowIso,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `affiliates/${affiliateId}`);
    }
  }

  /**
   * Admin reactivates a suspended affiliate
   */
  public static async reactivateAffiliate(affiliateId: string): Promise<void> {
    const nowIso = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'affiliates', affiliateId), {
        accountStatus: 'APPROVED',
        updatedAt: nowIso,
      });
      await updateDoc(doc(db, 'users', affiliateId), {
        accountStatus: 'active',
        updatedAt: nowIso,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `affiliates/${affiliateId}`);
    }
  }

  /**
   * Fetch public storefront profile by affiliate slug
   */
  public static async getAffiliateBySlug(slug: string): Promise<Affiliate | null> {
    try {
      const q = query(
        collection(db, 'affiliates'),
        where('affiliateSlug', '==', slug.trim().toLowerCase()),
        where('accountStatus', '==', 'APPROVED')
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return snap.docs[0].data() as Affiliate;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'affiliates');
    }
  }

  /**
   * Allows an affiliate to set custom selling price within admin permitted range
   */
  public static async setCustomProductPrice(params: {
    affiliateId: string;
    productId: string;
    proposedPrice: number;
  }): Promise<AffiliateProductPrice> {
    const productRef = doc(db, 'products', params.productId);

    try {
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        throw new Error('Product not found in catalog.');
      }

      const product = productSnap.data() as Product;
      const validation = PricingEngine.validateAffiliatePrice(
        product.adminBasePrice,
        product.maxAffiliateIncrease,
        params.proposedPrice
      );

      if (!validation.valid) {
        throw new Error(validation.reason || 'Invalid selling price');
      }

      const priceId = `${params.affiliateId}_${params.productId}`;
      const record: AffiliateProductPrice = {
        id: priceId,
        affiliateId: params.affiliateId,
        productId: params.productId,
        sellingPrice: params.proposedPrice,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'affiliateProductPrices', priceId), record);
      return record;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `affiliateProductPrices/${params.affiliateId}_${params.productId}`);
    }
  }

  /**
   * Fetch all custom prices set by an affiliate
   */
  public static async getAffiliatePrices(affiliateId: string): Promise<Record<string, number>> {
    try {
      const q = query(collection(db, 'affiliateProductPrices'), where('affiliateId', '==', affiliateId));
      const snap = await getDocs(q);
      const map: Record<string, number> = {};
      snap.forEach(d => {
        const item = d.data() as AffiliateProductPrice;
        map[item.productId] = item.sellingPrice;
      });
      return map;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'affiliateProductPrices');
    }
  }

  /**
   * Fetch affiliate record by affiliateId / uid
   */
  public static async getAffiliateById(affiliateId: string): Promise<Affiliate | null> {
    try {
      const snap = await getDoc(doc(db, 'affiliates', affiliateId));
      if (!snap.exists()) return null;
      return snap.data() as Affiliate;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `affiliates/${affiliateId}`);
    }
  }

  /**
   * Update permitted profile fields for an affiliate:
   * displayName, phone, bio, payoutMethod, payoutAccountNumber
   */
  public static async updateAffiliateProfile(
    affiliateId: string,
    updates: {
      displayName?: string;
      phone?: string;
      bio?: string;
      payoutMethod?: PayoutMethod;
      payoutAccountNumber?: string;
    }
  ): Promise<void> {
    const nowIso = new Date().toISOString();
    try {
      const affRef = doc(db, 'affiliates', affiliateId);
      await updateDoc(affRef, {
        ...updates,
        updatedAt: nowIso,
      });

      // Also sync displayName and phone to users collection if document exists
      const userRef = doc(db, 'users', affiliateId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userUpdates: any = { updatedAt: nowIso };
        if (updates.displayName) userUpdates.displayName = updates.displayName;
        if (updates.phone) userUpdates.phone = updates.phone;
        await updateDoc(userRef, userUpdates);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `affiliates/${affiliateId}`);
    }
  }
}
