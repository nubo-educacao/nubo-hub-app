"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface SisuProuniCardProps {
  opportunity_type: string; // 'sisu' | 'prouni'
}

export default function SisuProuniCard({ opportunity_type }: SisuProuniCardProps) {
  const router = useRouter();
  const title = opportunity_type.toLowerCase() === "prouni" ? "Programa ProUni" : "Programa SiSU";
  const description =
    opportunity_type.toLowerCase() === "prouni"
      ? "O Programa Universidade para Todos (ProUni) é um processo seletivo do MEC que concede bolsas de estudo integrais e parciais em instituições privadas, utilizando a nota do Enem e critérios de renda."
      : "O Sisu (Sistema de Seleção Unificada) é o processo seletivo do MEC que utiliza a nota do Enem para classificar candidatos a vagas ofertadas por instituições de ensino superior participantes.";

  const handleLearnMore = () => {
    const message = `Quero saber mais sobre o ${
      opportunity_type.toLowerCase() === "prouni" ? "ProUni" : "Sisu"
    }`;
    router.push(`/chat?message=${encodeURIComponent(message)}`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between h-full border border-slate-100">
      <div>
        <h3 className="text-xl font-bold text-[#024F86] mb-3">{title}</h3>
        <p className="text-slate-600 mb-6 leading-relaxed">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          onClick={handleLearnMore}
          className="text-[#38B1E4] bg-[#38B1E4]/10 hover:bg-[#38B1E4]/20 px-6 py-2.5 rounded-full font-bold flex flex-1 sm:flex-none justify-center items-center gap-2 transition-all group"
        >
          Tirar dúvidas
        </button>
        <a 
          href={opportunity_type.toLowerCase() === "prouni" ? "https://acessounico.mec.gov.br/prouni" : "https://acessounico.mec.gov.br/sisu"}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#38B1E4] hover:bg-[#024F86] text-white px-8 py-2.5 rounded-full font-bold shadow-md transition-colors flex flex-1 sm:flex-none justify-center items-center gap-2"
        >
          Candidatar-se
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
