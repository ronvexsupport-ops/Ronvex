import React, { useState, useEffect } from 'react';
import { Search, Package, Truck, CheckCircle2, AlertCircle, Clock, Calendar, ShieldCheck } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { Order, OrderStatusHistory, OrderStatus } from '../types';
import { PricingEngine } from '../services/pricingEngine';

interface TrackOrderPageProps {
  initialOrderNumber?: string;
}

const STATUS_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

export const TrackOrderPage: React.FC<TrackOrderPageProps> = ({ initialOrderNumber }) => {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{ order: Order; history: OrderStatusHistory[] } | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter the Order Reference Number.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number to verify parcel ownership.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await OrderService.trackOrder(orderNumber, phone);
      setOrderData(result);
    } catch (err: any) {
      setOrderData(null);
      setError(err.message || 'Unable to find order. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = orderData ? STATUS_STEPS.indexOf(orderData.order.orderStatus) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950">
          Track Your Parcel
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your unique order number and the phone number provided at checkout to verify your order timeline.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto">
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Order Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., RNX-20261024-ABCD"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient Phone Number (for PII verification) *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g., 017XXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-950 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <span>Querying Fulfillment System...</span> : <span>Track Parcel</span>}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Tracking Result View */}
      {orderData && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-8 animate-fade-in">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-950 font-mono">
                  {orderData.order.orderNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  {orderData.order.orderStatus}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Placed on {new Date(orderData.order.createdAt).toLocaleDateString()} at{' '}
                {new Date(orderData.order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {orderData.order.courier && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                <div className="font-semibold text-slate-900">
                  Courier: {orderData.order.courier.company}
                </div>
                <div className="text-slate-600 font-mono">
                  Tracking Code: {orderData.order.courier.trackingNumber}
                </div>
              </div>
            )}
          </div>

          {/* Visual Step Progress Bar */}
          <div className="py-2">
            <div className="grid grid-cols-5 gap-2 text-center">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step} className="space-y-2">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        isPassed ? 'bg-slate-950' : 'bg-slate-200'
                      }`}
                    />
                    <div
                      className={`text-[10px] sm:text-xs font-medium uppercase tracking-tight ${
                        isCurrent
                          ? 'font-bold text-slate-950'
                          : isPassed
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Logs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verification & Dispatch Timeline
            </h3>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              {orderData.history.length === 0 ? (
                <div className="p-4 text-center text-slate-400">Order recorded in fulfillment queue.</div>
              ) : (
                orderData.history.map(hist => (
                  <div key={hist.historyId} className="p-3 bg-white flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{hist.newStatus}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(hist.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {hist.note || `Status updated by ${hist.changedByName || 'Fulfillment Center'}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Masked Order Contents */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="font-semibold text-slate-900">Destination Details</div>
            <div className="text-slate-600">
              Deliver to: {orderData.order.customerDetails.fullName} ({orderData.order.customerDetails.district})
            </div>
            <div className="font-mono font-bold text-slate-950 pt-1">
              Payable Amount: {PricingEngine.formatBDT(orderData.order.total)} (Cash on Delivery)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
