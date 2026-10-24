import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Order,
  OrderItem,
  CustomerDetails,
  OrderStatus,
  PaymentStatus,
  OrderStatusHistory,
  Commission,
  MonthlyAffiliateStat,
  Product,
} from '../types';
import { PricingEngine, DEFAULT_PLATFORM_SETTINGS } from './pricingEngine';

export class OrderService {
  /**
   * Generates a customer-facing unique order number
   */
  public static generateOrderNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RNX-${dateStr}-${randomHex}`;
  }

  /**
   * Computes current year-month string in Bangladesh timezone (UTC+6)
   */
  public static getBangladeshYearMonth(date: Date = new Date()): string {
    // Bangladesh is UTC+6
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const bdDate = new Date(utc + 3600000 * 6);
    const yyyy = bdDate.getFullYear();
    const mm = String(bdDate.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  /**
   * Securely creates an order with historical snapshot of accepted prices
   */
  public static async createOrder(params: {
    customerDetails: CustomerDetails;
    items: { productId: string; quantity: number }[];
    affiliateId?: string | null;
    affiliateSlug?: string | null;
    paymentMethod?: 'COD' | 'bKash' | 'Nagad' | 'Bank';
  }): Promise<Order> {
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const orderNumber = this.generateOrderNumber();
    const nowIso = new Date().toISOString();

    try {
      // Execute in Firestore transaction to ensure stock check and atomic record creation
      const createdOrder = await runTransaction(db, async transaction => {
        let subtotal = 0;
        let affiliateMarginTotal = 0;
        const verifiedItems: OrderItem[] = [];

        for (const item of params.items) {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            throw new Error(`Product ${item.productId} was not found in the catalog.`);
          }

          const product = productSnap.data() as Product;

          if (!product.isActive) {
            throw new Error(`Product "${product.name}" is currently unavailable for purchase.`);
          }

          if (product.stockQuantity < item.quantity) {
            throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stockQuantity}.`);
          }

          // Authoritative base price
          const basePrice = product.adminBasePrice;
          let sellingPrice = basePrice;

          // If ordered via affiliate, fetch authorized affiliate custom price
          if (params.affiliateId) {
            const priceRef = doc(db, 'affiliateProductPrices', `${params.affiliateId}_${product.productId}`);
            const priceSnap = await transaction.get(priceRef);
            if (priceSnap.exists()) {
              const customPrice = priceSnap.data().sellingPrice;
              // Validate within limits
              const validation = PricingEngine.validateAffiliatePrice(basePrice, product.maxAffiliateIncrease, customPrice);
              if (validation.valid) {
                sellingPrice = customPrice;
              }
            }
          }

          const itemSubtotal = sellingPrice * item.quantity;
          subtotal += itemSubtotal;

          if (params.affiliateId) {
            const margin = PricingEngine.calculateAffiliateMargin(sellingPrice, basePrice) * item.quantity;
            affiliateMarginTotal += margin;
          }

          // Deduct stock
          transaction.update(productRef, {
            stockQuantity: product.stockQuantity - item.quantity,
            updatedAt: nowIso,
          });

          verifiedItems.push({
            productId: product.productId,
            productName: product.name,
            quantity: item.quantity,
            adminBasePrice: basePrice,
            affiliateSellingPrice: sellingPrice,
            unitPrice: sellingPrice,
            subtotal: itemSubtotal,
            imageUrl: product.imageUrls?.[0] || '',
          });
        }

        const deliveryCharge = PricingEngine.calculateDeliveryCharge(
          params.customerDetails.district,
          subtotal,
          DEFAULT_PLATFORM_SETTINGS
        );

        const total = subtotal + deliveryCharge;

        const order: Order = {
          orderId,
          orderNumber,
          customerDetails: params.customerDetails,
          items: verifiedItems,
          subtotal,
          deliveryCharge,
          total,
          paymentMethod: params.paymentMethod || 'COD',
          paymentStatus: 'PENDING',
          orderStatus: 'PENDING',
          affiliateId: params.affiliateId || null,
          affiliateSlug: params.affiliateSlug || null,
          affiliateMarginTotal,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        const orderRef = doc(db, 'orders', orderId);
        transaction.set(orderRef, order);

        // Record initial status in history
        const historyId = `hist_${orderId}_${Date.now()}`;
        const historyRef = doc(db, 'orderStatusHistory', historyId);
        const historyRecord: OrderStatusHistory = {
          historyId,
          orderId,
          previousStatus: 'PENDING',
          newStatus: 'PENDING',
          changedBy: 'system',
          changedByName: 'Order Placed',
          note: 'Customer placed order via storefront',
          timestamp: nowIso,
        };
        transaction.set(historyRef, historyRecord);

        // If affiliated and has positive margin, initialize Commission in PENDING status
        if (params.affiliateId && affiliateMarginTotal > 0) {
          const commissionId = `comm_${orderId}`;
          const commissionRef = doc(db, 'commissions', commissionId);
          const commissionRecord: Commission = {
            commissionId,
            orderId,
            orderNumber,
            affiliateId: params.affiliateId,
            amount: affiliateMarginTotal,
            status: 'PENDING',
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          transaction.set(commissionRef, commissionRecord);
        }

        return order;
      });

      return createdOrder;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  }

  /**
   * Updates order status with strict lifecycle rules & commission / target synchronization
   */
  public static async updateOrderStatus(params: {
    orderId: string;
    newStatus: OrderStatus;
    changedBy: string;
    changedByName?: string;
    note?: string;
    courier?: { company: string; trackingNumber: string; shippedAt?: string; deliveredAt?: string };
    paymentStatus?: PaymentStatus;
  }): Promise<void> {
    const nowIso = new Date().toISOString();
    const orderRef = doc(db, 'orders', params.orderId);

    try {
      await runTransaction(db, async transaction => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) {
          throw new Error(`Order ${params.orderId} not found.`);
        }

        const order = orderSnap.data() as Order;
        const previousStatus = order.orderStatus;

        if (previousStatus === params.newStatus) {
          return; // No state change needed
        }

        const updatePayload: Partial<Order> = {
          orderStatus: params.newStatus,
          updatedAt: nowIso,
        };

        if (params.paymentStatus) {
          updatePayload.paymentStatus = params.paymentStatus;
        }

        if (params.courier) {
          updatePayload.courier = {
            ...order.courier,
            ...params.courier,
            shippedAt: params.newStatus === 'SHIPPED' ? nowIso : order.courier?.shippedAt,
            deliveredAt: params.newStatus === 'DELIVERED' ? nowIso : order.courier?.deliveredAt,
          };
        }

        // If COD and Delivered, auto-mark payment as COD_CONFIRMED
        if (params.newStatus === 'DELIVERED' && order.paymentMethod === 'COD') {
          updatePayload.paymentStatus = 'COD_CONFIRMED';
        }

        transaction.update(orderRef, updatePayload);

        // Record history entry
        const historyId = `hist_${params.orderId}_${Date.now()}`;
        const historyRef = doc(db, 'orderStatusHistory', historyId);
        transaction.set(historyRef, {
          historyId,
          orderId: params.orderId,
          previousStatus,
          newStatus: params.newStatus,
          changedBy: params.changedBy,
          changedByName: params.changedByName || 'Administrator',
          note: params.note || `Status transitioned from ${previousStatus} to ${params.newStatus}`,
          timestamp: nowIso,
        });

        // Commission lifecycle handling
        if (order.affiliateId && (order.affiliateMarginTotal || 0) > 0) {
          const commissionRef = doc(db, 'commissions', `comm_${order.orderId}`);
          const commSnap = await transaction.get(commissionRef);

          if (commSnap.exists()) {
            const currentComm = commSnap.data() as Commission;

            if (params.newStatus === 'DELIVERED' && currentComm.status === 'PENDING') {
              // Eligible / Payable upon successful delivery
              transaction.update(commissionRef, {
                status: 'PAYABLE',
                eligibleAt: nowIso,
                updatedAt: nowIso,
              });

              // Increment Monthly Delivered Sales for Target
              const yearMonth = this.getBangladeshYearMonth(new Date());
              const statId = `${order.affiliateId}_${yearMonth}`;
              const statRef = doc(db, 'monthlyAffiliateStats', statId);
              const statSnap = await transaction.get(statRef);

              let currentDelivered = 0;
              const targetAmount = DEFAULT_PLATFORM_SETTINGS.defaultMonthlyTarget;
              const bonusAmount = DEFAULT_PLATFORM_SETTINGS.defaultMonthlyBonus;

              if (statSnap.exists()) {
                const currentData = statSnap.data() as MonthlyAffiliateStat;
                currentDelivered = currentData.eligibleDeliveredSales || 0;
              }

              const newDelivered = currentDelivered + order.subtotal;
              const qualifies = newDelivered >= targetAmount;

              transaction.set(
                statRef,
                {
                  id: statId,
                  affiliateId: order.affiliateId,
                  yearMonth,
                  eligibleDeliveredSales: newDelivered,
                  targetAmount,
                  bonusAmount,
                  bonusStatus: qualifies ? 'QUALIFIED' : 'IN_PROGRESS',
                  updatedAt: nowIso,
                },
                { merge: true }
              );
            } else if (
              (params.newStatus === 'CANCELLED' || params.newStatus === 'RETURNED') &&
              currentComm.status !== 'REVERSED'
            ) {
              // Reversal logic
              transaction.update(commissionRef, {
                status: 'REVERSED',
                reversalReason: `Order transitioned to ${params.newStatus}`,
                updatedAt: nowIso,
              });

              // If previously delivered, adjust monthly sales stats
              if (previousStatus === 'DELIVERED') {
                const yearMonth = this.getBangladeshYearMonth(new Date(order.createdAt));
                const statId = `${order.affiliateId}_${yearMonth}`;
                const statRef = doc(db, 'monthlyAffiliateStats', statId);
                const statSnap = await transaction.get(statRef);
                if (statSnap.exists()) {
                  const currentData = statSnap.data() as MonthlyAffiliateStat;
                  const adjustedDelivered = Math.max(0, (currentData.eligibleDeliveredSales || 0) - order.subtotal);
                  transaction.update(statRef, {
                    eligibleDeliveredSales: adjustedDelivered,
                    bonusStatus: adjustedDelivered >= currentData.targetAmount ? 'QUALIFIED' : 'IN_PROGRESS',
                    updatedAt: nowIso,
                  });
                }
              }
            }
          }
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${params.orderId}`);
    }
  }

  /**
   * Safe customer parcel tracking lookup (protects PII)
   */
  public static async trackOrder(
    orderNumber: string,
    phoneVerification: string
  ): Promise<{ order: Order; history: OrderStatusHistory[] }> {
    try {
      const q = query(collection(db, 'orders'), where('orderNumber', '==', orderNumber.trim()));
      const snap = await getDocs(q);

      if (snap.empty) {
        throw new Error('No order found matching the provided Order Number.');
      }

      const order = snap.docs[0].data() as Order;

      // Phone verification check: last 4 digits or full number must match
      const cleanedInput = phoneVerification.replace(/\D/g, '');
      const cleanedOrderPhone = order.customerDetails.phone.replace(/\D/g, '');

      const isMatch =
        cleanedOrderPhone === cleanedInput ||
        (cleanedInput.length >= 4 && cleanedOrderPhone.endsWith(cleanedInput));

      if (!isMatch) {
        throw new Error('Verification failed. Phone number does not match this order.');
      }

      // Fetch status timeline
      const histQuery = query(
        collection(db, 'orderStatusHistory'),
        where('orderId', '==', order.orderId),
        orderBy('timestamp', 'asc')
      );
      const histSnap = await getDocs(histQuery);
      const history = histSnap.docs.map(d => d.data() as OrderStatusHistory);

      return { order, history };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'orders');
    }
  }
}
