import React from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterPillsProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

export default function FilterPills({ 
  selectedFilter = "Parceiros", 
  onSelectFilter = () => {} 
}: FilterPillsProps) {
  const filters = [
    "Parceiros",
    "Públicas",
    "Vagas ociosas",
    "Bolsas integrais",
    "Bolsas parciais",
    "EAD"
  ];

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide pt-2">
      <div className="flex items-center gap-3 min-w-max px-1">
        {/* Dropdown Filters */}
        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-[#024F86] text-[#024F86] bg-white/10 hover:bg-[#024F86]/5">
          Próximas a você
          <ChevronDown size={14} />
        </button>
        
        <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-[#024F86] text-[#024F86] bg-white/10 hover:bg-[#024F86]/5">
          Selecione o curso
          <ChevronDown size={14} />
        </button>

        {/* Divider / Spacer if needed, or just flow */}
        <div className="w-px h-6 bg-[#024F86]/20 mx-1"></div>
        
        {/* Filter Pills */}
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => onSelectFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border border-[#024F86] shadow-sm ${
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
  );
}
