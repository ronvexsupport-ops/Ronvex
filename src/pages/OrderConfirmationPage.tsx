import React from 'react';
import { CheckCircle2, ArrowRight, Package, Truck, Phone, FileText } from 'lucide-react';
import { Order } from '../types';
import { PricingEngine } from '../services/pricingEngine';

interface OrderConfirmationPageProps {
  order: Order;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ order, onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Top Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950">
          Order Successfully Placed!
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Thank you for choosing RONVEX. Your order has been registered in our fulfillment queue for Cash on Delivery dispatch.
        </p>
      </div>

      {/* Order Reference Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Order Reference Number
            </div>
            <div className="text-lg font-bold font-mono text-slate-950 tabular-nums mt-0.5">
              {order.orderNumber}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              Payment Method
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-0.5">
              Cash on Delivery (Pay at Doorstep)
            </div>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5">Recipient Details:</span>
            <div className="font-semibold text-slate-900">{order.customerDetails.fullName}</div>
            <div className="text-slate-600 font-mono tabular-nums">{order.customerDetails.phone}</div>
            {order.customerDetails.email && <div className="text-slate-500">{order.customerDetails.email}</div>}
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5">Delivery Destination:</span>
            <div className="text-slate-800">{order.customerDetails.address}</div>
            <div className="text-slate-600">
              {order.customerDetails.area ? `${order.customerDetails.area}, ` : ''}
              {order.customerDetails.district}
            </div>
          </div>
        </div>

        {/* Itemized Snapshot */}
        <div className="border-t border-slate-200 pt-4 space-y-2">
          <span className="text-xs font-bold text-slate-900 block mb-1">Items Purchased</span>
          {order.items.map(item => (
            <div key={item.productId} className="flex justify-between items-center text-xs py-1">
              <div>
                <span className="font-medium text-slate-800">{item.productName}</span>
                <span className="text-slate-500 text-[11px] ml-2 font-mono tabular-nums">
                  Qty: {item.quantity}
                </span>
              </div>
              <div className="font-mono font-semibold text-slate-900 tabular-nums">
                {PricingEngine.formatBDT(item.subtotal)}
              </div>
            </div>
          ))}

          <div className="border-t border-slate-200/80 pt-2 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charge</span>
              <span className="font-mono tabular-nums">
                {order.deliveryCharge === 0 ? 'Free' : PricingEngine.formatBDT(order.deliveryCharge)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-950 pt-1">
              <span>Total Payable</span>
              <span className="font-mono tabular-nums">{PricingEngine.formatBDT(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => onNavigate('track-order', order.orderNumber)}
          className="flex-1 py-3 px-4 bg-slate-950 text-white rounded-xl font-semibold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Status</span>
        </button>

        <button
          onClick={() => onNavigate('shop')}
          className="flex-1 py-3 px-4 bg-slate-100 text-slate-900 rounded-xl font-semibold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
