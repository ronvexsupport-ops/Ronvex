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
  Payout,
  PayoutMethod,
  PayoutDetails,
  PayoutStatus,
  Commission,
} from '../types';
import { DEFAULT_PLATFORM_SETTINGS } from './pricingEngine';

export class PayoutService {
  /**
   * Calculates affiliate balance breakdown:
   * - Total earned
   * - Pending (orders not yet delivered)
   * - Eligible / Payable (delivered orders, cleared)
   * - In-flight payouts (already requested, approved, or processing)
   * - Available to withdraw right now
   * - Paid to date
   */
  public static async getAffiliateBalanceSummary(affiliateId: string): Promise<{
    totalEarned: number;
    pendingCommission: number;
    payableCommission: number;
    inFlightPayouts: number;
    availablePayableBalance: number;
    totalPaid: number;
  }> {
    try {
      // 1. Fetch all commissions for this affiliate
      const commQ = query(
        collection(db, 'commissions'),
        where('affiliateId', '==', affiliateId)
      );
      const commSnap = await getDocs(commQ);

      let pendingCommission = 0;
      let payableCommission = 0;
      let totalPaid = 0;

      commSnap.forEach(d => {
        const c = d.data() as Commission;
        if (c.status === 'PENDING') {
          pendingCommission += c.amount;
        } else if (c.status === 'PAYABLE' || c.status === 'ELIGIBLE') {
          payableCommission += c.amount;
        } else if (c.status === 'PAID') {
          totalPaid += c.amount;
        }
      });

      // 2. Fetch all payouts for this affiliate that are REQUESTED, APPROVED, or PROCESSING
      const payoutQ = query(
        collection(db, 'payouts'),
        where('affiliateId', '==', affiliateId)
      );
      const payoutSnap = await getDocs(payoutQ);

      let inFlightPayouts = 0;
      let recordedPaidPayouts = 0;

      payoutSnap.forEach(d => {
        const p = d.data() as Payout;
        if (p.status === 'REQUESTED' || p.status === 'APPROVED' || p.status === 'PROCESSING') {
          inFlightPayouts += p.requestedAmount;
        } else if (p.status === 'PAID') {
          recordedPaidPayouts += p.requestedAmount;
        }
      });

      const availablePayableBalance = Math.max(0, payableCommission - inFlightPayouts);
      const totalEarned = pendingCommission + payableCommission + totalPaid;

      return {
        totalEarned,
        pendingCommission,
        payableCommission,
        inFlightPayouts,
        availablePayableBalance,
        totalPaid: Math.max(totalPaid, recordedPaidPayouts),
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'commissions');
    }
  }

  /**
   * Affiliate submits a payout request
   */
  public static async requestPayout(params: {
    affiliateId: string;
    affiliateName?: string;
    affiliateEmail?: string;
    requestedAmount: number;
    paymentMethod: PayoutMethod;
    payoutDetails: PayoutDetails;
  }): Promise<Payout> {
    if (params.requestedAmount <= 0) {
      throw new Error('Payout request amount must be greater than ৳0.');
    }

    const payoutId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    try {
      return await runTransaction(db, async transaction => {
        // Verify available payable balance inside transaction
        const commQ = query(
          collection(db, 'commissions'),
          where('affiliateId', '==', params.affiliateId)
        );
        const commSnap = await getDocs(commQ);

        let payableTotal = 0;
        commSnap.forEach(d => {
          const c = d.data() as Commission;
          if (c.status === 'PAYABLE' || c.status === 'ELIGIBLE') {
            payableTotal += c.amount;
          }
        });

        // Sum existing active payouts
        const payoutQ = query(
          collection(db, 'payouts'),
          where('affiliateId', '==', params.affiliateId)
        );
        const payoutSnap = await getDocs(payoutQ);

        let inFlight = 0;
        payoutSnap.forEach(d => {
          const p = d.data() as Payout;
          if (p.status === 'REQUESTED' || p.status === 'APPROVED' || p.status === 'PROCESSING') {
            inFlight += p.requestedAmount;
          }
        });

        const available = payableTotal - inFlight;
        if (params.requestedAmount > available) {
          throw new Error(
            `Requested amount (৳${params.requestedAmount}) exceeds available payable balance (৳${available}).`
          );
        }

        const payout: Payout = {
          payoutId,
          affiliateId: params.affiliateId,
          affiliateName: params.affiliateName || 'Affiliate Member',
          affiliateEmail: params.affiliateEmail,
          requestedAmount: params.requestedAmount,
          paymentMethod: params.paymentMethod,
          payoutDetails: params.payoutDetails,
          status: 'REQUESTED',
          requestedAt: nowIso,
        };

        const payoutRef = doc(db, 'payouts', payoutId);
        transaction.set(payoutRef, payout);

        return payout;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'payouts');
    }
  }

  /**
   * Admin approves a payout request
   */
  public static async approvePayout(payoutId: string, adminUid: string, notes?: string): Promise<void> {
    try {
      const payoutRef = doc(db, 'payouts', payoutId);
      await updateDoc(payoutRef, {
        status: 'APPROVED',
        processedBy: adminUid,
        adminNotes: notes || 'Approved for weekly Wednesday disbursement',
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payouts/${payoutId}`);
    }
  }

  /**
   * Admin marks payout as PAID after physical bKash/Nagad/Bank transfer is completed
   */
  public static async markPayoutPaid(params: {
    payoutId: string;
    adminUid: string;
    paymentReference: string;
    notes?: string;
  }): Promise<void> {
    const nowIso = new Date().toISOString();
    const payoutRef = doc(db, 'payouts', params.payoutId);

    try {
      await runTransaction(db, async transaction => {
        const payoutSnap = await transaction.get(payoutRef);
        if (!payoutSnap.exists()) {
          throw new Error('Payout record not found.');
        }

        const payout = payoutSnap.data() as Payout;
        if (payout.status === 'PAID') {
          throw new Error('This payout has already been processed and marked as PAID.');
        }

        // Update payout status
        transaction.update(payoutRef, {
          status: 'PAID',
          processedAt: nowIso,
          processedBy: params.adminUid,
          paymentReference: params.paymentReference,
          adminNotes: params.notes || 'Disbursement confirmed',
        });

        // Mark corresponding commissions as PAID up to requestedAmount
        const commQ = query(
          collection(db, 'commissions'),
          where('affiliateId', '==', payout.affiliateId),
          where('status', 'in', ['PAYABLE', 'ELIGIBLE'])
        );
        const commSnap = await getDocs(commQ);

        let remainingToCover = payout.requestedAmount;
        for (const docSnap of commSnap.docs) {
          if (remainingToCover <= 0) break;
          const comm = docSnap.data() as Commission;
          transaction.update(docSnap.ref, {
            status: 'PAID',
            paidAt: nowIso,
            payoutId: params.payoutId,
            updatedAt: nowIso,
          });
          remainingToCover -= comm.amount;
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payouts/${params.payoutId}`);
    }
  }

  /**
   * Admin rejects a payout request
   */
  public static async rejectPayout(payoutId: string, adminUid: string, reason: string): Promise<void> {
    try {
      const payoutRef = doc(db, 'payouts', payoutId);
      await updateDoc(payoutRef, {
        status: 'REJECTED',
        processedBy: adminUid,
        adminNotes: reason,
        processedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payouts/${payoutId}`);
    }
  }
}
