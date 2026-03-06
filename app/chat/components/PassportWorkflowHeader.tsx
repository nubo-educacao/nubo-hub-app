'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, FileText, ChevronDown, CheckCircle2, Circle } from 'lucide-react';
import { PassportPhase } from '@/services/supabase/profile';

interface PassportWorkflowHeaderProps {
    currentPhase: PassportPhase;
    furthestPhase: PassportPhase | null;
    onBack: (previousPhase: PassportPhase) => void;
    isLoading?: boolean;
    onViewForms?: () => void;
    showViewFormsButton?: boolean;
    activeApplicationTargetId?: string | null;
    profileId?: string | null;
}

const PHASE_WEIGHTS: Record<PassportPhase, number> = {
    'INTRO': 1,
    'ONBOARDING': 2,
    'ASK_DEPENDENT': 3,
    'DEPENDENT_ONBOARDING': 4,
    'PROGRAM_MATCH': 5,
    'EVALUATE': 6,
    'CONCLUDED': 7
};

const PHASE_LABELS: Record<PassportPhase, string> = {
    'INTRO': 'Introdução',
    'ONBOARDING': 'Configurando o Perfil',
    'ASK_DEPENDENT': 'Definindo o responsável',
    'DEPENDENT_ONBOARDING': 'Perfil de Dependente',
    'PROGRAM_MATCH': 'Match de Programa',
    'EVALUATE': 'Preenchendo o formulário',
    'CONCLUDED': 'Formulário Concluído'
};

const DEFAULT_PHASE_ORDER: PassportPhase[] = [
    'INTRO',
    'ONBOARDING',
    'ASK_DEPENDENT',
    'DEPENDENT_ONBOARDING',
    'PROGRAM_MATCH',
    'EVALUATE',
    'CONCLUDED'
];

export default function PassportWorkflowHeader({
    currentPhase,
    furthestPhase,
    onBack,
    isLoading,
    onViewForms,
    showViewFormsButton,
    activeApplicationTargetId,
    profileId
}: PassportWorkflowHeaderProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Determines if it's a dependent application based on target ID
    // We only show the dependent step if we explicitly have a target ID that is different from the profile ID.
    const isDependentApplication = !!activeApplicationTargetId && activeApplicationTargetId !== profileId;

    // Filter phases: 
    // 1. Always hide 'INTRO' as the user shouldn't navigate back to it.
    // 2. Hide 'DEPENDENT_ONBOARDING' if NOT a dependent application.
    const effectivePhaseOrder = DEFAULT_PHASE_ORDER.filter(phase => {
        if (phase === 'INTRO') return false;
        if (phase === 'DEPENDENT_ONBOARDING') return isDependentApplication;
        return true;
    });

    const currentIndex = effectivePhaseOrder.indexOf(currentPhase);
    const canGoBack = currentIndex > 1; // Disabled in INTRO (0) and ONBOARDING (1)

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBack = () => {
        if (canGoBack && !isLoading) {
            const prevPhase = effectivePhaseOrder[currentIndex - 1];
            onBack(prevPhase);
        }
    };

    const handleNavigate = (phase: PassportPhase) => {
        const targetIndex = effectivePhaseOrder.indexOf(phase);
        
        const currentWeight = PHASE_WEIGHTS[currentPhase] || 0;
        const targetWeight = PHASE_WEIGHTS[phase] || 0;
        const furthestWeight = furthestPhase ? (PHASE_WEIGHTS[furthestPhase] || 0) : currentWeight;

        // Allow navigating to any phase already reached (up to furthestWeight)
        if (targetIndex !== -1 && targetWeight <= furthestWeight && !isLoading) {
            onBack(phase);
            setIsDropdownOpen(false);
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

                <div className="flex flex-col min-w-0 relative" ref={dropdownRef}>
                    <span className="text-[8px] md:text-[10px] uppercase tracking-wider text-[#024F86]/60 font-bold">Passo Atual</span>
                    <button
                        onClick={() => !isLoading && setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isLoading}
                        className="flex items-center gap-1 text-xs md:text-sm font-semibold text-[#024F86] hover:opacity-80 transition-opacity truncate group"
                    >
                        <span className="truncate">{PHASE_LABELS[currentPhase] || 'Carregando...'}</span>
                        <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-3 py-1 mb-1">
                                <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Navegar para passo:</span>
                            </div>
                            {effectivePhaseOrder.map((phase) => {
                                const idx = effectivePhaseOrder.indexOf(phase);
                                const isCompleted = idx < currentIndex;
                                const isCurrent = idx === currentIndex;
                                
                                const currentWeight = PHASE_WEIGHTS[currentPhase] || 0;
                                const targetWeight = PHASE_WEIGHTS[phase] || 0;
                                const furthestWeight = furthestPhase ? (PHASE_WEIGHTS[furthestPhase] || 0) : currentWeight;

                                const isEnabled = targetWeight <= furthestWeight;

                                return (
                                    <button
                                        key={phase}
                                        onClick={() => isEnabled && !isCurrent && handleNavigate(phase)}
                                        disabled={!isEnabled || isCurrent || isLoading}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                                            ${isCurrent ? 'bg-[#024F86]/5 text-[#024F86]' : ''}
                                            ${isEnabled && !isCurrent ? 'hover:bg-gray-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'}
                                        `}
                                    >
                                        <div className="shrink-0">
                                            {isCompleted ? (
                                                <CheckCircle2 size={16} className="text-[#024F86]" />
                                            ) : isCurrent ? (
                                                <div className="w-4 h-4 rounded-full border-2 border-[#024F86] flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#024F86]" />
                                                </div>
                                            ) : (
                                                <Circle size={16} className="text-gray-300" />
                                            )}
                                        </div>
                                        <span className={`text-xs md:text-sm ${isCurrent ? 'font-bold' : 'font-medium'}`}>
                                            {PHASE_LABELS[phase]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
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
                    {effectivePhaseOrder.map((phase, idx) => (
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

