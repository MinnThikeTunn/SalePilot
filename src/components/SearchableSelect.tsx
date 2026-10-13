import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

interface SearchableSelectProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  lang?: "en" | "my";
  required?: boolean;
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder = "Select a township...",
  lang,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = useMemo(() => {
    const uniqueOptions = Array.from(new Set(options || []));
    if (!searchTerm) return uniqueOptions;
    return uniqueOptions.filter((opt) =>
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const displayValue = value || placeholder;

  // Handle outside click & escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="block text-xs font-semibold text-stone-700">
        {label}
        {required && <span className="text-[#0069FF] ml-1">*</span>}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`w-full bg-[#FAF8F5]/60 border rounded-xl py-2.5 px-4 text-xs font-medium text-left flex items-center justify-between transition-all cursor-pointer ${
            isOpen
              ? "border-[#0069FF] ring-2 ring-[#0069FF]/15 bg-white"
              : "border-stone-200/80 hover:border-stone-300 hover:bg-white"
          }`}
        >
          <span className={value ? "text-stone-900 font-semibold" : "text-stone-400 font-normal"}>
            {displayValue}
          </span>
          <ChevronDown
            size={14}
            className={`text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#0069FF]" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-stone-200/90 rounded-2xl shadow-lg z-50 overflow-hidden">
            <div className="p-2 border-b border-stone-100 bg-[#FAF8F5]/50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type township name..."
                  className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-9 pr-3 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#0069FF] focus:ring-1 focus:ring-[#0069FF]/20"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-stone-50" role="listbox">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = value === option;
                  return (
                    <button
                      key={`${option}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#EFF6FF] text-[#0069FF] font-semibold"
                          : "text-stone-700 hover:bg-[#FAF8F5] hover:text-stone-900"
                      }`}
                    >
                      <span>{option}</span>
                      {isSelected && <Check size={13} className="text-[#0069FF]" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-xs text-stone-400 text-center">
                  No townships matching &ldquo;{searchTerm}&rdquo;
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}