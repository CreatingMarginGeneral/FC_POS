import React from 'react';
import { Delete } from 'lucide-react';

interface NumericKeypadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const handleDigit = (digit: string) => {
    if (disabled) return;
    if (value.length < 8) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange('');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      {/* 3x3 Keypad Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(k)}
            className="h-14 sm:h-16 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:bg-gray-200 active:scale-95 text-xl sm:text-2xl font-bold text-gray-800 transition-all flex items-center justify-center shadow-sm disabled:opacity-40"
          >
            {k}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleClear}
          className="h-14 sm:h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-xs font-bold text-gray-600 transition-all flex items-center justify-center uppercase tracking-wider disabled:opacity-30"
        >
          Clear
        </button>

        {/* Zero */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="h-14 sm:h-16 rounded-2xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:bg-gray-200 active:scale-95 text-xl sm:text-2xl font-bold text-gray-800 transition-all flex items-center justify-center shadow-sm disabled:opacity-40"
        >
          0
        </button>

        {/* Backspace */}
        <button
          type="button"
          disabled={disabled || value.length === 0}
          onClick={handleBackspace}
          className="h-14 sm:h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 transition-all flex items-center justify-center disabled:opacity-30"
          aria-label="Backspace"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Enter / Submit Button */}
      <button
        type="button"
        disabled={disabled || value.length < 4}
        onClick={onSubmit}
        className="w-full py-4 bg-brand-teal hover:bg-brand-tealDark active:scale-[0.99] disabled:opacity-40 text-white font-extrabold text-base rounded-2xl shadow-lg transition-all uppercase tracking-wider"
      >
        Sign In With PIN
      </button>
    </div>
  );
};
