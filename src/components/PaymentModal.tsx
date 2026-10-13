import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  X,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { Customer, CartItem } from '../types';
import { createPaymentIntent } from '../services/api';
import { useTerminal, sendCartToWisePOSE } from '../services/terminal';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_live_51HjCUIEbmMPUJqT0HJTMm18674OTXDcXFo8Y2CFenx9bBFHgDo5VhoOTSy5ntoyKlgYZK4F4rkWUSU9q4MSht7Wx00Tct3pFvr'
);

interface PaymentFormProps {
  cart: CartItem[];
  customer: Customer;
  storeUID: string;
  careInstructions: string[];
  onSuccess: (paymentIntentId: string) => void;
  onClose: () => void;
}

const CheckoutForm: React.FC<PaymentFormProps> = ({
  cart,
  customer,
  storeUID,
  careInstructions,
  onSuccess,
  onClose,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const terminal = useTerminal();

  const [cardholderName, setCardholderName] = useState(
    `${customer.firstName} ${customer.lastName}`.trim()
  );
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [retryingTerminal, setRetryingTerminal] = useState(false);

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);
  const totalCents = Math.round(totalAmount * 100);

  const handleRetryTerminal = async () => {
    setRetryingTerminal(true);
    try {
      await sendCartToWisePOSE(cart);
    } catch (err) {
      console.warn('Retry WisePOS E scan result:', err);
    } finally {
      setRetryingTerminal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) return;

    if (!cardholderName.trim()) {
      setPaymentError('Please enter the name on the card.');
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      // 1. Create PaymentIntent on the backend
      const orderSummary = cart
        .map((i) => `${i.name} (${i.quantity}x)`)
        .join(', ');

      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        amountCents: totalCents,
        customerEmail: customer.email,
        customerName: cardholderName.trim(),
        storeUID,
        orderSummary,
      });

      // 2. Confirm Card Payment via Stripe SDK
      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: {
            name: cardholderName.trim(),
            email: customer.email,
            phone: customer.phoneNumber,
          },
        },
      });

      if (confirmResult.error) {
        setPaymentError(confirmResult.error.message || 'Payment confirmation failed.');
        setProcessing(false);
      } else if (confirmResult.paymentIntent && confirmResult.paymentIntent.status === 'succeeded') {
        onSuccess(confirmResult.paymentIntent.id || paymentIntentId);
      } else {
        setPaymentError('Payment could not be completed. Please try another card.');
        setProcessing(false);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setPaymentError(err.message || 'An unexpected payment error occurred.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Customer & Total Display */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-teal-800 font-semibold uppercase tracking-wider">
            Paying Customer
          </p>
          <p className="text-sm font-bold text-gray-900">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-xs text-gray-500">{customer.email}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-teal-800 font-semibold uppercase tracking-wider">
            Total Due
          </p>
          <p className="text-2xl font-black text-brand-teal">${totalAmount.toFixed(2)}</p>
        </div>
      </div>

      {careInstructions.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Care instructions for this order
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-amber-900">
            {careInstructions.map((instruction) => (
              <li key={instruction}>{instruction}</li>
            ))}
          </ul>
        </div>
      )}

      {/* WisePOS E Wi-Fi Discovery / Status Banner */}
      {terminal.status === 'connected' ? (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              <strong className="font-semibold text-emerald-950">BBPOS WisePOS E Connected:</strong> Cart items are synced on customer screen.
            </span>
          </div>
          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
            Live Screen
          </span>
        </div>
      ) : terminal.status === 'discovering' || terminal.status === 'connecting' || retryingTerminal ? (
        <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 text-brand-teal animate-spin flex-shrink-0" />
          <span>Scanning Wi-Fi network for BBPOS WisePOS E and syncing cart...</span>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 text-sm">
                Could not connect to BBPOS WisePOS E on Wi-Fi
              </p>
              <p className="mt-1 text-amber-900 leading-relaxed">
                Please ask the customer to enter their credit card information below (noting that all card information is securely stored and encrypted in Stripe).
              </p>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-amber-200/60">
            <button
              type="button"
              onClick={handleRetryTerminal}
              disabled={retryingTerminal}
              className="inline-flex items-center gap-1.5 font-bold text-brand-teal hover:text-brand-tealDark active:underline transition-colors text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retryingTerminal ? 'animate-spin' : ''}`} />
              <span>Retry scanning Wi-Fi reader</span>
            </button>
            <span className="text-[11px] text-amber-800 font-medium">
              Secure Stripe card entry
            </span>
          </div>
        </div>
      )}

      {paymentError && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <span>{paymentError}</span>
        </div>
      )}

      {/* Cardholder Name */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          placeholder="Name on card"
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none text-base font-medium"
        />
      </div>

      {/* Stripe CardElement */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
          Credit or Debit Card
        </label>
        <div className="p-4 bg-white border border-gray-300 rounded-xl shadow-inner focus-within:ring-2 focus-within:ring-brand-teal">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '18px',
                  color: '#1e293b',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  '::placeholder': {
                    color: '#94a3b8',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
        <ShieldCheck className="w-4 h-4 text-brand-teal flex-shrink-0" />
        <span>All card information is end-to-end encrypted and securely stored in Stripe</span>
      </div>

      {/* Submit & Cancel Buttons */}
      <div className="space-y-2.5">
        <button
          type="submit"
          disabled={processing || !stripe}
          className="w-full py-4 px-6 bg-brand-teal hover:bg-brand-tealDark active:scale-[0.99] disabled:opacity-50 text-white font-extrabold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Card...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span>PAY ${totalAmount.toFixed(2)}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="w-full py-2.5 px-4 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors text-center disabled:opacity-40"
        >
          Cancel and return to checkout
        </button>
      </div>
    </form>
  );
};

export const PaymentModal: React.FC<PaymentFormProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-brand-teal text-white px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-yellow-300" />
            <h2 className="text-xl font-bold tracking-tight">Customer Card Payment</h2>
          </div>
          <button
            onClick={props.onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Stripe Elements Provider Wrapper */}
        <Elements stripe={stripePromise}>
          <CheckoutForm {...props} />
        </Elements>
      </div>
    </div>
  );
};
