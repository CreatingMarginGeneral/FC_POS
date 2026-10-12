import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import freshClothesLogo from '../assets/fresh-clothes-logo-mark.png';

export const Header: React.FC = () => {
  const { employee, logout } = useAuth();

  return (
    <header className="bg-brand-teal text-white shadow-md select-none sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand and Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <img src={freshClothesLogo} alt="Fresh Clothes logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Fresh Clothes POS
            </h1>
            <span className="text-[11px] text-teal-100 font-medium">Counter Checkout System</span>
          </div>
        </div>

        {/* Logged in Employee Info and Sign Out */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-teal-100">Logged in as:</p>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
              {employee?.name || employee?.email || 'Staff Member'}
            </p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/15 hover:bg-white/25 active:bg-white/30 text-xs font-semibold text-white tracking-wider uppercase transition-colors border border-white/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
