"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export interface Opportunity {
  id: string;
  shift: string;
  scholarship_type?: string;
  cutoff_score: number | null;
  opportunity_type: string;
}

interface OpportunitiesListCardProps {
  opportunities: Opportunity[];
}

export default function OpportunitiesListCard({ opportunities }: OpportunitiesListCardProps) {
  const router = useRouter();

  const handleFindSimilar = (opportunityId: string) => {
    const message = `Quero encontrar oportunidade similar a ${opportunityId}`;
    router.push(`/chat?message=${encodeURIComponent(message)}`);
  };

  const getShiftLabel = (shift: string) => {
    const map: Record<string, string> = {
      'Integral': 'Integral',
      'Matutino': 'Matutino',
      'Vespertino': 'Vespertino',
      'Noturno': 'Noturno',
    }
    return map[shift] || shift;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 col-span-1 md:col-span-2">
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-xl font-bold text-[#024F86]">Lista de Oportunidades</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Turno</th>
              <th className="px-6 py-4 font-semibold">Tipo</th>
              <th className="px-6 py-4 font-semibold">Nota de Corte</th>
              <th className="px-6 py-4 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opp) => (
              <tr key={opp.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 text-slate-700 font-medium">
                  {getShiftLabel(opp.shift)}
                </td>
                <td className="px-6 py-4 text-slate-600">
                    {opp.scholarship_type || (opp.opportunity_type === 'sisu' ? 'Vaga Sisu' : 'Vaga Regular')}
                </td>
                <td className="px-6 py-4 font-bold text-[#024F86]">
                   {opp.cutoff_score ? opp.cutoff_score.toFixed(2) : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleFindSimilar(opp.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#38B1E4] text-[#38B1E4] rounded-full hover:bg-[#38B1E4] hover:text-white transition-all text-sm font-semibold"
                  >
                    <Search className="w-4 h-4" />
                    Procurar similar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {opportunities.length === 0 && (
         <div className="p-8 text-center text-slate-500">
            Nenhuma oportunidade encontrada.
         </div>
      )}
    </div>
  );
}
