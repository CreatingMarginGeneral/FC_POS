import React, { useState } from 'react';
import { Plus, Minus, Shirt, Sparkles, Footprints, Wind, HelpCircle } from 'lucide-react';
import { CartItem, ServiceItem } from '../types';

interface ServiceTallyProps {
  cart: CartItem[];
  onAddToCart: (item: ServiceItem, quantity?: number, customPrice?: number, customNotes?: string) => void;
  onRemoveFromCart: (serviceId: string) => void;
  onUpdateQuantity: (serviceId: string, delta: number) => void;
  onOpenCheckout: () => void;
  onClearCart: () => void;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: 'premium_drop_off',
    name: 'Premium Drop Off ($1.25 / lb)',
    pricePerUnit: 1.25,
    unit: 'lb',
    defaultQuantity: 20, // $25.00 base standard
    iconType: 'washer',
  },
  {
    id: 'budget_drop_off',
    name: 'Budget Drop Off ($0.50 / lb)',
    pricePerUnit: 0.50,
    unit: 'lb',
    defaultQuantity: 24, // $12.00 base standard
    iconType: 'budget',
  },
  {
    id: 'shoe_polish',
    name: 'Shoe Polish',
    pricePerUnit: 15.00,
    unit: 'item',
    defaultQuantity: 1,
    iconType: 'shoe',
  },
  {
    id: 'ironing',
    name: 'Ironing',
    pricePerUnit: 3.00,
    unit: 'item',
    defaultQuantity: 1,
    iconType: 'iron',
  },
];

export const ServiceTally: React.FC<ServiceTallyProps> = ({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onOpenCheckout,
  onClearCart,
}) => {
  // Other service custom item state
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherName, setOtherName] = useState('');
  const [otherPrice, setOtherPrice] = useState('');

  // Weight edit modal for per-pound services
  const [editingWeightService, setEditingWeightService] = useState<ServiceItem | null>(null);
  const [weightInput, setWeightInput] = useState('');

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.total, 0);

  const getServiceIcon = (type: ServiceItem['iconType']) => {
    switch (type) {
      case 'washer':
        return <Shirt className="w-6 h-6 text-brand-teal" />;
      case 'budget':
        return <Sparkles className="w-6 h-6 text-brand-teal" />;
      case 'shoe':
        return <Footprints className="w-6 h-6 text-brand-teal" />;
      case 'iron':
        return <Wind className="w-6 h-6 text-brand-teal" />;
      default:
        return <HelpCircle className="w-6 h-6 text-brand-teal" />;
    }
  };

  const handleAddOther = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(otherPrice);
    if (!otherName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const customItem: ServiceItem = {
      id: `other_${Date.now()}`,
      name: otherName.trim(),
      pricePerUnit: priceNum,
      unit: 'service',
      iconType: 'other',
    };

    onAddToCart(customItem, 1, priceNum);
    setOtherName('');
    setOtherPrice('');
    setShowOtherModal(false);
  };

  const handleSaveCustomWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWeightService) return;
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;

    onAddToCart(editingWeightService, w, w * editingWeightService.pricePerUnit);
    setEditingWeightService(null);
    setWeightInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 select-none pb-28">
      {/* Services List / Cards */}
      <div className="space-y-2.5">
        {DEFAULT_SERVICES.map((srv) => {
          const inCart = cart.find((i) => i.id === srv.id);
          const currentDisplayPrice = srv.unit === 'lb'
            ? `$${((srv.defaultQuantity || 20) * srv.pricePerUnit).toFixed(2)}`
            : `$${srv.pricePerUnit.toFixed(2)}`;

          return (
            <div
              key={srv.id}
              className="bg-white border-2 border-brand-teal/40 rounded-full px-4 py-2 flex items-center justify-between shadow-sm hover:border-brand-teal transition-all"
            >
              {/* Left Icon + Service Name */}
              <div className="flex items-center space-x-3.5 flex-1 cursor-pointer"
                onClick={() => {
                  if (srv.unit === 'lb') {
                    setEditingWeightService(srv);
                    setWeightInput(String(inCart ? inCart.quantity : srv.defaultQuantity || 20));
                  }
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
                  {getServiceIcon(srv.iconType)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm tracking-tight">{srv.name}</h3>
                  {srv.unit === 'lb' && (
                    <span className="text-[11px] text-teal-700 font-medium">
                      Tap to set exact scale weight
                    </span>
                  )}
                </div>
              </div>

              {/* Price Tag */}
              <div className="text-right pr-4">
                <span className="text-base font-bold text-gray-800">{currentDisplayPrice}</span>
              </div>

              {/* Action Buttons (+ / -) */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (srv.unit === 'lb') {
                      const qty = srv.defaultQuantity || 20;
                      onAddToCart(srv, qty, qty * srv.pricePerUnit);
                    } else {
                      onAddToCart(srv, 1, srv.pricePerUnit);
                    }
                  }}
                  className="w-10 h-10 rounded-full border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white active:scale-95 flex items-center justify-center transition-colors shadow-sm"
                  title="Add service"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>

                <button
                  onClick={() => onRemoveFromCart(srv.id)}
                  disabled={!inCart}
                  className="w-10 h-10 rounded-full border-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white active:scale-95 flex items-center justify-center transition-colors shadow-sm disabled:opacity-30 disabled:pointer-events-none"
                  title="Remove service"
                >
                  <Minus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Other Service Item Row */}
        <div className="bg-white border-2 border-brand-teal/40 rounded-full px-4 py-2 flex items-center justify-between shadow-sm hover:border-brand-teal transition-all">
          <div className="flex items-center space-x-3.5 flex-1">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-brand-teal" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm tracking-tight">Other</h3>
              <span className="text-[11px] text-gray-500">Custom service or miscellaneous charge</span>
            </div>
          </div>

          <button
            onClick={() => setShowOtherModal(true)}
            className="w-10 h-10 rounded-full border-2 border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white active:scale-95 flex items-center justify-center transition-colors shadow-sm"
            title="Add Custom Item"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Cart Summary Table (Curio Layout) */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mt-6">
        {/* Table Header */}
        <div className="bg-brand-teal text-white grid grid-cols-12 px-5 py-3 text-sm font-bold tracking-wider">
          <div className="col-span-6 uppercase">Service</div>
          <div className="col-span-3 text-center uppercase">Quantity</div>
          <div className="col-span-3 text-right uppercase">Total</div>
        </div>

        {/* Cart Line Items */}
        <div className="divide-y divide-gray-100 min-h-[160px] max-h-[260px] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No services added yet. Tap items above to build order.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="grid grid-cols-12 px-5 py-3 text-sm items-center hover:bg-gray-50">
                <div className="col-span-6 font-semibold text-gray-800">
                  {item.name}
                  {item.unit === 'lb' && (
                    <span className="block text-xs text-gray-500 font-normal">
                      Weight: {item.quantity} lbs
                    </span>
                  )}
                </div>
                <div className="col-span-3 text-center text-gray-700 font-medium">
                  {item.unit === 'lb' ? `${item.quantity} lbs` : item.quantity}
                </div>
                <div className="col-span-3 text-right font-bold text-gray-900">
                  ${item.total.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary Bar */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-gray-700 font-bold text-sm">
            Total Items: <span className="text-gray-900">{totalItems}</span>
          </div>
          <div className="text-gray-700 font-bold text-sm">
            Total Price: <span className="text-lg text-brand-teal font-extrabold ml-1">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-3.5 px-4 shadow-2xl z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="px-5 py-3.5 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              Clear Cart
            </button>
          )}

          <button
            onClick={onOpenCheckout}
            disabled={cart.length === 0}
            className="flex-1 py-4 px-6 bg-brand-teal hover:bg-brand-tealDark active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-lg rounded-xl shadow-lg transition-all flex items-center justify-center gap-3"
          >
            <span>CHECKOUT</span>
            <span>•</span>
            <span>${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Modal: Other Service Custom Item */}
      {showOtherModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Custom Service</h3>
            <form onSubmit={handleAddOther} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Service Description
                </label>
                <input
                  type="text"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  placeholder="e.g. Comforter Laundry"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={otherPrice}
                  onChange={(e) => setOtherPrice(e.target.value)}
                  placeholder="20.00"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtherModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-teal text-white font-bold text-sm hover:bg-brand-tealDark shadow"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Custom Scale Weight Input */}
      {editingWeightService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{editingWeightService.name}</h3>
            <p className="text-xs text-gray-500 mb-4">
              Rate: ${editingWeightService.pricePerUnit.toFixed(2)} / lb
            </p>
            <form onSubmit={handleSaveCustomWeight} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Scale Weight (lbs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="20.0"
                  required
                  autoFocus
                  className="w-full px-3.5 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none text-xl font-bold text-center"
                />
              </div>

              {parseFloat(weightInput) > 0 && (
                <div className="p-3 bg-teal-50 rounded-xl text-center">
                  <span className="text-xs text-teal-800 font-medium">Calculated Total: </span>
                  <span className="text-base font-extrabold text-brand-teal ml-1">
                    ${(parseFloat(weightInput) * editingWeightService.pricePerUnit).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWeightService(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 font-bold text-sm text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-teal text-white font-bold text-sm hover:bg-brand-tealDark shadow"
                >
                  Update Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
