import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import freshClothesLogo from '../assets/fresh-clothes-logo-mark.png';
import { NumericKeypad } from './NumericKeypad';

export const LoginScreen: React.FC = () => {
  const { login, loginWithCode } = useAuth();
  const [authMode, setAuthMode] = useState<'pin' | 'email'>('pin');

  // PIN state
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSubmitting, setPinSubmitting] = useState(false);

  // Email / Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setPinError('Please enter a valid 4-digit code.');
      return;
    }

    setPinError(null);
    setPinSubmitting(true);
    const res = await loginWithCode(pin);
    setPinSubmitting(false);

    if (!res.success) {
      setPinError(res.error || 'Invalid code. Please try again.');
      setPin('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = await login(email.trim(), password);
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-teal to-brand-tealDark flex flex-col justify-center items-center px-4 py-8 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header branding */}
        <div className="bg-brand-teal px-8 pt-7 pb-5 text-center text-white relative">
          <div className="w-16 h-16 bg-white/15 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <img src={freshClothesLogo} alt="Fresh Clothes logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Fresh Clothes POS</h1>
          <p className="text-xs text-teal-100 mt-1 uppercase tracking-wider font-semibold">
            Counter Terminal Access
          </p>

          {/* Tab Selector: PIN Code vs Email */}
          <div className="mt-5 grid grid-cols-2 bg-black/20 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('pin');
                setPinError(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'pin'
                  ? 'bg-white text-brand-teal shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>STAFF PIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'email'
                  ? 'bg-white text-brand-teal shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>EMAIL LOGIN</span>
            </button>
          </div>
        </div>

        {/* Tab 1: PIN Keypad */}
        {authMode === 'pin' ? (
          <div className="p-6 sm:p-8 space-y-5">
            {pinError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {/* PIN Dots Display */}
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Enter 4-Digit Employee Code
              </p>
              <div className="flex justify-center items-center gap-3 h-10">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        filled
                          ? 'bg-brand-teal border-brand-teal scale-110 shadow-sm'
                          : 'bg-gray-100 border-gray-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Numeric Touch Keypad */}
            <NumericKeypad
              value={pin}
              onChange={setPin}
              onSubmit={handlePinSubmit}
              disabled={pinSubmitting}
            />

            <p className="text-center text-[11px] text-gray-400">
              Default staff PINs: 1234, 2081, 2082, 9999. Configurable via .env.
            </p>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Employee Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="staff@freshclotheslaundry.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-gray-800 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-brand-teal text-gray-800 text-base"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-brand-teal hover:bg-brand-tealDark active:scale-[0.99] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In to POS'
              )}
            </button>

            <p className="text-center text-xs text-gray-400 pt-2">
              Authorized personnel only. Sessions authenticated against employee database.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
