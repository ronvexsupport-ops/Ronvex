import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Package,
  ShoppingBag,
  Users,
  Wallet,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Search,
  Filter,
  Upload,
  Link,
  Target,
  FileCheck,
} from 'lucide-react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  Product,
  Order,
  AffiliateApplication,
  Affiliate,
  Payout,
  Commission,
  OrderStatus,
  PaymentStatus,
} from '../types';
import { PricingEngine, DEFAULT_PLATFORM_SETTINGS } from '../services/pricingEngine';
import { OrderService } from '../services/orderService';
import { AffiliateService } from '../services/affiliateService';
import { PayoutService } from '../services/payoutService';
import { ImageService, DEFAULT_FALLBACK_IMAGE } from '../services/imageService';
import { useAuth } from '../context/AuthContext';

interface AdminPortalPageProps {
  products: Product[];
  onRefreshProducts: () => void;
  onOpenDiagnostics?: () => void;
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  products,
  onRefreshProducts,
  onOpenDiagnostics,
}) => {
  const { appUser, isAdmin, currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'applications' | 'payouts' | 'settings'>('overview');

  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<AffiliateApplication[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  // Product Add / Edit Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodSlug, setProdSlug] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('wearables');
  const [prodCategoryName, setProdCategoryName] = useState('Smart Wearables');
  const [prodBasePrice, setProdBasePrice] = useState<number>(600);
  const [prodMaxIncrease, setProdMaxIncrease] = useState<number>(150);
  const [prodStock, setProdStock] = useState<number>(50);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Order Transition Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderNewStatus, setOrderNewStatus] = useState<OrderStatus>('CONFIRMED');
  const [courierCompany, setCourierCompany] = useState('Pathao Courier');
  const [courierTracking, setCourierTracking] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Application Approval Modal State
  const [selectedApp, setSelectedApp] = useState<AffiliateApplication | null>(null);
  const [assignedSlug, setAssignedSlug] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [isProcessingApp, setIsProcessingApp] = useState(false);

  // Payout Process Modal State
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [paymentRefCode, setPaymentRefCode] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Notification banners
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Orders
      const orderSnap = await getDocs(collection(db, 'orders'));
      setOrders(orderSnap.docs.map(d => d.data() as Order));

      // 2. Affiliate Applications
      const appSnap = await getDocs(collection(db, 'affiliateApplications'));
      setApplications(appSnap.docs.map(d => d.data() as AffiliateApplication));

      // 3. Affiliates
      const affSnap = await getDocs(collection(db, 'affiliates'));
      setAffiliates(affSnap.docs.map(d => d.data() as Affiliate));

      // 4. Payouts
      const payoutSnap = await getDocs(collection(db, 'payouts'));
      setPayouts(payoutSnap.docs.map(d => d.data() as Payout));

      // 5. Commissions
      const commSnap = await getDocs(collection(db, 'commissions'));
      setCommissions(commSnap.docs.map(d => d.data() as Commission));
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName('');
    setProdSlug('');
    setProdDesc('');
    setProdCategory('wearables');
    setProdCategoryName('Smart Wearables');
    setProdBasePrice(600);
    setProdMaxIncrease(150);
    setProdStock(50);
    setProdImageUrl('/src/assets/images/ronvex_hero_lifestyle_1792836927304.jpg');
    setShowProductModal(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSlug(p.slug);
    setProdDesc(p.description);
    setProdCategory(p.categoryId);
    setProdCategoryName(p.categoryName);
    setProdBasePrice(p.adminBasePrice);
    setProdMaxIncrease(p.maxAffiliateIncrease);
    setProdStock(p.stockQuantity);
    setProdImageUrl(p.imageUrls?.[0] || DEFAULT_FALLBACK_IMAGE);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProduct(true);
    setActionError(null);
    setActionSuccess(null);

    const productId = editingProduct ? editingProduct.productId : `prod_${Date.now()}`;
    const cleanSlug = prodSlug.trim() || prodName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const productPayload: Product = {
      productId,
      name: prodName.trim(),
      slug: cleanSlug,
      description: prodDesc.trim(),
      categoryId: prodCategory,
      categoryName: prodCategoryName,
      adminBasePrice: Number(prodBasePrice),
      maxAffiliateIncrease: Number(prodMaxIncrease),
      stockQuantity: Number(prodStock),
      imageUrls: [prodImageUrl.trim() || DEFAULT_FALLBACK_IMAGE],
      isActive: editingProduct ? editingProduct.isActive : true,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'products', productId), productPayload);
      setShowProductModal(false);
      setActionSuccess(`Product "${prodName}" saved successfully.`);
      onRefreshProducts();
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleProductActive = async (p: Product) => {
    try {
      await updateDoc(doc(db, 'products', p.productId), {
        isActive: !p.isActive,
        updatedAt: new Date().toISOString(),
      });
      onRefreshProducts();
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update product status');
    }
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdatingOrder(true);
    try {
      await OrderService.updateOrderStatus({
        orderId: selectedOrder.orderId,
        newStatus: orderNewStatus,
        changedBy: appUser?.uid || 'admin',
        changedByName: appUser?.displayName || 'Administrator',
        note: statusNote.trim() || undefined,
        courier: courierTracking.trim()
          ? {
              company: courierCompany,
              trackingNumber: courierTracking.trim(),
            }
          : undefined,
      });

      setSelectedOrder(null);
      setActionSuccess(`Order ${selectedOrder.orderNumber} transitioned to ${orderNewStatus}.`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update order status');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const handleApproveApplication = async () => {
    if (!selectedApp) return;
    setIsProcessingApp(true);
    try {
      await AffiliateService.approveApplication({
        applicationId: selectedApp.applicationId,
        affiliateSlug: assignedSlug.trim(),
        reviewedBy: appUser?.displayName || 'Administrator',
        reviewNote: reviewNote.trim() || 'Approved partner',
      });
      setSelectedApp(null);
      setActionSuccess(`Affiliate approved with storefront slug: @${assignedSlug.trim()}`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve application');
    } finally {
      setIsProcessingApp(false);
    }
  };

  const handleMarkPayoutPaid = async () => {
    if (!selectedPayout || !paymentRefCode.trim()) return;
    setIsProcessingPayout(true);
    try {
      await PayoutService.markPayoutPaid({
        payoutId: selectedPayout.payoutId,
        adminUid: appUser?.uid || 'admin',
        paymentReference: paymentRefCode.trim(),
        notes: `Transfer confirmed via ${selectedPayout.paymentMethod.toUpperCase()}`,
      });
      setSelectedPayout(null);
      setActionSuccess(`Payout ${selectedPayout.payoutId} marked as PAID. Reference: ${paymentRefCode.trim()}`);
      fetchAllData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to process payout');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'PENDING').length;
  const processingOrders = orders.filter(o => o.orderStatus === 'PROCESSING').length;
  const shippedOrders = orders.filter(o => o.orderStatus === 'SHIPPED').length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'DELIVERED').length;
  const cancelledOrders = orders.filter(o => o.orderStatus === 'CANCELLED' || o.orderStatus === 'RETURNED').length;

  const totalDeliveredRevenue = orders
    .filter(o => o.orderStatus === 'DELIVERED')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingApps = applications.filter(a => a.applicationStatus === 'PENDING').length;
  const pendingPayouts = payouts.filter(p => p.status === 'REQUESTED' || p.status === 'APPROVED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Executive Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950 mt-1">
            RONVEX Operations Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as: <strong className="text-slate-800 font-mono">{currentUser?.email || appUser?.email || 'ronvex.support@gmail.com'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <FileCheck className="w-4 h-4" />
              <span>Verify Business & Payout Tests</span>
            </button>
          )}

          <button
            onClick={openAddProductModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Catalog Product</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 text-xs">
        {[
          { id: 'overview', label: 'Platform Metrics' },
          { id: 'products', label: `Products Catalog (${products.length})` },
          { id: 'orders', label: `Orders Management (${orders.length})` },
          { id: 'applications', label: `Affiliate Applications (${pendingApps} Pending)` },
          { id: 'payouts', label: `Weekly Payouts (${pendingPayouts} In-Flight)` },
          { id: 'settings', label: 'Platform & Delivery Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Delivered Sales Revenue
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                {PricingEngine.formatBDT(totalDeliveredRevenue)}
              </div>
              <p className="text-[10px] text-slate-400">Total fulfilled orders delivered across Bangladesh</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Orders Placed
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {totalOrders}
              </div>
              <p className="text-[10px] text-slate-400">{pendingOrders} awaiting confirmation · {processingOrders} in packing</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Partner Applications
              </span>
              <div className="text-2xl font-bold font-mono text-amber-700 tabular-nums">
                {pendingApps} Pending
              </div>
              <p className="text-[10px] text-slate-400">{affiliates.length} approved partners active</p>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Pending Payouts
              </span>
              <div className="text-2xl font-bold font-mono text-blue-700 tabular-nums">
                {pendingPayouts} Requests
              </div>
              <p className="text-[10px] text-slate-400">Scheduled for manual Wednesday disbursement</p>
            </div>
          </div>

          {/* Fulfillment Pipeline */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              National Logistics Pipeline
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Pending</span>
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1 block">
                  {pendingOrders}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Processing</span>
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1 block">
                  {processingOrders}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Shipped</span>
                <span className="text-xl font-bold font-mono text-blue-700 tabular-nums mt-1 block">
                  {shippedOrders}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-medium block">Delivered</span>
                <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums mt-1 block">
                  {deliveredOrders}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Cancelled</span>
                <span className="text-xl font-bold font-mono text-slate-600 tabular-nums mt-1 block">
                  {cancelledOrders}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Active SKUs</span>
                <span className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-1 block">
                  {products.filter(p => p.isActive).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-serif">
                Catalog Inventory & Pricing Authority
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage base wholesale prices and maximum permitted affiliate markup ceiling.
              </p>
            </div>

            <button
              onClick={openAddProductModal}
              className="px-3.5 py-2 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Max Markup Ceiling</th>
                  <th className="p-3">Stock Units</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.productId} className="hover:bg-slate-50/50">
                    <td className="p-3 flex items-center gap-3">
                      <img
                        src={p.imageUrls?.[0] || DEFAULT_FALLBACK_IMAGE}
                        alt=""
                        className="w-10 h-10 object-cover rounded-lg bg-slate-100 border border-slate-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                        }}
                      />
                      <div>
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.productId}</div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">{p.categoryName}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 tabular-nums">
                      {PricingEngine.formatBDT(p.adminBasePrice)}
                    </td>
                    <td className="p-3 font-mono text-slate-700 tabular-nums">
                      +{PricingEngine.formatBDT(p.maxAffiliateIncrease)} (Ceiling: {PricingEngine.formatBDT(p.adminBasePrice + p.maxAffiliateIncrease)})
                    </td>
                    <td className="p-3 font-mono tabular-nums">
                      <span className={p.stockQuantity <= 5 ? 'text-amber-700 font-bold' : 'text-slate-800'}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleProductActive(p)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                          p.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openEditProductModal(p)}
                        className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit product details & pricing"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Order Fulfillment & Lifecycle Transitions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transition order statuses to update customer tracking, courier assignments, and affiliate commissions.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Recipient & City</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Attributed Partner</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(order => (
                  <tr key={order.orderId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{order.customerDetails.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{order.customerDetails.phone} · {order.customerDetails.district}</div>
                    </td>
                    <td className="p-3 text-slate-600">
                      {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-950 tabular-nums">
                      {PricingEngine.formatBDT(order.total)}
                    </td>
                    <td className="p-3">
                      {order.affiliateSlug ? (
                        <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">
                          @{order.affiliateSlug} (+{PricingEngine.formatBDT(order.affiliateMarginTotal || 0)})
                        </span>
                      ) : (
                        <span className="text-slate-400">Direct Storefront</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : order.orderStatus === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-800'
                            : order.orderStatus === 'PROCESSING'
                            ? 'bg-purple-50 text-purple-800'
                            : order.orderStatus === 'CANCELLED' || order.orderStatus === 'RETURNED'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setOrderNewStatus(order.orderStatus);
                          setCourierCompany(order.courier?.company || 'Pathao Courier');
                          setCourierTracking(order.courier?.trackingNumber || '');
                          setStatusNote('');
                        }}
                        className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AFFILIATE APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Affiliate Candidate Applications ({applications.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review applicant details, approve and assign unique storefront URL slug, or reject.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Applicant Name</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Channels & Strategy</th>
                  <th className="p-3">Submitted Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(app => (
                  <tr key={app.applicationId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-900">{app.fullName}</td>
                    <td className="p-3 font-mono text-slate-700">
                      <div>{app.phone}</div>
                      <div className="text-[11px] text-slate-500">{app.email}</div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">
                      {app.socialLinks || app.marketingExperience || 'None specified'}
                    </td>
                    <td className="p-3 text-slate-500">{new Date(app.submittedAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          app.applicationStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800'
                            : app.applicationStatus === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {app.applicationStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {app.applicationStatus === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setAssignedSlug(app.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                            setReviewNote('');
                          }}
                          className="px-2.5 py-1 bg-emerald-700 text-white rounded text-xs font-semibold hover:bg-emerald-800"
                        >
                          Review & Approve
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PAYOUTS */}
      {activeTab === 'payouts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Weekly Wednesday Payout Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm mobile wallet or bank disbursements and record reference transaction IDs.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Payout ID</th>
                  <th className="p-3">Affiliate</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method & Destination</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reference Code</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map(p => (
                  <tr key={p.payoutId} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-900">{p.payoutId}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{p.affiliateName || p.affiliateId}</div>
                      <div className="text-[11px] text-slate-500">{p.affiliateEmail}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-950 tabular-nums">
                      {PricingEngine.formatBDT(p.requestedAmount)}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold uppercase text-slate-800">{p.paymentMethod}</span>: {p.payoutDetails.accountNumber}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800'
                            : p.status === 'APPROVED'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {p.paymentReference || '—'}
                    </td>
                    <td className="p-3 text-right">
                      {p.status !== 'PAID' && (
                        <button
                          onClick={() => {
                            setSelectedPayout(p);
                            setPaymentRefCode(`TXN-BD-${Date.now().toString().slice(-6)}`);
                          }}
                          className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                        >
                          Disburse
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-in max-w-3xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Global Platform Parameters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative parameters governed by Firestore security rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Default Monthly Target</span>
              <span className="text-base font-bold font-mono text-slate-900">৳100,000 Delivered Sales</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Default Target Bonus</span>
              <span className="text-base font-bold font-mono text-emerald-700">৳800 Fixed Bonus</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Minimum Payout Threshold</span>
              <span className="text-base font-bold font-mono text-emerald-700">None (Pay Any Balance &gt; ৳0)</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Weekly Payout Day</span>
              <span className="text-base font-bold text-slate-900">Every Wednesday</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Delivery Charge (Inside Dhaka)</span>
              <span className="text-base font-bold font-mono text-slate-900">৳80</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 block">Delivery Charge (Outside Dhaka)</span>
              <span className="text-base font-bold font-mono text-slate-900">৳150</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={e => {
                      setProdCategory(e.target.value);
                      const map: Record<string, string> = {
                        wearables: 'Smart Wearables',
                        audio: 'Audio Hardware',
                        lifestyle: 'Bags & Lifestyle',
                        watches: 'Accessories',
                      };
                      setProdCategoryName(map[e.target.value] || 'General');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs cursor-pointer"
                  >
                    <option value="wearables">Smart Wearables</option>
                    <option value="audio">Audio Hardware</option>
                    <option value="lifestyle">Bags & Lifestyle</option>
                    <option value="watches">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodStock}
                    onChange={e => setProdStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admin Base Price (৳) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={prodBasePrice}
                    onChange={e => setProdBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Affiliate Markup (৳) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodMaxIncrease}
                    onChange={e => setProdMaxIncrease(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">External Image URL (Cloudinary / Host) *</label>
                <input
                  type="text"
                  required
                  value={prodImageUrl}
                  onChange={e => setProdImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specifications & Description *</label>
                <textarea
                  required
                  rows={3}
                  value={prodDesc}
                  onChange={e => setProdDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-4 py-2 bg-slate-950 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  {isSavingProduct ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ORDER STATUS TRANSITION */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Update Order {selectedOrder.orderNumber}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateOrderStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Order Status *</label>
                <select
                  value={orderNewStatus}
                  onChange={e => setOrderNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs cursor-pointer font-semibold"
                >
                  <option value="CONFIRMED">CONFIRMED (Accepted)</option>
                  <option value="PROCESSING">PROCESSING (Packing at Warehouse)</option>
                  <option value="SHIPPED">SHIPPED (Handed to Courier)</option>
                  <option value="DELIVERED">DELIVERED (Cash Collected)</option>
                  <option value="CANCELLED">CANCELLED (Customer declined)</option>
                  <option value="RETURNED">RETURNED (Damage / Return)</option>
                </select>
              </div>

              {(orderNewStatus === 'SHIPPED' || orderNewStatus === 'DELIVERED') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Courier Service</label>
                    <select
                      value={courierCompany}
                      onChange={e => setCourierCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs cursor-pointer"
                    >
                      <option value="Pathao Courier">Pathao Courier</option>
                      <option value="Steadfast Courier">Steadfast Courier</option>
                      <option value="RedX Logistics">RedX Logistics</option>
                      <option value="eCourier">eCourier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tracking Code</label>
                    <input
                      type="text"
                      placeholder="e.g. STDF-98214"
                      value={courierTracking}
                      onChange={e => setCourierTracking(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Transition Note</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched with Dhaka South delivery van"
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
                Setting status to DELIVERED automatically clears pending affiliate commission to PAYABLE and registers ৳{selectedOrder.subtotal} toward their monthly bonus target.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingOrder}
                  className="px-4 py-2 bg-slate-950 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  {isUpdatingOrder ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: APPLICATION APPROVAL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Approve Partner: {selectedApp.fullName}
              </h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Public Storefront URL Slug *
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-mono">/affiliate/</span>
                  <input
                    type="text"
                    required
                    value={assignedSlug}
                    onChange={e => setAssignedSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approval Note</label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Verification note recorded in application ledger"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveApplication}
                  disabled={isProcessingApp || !assignedSlug.trim()}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800"
                >
                  {isProcessingApp ? 'Approving...' : 'Authorize Partner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PAYOUT DISBURSEMENT */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Confirm Disbursement: ৳{selectedPayout.requestedAmount}
              </h3>
              <button onClick={() => setSelectedPayout(null)} className="text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div>Channel: <strong className="uppercase">{selectedPayout.paymentMethod}</strong></div>
                <div>Destination Account: <strong className="font-mono">{selectedPayout.payoutDetails.accountNumber}</strong></div>
                <div>Affiliate: <strong>{selectedPayout.affiliateName || selectedPayout.affiliateId}</strong></div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank / bKash / Nagad Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9B284KA019"
                  value={paymentRefCode}
                  onChange={e => setPaymentRefCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkPayoutPaid}
                  disabled={isProcessingPayout || !paymentRefCode.trim()}
                  className="px-4 py-2 bg-slate-950 text-white rounded-lg font-semibold hover:bg-slate-800"
                >
                  {isProcessingPayout ? 'Recording...' : 'Mark as PAID'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
