"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

interface SisuProuniCardProps {
  type: string; // 'sisu' | 'prouni'
}

export default function SisuProuniCard({ type }: SisuProuniCardProps) {
  const router = useRouter();
  const title = type.toLowerCase() === "prouni" ? "Programa ProUni" : "Programa SiSU";
  const description =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.";

  const handleLearnMore = () => {
    const message = `Quero saber mais sobre o ${
      type.toLowerCase() === "prouni" ? "ProUni" : "Sisu"
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
