import React from 'react';
import { Opportunity } from '../types/opportunity';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <div className="group bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-indigo-500/50 hover:bg-neutral-800/50 transition-all duration-300 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
            opportunity.type === 'Pública' ? 'bg-green-900/30 text-green-400' :
            opportunity.type === 'Privada' ? 'bg-blue-900/30 text-blue-400' :
            'bg-purple-900/30 text-purple-400'
          }`}>
            {opportunity.scholarship_type}
          </span>
          {opportunity.cutoff_score && (
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-900/30 text-amber-400">
              Nota: {opportunity.cutoff_score.toFixed(2)}
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
          </svg>
          {opportunity.location}
        </span>
      </div>

      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
        {opportunity.title}
      </h3>
      <p className="text-neutral-400 text-sm mb-4">
        {opportunity.institution}
      </p>

      <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
          {opportunity.modality}
        </span>
        <button className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          Ver detalhes
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
