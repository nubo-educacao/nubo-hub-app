import React from 'react';

const FILTERS = [
  "Em destaque",
  "Públicas",
  "Privadas",
  "Parceiros",
  "EAD",
  "Programas internacionais",
  "Políticas de permanência"
];

export default function FilterPills() {
  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex items-center gap-3 min-w-max px-1">
        {FILTERS.map((filter, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              index === 0 
                ? 'bg-white text-neutral-950 border-white hover:bg-neutral-200' 
                : 'bg-transparent text-neutral-300 border-neutral-800 hover:border-neutral-600 hover:text-white'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
