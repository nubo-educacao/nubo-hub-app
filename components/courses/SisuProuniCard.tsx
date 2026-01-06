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
      <button
        onClick={handleLearnMore}
        className="text-[#38B1E4] font-semibold flex items-center gap-2 hover:gap-3 transition-all group"
      >
        Saiba mais
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
