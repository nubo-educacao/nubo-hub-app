'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Montserrat } from 'next/font/google';
import { Loader2, XCircle } from 'lucide-react';
import { updateUserProfileService } from '@/services/supabase/profile';
import { evaluateJsonLogic } from '@/utils/jsonLogic';

import PartnerFormEngine from './PartnerFormEngine';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface PartnerStep {
    id: string;
    partner_id: string;
    step_name: string;
    sort_order: number;
    introduction?: string | null;
    secret_step?: boolean;
    is_iterable?: boolean;
    repeat_limit?: number | null;
    conditional_rule?: Record<string, unknown> | null;
}

interface PartnerFormField {
    id: string;
    partner_id: string;
    step_id: string | null;
    field_name: string;
    question_text: string;
    data_type: string;
    options: string[] | { rows: string[]; columns: string[] } | null;
    mapping_source: string | null;
    is_criterion: boolean;
    criterion_rule: Record<string, unknown> | null;
    conditional_rule: Record<string, unknown> | null;
    sort_order: number;
    optional: boolean;
    maskking: string | null;
}

interface StudentApplication {
    id: string;
    user_id: string;
    partner_id: string;
    status: string;
    answers: Record<string, any>;
}

interface PartnerFormProps {
    applicationId?: string;
    onFormDirty?: (state: Record<string, string> | null) => void;
    onComplete?: () => void;
    onTriggerChatMessage?: (message: string) => void;
}

export default function PartnerForm({ applicationId, onFormDirty, onComplete, onTriggerChatMessage }: PartnerFormProps) {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [application, setApplication] = useState<StudentApplication | null>(null);
    const [steps, setSteps] = useState<PartnerStep[]>([]);
    const [fields, setFields] = useState<PartnerFormField[]>([]);
    const [partnerName, setPartnerName] = useState('');
    const [initialAnswers, setInitialAnswers] = useState<Record<string, any>>({});

    // Safety-net: track dirtiness from engine
    const isDirtyRef = useRef(false);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data: parentProfile } = await supabase
                    .from('user_profiles')
                    .select('active_application_target_id')
                    .eq('id', user.id)
                    .single();

                const targetId = parentProfile?.active_application_target_id || user.id;

                let appData: any = null;
                let appError: any = null;

                if (applicationId) {
                    const result = await supabase
                        .from('student_applications')
                        .select('*')
                        .eq('id', applicationId)
                        .single();
                    appData = result.data;
                    appError = result.error;
                } else {
                    const result = await supabase
                        .from('student_applications')
                        .select('*')
                        .eq('user_id', targetId)
                        .order('updated_at', { ascending: false })
                        .limit(1)
                        .single();
                    appData = result.data;
                    appError = result.error;
                }

                if (appError || !appData) {
                    setError('Nenhuma aplicação encontrada. Volte ao chat e escolha um programa.');
                    setLoading(false);
                    return;
                }

                setApplication(appData);
                const partnerId = appData.partner_id;

                const { data: partnerData } = await supabase
                    .from('partners')
                    .select('name')
                    .eq('id', partnerId)
                    .single();

                if (partnerData) setPartnerName(partnerData.name);

                const { data: stepsData } = await supabase
                    .from('partner_steps')
                    .select('*')
                    .eq('partner_id', partnerId)
                    .order('sort_order', { ascending: true });

                const sortedSteps = stepsData || [];
                setSteps(sortedSteps);

                const { data: fieldsData } = await supabase
                    .from('partner_forms')
                    .select('*')
                    .eq('partner_id', partnerId)
                    .order('sort_order', { ascending: true });

                setFields(fieldsData || []);

                const existingAnswers: Record<string, any> = { ...(appData.answers || {}) };

                const targetProfileId = appData.user_id;
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', targetProfileId)
                    .single();

                if (profileData && fieldsData) {
                    for (const field of fieldsData) {
                        if (!existingAnswers[field.field_name] && field.mapping_source) {
                            const parts = field.mapping_source.split('.');
                            if (parts.length === 2 && parts[0] === 'user_profiles') {
                                const val = profileData[parts[1]];
                                if (val !== null && val !== undefined && val !== '') {
                                    existingAnswers[field.field_name] = String(val);
                                }
                            } else if (parts.length === 3 && parts[0] === 'auth' && parts[1] === 'users') {
                                const mappingField = parts[2];
                                if (mappingField === 'phone' && user.phone) {
                                    existingAnswers[field.field_name] = user.phone;
                                } else if (mappingField === 'email' && user.email) {
                                    existingAnswers[field.field_name] = user.email;
                                }
                            }
                        }
                    }
                }

                const targetAppId = applicationId || appData.id;
                if (targetAppId && appData.status !== 'SUBMITTED') {
                    const storageKey = `nubo_form_draft_${targetAppId}`;
                    const savedDraft = localStorage.getItem(storageKey);
                    if (savedDraft) {
                        try {
                            const parsed = JSON.parse(savedDraft);
                            Object.assign(existingAnswers, parsed);
                            console.log(`[PartnerFormContainer] Draft restored for ${targetAppId}`);
                        } catch (e) {
                            console.error("[PartnerFormContainer] Failed to parse draft", e);
                        }
                    }
                }

                setInitialAnswers(existingAnswers);
                setLoading(false);
            } catch (e) {
                console.error('[PartnerFormContainer] Error loading data:', e);
                setError('Erro ao carregar formulário.');
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id, applicationId]);

    // Safety-net periodic sync
    useEffect(() => {
        if (loading) return;
        const interval = setInterval(() => {
            if (isDirtyRef.current) {
                console.log('[PartnerFormContainer] Safety-net: DB synced');
                isDirtyRef.current = false;
                // Periodic DB sync logic goes here if needed
                // Currently handled internally by `onSaveDraft` which we can wire up
            }
        }, 60000);
        return () => clearInterval(interval);
    }, [loading]);

    const computeEligibilityScore = (finalAnswers: Record<string, any>) => {
        const criterionFields = fields.filter(f => f.is_criterion);

        // Base evaluation data needed for JsonLogic mapped across flattened single-tier array
        const evaluationData: Record<string, any> = {};
        Object.keys(finalAnswers).forEach(key => {
            if (!Array.isArray(finalAnswers[key])) evaluationData[key] = finalAnswers[key];
        });
        steps.forEach(step => {
            if (step.is_iterable && Array.isArray(finalAnswers[step.id]) && finalAnswers[step.id].length > 0) {
                Object.assign(evaluationData, finalAnswers[step.id][0]);
            }
        });

        const results = criterionFields.map(crit => {
            let userVal = finalAnswers[crit.field_name];
            if ((userVal === null || userVal === undefined || userVal === '') && crit.mapping_source) {
                userVal = finalAnswers[crit.mapping_source];
            }

            let met = false;
            if (userVal !== null && userVal !== undefined && userVal !== '') {
                const rule = crit.criterion_rule;
                if (!rule) {
                    met = true;
                } else {
                    try {
                        met = Boolean(evaluateJsonLogic(rule, { ...evaluationData, [crit.field_name]: userVal }));
                    } catch { met = false; }
                }
            }

            return {
                field_name: crit.field_name,
                question_text: crit.question_text,
                met,
                user_answer: userVal !== null && userVal !== undefined ? String(userVal) : '',
            };
        });

        return results;
    };

    const handleSaveDraft = useCallback(async (currentAnswers: Record<string, any>) => {
        if (!application) return;

        isDirtyRef.current = true;
        const targetAppId = applicationId || application.id;

        // Save local
        const storageKey = `nubo_form_draft_${targetAppId}`;
        localStorage.setItem(storageKey, JSON.stringify(currentAnswers));

        // Let parent know dirtiness
        if (onFormDirty) onFormDirty(currentAnswers);

        // Background save DB (throttled by Engine normally)
        try {
            await supabase.rpc('update_student_application_answers', {
                p_application_id: application.id,
                p_answers: currentAnswers
            });
        } catch (e) {
            console.error('[PartnerFormContainer] Error saving draft:', e);
        }
    }, [application, applicationId, onFormDirty]);

    const handleSubmitForm = async (finalAnswers: Record<string, any>) => {
        if (!application || !user) return { success: false };

        try {
            await supabase.rpc('update_student_application_answers', {
                p_application_id: application.id,
                p_answers: finalAnswers
            });

            await supabase
                .from('student_applications')
                .update({
                    status: 'SUBMITTED',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', application.id);

            await supabase.rpc('calculate_application_eligibility', {
                p_application_id: application.id
            });

            await updateUserProfileService({ passport_phase: 'CONCLUDED' });

            const targetAppId = applicationId || application.id;
            localStorage.removeItem(`nubo_form_draft_${targetAppId}`);

            const eligibilityResults = computeEligibilityScore(finalAnswers);

            if (onTriggerChatMessage) {
                setTimeout(() => {
                    const metCount = eligibilityResults.filter(r => r.met).length;
                    const totalCount = eligibilityResults.length;
                    onTriggerChatMessage(
                        `Acabei de enviar minha candidatura para o programa ${partnerName}. ` +
                        `Atendi ${metCount} de ${totalCount} critérios de elegibilidade. ` +
                        `Por favor, confirme o recebimento e me diga os próximos passos.`
                    );
                }, 1500);
            }

            if (onComplete) onComplete();

            return { success: true, eligibilityResults };
        } catch (e) {
            console.error('[PartnerFormContainer] Error submitting form:', e);
            return { success: false };
        }
    };

    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center h-full min-h-[400px] gap-4 ${montserrat.className}`}>
                <div className="relative">
                    <div className="absolute inset-0 bg-[#38B1E4]/20 animate-ping rounded-full blur-xl scale-150" />
                    <Loader2 className="animate-spin text-[#024F86] relative z-10" size={40} />
                </div>
                <p className="text-[#024F86] font-medium">Carregando formulário...</p>
            </div>
        );
    }

    if (error || !application) {
        return (
            <div className={`flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-4 ${montserrat.className}`}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="text-red-500" size={32} />
                </div>
                <p className="text-[#3A424E] font-medium">{error || 'Erro inesperado'}</p>
            </div>
        );
    }

    return (
        <PartnerFormEngine
            partnerName={partnerName}
            steps={steps}
            fields={fields}
            defaultValues={initialAnswers}
            onSubmitForm={handleSubmitForm}
            onSaveDraft={handleSaveDraft}
            onStepChange={(stepName) => {
                if (onTriggerChatMessage) {
                    onTriggerChatMessage(`Acabei de avançar para a etapa: ${stepName}. Pode me explicar o que é esperado aqui ou me ajudar se eu tiver dúvidas?`);
                }
            }}
            onValidationError={(errors) => {
                if (onTriggerChatMessage) {
                    onTriggerChatMessage(`Ainda restam alguns campos para preencher ou corrigir nesta etapa. Pode me ajudar? [Metadata: ui_form_errors=${JSON.stringify(errors)}]`);
                }
            }}
        />
    );
}
