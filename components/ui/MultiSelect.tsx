'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({ options, selected, onChange, placeholder = 'Selecione...', className = '', disabled = false }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (disabled) return;
    
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    
    onChange(newSelected);
  };

  const removeOption = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(selected.filter(item => item !== value));
  };

  // Get labels for selected items to display
  const selectedLabels = options
    .filter(opt => selected.includes(opt.value))
    .map(opt => opt.label);

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div
        className={`bg-white/50 border border-white/40 rounded-lg px-3 py-2 min-h-[42px] flex items-center justify-between cursor-pointer transition-all ${
           isOpen ? 'border-[#38B1E4] ring-1 ring-[#38B1E4]' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1.5 flex-1">
          {selected.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
             <div className="flex flex-wrap gap-1">
                 {/* Show only first 2-3 items then +X more to save space? Or all? Let's show pills. */}
                 {selected.map(value => {
                     const opt = options.find(o => o.value === value);
                     return (
                        <div key={value} className="bg-[#E0F2FE] text-[#024F86] text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {opt?.label}
                            <div onClick={(e) => removeOption(e, value)} className="cursor-pointer hover:text-red-500">
                                <X size={12} />
                            </div>
                        </div>
                     );
                 })}
             </div>
          )}
        </div>
        
        <div className="flex items-center text-gray-400">
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[9999] top-full left-0 w-full mt-1 bg-white border border-gray-100 shadow-xl rounded-lg max-h-60 overflow-y-auto">
          {options.length === 0 ? (
             <div className="p-3 text-sm text-gray-500 text-center">Nenhuma opção disponível</div>
          ) : (
              <div className="p-1">
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#E0F2FE] text-[#024F86]' : 'text-[#3A424E] hover:bg-gray-50'
                      }`}
                      onClick={() => toggleOption(option.value)}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#38B1E4] border-[#38B1E4] text-white' : 'border-gray-300 bg-white'
                      }`}>
                          {isSelected && <Check size={10} strokeWidth={4} />}
                      </div>
                      <span className="flex-1">{option.label}</span>
                    </div>
                  );
                })}
              </div>
          )}
        </div>
      )}
    </div>
  );
}
