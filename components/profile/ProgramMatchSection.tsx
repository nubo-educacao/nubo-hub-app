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
                .select('active_application_target_id, eligibility_results, current_dependent_id')
                .eq('id', user.id)
                .single();

            let eligibility = parentProfile?.eligibility_results as EligibilityResult[] | null;
            const targetId = parentProfile?.active_application_target_id || user.id;

            // If eligibility is null or empty, compute it via RPC
            if (!eligibility || eligibility.length === 0) {
                const { data: rpcResults, error: rpcError } = await supabase.rpc('calculate_passport_eligibility', { p_user_id: user.id });
                
                if (rpcError) {
                    console.error('Error calculating eligibility via RPC:', rpcError);
                } else {
                    eligibility = rpcResults as EligibilityResult[];
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
            .channel(`public:user_profiles:${user.id}`)
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
                    
                    // If eligibility was cleared (null) or is empty, we should recalculate
                    if (newEligibility === null || (Array.isArray(newEligibility) && newEligibility.length === 0)) {
                        fetchResults();
                    } else {
                        setResults(newEligibility);
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
                {sortedResults
                    .filter(result => partnerDetails[result.partner_id]?.applications_open === true)
                    .map((result, index) => {
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
                                    onApply={async (partnerId, partnerName) => {
                                        if (onTriggerChatMessage) {
                                            if (!user) return; // TS null guard check

                                            // Get the latest target info to formulate the correct message
                                            const { data: profile } = await supabase
                                                .from('user_profiles')
                                                .select('active_application_target_id, current_dependent_id')
                                                .eq('id', user.id)
                                                .single();
                                            
                                            const targetId = profile?.active_application_target_id || user.id;
                                            const isDependent = targetId !== user.id && targetId === profile?.current_dependent_id;
                                            
                                            let message = `Quero me aplicar no programa ${partnerName}`;
                                            
                                            if (isDependent) {
                                                // Fetch dependent name for a better message
                                                const { data: dependent } = await supabase
                                                    .from('user_profiles')
                                                    .select('full_name')
                                                    .eq('id', targetId)
                                                    .single();
                                                    
                                                const depName = dependent?.full_name?.split(' ')[0] || 'meu dependente';
                                                message = `Quero inscrever ${depName} no programa ${partnerName}`;
                                            }
                                            
                                            // Append metadata so the agent can parse the exact ID
                                            message += `\n[Metadata: target_user_id=${targetId}]`;
                                            
                                            onTriggerChatMessage(message);
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
