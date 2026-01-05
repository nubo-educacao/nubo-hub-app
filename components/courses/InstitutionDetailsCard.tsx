"use client";

import React from "react";
import { MapPin, Building2, GraduationCap } from "lucide-react";

interface InstitutionDetailsCardProps {
  institution: {
    name: string;
    academic_organization?: string;
  };
  campus: {
    name: string;
    city: string;
    state: string;
  };
}

export default function InstitutionDetailsCard({ institution, campus }: InstitutionDetailsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full border border-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-orange-50 rounded-lg">
           <Building2 className="w-5 h-5 text-[#FF9900]" />
        </div>
        <h3 className="text-xl font-bold text-[#024F86]">Detalhes da Instituição</h3>
      </div>

      <div className="space-y-5">
        <div>
           <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Instituição</h4>
           <p className="text-lg text-slate-900 font-medium">{institution.name}</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-[#38B1E4]" />
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Localização</h4>
                 </div>
                 <p className="text-slate-700">{campus.city} - {campus.state}</p>
                 <p className="text-slate-500 text-sm mt-1">{campus.name}</p>
            </div>

            {institution.academic_organization && (
                <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="w-4 h-4 text-[#38B1E4]" />
                        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Org. Acadêmica</h4>
                     </div>
                     <p className="text-slate-700">{institution.academic_organization}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
