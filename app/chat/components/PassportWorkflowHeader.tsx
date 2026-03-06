'use client';

import React from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { PassportPhase } from '@/services/supabase/profile';

interface PassportWorkflowHeaderProps {
    currentPhase: PassportPhase;
    onBack: (previousPhase: PassportPhase) => void;
    isLoading?: boolean;
    onViewForms?: () => void;
    showViewFormsButton?: boolean;
}

const PHASE_LABELS: Record<PassportPhase, string> = {
    'INTRO': 'Introdução',
    'ONBOARDING': 'Configurando o Perfil',
    'ASK_DEPENDENT': 'Definindo o responsável',
    'DEPENDENT_ONBOARDING': 'Perfil de Dependente',
    'PROGRAM_MATCH': 'Match de Programa',
    'EVALUATE': 'Preenchendo o formulário',
    'CONCLUDED': 'Formulário Concluído'
};

// Ordem lógica para retroceder
const PHASE_ORDER: PassportPhase[] = [
    'INTRO',
    'ONBOARDING',
    'ASK_DEPENDENT',
    'DEPENDENT_ONBOARDING',
    'PROGRAM_MATCH',
    'EVALUATE',
    'CONCLUDED'
];

export default function PassportWorkflowHeader({ currentPhase, onBack, isLoading, onViewForms, showViewFormsButton }: PassportWorkflowHeaderProps) {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    const canGoBack = currentIndex > 1; // Desabilitado em INTRO (0) e ONBOARDING (1)

    const handleBack = () => {
        if (canGoBack && !isLoading) {
            const prevPhase = PHASE_ORDER[currentIndex - 1];
            onBack(prevPhase);
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 bg-white border-b border-gray-100 gap-2 relative z-20">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <button
                    onClick={handleBack}
                    disabled={!canGoBack || isLoading}
                    className={`flex items-center gap-1 md:gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-all shrink-0
            ${!canGoBack || isLoading
                            ? 'text-gray-400 cursor-not-allowed bg-gray-100/50'
                            : 'text-[#024F86] hover:bg-[#024F86]/10 active:scale-95 bg-white shadow-sm border border-[#024F86]/10'
                        }`}
                >
                    <ArrowLeft size={14} className="md:w-4 md:h-4" />
                    <span className="hidden md:inline">Voltar</span>
                </button>

                <div className="h-4 md:h-6 w-px bg-gray-300/50 shrink-0" />

                <div className="flex flex-col min-w-0">
                    <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-[#024F86]/60 font-bold">Passo Atual</span>
                    <span className="text-xs md:text-sm font-semibold text-[#024F86] truncate">
                        {PHASE_LABELS[currentPhase] || 'Carregando...'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                {/* View Forms Button */}
                {showViewFormsButton && onViewForms && (
                    <button
                        onClick={onViewForms}
                        className="flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-semibold transition-all
                            text-[#024F86] bg-[#024F86]/5 hover:bg-[#024F86]/15 active:scale-95 border border-[#024F86]/10"
                    >
                        <FileText size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="hidden sm:inline">Ver formulários</span>
                        <span className="sm:hidden">Forms</span>
                    </button>
                )}

                {/* Progress Bar */}
                <div className="flex items-center gap-0.5 md:gap-1">
                    {PHASE_ORDER.map((phase, idx) => (
                        <div
                            key={phase}
                            className={`h-1 md:h-1.5 rounded-full transition-all duration-500 ${idx <= currentIndex ? 'w-3 md:w-6 bg-[#024F86]' : 'w-1.5 md:w-2 bg-[#024F86]/10'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

