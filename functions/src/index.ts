import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: On Order Status Changed
 * Idempotently manages commission states and aggregates delivered sales towards monthly targets
 */
export const onOrderStatusChanged = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const orderId = context.params.orderId;

    if (beforeData.orderStatus === afterData.orderStatus) {
      return null;
    }

    const newStatus = afterData.orderStatus;
    const affiliateId = afterData.affiliateId;

    if (!affiliateId) return null;

    const commRef = db.doc(`commissions/comm_${orderId}`);

    // If order was delivered
    if (newStatus === 'DELIVERED') {
      const commSnap = await commRef.get();
      if (commSnap.exists && commSnap.data()?.status === 'PENDING') {
        await commRef.update({
          status: 'PAYABLE',
          eligibleAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Aggregate delivered sales in monthlyAffiliateStats
      const bdDate = new Date(); // In production, adjust to UTC+6
      const yearMonth = `${bdDate.getFullYear()}-${String(bdDate.getMonth() + 1).padStart(2, '0')}`;
      const statRef = db.doc(`monthlyAffiliateStats/${affiliateId}_${yearMonth}`);

      await db.runTransaction(async t => {
        const statSnap = await t.get(statRef);
        let deliveredSales = afterData.subtotal;
        let targetAmount = 100000;
        let bonusAmount = 800;

        if (statSnap.exists) {
          const currentData = statSnap.data()!;
          deliveredSales += currentData.eligibleDeliveredSales || 0;
          targetAmount = currentData.targetAmount || 100000;
          bonusAmount = currentData.bonusAmount || 800;
        }

        const qualifies = deliveredSales >= targetAmount;

        t.set(
          statRef,
          {
            id: `${affiliateId}_${yearMonth}`,
            affiliateId,
            yearMonth,
            eligibleDeliveredSales: deliveredSales,
            targetAmount,
            bonusAmount,
            bonusStatus: qualifies ? 'QUALIFIED' : 'IN_PROGRESS',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });
    }

    // If order was cancelled or returned
    if ((newStatus === 'CANCELLED' || newStatus === 'RETURNED') && beforeData.orderStatus !== newStatus) {
      const commSnap = await commRef.get();
      if (commSnap.exists && commSnap.data()?.status !== 'REVERSED') {
        await commRef.update({
          status: 'REVERSED',
          reversalReason: `Order transitioned to ${newStatus}`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return null;
  });

/**
 * Cloud Function: On Affiliate Application Approved
 * Sets custom claim for affiliate role
 */
export const onAffiliateApproved = functions.firestore
  .document('affiliateApplications/{appId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (beforeData.applicationStatus !== 'APPROVED' && afterData.applicationStatus === 'APPROVED') {
      const uid = afterData.uid;
      // Set custom user claim
      await admin.auth().setCustomUserClaims(uid, {
        affiliate: true,
      });

      // Update user document
      await db.doc(`users/${uid}`).set(
        {
          role: 'affiliate',
          accountStatus: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
    return null;
  });
