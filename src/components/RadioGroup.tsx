import React from 'react';

interface RadioOption {
  id: string;
  labelEn: string;
  labelMy?: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  lang?: string;
  required?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  required = false,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700">
          {label}
          {required && <span className="text-[#0069FF] ml-1">*</span>}
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {options.map((option) => {
          const isSelected = value === option.id;
          const displayLabel = option.labelEn;

          return (
            <label
              key={option.id}
              className={`px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between group focus-within:ring-2 focus-within:ring-[#0069FF]/20 ${
                isSelected
                  ? 'bg-[#EFF6FF] border-[#0069FF] text-stone-900 shadow-xs'
                  : 'bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-stone-50/60'
              }`}
            >
              <span className={`text-xs ${isSelected ? 'font-semibold text-stone-900' : 'font-medium text-stone-700'}`}>
                {displayLabel}
              </span>

              <input
                type="radio"
                name={label}
                value={option.id}
                checked={isSelected}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />

              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'border-[#0069FF] bg-[#0069FF]'
                    : 'border-stone-300 bg-white group-hover:border-stone-400'
                }`}
                aria-hidden="true"
              >
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
