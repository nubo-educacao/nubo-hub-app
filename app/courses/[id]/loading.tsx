import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F0F8FF]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-[#38B1E4] animate-spin" />
        <p className="text-[#024F86] font-medium animate-pulse">
          Carregando detalhes do curso...
        </p>
      </div>
    </div>
  );
}
