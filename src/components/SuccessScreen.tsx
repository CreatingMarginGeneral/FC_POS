import React, { useEffect, useState } from 'react';
import { CheckCircle2, Mail, Printer, RefreshCw } from 'lucide-react';
import { PosOrder } from '../types';

interface SuccessScreenProps {
  order: PosOrder;
  storeSupportEmail: string;
  onReset: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  order,
  storeSupportEmail,
  onReset,
}) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReset]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 print:p-0 print:border-none print:shadow-none">
        {/* Animated Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-200">
          <CheckCircle2 className="w-12 h-12 text-brand-green" />
        </div>

        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Payment Complete!</h2>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
          Order #{order.orderNumber}
        </p>

        {/* Amount Paid Badge */}
        <div className="my-5 py-4 px-6 bg-teal-50 border border-teal-200 rounded-2xl">
          <p className="text-xs text-teal-800 font-bold uppercase tracking-wider">Total Charged</p>
          <p className="text-3xl font-black text-brand-teal mt-0.5">${order.total.toFixed(2)}</p>
          <p className="text-[11px] text-gray-500 mt-1">Paid via Card on Counter POS</p>
        </div>

        {/* Receipt Dispatches Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 mb-6 border border-gray-200 text-xs">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800">Customer Receipt Emailed</p>
              <p className="text-gray-500 break-all">{order.customer.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 border-t border-gray-200 pt-2.5">
            <Mail className="w-4 h-4 text-brand-teal flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-800">Store Support Notified</p>
              <p className="text-gray-500 break-all">{storeSupportEmail}</p>
            </div>
          </div>
        </div>

        {order.careInstructions && order.careInstructions.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-xs">
            <p className="font-bold uppercase tracking-wider text-amber-900">Care Instructions</p>
            <ul className="mt-1 list-inside list-disc text-amber-900">
              {order.careInstructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Printable Receipt Hidden Details for browser print */}
        <div className="hidden print:block text-left text-xs space-y-2 mb-4">
          <h3 className="font-bold text-sm">Fresh Clothes Laundry</h3>
          <p>Order: #{order.orderNumber}</p>
          <p>Customer: {order.customer.firstName} {order.customer.lastName}</p>
          <p>Date: {new Date().toLocaleString()}</p>
          <div className="border-t border-b py-2 space-y-1">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between">
                <span>{it.name} x{it.quantity}</span>
                <span>${it.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          {order.careInstructions && order.careInstructions.length > 0 && (
            <div>
              <p className="font-bold">Care Instructions:</p>
              <ul className="list-inside list-disc">
                {order.careInstructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm">
            <span>Total Paid:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3 print:hidden">
          <button
            onClick={onReset}
            className="w-full py-4 px-6 bg-brand-teal hover:bg-brand-tealDark active:scale-[0.99] text-white font-extrabold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>START NEXT ORDER</span>
            <span className="text-teal-200 text-xs font-normal">({countdown}s)</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full py-3 px-4 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print Counter Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
