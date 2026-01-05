"use client";

import React from "react";
import { MapPin, Building2, Star, Globe, Phone, Mail } from "lucide-react";

interface InstitutionDetailsCardProps {
  institution: {
    name: string;
    acronym?: string;
    igc?: number;
    ci?: number;
    ci_ead?: number;
    site?: string;
    phone?: string;
    email?: string;
  };
  course: {
    name: string;
  };
  campus: {
    name: string;
    city: string;
    state: string;
  };
}

function StarRating({ value }: { value?: number }) {
  if (!value) return <span className="text-slate-400 text-sm">-</span>;
  
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(value)
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-200 fill-slate-200"
          }`}
        />
      ))}
      <span className="ml-2 text-sm text-slate-500 font-medium">{value}</span>
    </div>
  );
}

export default function InstitutionDetailsCard({ institution, course, campus }: InstitutionDetailsCardProps) {
  const isValidRating = (value: any) => {
    if (!value) return false;
    if (value === "-") return false;
    if (value == 0) return false;
    return true;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full border border-slate-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-orange-50 rounded-lg">
           <Building2 className="w-5 h-5 text-[#FF9900]" />
        </div>
        <h3 className="text-xl font-bold text-[#024F86]">Detalhes da Instituição</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Column 1: Institution & Course Info */}
        <div className="flex flex-col gap-8">
            {/* Institution Section */}
            <div>
               <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Instituição</h4>
               <p className="text-lg text-slate-900 font-medium leading-tight mb-4">
                 {institution.name} {institution.acronym && <span className="text-slate-500">({institution.acronym})</span>}
               </p>

               <div className="flex flex-col gap-3 bg-slate-50 rounded-xl p-4">
                 {isValidRating(institution.igc) && (
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-slate-600 font-medium">Qualidade dos cursos (IGC)</span>
                     <StarRating value={institution.igc} />
                   </div>
                 )}
                 {isValidRating(institution.ci) && (
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 font-medium">Qualidade da infraestrutura (CI)</span>
                      <StarRating value={institution.ci} />
                   </div>
                 )}
                 {isValidRating(institution.ci_ead) && (
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 font-medium">Qualidade da infraestrutura EAD (CI-EAD)</span>
                      <StarRating value={institution.ci_ead} />
                   </div>
                 )}
               </div>
            </div>
            
            {/* Course Section */}
            <div>
                 <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Curso</h4>
                 <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-[#38B1E4] rounded-full"></div>
                    <p className="text-slate-900 text-lg font-medium">{course.name}</p>
                 </div>
            </div>
        </div>

        {/* Column 2: Location & Contact Info */}
        <div className="flex flex-col gap-8 md:border-l md:border-slate-100 md:pl-8">
             {/* Location Section */}
             <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Localização</h4>
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50/50 rounded-lg shrink-0">
                        <MapPin className="w-5 h-5 text-[#38B1E4]" />
                    </div>
                    <div>
                        <p className="text-slate-900 text-lg font-medium">{campus.city} - {campus.state}</p>
                        <p className="text-slate-500 mt-0.5 text-sm">{campus.name}</p>
                    </div>
                </div>
             </div>

             {/* Contact Section */}
             <div>
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Contato</h4>
                <div className="flex flex-col gap-3">
                  {institution.site && (
                    <a href={institution.site.startsWith('http') ? institution.site : `https://${institution.site}`} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       className="flex items-center gap-3 text-slate-600 hover:text-[#38B1E4] transition-colors group">
                      <div className="p-1.5 bg-slate-100 rounded-md group-hover:bg-blue-50 transition-colors">
                        <Globe className="w-4 h-4 text-slate-500 group-hover:text-[#38B1E4]" />
                      </div>
                      <span className="text-sm truncate max-w-[250px]">{institution.site}</span>
                    </a>
                  )}
                  
                  {institution.phone && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <div className="p-1.5 bg-slate-100 rounded-md">
                        <Phone className="w-4 h-4 text-slate-500" />
                      </div>
                      <span className="text-sm">{institution.phone}</span>
                    </div>
                  )}

                  {institution.email && (
                    <a href={`mailto:${institution.email}`} className="flex items-center gap-3 text-slate-600 hover:text-[#38B1E4] transition-colors group">
                       <div className="p-1.5 bg-slate-100 rounded-md group-hover:bg-blue-50 transition-colors">
                         <Mail className="w-4 h-4 text-slate-500 group-hover:text-[#38B1E4]" />
                       </div>
                       <span className="text-sm truncate max-w-[250px]">{institution.email}</span>
                    </a>
                  )}
                  
                  {!institution.site && !institution.phone && !institution.email && (
                    <span className="text-slate-400 text-sm italic">Informações de contato não disponíveis</span>
                  )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
