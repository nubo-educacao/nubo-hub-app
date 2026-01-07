'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()} 
      className="flex items-center gap-2 text-[#024F86] hover:text-[#38B1E4] transition-colors font-medium whitespace-nowrap self-start md:self-auto order-first md:order-last"
    >
      <ArrowLeft size={20} />
      Voltar
    </button>
  );
}
