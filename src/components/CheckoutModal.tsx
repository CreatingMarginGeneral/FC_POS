import React, { useState } from 'react';
import { X, Plus, Minus, Search, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { CartItem, Customer } from '../types';
import { searchCustomer } from '../services/api';

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (serviceId: string, delta: number) => void;
  careInstructions: string[];
  careNotes: string;
  onCareInstructionsChange: (instructions: string[]) => void;
  onCareNotesChange: (notes: string) => void;
  onProceedToPayment: (customer: Customer, careInstructions: string[]) => void;
}

const CARE_OPTIONS = ['Stain treatment', 'Hang dry', 'Fragrance-free'];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  onClose,
  onUpdateQuantity,
  careInstructions,
  careNotes,
  onCareInstructionsChange,
  onCareNotesChange,
  onProceedToPayment,
}) => {
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('existing');

  // Search by fields
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // New customer fields
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Selected / attached customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.total, 0);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim() && !searchPhone.trim()) {
      setSearchError('Please enter an email or phone number to search.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    try {
      const found = await searchCustomer({
        email: searchEmail.trim(),
        phone: searchPhone.trim(),
      });

      if (found) {
        setSelectedCustomer(found);
        setSearchError(null);
      } else {
        setSearchError('No existing customer found with that email or phone.');
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error('Customer search error:', err);
      setSearchError('Error looking up customer. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleContinue = () => {
    if (customerMode === 'existing') {
      if (!selectedCustomer) {
        setSearchError('Please search and select a customer before proceeding.');
        return;
      }
      onProceedToPayment(selectedCustomer, careInstructions);
    } else {
      if (!newFirstName.trim() || !newEmail.trim() || !newPhone.trim()) {
        setSearchError('First Name, Email, and Phone number are required.');
        return;
      }
      const customer: Customer = {
        firstName: newFirstName.trim(),
        lastName: newLastName.trim(),
        email: newEmail.trim().toLowerCase(),
        phoneNumber: newPhone.trim(),
      };
      onProceedToPayment(customer, careInstructions);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95">
        {/* Curio Check Out Header */}
        <div className="bg-brand-teal text-white px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
          <h2 className="text-xl font-bold tracking-tight">Check Out</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Top Cart Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-brand-teal text-white grid grid-cols-12 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">
              <div className="col-span-6">Service</div>
              <div className="col-span-4 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="grid grid-cols-12 px-4 py-3 text-xs items-center">
                  <div className="col-span-6 font-semibold text-gray-800 pr-2">
                    {item.name}
                  </div>

                  {/* Quantity Stepper matching Curio pill */}
                  <div className="col-span-4 flex items-center justify-center">
                    <div className="inline-flex items-center bg-brand-tealDark rounded-full p-0.5 text-white shadow-inner">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold min-w-[28px] text-center">
                        {item.unit === 'lb' ? `${item.quantity}` : item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 text-right font-bold text-gray-900">
                    {item.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal summary */}
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between text-xs font-bold text-gray-700">
              <div>Total Items: {totalItems}</div>
              <div>
                Total Price:{' '}
                <span className="text-sm font-extrabold text-brand-teal">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <section className="pt-2">
            <div className="mb-3 border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-brand-teal">Care Instructions</h3>
              <p className="mt-1 text-xs text-gray-500">
                These instructions will be attached to this order.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {CARE_OPTIONS.map((instruction) => (
                <label
                  key={instruction}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={careInstructions.includes(instruction)}
                    onChange={(event) => {
                      const nextInstructions = event.target.checked
                        ? [...careInstructions, instruction]
                        : careInstructions.filter((selected) => selected !== instruction);
                      onCareInstructionsChange(nextInstructions);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
                  />
                  {instruction}
                </label>
              ))}
            </div>
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-gray-600">
              Additional care notes
              <textarea
                value={careNotes}
                onChange={(event) => onCareNotesChange(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Add garment-specific instructions or customer preferences"
                className="mt-1.5 w-full resize-y rounded-xl border border-gray-300 px-3.5 py-3 text-sm font-normal normal-case tracking-normal text-gray-800 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </label>
          </section>

          {/* Customer Information Section (Curio Layout) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4 border-b pb-2 border-gray-100">
              <h3 className="text-base font-bold text-brand-teal">Customer Information</h3>

              {/* Radio Toggle: Existing vs New */}
              <div className="flex items-center space-x-4 text-xs font-semibold text-gray-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="customerMode"
                    value="existing"
                    checked={customerMode === 'existing'}
                    onChange={() => {
                      setCustomerMode('existing');
                      setSearchError(null);
                    }}
                    className="w-4 h-4 text-brand-teal focus:ring-brand-teal"
                  />
                  <span>Existing</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="customerMode"
                    value="new"
                    checked={customerMode === 'new'}
                    onChange={() => {
                      setCustomerMode('new');
                      setSelectedCustomer(null);
                      setSearchError(null);
                    }}
                    className="w-4 h-4 text-brand-teal focus:ring-brand-teal"
                  />
                  <span>New</span>
                </label>
              </div>
            </div>

            {searchError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Existing Customer Search Form */}
            {customerMode === 'existing' ? (
              <form onSubmit={handleSearch} className="space-y-3.5">
                <span className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
                  Search By
                </span>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border-b-2 border-gray-300 focus:border-brand-teal focus:bg-white focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div className="text-center font-bold text-xs text-gray-400 uppercase py-0.5">
                  Or
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border-b-2 border-gray-300 focus:border-brand-teal focus:bg-white focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full py-3 px-4 bg-brand-tealDark hover:bg-brand-teal active:scale-[0.99] text-white font-bold rounded-full shadow transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        GET CUSTOMER
                      </>
                    )}
                  </button>
                </div>

                {/* Display Found Customer Card */}
                {selectedCustomer && (
                  <div className="mt-4 p-4 bg-teal-50 border-2 border-brand-teal rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-brand-teal font-extrabold text-sm">
                        <UserCheck className="w-4 h-4" />
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{selectedCustomer.email}</p>
                      <p className="text-xs text-gray-600">{selectedCustomer.phoneNumber}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-brand-teal text-white text-[10px] font-extrabold uppercase rounded-full">
                      Attached
                    </span>
                  </div>
                )}
              </form>
            ) : (
              /* New Customer Form */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="Jane"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                    Email (for receipt) *
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="customer@example.com"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(208) 555-0123"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-teal focus:outline-none text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Proceed Button */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleContinue}
            disabled={customerMode === 'existing' && !selectedCustomer}
            className="w-full py-4 px-6 bg-brand-teal hover:bg-brand-tealDark active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>PROCEED TO PAYMENT</span>
            <span>•</span>
            <span>${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
