'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PartnerCard } from '../PartnerCard';
import { Loader2, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Montserrat } from 'next/font/google';
import { Partner } from '@/services/supabase/partners';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface EligibilityResult {
    partner_id: string;
    partner_name: string;
    total_criteria: number;
    met_criteria: number;
    details: { field: string; met: boolean }[];
}

interface ProgramMatchSectionProps {
    onTriggerChatMessage?: (message: string) => void;
}

export default function ProgramMatchSection({ onTriggerChatMessage }: ProgramMatchSectionProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState<EligibilityResult[] | null>(null);
    const [partnerDetails, setPartnerDetails] = useState<Record<string, Partner>>({});

    useEffect(() => {
        if (!user) return;

        const fetchResults = async () => {
            // Get parent profile to check target and existing results
            const { data: parentProfile } = await supabase
                .from('user_profiles')
                .select('active_application_target_id, eligibility_results')
                .eq('id', user.id)
                .single();

            let eligibility = parentProfile?.eligibility_results as EligibilityResult[] | null;
            const targetId = parentProfile?.active_application_target_id || user.id;

            // If eligibility is null or empty, compute it locally and trigger the agent
            if (!eligibility || eligibility.length === 0) {
                // 1. Fetch target profile data
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', targetId)
                    .single();

                // 2. Fetch all partners & criterion forms
                const { data: partners } = await supabase.from('partners').select('id, name');
                const partnersMap: Record<string, string> = {};
                partners?.forEach(p => partnersMap[p.id] = p.name);

                const { data: criteriaForms } = await supabase
                    .from('partner_forms')
                    .select('partner_id, field_name, mapping_source, criterion_rule')
                    .eq('is_criterion', true);

                // 3. Import evaluator and calculate
                const { evaluateJsonLogic } = await import('@/utils/jsonLogic');

                const resultsMap: Record<string, EligibilityResult> = {};
                partners?.forEach(p => {
                    resultsMap[p.id] = {
                        partner_id: p.id,
                        partner_name: p.name,
                        total_criteria: 0,
                        met_criteria: 0,
                        details: []
                    };
                });

                criteriaForms?.forEach(crit => {
                    const pId = crit.partner_id;
                    if (!resultsMap[pId]) return; // Fallback if partner is not in partners table

                    const mapping = crit.mapping_source;

                    if (mapping && mapping.startsWith('user_profiles.')) {
                        const field = mapping.split('.')[1];
                        const userVal = profile?.[field];

                        // ONLY count this criterion if we have a mapping AND the user provided a value
                        if (userVal !== null && userVal !== undefined && userVal !== '') {
                            resultsMap[pId].total_criteria += 1;
                            let met = false; // Initialize met here for this specific criterion

                            const rule = crit.criterion_rule;
                            if (!rule) {
                                // If there is no rule but a value exists, it's considered met for that criterion.
                                met = true;
                            } else {
                                const varName = crit.field_name;
                                met = Boolean(evaluateJsonLogic(rule, { [varName]: userVal }));
                            }

                            if (met) resultsMap[pId].met_criteria += 1;
                            resultsMap[pId].details.push({ field: crit.field_name, met });
                        }
                    }
                });

                eligibility = Object.values(resultsMap);

                // 4. Save to DB
                await supabase
                    .from('user_profiles')
                    .update({ eligibility_results: eligibility })
                    .eq('id', user.id);

                // 5. Tell the agent!
                if (onTriggerChatMessage) {
                    onTriggerChatMessage("A análise do meu perfil terminou. Por favor, leia meus dados com a sua tool, veja meus `eligibility_results` atualizados, faça um breve resumo de qual foi o meu melhor match e, em seguida, me pergunte qual programa eu escolho para iniciar a inscrição.");
                }
            }

            setResults(eligibility);

            if (eligibility && eligibility.length > 0) {
                // Fetch partner details for the cards
                const partnerIds = eligibility.map(r => r.partner_id);
                const { data: partners } = await supabase
                    .from('partners')
                    .select('*')
                    .in('id', partnerIds);

                if (partners) {
                    const detailsMap: Record<string, Partner> = {};
                    partners.forEach(p => {
                        detailsMap[p.id] = p;
                    });
                    setPartnerDetails(detailsMap);
                }
            }
            setLoading(false);
        };

        fetchResults();

        // Subscribe to changes on user_profiles for this user
        const subscription = supabase
            .channel('public:user_profiles')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    const newEligibility = payload.new.eligibility_results as EligibilityResult[] | null;
                    setResults(newEligibility);
                    if (newEligibility && newEligibility.length > 0) {
                        // We could fetch partners again here, but usually they are static
                        // For simplicity, refetching everything to ensure data integrity
                        fetchResults();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    if (loading || !results) {
        return (
            <div className={`w-full flex flex-col items-center justify-center py-32 gap-6 ${montserrat.className}`}>
                <div className="relative">
                    <div className="absolute inset-0 bg-[#38B1E4]/20 animate-ping rounded-full blur-xl scale-150"></div>
                    <Loader2 className="animate-spin text-[#024F86] relative z-10" size={48} />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-[#024F86]">Analisando seu perfil...</h3>
                    <p className="text-[#3A424E]/70 max-w-[280px]">
                        A Cloudinha está cruzando seus dados com as regras dos nossos parceiros. Isso leva só alguns segundos!
                    </p>
                </div>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-20 text-center px-4">
                <p className="text-[#3A424E] mb-4">Ainda não encontramos programas correspondentes ao seu perfil.</p>
            </div>
        );
    }

    // Sort results by match percentage descending
    const sortedResults = [...results].sort((a, b) => {
        const scoreA = a.total_criteria > 0 ? a.met_criteria / a.total_criteria : 0;
        const scoreB = b.total_criteria > 0 ? b.met_criteria / b.total_criteria : 0;
        return scoreB - scoreA;
    });

    return (
        <div className={`w-full pb-20 px-2 md:px-6 ${montserrat.className}`}>
            <div className="mb-8 text-center md:text-left">
                <h2 className="text-2xl font-bold text-[#024F86] flex items-center justify-center md:justify-start gap-2">
                    <Zap className="text-[#FF9900]" fill="#FF9900" size={24} />
                    Seu Match Perfeito
                </h2>
                <p className="text-[#3A424E] mt-2">
                    Baseado nas suas informações, aqui estão os programas que mais combinam com você.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
                {sortedResults.map((result, index) => {
                    const partner = partnerDetails[result.partner_id];
                    if (!partner) return null; // Wait for partner detail loading

                    const isBestMatch = index === 0 && result.met_criteria > 0;

                    return (
                        <div key={result.partner_id} className="relative">
                            {isBestMatch && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-[#FF9900] to-[#FF8000] text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                                    🌟 Melhor Afinidade
                                </div>
                            )}
                            <div className={`h-full transition-transform hover:-translate-y-1 ${isBestMatch ? 'ring-2 ring-[#FF9900] ring-offset-2 rounded-2xl' : ''}`}>
                                <PartnerCard
                                    partner={partner}
                                    matchScore={{ total: result.total_criteria, met: result.met_criteria }}
                                    onApply={(partnerId, partnerName) => {
                                        if (onTriggerChatMessage) {
                                            onTriggerChatMessage(`Quero me aplicar no programa ${partnerName}`);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
