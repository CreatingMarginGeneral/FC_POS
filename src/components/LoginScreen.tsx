import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import freshClothesLogo from '../assets/fresh-clothes-logo-mark.png';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Header branding */}
        <div className="bg-brand-teal px-8 py-8 text-center text-white relative">
          <div className="w-16 h-16 bg-white/15 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <img src={freshClothesLogo} alt="Fresh Clothes logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Fresh Clothes POS</h1>
          <p className="text-sm text-teal-100 mt-1">Staff Counter Service Portal</p>
        </div>

        {/* Form Body */}
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
      </div>
    </div>
  );
};
