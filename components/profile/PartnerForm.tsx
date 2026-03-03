'use client';

import React from 'react';
import { Montserrat } from 'next/font/google';
import { FileText } from 'lucide-react';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface PartnerFormProps {
    partnerId?: string;
    onFormDirty?: (state: any) => void;
    onComplete?: () => void;
}

export default function PartnerForm({ partnerId, onFormDirty, onComplete }: PartnerFormProps) {
    // Placeholder implementation
    return (
        <div className={`bg-white/30 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px] ${montserrat.className}`}>
            <div className="w-16 h-16 bg-[#024F86]/10 rounded-full flex items-center justify-center mb-4 text-[#024F86]">
                <FileText size={32} />
            </div>
            <h2 className="text-2xl font-bold text-[#024F86] mb-2">Formulário do Programa</h2>
            <p className="text-[#3A424E] mb-6 max-w-md">
                Nesta etapa, você deve preencher as informações específicas obrigatórias deste programa parceiro.
            </p>

            {/* In a real scenario this would render the dynamic form fields fetched from partner_steps */}
            <div className="w-full max-w-sm space-y-4 mb-8">
                <div className="p-4 rounded-xl border-2 border-dashed border-[#38B1E4]/50 bg-white/50 text-sm text-[#024F86]/70">
                    [ Campos Dinâmicos do Edital ]
                </div>
            </div>

            <button
                onClick={onComplete}
                className="px-6 py-3 bg-[#38B1E4] hover:bg-[#2a9ac9] text-white font-bold rounded-full transition-all shadow-md hover:shadow-lg"
            >
                Simular Conclusão (Dev)
            </button>
        </div>
    );
}
