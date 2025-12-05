import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function FilterPills() {
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
        
        {/* Active Filter Example */}
        <button className="px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 border border-[#024F86] bg-[#024F86] text-white shadow-md">
          Parceiros
        </button>

        {/* Other Filters */}
        {[
          "Públicas",
          "Vagas ociosas",
          "Bolsas integrais",
          "Bolsas parciais",
          "EAD"
        ].map((filter, index) => (
          <button
            key={index}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-[#024F86] text-[#024F86] bg-white/10 hover:bg-[#024F86]/10"
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
