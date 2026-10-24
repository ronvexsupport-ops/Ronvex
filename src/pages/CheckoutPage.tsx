import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PricingEngine, DEFAULT_PLATFORM_SETTINGS } from '../services/pricingEngine';
import { OrderService } from '../services/orderService';
import { Order } from '../types';

interface CheckoutPageProps {
  onBack: () => void;
  onOrderSuccess: (order: Order) => void;
}

const BANGLADESH_DISTRICTS = [
  'Dhaka',
  'Chattogram',
  'Gazipur',
  'Narayanganj',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Cumilla',
  'Bogura',
  'Cox\'s Bazar',
  'Noakhali',
  'Feni',
  'Brahmanbaria',
  'Tangail',
  'Faridpur',
  'Jessore',
  'Kushtia',
  'Pabna',
  'Dinajpur',
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBack, onOrderSuccess }) => {
  const { items, subtotal, clearCart, activeAttribution } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad'>('COD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deliveryCharge = PricingEngine.calculateDeliveryCharge(
    district,
    subtotal,
    DEFAULT_PLATFORM_SETTINGS
  );
  const total = subtotal + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full recipient name.');
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      setErrorMessage('Please enter a valid 11-digit Bangladesh phone number (e.g., 017XXXXXXXX).');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please enter your full delivery road and house address.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Your shopping bag is empty. Please add items before checking out.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await OrderService.createOrder({
        customerDetails: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim(),
          district,
          area: area.trim() || undefined,
          orderNotes: orderNotes.trim() || undefined,
        },
        items: items.map(i => ({
          productId: i.product.productId,
          quantity: i.quantity,
        })),
        affiliateId: activeAttribution?.affiliateId || null,
        affiliateSlug: activeAttribution?.affiliateSlug || null,
        paymentMethod: 'COD',
      });

      clearCart();
      onOrderSuccess(order);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shopping</span>
      </button>

      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-serif">
          Cash on Delivery Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your order details and specify your delivery address across Bangladesh.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Customer Information (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Tanvir Ahmed"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (BD) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 bg-white font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District *
                </label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 bg-white cursor-pointer"
                >
                  {BANGLADESH_DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      {d} {d === 'Dhaka' ? '(Inside Dhaka ৳80)' : '(Outside Dhaka ৳150)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thana / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g., Gulshan-2, Banani, Mirpur"
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Street & House Address *
              </label>
              <textarea
                required
                rows={2}
                placeholder="House No, Road No, Sector / Flat Details"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional for invoice)
                </label>
                <input
                  type="email"
                  placeholder="tanvir@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Call before arrival / Leave with security"
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Payment Method
            </h2>

            <div className="p-4 border-2 border-slate-900 bg-slate-50/50 rounded-xl flex items-start gap-3">
              <Truck className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-slate-950">Cash on Delivery (Standard)</div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Inspect your parcel upon delivery and pay the delivery rider directly.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
              Order Snapshot ({items.length} items)
            </h2>

            <div className="divide-y divide-slate-200/80 max-h-72 overflow-y-auto pr-1 space-y-2">
              {items.map(item => (
                <div key={item.product.productId} className="pt-2 flex justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">{item.product.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                      Qty: {item.quantity} × {PricingEngine.formatBDT(item.sellingPrice)}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-slate-950 tabular-nums">
                    {PricingEngine.formatBDT(item.sellingPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {PricingEngine.formatBDT(subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  Delivery Charge ({district === 'Dhaka' ? 'Dhaka' : 'Outside Dhaka'})
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {deliveryCharge === 0 ? 'Free (Promo)' : PricingEngine.formatBDT(deliveryCharge)}
                </span>
              </div>

              {activeAttribution && (
                <div className="flex justify-between text-[11px] text-indigo-700 bg-indigo-50/80 px-2 py-1 rounded">
                  <span>Affiliate Partner Attribution</span>
                  <span className="font-mono font-semibold">@{activeAttribution.affiliateSlug}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">Total Payable at Doorstep</span>
              <span className="text-xl font-extrabold font-mono text-slate-950 tabular-nums">
                {PricingEngine.formatBDT(total)}
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full py-3.5 px-4 bg-slate-950 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirm Order (Cash on Delivery)</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-500 text-center">
              By confirming, you agree to our 7-day inspection and verification policy.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
