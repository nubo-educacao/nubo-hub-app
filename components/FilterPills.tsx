'use client';

type FilterPillsProps = {
  filters: string[];
  activeFilter: string;
  onSelect?: (filter: string) => void;
};

export default function FilterPills({ filters, activeFilter, onSelect }: FilterPillsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {filters.map((filter) => {
        const isActive = filter === activeFilter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onSelect?.(filter)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
              isActive
                ? 'border-white bg-white/10 text-white shadow-lg shadow-indigo-500/20'
                : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white'
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
