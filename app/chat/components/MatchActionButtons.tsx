import React from 'react';
import { RotateCcw, Check, SlidersHorizontal } from 'lucide-react';

interface MatchActionButtonsProps {
  onRefine: () => void;
  onSatisfied: () => void;
  onRestart: () => void;
}

export default function MatchActionButtons({ onRefine, onSatisfied, onRestart }: MatchActionButtonsProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-lg mx-auto mt-4 mb-6 animation-fade-in">
      <div className="flex gap-3">
        <button
          onClick={onRefine}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-sky-200 rounded-xl text-sky-600 hover:bg-sky-50 transition-all shadow-sm font-medium"
        >
          <SlidersHorizontal size={18} />
          Quero refinar resultados
        </button>
        
        <button
          onClick={onSatisfied}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white rounded-xl transition-all shadow-md font-medium"
        >
          <Check size={18} />
          Estou satisfeito
        </button>
      </div>
      
      <button
        onClick={onRestart}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-600 text-sm transition-colors"
      >
        <RotateCcw size={14} />
        Recomeçar busca
      </button>
    </div>
  );
}
