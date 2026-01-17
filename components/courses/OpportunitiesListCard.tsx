"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Search, Sun, Sunset, Moon, SunMoon, Laptop, Info } from "lucide-react";

export interface Opportunity {
  id: string;
  shift: string;
  scholarship_type?: string;
  concurrency_type?: string;
  concurrency_tags?: string[][] | any; // Supports JSONB array of arrays
  cutoff_score: number | null;
  opportunity_type: string;
}

interface OpportunitiesListCardProps {
  opportunities: Opportunity[];
}

const getTagStyle = (tag: string) => {
  switch (tag) {
    case 'AMPLA_CONCORRENCIA': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ampla Concorrência' };
    case 'ESCOLA_PUBLICA': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Escola Pública' };
    case 'BAIXA_RENDA': return { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Baixa Renda' };
    case 'PPI': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'PPI' };
    case 'PCD': return { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'PcD' };
    case 'QUILOMBOLAS': return { bg: 'bg-cyan-100', text: 'text-cyan-800', label: 'Quilombolas' };
    case 'INDIGENAS': return { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Indígenas' };
    case 'RURAL': return { bg: 'bg-lime-100', text: 'text-lime-800', label: 'Rural' };
    case 'PROFESSOR': return { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Professor' };
    case 'TRANS': return { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Trans' };
    case 'REFUGIADOS': return { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Refugiados' };
    case 'BOLSA_INTEGRAL': return { bg: 'bg-sky-100', text: 'text-sky-700', label: 'Bolsa Integral' };
    case 'BOLSA_PARCIAL': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Bolsa Parcial' };
    case 'MILITAR': return { bg: 'bg-zinc-100', text: 'text-zinc-800', label: 'Militar/Policial' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Outros' };
  }
};

export default function OpportunitiesListCard({ opportunities }: OpportunitiesListCardProps) {
  const router = useRouter();
  
  console.log('Opportunities Data in Component:', opportunities);

  const handleFindSimilar = (opportunityId: string) => {
    const message = `Quero encontrar oportunidade similar a ${opportunityId}`;
    router.push(`/chat?message=${encodeURIComponent(message)}`);
  };

  const getShiftDetails = (shift: string) => {
    switch (shift) {
      case 'Matutino': return { icon: Sun, label: 'Matutino' };
      case 'Vespertino': return { icon: Sunset, label: 'Vespertino' };
      case 'Noturno': return { icon: Moon, label: 'Noturno' };
      case 'Integral': return { icon: SunMoon, label: 'Integral' };
      case 'EaD':
      case 'Curso a distância': return { icon: Laptop, label: 'EAD' };
      default: return { icon: Sun, label: shift };
    }
  };

  const renderTags = (tags: any) => {
    // Handle legacy format (string[]) or potential nulls
    if (!tags || tags.length === 0) return null;
    
    // Normalize to array of arrays: if first element is string, wrap it.
    // If first element is array, use as is.
    let groups: string[][] = [];
    if (Array.isArray(tags[0])) {
        groups = tags;
    } else {
        groups = [tags];
    }

    return (
        <div className="flex flex-wrap items-center gap-y-1">
            {groups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                    {groupIndex > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 mx-1.5 uppercase tracking-wide">OU</span>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {group.map((tag: string) => {
                             const style = getTagStyle(tag);
                             return (
                                 <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text} whitespace-nowrap`}>
                                     {style.label}
                                 </span>
                             );
                        })}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
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
              <th className="px-6 py-4 font-semibold text-center w-[10%]">Turno</th>
              <th className="px-6 py-4 font-semibold w-[45%]">Tipo</th>
              <th className="px-6 py-4 font-semibold text-center w-[20%] whitespace-nowrap">Nota de Corte</th>
              {/* <th className="px-6 py-4 font-semibold text-center w-[25%]">Ação</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {opportunities.map((opp) => {
              const { icon: Icon, label } = getShiftDetails(opp.shift);
              return (
              <tr key={opp.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 text-slate-700 font-medium">
                  <div className="relative group w-fit mx-auto">
                    <Icon size={24} className="text-[#024F86]" />
                    
                    {/* Tooltip */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm">
                        {label}
                        {/* Arrow */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800/90"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-wrap items-center gap-2">
                        {opp.concurrency_tags && opp.concurrency_tags.length > 0 ? (
                            renderTags(opp.concurrency_tags)
                        ) : (
                             // Fallback: Use concurrency_type (Sisu) or scholarship_type (Prouni)
                             opp.concurrency_type || opp.scholarship_type || (opp.opportunity_type === 'sisu' ? 'Vaga Sisu' : 'Vaga Regular')
                        )}
                        
                        {/* Info Tooltip for full description */}
                        {(opp.scholarship_type || opp.concurrency_type) && (
                            <div className="relative group/info inline-flex items-center ml-1">
                                <Info size={16} className="text-slate-400 cursor-help hover:text-[#024F86] transition-colors" />
                                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-64 p-3 bg-gray-800/95 text-white text-xs rounded-lg opacity-0 group-hover/info:opacity-100 transition-opacity pointer-events-none z-50 backdrop-blur-sm shadow-xl">
                                    {opp.concurrency_type || opp.scholarship_type}
                                    {/* Arrow */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800/95"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 font-bold text-[#024F86] text-center">
                   {opp.cutoff_score ? opp.cutoff_score.toFixed(2) : '-'}
                </td>
                {/* <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleFindSimilar(opp.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#38B1E4] text-[#38B1E4] rounded-full hover:bg-[#38B1E4] hover:text-white transition-all text-sm font-semibold"
                  >
                    <Search className="w-4 h-4" />
                    Procurar similar
                  </button>
                </td> */}
              </tr>
            )})}
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
