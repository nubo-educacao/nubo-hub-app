import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterPillsProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
  children?: React.ReactNode;
}

export default function FilterPills({ 
  selectedFilter = "Parceiros", 
  onSelectFilter = () => {},
  children
}: FilterPillsProps) {
  const filters = [
    "Parceiros",
    "SISU",
    "Prouni",
    "Ações afirmativas",
    "EAD",
    "Fáceis de entrar"
  ];

  return (
    <div className="w-full flex items-center gap-2">
      {/* Left Content (Sort/Search) */}
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
          {/* Divider */}
          <div className="w-px h-6 bg-[#024F86]/20 mx-1"></div>
        </div>
      )}

      {/* Scrollable Pills */}
      <div className="overflow-x-auto pb-4 pt-2 scrollbar-hide flex-1 min-w-0">
        <div className="flex items-center gap-3 min-w-max px-1">
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => onSelectFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border border-[#024F86] shadow-sm whitespace-nowrap ${
                  isSelected 
                    ? 'bg-[#024F86] text-white shadow-md' 
                    : 'text-[#024F86] bg-white/10 hover:bg-[#024F86]/10'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
