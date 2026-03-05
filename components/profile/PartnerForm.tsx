'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Montserrat } from 'next/font/google';
import { Loader2, FileText, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Send, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateJsonLogic } from '@/utils/jsonLogic';
import { updateUserProfileService } from '@/services/supabase/profile';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ─── Types ───────────────────────────────────────────────────────────────────

interface PartnerStep {
    id: string;
    partner_id: string;
    step_name: string;
    sort_order: number;
    introduction?: string | null;
    secret_step?: boolean;
}

interface PartnerFormField {
    id: string;
    partner_id: string;
    step_id: string | null;
    field_name: string;
    question_text: string;
    data_type: string;
    options: string[] | null;
    mapping_source: string | null;
    is_criterion: boolean;
    criterion_rule: Record<string, unknown> | null;
    sort_order: number;
    optional: boolean;
}

interface StudentApplication {
    id: string;
    user_id: string;
    partner_id: string;
    status: string;
    answers: Record<string, string>;
}

interface EligibilityCriterion {
    field_name: string;
    question_text: string;
    met: boolean;
}

interface PartnerFormProps {
    applicationId?: string;
    onFormDirty?: (state: Record<string, string> | null) => void;
    onComplete?: () => void;
    onTriggerChatMessage?: (message: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PartnerForm({ applicationId, onFormDirty, onComplete, onTriggerChatMessage }: PartnerFormProps) {
    const { user } = useAuth();

    // Data state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [application, setApplication] = useState<StudentApplication | null>(null);
    const [steps, setSteps] = useState<PartnerStep[]>([]);
    const [fields, setFields] = useState<PartnerFormField[]>([]);
    const [partnerName, setPartnerName] = useState('');

    // Form state
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Review state (after last step)
    const [showReview, setShowReview] = useState(false);
    const [eligibilityResults, setEligibilityResults] = useState<EligibilityCriterion[]>([]);

    // ─── Data Fetch ──────────────────────────────────────────────────────────

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Get the student_application (specific or most recent)
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
                        .eq('user_id', user.id)
                        .order('created_at', { ascending: false })
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

                // 2. Fetch partner name
                const { data: partnerData } = await supabase
                    .from('partners')
                    .select('name')
                    .eq('id', partnerId)
                    .single();

                if (partnerData) setPartnerName(partnerData.name);

                // 3. Fetch steps
                const { data: stepsData } = await supabase
                    .from('partner_steps')
                    .select('*')
                    .eq('partner_id', partnerId)
                    .order('sort_order', { ascending: true });

                const sortedSteps = stepsData || [];
                setSteps(sortedSteps);

                // 4. Fetch form fields
                const { data: fieldsData } = await supabase
                    .from('partner_forms')
                    .select('*')
                    .eq('partner_id', partnerId)
                    .order('sort_order', { ascending: true });

                setFields(fieldsData || []);

                // 5. Pre-fill answers from application AND user profile mapping
                const existingAnswers: Record<string, string> = { ...(appData.answers || {}) };

                // Fetch user profile for mapping_source pre-fill
                const { data: parentProfile } = await supabase
                    .from('user_profiles')
                    .select('active_application_target_id')
                    .eq('id', user.id)
                    .single();

                const targetId = parentProfile?.active_application_target_id || user.id;

                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', targetId)
                    .single();

                if (profileData && fieldsData) {
                    for (const field of fieldsData) {
                        // If no answer yet, try pre-filling from mapping_source
                        if (!existingAnswers[field.field_name] && field.mapping_source) {
                            const parts = field.mapping_source.split('.');
                            if (parts.length === 2 && parts[0] === 'user_profiles') {
                                const val = profileData[parts[1]];
                                if (val !== null && val !== undefined && val !== '') {
                                    existingAnswers[field.field_name] = String(val);
                                }
                            }
                        }
                    }
                }

                setAnswers(existingAnswers);
                setLoading(false);
            } catch (e) {
                console.error('[PartnerForm] Error loading data:', e);
                setError('Erro ao carregar formulário.');
                setLoading(false);
            }
        };

        fetchData();
    }, [user, applicationId]);

    // Notify parent of form dirtiness
    useEffect(() => {
        if (onFormDirty) {
            onFormDirty(Object.keys(answers).length > 0 ? answers : null);
        }
    }, [answers]);

    // ─── Derived Data ────────────────────────────────────────────────────────

    const visibleSteps = useMemo(() => steps.filter(s => !s.secret_step), [steps]);
    const currentStep = visibleSteps[currentStepIndex] || null;

    const currentFields = useMemo(() => {
        if (!currentStep) {
            // If no visible steps, show all fields that are not in a step (orphans) or all if none
            return fields.filter(f => !f.step_id || !steps.find(s => s.id === f.step_id));
        }
        return fields.filter(f => f.step_id === currentStep.id);
    }, [fields, currentStep, steps]);

    const isLastStep = currentStepIndex >= visibleSteps.length - 1;

    // ─── Validation ──────────────────────────────────────────────────────────

    const validateCurrentStep = useCallback((): boolean => {
        const errors = new Set<string>();

        for (const field of currentFields) {
            if (!field.optional) {
                const value = answers[field.field_name];
                if (!value || value.trim() === '') {
                    errors.add(field.field_name);
                }
            }
        }

        setValidationErrors(errors);
        return errors.size === 0;
    }, [currentFields, answers]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleAnswerChange = (fieldName: string, value: string) => {
        setAnswers(prev => ({ ...prev, [fieldName]: value }));
        // Clear validation error for this field
        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
        });
    };

    const handleMultiSelectChange = (fieldName: string, option: string, checked: boolean) => {
        setAnswers(prev => {
            const current = prev[fieldName] ? prev[fieldName].split(',').map(s => s.trim()).filter(Boolean) : [];
            let next: string[];
            if (checked) {
                next = [...current, option];
            } else {
                next = current.filter(v => v !== option);
            }
            return { ...prev, [fieldName]: next.join(', ') };
        });
        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
        });
    };

    const saveAnswersToDb = async () => {
        if (!application) return;
        setSaving(true);
        try {
            await supabase
                .from('student_applications')
                .update({ answers, updated_at: new Date().toISOString() })
                .eq('id', application.id);
        } catch (e) {
            console.error('[PartnerForm] Error saving answers:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (!validateCurrentStep()) return;

        // Save progress
        await saveAnswersToDb();

        if (isLastStep) {
            // Calculate eligibility and show review
            computeEligibility();
            setShowReview(true);
        } else {
            setCurrentStepIndex(prev => prev + 1);
            setValidationErrors(new Set());
        }
    };

    const handlePrev = () => {
        if (showReview) {
            setShowReview(false);
            return;
        }
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            setValidationErrors(new Set());
        }
    };

    // ─── Eligibility Computation ─────────────────────────────────────────────

    const computeEligibility = () => {
        const criterionFields = fields.filter(f => f.is_criterion);
        const results: EligibilityCriterion[] = criterionFields.map(crit => {
            const userVal = answers[crit.field_name];
            let met = false;

            if (userVal !== null && userVal !== undefined && userVal !== '') {
                const rule = crit.criterion_rule;
                if (!rule) {
                    met = true;
                } else {
                    met = Boolean(evaluateJsonLogic(rule, { [crit.field_name]: userVal }));
                }
            }

            return {
                field_name: crit.field_name,
                question_text: crit.question_text,
                met,
            };
        });

        setEligibilityResults(results);
    };

    // ─── Submit ──────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!application || !user) return;
        setSubmitting(true);

        try {
            // 1. Save final answers and update status
            await supabase
                .from('student_applications')
                .update({
                    answers,
                    status: 'SUBMITTED',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', application.id);

            // 2. Update passport_phase to CONCLUDED
            await updateUserProfileService({ passport_phase: 'CONCLUDED' });

            // 3. Trigger chat message
            if (onTriggerChatMessage) {
                const metCount = eligibilityResults.filter(r => r.met).length;
                const totalCount = eligibilityResults.length;
                onTriggerChatMessage(
                    `Acabei de enviar minha candidatura para o programa ${partnerName}. ` +
                    `Atendi ${metCount} de ${totalCount} critérios de elegibilidade. ` +
                    `Por favor, confirme o recebimento e me diga os próximos passos.`
                );
            }

            // 4. Callback
            if (onComplete) onComplete();
        } catch (e) {
            console.error('[PartnerForm] Error submitting:', e);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Render Helpers ──────────────────────────────────────────────────────

    const renderField = (field: PartnerFormField) => {
        const value = answers[field.field_name] || '';
        const hasError = validationErrors.has(field.field_name);
        const baseInputClass = `w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/80 backdrop-blur-sm text-[#3A424E] text-sm outline-none
            ${hasError ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-[#38B1E4] focus:ring-2 focus:ring-[#38B1E4]/20'}`;

        return (
            <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
            >
                <label className="block text-sm font-semibold text-[#024F86]">
                    {field.question_text}
                    {!field.optional && <span className="text-red-400 ml-1">*</span>}
                </label>

                {field.data_type === 'text' && (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleAnswerChange(field.field_name, e.target.value)}
                        className={baseInputClass}
                        placeholder="Digite sua resposta..."
                    />
                )}

                {field.data_type === 'number' && (
                    <input
                        type="text"
                        inputMode="numeric"
                        value={value}
                        onChange={(e) => handleAnswerChange(field.field_name, e.target.value)}
                        className={baseInputClass}
                        placeholder="Digite um número..."
                    />
                )}

                {field.data_type === 'select' && (
                    <select
                        value={value}
                        onChange={(e) => handleAnswerChange(field.field_name, e.target.value)}
                        className={baseInputClass + ' appearance-none cursor-pointer'}
                    >
                        <option value="">Selecione uma opção...</option>
                        {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                )}

                {field.data_type === 'multiselect' && (
                    <div className="space-y-2">
                        {(field.options || []).map((opt, i) => {
                            const selected = value.split(',').map(s => s.trim()).includes(opt);
                            return (
                                <label
                                    key={i}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all duration-200
                                        ${selected
                                            ? 'border-[#38B1E4] bg-[#38B1E4]/5'
                                            : 'border-gray-200 bg-white/80 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={(e) => handleMultiSelectChange(field.field_name, opt, e.target.checked)}
                                        className="w-4 h-4 text-[#38B1E4] rounded border-gray-300 focus:ring-[#38B1E4]"
                                    />
                                    <span className="text-sm text-[#3A424E]">{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                )}

                {field.data_type === 'boolean' && (
                    <div className="flex gap-3">
                        {['Sim', 'Não'].map(opt => (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => handleAnswerChange(field.field_name, opt)}
                                className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                                    ${value === opt
                                        ? 'border-[#38B1E4] bg-[#38B1E4]/10 text-[#024F86]'
                                        : 'border-gray-200 bg-white/80 text-[#3A424E] hover:border-gray-300'
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {hasError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Este campo é obrigatório
                    </p>
                )}
            </motion.div>
        );
    };

    // ─── Loading / Error States ──────────────────────────────────────────────

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

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center px-4 ${montserrat.className}`}>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="text-red-500" size={32} />
                </div>
                <p className="text-[#3A424E] font-medium">{error}</p>
            </div>
        );
    }

    // ─── Review Screen ───────────────────────────────────────────────────────

    if (showReview) {
        const metCount = eligibilityResults.filter(r => r.met).length;
        const totalCount = eligibilityResults.length;

        return (
            <div className={`bg-transparent md:bg-white/30 backdrop-blur-md md:border border-white/20 md:shadow-lg md:rounded-2xl p-4 md:p-8 flex flex-col h-full ${montserrat.className}`}>
                {/* Header */}
                <div className="text-center mb-6">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-16 h-16 bg-[#024F86]/10 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <CheckCircle2 className="text-[#024F86]" size={32} />
                    </motion.div>
                    <h2 className="text-xl font-bold text-[#024F86]">Revisão da Candidatura</h2>
                    <p className="text-sm text-[#3A424E]/70 mt-1">
                        Confira seus critérios de elegibilidade para <strong>{partnerName}</strong>
                    </p>
                </div>

                {/* Eligibility Summary */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-6">
                    {totalCount > 0 && (
                        <div className={`p-4 rounded-2xl border-2 text-center mb-4 ${metCount === totalCount
                            ? 'border-green-300 bg-green-50'
                            : metCount > 0
                                ? 'border-amber-300 bg-amber-50'
                                : 'border-red-300 bg-red-50'
                            }`}>
                            <p className="text-lg font-bold text-[#024F86]">
                                {metCount}/{totalCount} critérios atendidos
                            </p>
                        </div>
                    )}

                    {eligibilityResults.map((result, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 ${result.met
                                ? 'border-green-200 bg-green-50/50'
                                : 'border-red-200 bg-red-50/50'
                                }`}
                        >
                            {result.met ? (
                                <CheckCircle2 className="text-green-500 shrink-0" size={20} />
                            ) : (
                                <XCircle className="text-red-400 shrink-0" size={20} />
                            )}
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-[#3A424E] truncate">{result.field_name}</p>
                                <p className="text-xs text-[#3A424E]/60 truncate">{result.question_text}</p>
                            </div>
                        </motion.div>
                    ))}

                    {totalCount === 0 && (
                        <div className="text-center py-8 text-[#3A424E]/60 text-sm">
                            Este programa não possui critérios de elegibilidade configurados.
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                        onClick={handlePrev}
                        className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-gray-200 text-[#3A424E] text-sm font-medium hover:bg-gray-50 transition-all"
                    >
                        <ChevronLeft size={16} />
                        Voltar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#024F86] to-[#38B1E4] text-white text-sm font-bold shadow-lg shadow-[#024F86]/20 hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <Send size={16} />
                                Enviar Candidatura
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Form Screen ─────────────────────────────────────────────────────────

    const totalSteps = visibleSteps.length;
    const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 100;

    return (
        <div className={`bg-transparent md:bg-white/30 backdrop-blur-md md:border border-white/20 md:shadow-lg md:rounded-2xl p-4 md:p-8 flex flex-col h-full ${montserrat.className}`}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#024F86]/10 rounded-full flex items-center justify-center shrink-0">
                        <FileText className="text-[#024F86]" size={20} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-lg font-bold text-[#024F86] truncate">{partnerName}</h2>
                        {currentStep && (
                            <p className="text-xs text-[#3A424E]/60">
                                Etapa {currentStepIndex + 1} de {totalSteps}: <span className="font-semibold">{currentStep.step_name}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Progress bar */}
                {totalSteps > 1 && (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#024F86] to-[#38B1E4] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                )}
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto space-y-5 mb-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep?.id || 'all'}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-5"
                    >
                        {currentStep?.introduction && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 rounded-xl bg-[#024F86]/5 border border-[#024F86]/10 text-sm text-[#024F86] mb-2"
                            >
                                {currentStep.introduction}
                            </motion.div>
                        )}

                        {currentFields.length === 0 ? (
                            <div className="text-center py-8 text-[#3A424E]/60 text-sm">
                                Nenhum campo nesta etapa.
                            </div>
                        ) : (
                            currentFields.map(field => renderField(field))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                {currentStepIndex > 0 && (
                    <button
                        onClick={handlePrev}
                        className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-gray-200 text-[#3A424E] text-sm font-medium hover:bg-gray-50 transition-all"
                    >
                        <ChevronLeft size={16} />
                        Voltar
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#38B1E4] to-[#2a9ac9] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : isLastStep ? (
                        <>
                            Revisar e Enviar
                            <ChevronRight size={16} />
                        </>
                    ) : (
                        <>
                            Próximo
                            <ChevronRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </div >
    );
}
