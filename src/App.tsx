import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ServiceTally } from './components/ServiceTally';
import { CheckoutModal } from './components/CheckoutModal';
import { PaymentModal } from './components/PaymentModal';
import { SuccessScreen } from './components/SuccessScreen';
import { CartItem, Customer, PosOrder, ServiceItem } from './types';
import { recordOrderAndSendReceipt, resolveStoreSupportEmail } from './services/api';
import { sendCartToWisePOSE, clearWisePOSDisplay } from './services/terminal';
import { Loader2 } from 'lucide-react';

const POSMain: React.FC = () => {
  const { employee, loading } = useAuth();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [careSelections, setCareSelections] = useState<string[]>([]);
  const [activeCareInstructions, setActiveCareInstructions] = useState<string[]>([]);
  const [careNotes, setCareNotes] = useState('');
  const [completedOrder, setCompletedOrder] = useState<PosOrder | null>(null);
  const [storeSupportEmail, setStoreSupportEmail] = useState('support_boisewb@freshclotheslaundry.com');

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-brand-teal animate-spin" />
        <p className="text-sm font-semibold text-gray-600 tracking-wider">Loading POS Terminal...</p>
      </div>
    );
  }

  // Not logged in -> Show Employee Login
  if (!employee) {
    return <LoginScreen />;
  }

  // Add item or increment quantity
  const handleAddToCart = (
    item: ServiceItem,
    quantity = 1,
    customPrice?: number,
    customNotes?: string
  ) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      const unitPrice = customPrice !== undefined && quantity > 0
        ? customPrice / quantity
        : item.pricePerUnit;

      if (existingIndex > -1) {
        // Update existing item
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = item.unit === 'lb' ? quantity : current.quantity + quantity;
        const newTotal = item.unit === 'lb' && customPrice !== undefined
          ? customPrice
          : newQty * item.pricePerUnit;

        updated[existingIndex] = {
          ...current,
          quantity: newQty,
          total: parseFloat(newTotal.toFixed(2)),
          customNotes: customNotes || current.customNotes,
        };
        return updated;
      }

      // Add new item to cart
      const total = customPrice !== undefined
        ? customPrice
        : parseFloat((quantity * item.pricePerUnit).toFixed(2));

      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          pricePerUnit: unitPrice,
          unit: item.unit,
          quantity,
          total: parseFloat(total.toFixed(2)),
          customNotes,
        },
      ];
    });
  };

  // Remove completely
  const handleRemoveFromCart = (serviceId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== serviceId));
  };

  // Stepper increment / decrement from modal or table
  const handleUpdateQuantity = (serviceId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === serviceId) {
            const nextQty = Math.max(0, item.quantity + delta);
            return {
              ...item,
              quantity: nextQty,
              total: parseFloat((nextQty * item.pricePerUnit).toFixed(2)),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Sync cart to BBPOS WisePOS E when items/quantities change during checkout
  useEffect(() => {
    if ((checkoutOpen || paymentOpen) && cart.length > 0) {
      sendCartToWisePOSE(cart).catch((err) => {
        console.warn('WisePOS E sync note:', err);
      });
    }
  }, [checkoutOpen, paymentOpen, cart]);

  // Step 1: Open Checkout Modal & scan Wi-Fi for WisePOS E
  const handleOpenCheckout = () => {
    setCheckoutOpen(true);
    if (cart.length > 0) {
      sendCartToWisePOSE(cart).catch((err) => {
        console.warn('WisePOS E scan note:', err);
      });
    }
  };

  // Step 2: Customer selected / entered -> Open Touch Card Payment Modal
  const handleProceedToPayment = async (customer: Customer, selectedCareInstructions: string[]) => {
    setActiveCustomer(customer);
    const orderCareInstructions = careNotes.trim()
      ? [...selectedCareInstructions, careNotes.trim()]
      : selectedCareInstructions;
    setActiveCareInstructions(orderCareInstructions);
    setCheckoutOpen(false);

    // Prefetch store support email in background
    const supportEmail = await resolveStoreSupportEmail(employee.storeUID);
    setStoreSupportEmail(supportEmail);

    setPaymentOpen(true);
  };

  // Step 3: Card payment confirmed via Stripe
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!activeCustomer) return;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const orderNumber = `POS-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderData: Omit<PosOrder, 'id' | 'createdAt'> = {
      orderNumber,
      items: cart,
      totalItems,
      subtotal,
      tax: 0,
      total: subtotal,
      careInstructions: activeCareInstructions,
      customer: activeCustomer,
      employee: {
        uid: employee.uid,
        email: employee.email,
        name: employee.name,
      },
      storeUID: employee.storeUID || 'boise-store',
      paymentIntentId,
      status: 'paid',
    };

    setPaymentOpen(false);

    // Clear customer-facing WisePOS E display
    clearWisePOSDisplay().catch((err) => {
      console.warn('Error clearing WisePOS E display:', err);
    });

    // Record order and fire email dispatches
    try {
      const orderId = await recordOrderAndSendReceipt(orderData);
      setCompletedOrder({
        ...orderData,
        id: orderId,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Order recording error:', err);
      // Still show success screen because payment succeeded
      setCompletedOrder({
        ...orderData,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Reset POS back to clean slate for next counter customer
  const handleReset = () => {
    setCart([]);
    setActiveCustomer(null);
    setCareSelections([]);
    setActiveCareInstructions([]);
    setCareNotes('');
    setCompletedOrder(null);
    setCheckoutOpen(false);
    setPaymentOpen(false);
    clearWisePOSDisplay().catch((err) => {
      console.warn('Error clearing WisePOS E display on reset:', err);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-4">
        <ServiceTally
          cart={cart}
          onAddToCart={handleAddToCart}
          onRemoveFromCart={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onOpenCheckout={handleOpenCheckout}
          onClearCart={handleClearCart}
        />
      </main>

      {/* Customer Lookup & Checkout Modal */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          careInstructions={careSelections}
          careNotes={careNotes}
          onClose={() => setCheckoutOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onCareInstructionsChange={setCareSelections}
          onCareNotesChange={setCareNotes}
          onProceedToPayment={handleProceedToPayment}
        />
      )}

      {/* Touchscreen Stripe Elements Card Payment Modal */}
      {paymentOpen && activeCustomer && (
        <PaymentModal
          cart={cart}
          customer={activeCustomer}
          storeUID={employee.storeUID || 'boise-store'}
          careInstructions={activeCareInstructions}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentOpen(false)}
        />
      )}

      {/* Payment Success Confirmation & Auto-reset */}
      {completedOrder && (
        <SuccessScreen
          order={completedOrder}
          storeSupportEmail={storeSupportEmail}
          onReset={handleReset}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <POSMain />
    </AuthProvider>
  );
}
