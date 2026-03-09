'use client';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Montserrat } from 'next/font/google';
import { Loader2, FileText, ChevronRight, ChevronLeft, CheckCircle2, XCircle, Send, AlertCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateJsonLogic } from '@/utils/jsonLogic';
import { updateUserProfileService } from '@/services/supabase/profile';
import { applyMask, validateMask, getPlaceholder, getMaxLength, getComponentType } from '@/utils/maskUtils';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// ─── Types ───────────────────────────────────────────────────────────────────

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
    options: string[] | null;
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
    answers: Record<string, string>;
}

interface EligibilityCriterion {
    field_name: string;
    question_text: string;
    met: boolean;
    user_answer: string;
}

interface PartnerFormProps {
    applicationId?: string;
    onFormDirty?: (state: Record<string, string> | null) => void;
    onComplete?: () => void;
    onTriggerChatMessage?: (message: string) => void;
}

// ─── Memoized Field Component ────────────────────────────────────────────────

interface FormFieldProps {
    field: PartnerFormField;
    value: string;
    hasError: boolean;
    onAnswerChange: (fieldName: string, value: string, maskType?: string | null) => void;
    onMultiSelectChange: (fieldName: string, option: string, checked: boolean) => void;
}

const FormField = React.memo(function FormField({ field, value, hasError, onAnswerChange, onMultiSelectChange }: FormFieldProps) {
    const stringValue = value !== undefined && value !== null ? String(value) : '';
    const componentType = getComponentType(field.maskking, field.data_type);

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

            {field.data_type === 'boolean' || field.data_type === 'multiselect' ? null : componentType === 'date' ? (
                <input
                    type="date"
                    value={stringValue}
                    onChange={(e) => onAnswerChange(field.field_name, e.target.value)}
                    className={baseInputClass}
                />
            ) : componentType === 'textarea' ? (
                <div className="relative">
                    <textarea
                        value={stringValue}
                        onChange={(e) => onAnswerChange(field.field_name, e.target.value.slice(0, 500), field.maskking)}
                        className={baseInputClass + ' min-h-[120px] resize-none'}
                        placeholder={getPlaceholder(field.maskking, field.data_type)}
                        maxLength={500}
                    />
                    <div className={`absolute bottom-2 right-3 text-[10px] font-medium ${stringValue.length >= 500 ? 'text-red-500' : 'text-[#3A424E]/40'}`}>
                        {stringValue.length}/500
                    </div>
                </div>
            ) : componentType === 'select' ? (
                <select
                    value={stringValue}
                    onChange={(e) => onAnswerChange(field.field_name, e.target.value)}
                    className={baseInputClass + ' appearance-none cursor-pointer'}
                >
                    <option value="">Selecione uma opção...</option>
                    {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={(field.maskking?.toLowerCase() || '') === 'email' ? 'email' : (field.maskking?.toLowerCase() || '') === 'link' ? 'url' : (field.maskking?.toLowerCase() || '') === 'phone' ? 'tel' : 'text'}
                    inputMode={(field.maskking?.toLowerCase() || '') === 'phone' || (field.maskking?.toLowerCase() || '') === 'cpf' || (field.maskking?.toLowerCase() || '') === 'cnpj' || (field.maskking?.toLowerCase() || '') === 'cep' ? 'numeric' : undefined}
                    value={stringValue}
                    onChange={(e) => onAnswerChange(field.field_name, e.target.value, field.maskking)}
                    className={baseInputClass}
                    placeholder={getPlaceholder(field.maskking, field.data_type)}
                    maxLength={getMaxLength(field.maskking)}
                />
            )}

            {field.data_type === 'multiselect' && (
                <div className="space-y-2">
                    {(field.options || []).map((opt, i) => {
                        const currentArray = Array.isArray(value) 
                            ? value 
                            : (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
                        const selected = currentArray.includes(opt);
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
                                    onChange={(e) => onMultiSelectChange(field.field_name, opt, e.target.checked)}
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
                            onClick={() => onAnswerChange(field.field_name, opt)}
                            className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                                ${stringValue === opt
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
});

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
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentIteration, setCurrentIteration] = useState(0);
    const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Review state (after last step)
    const [showReview, setShowReview] = useState(false);
    const [eligibilityResults, setEligibilityResults] = useState<EligibilityCriterion[]>([]);

    // Ref to avoid re-registering event listeners on every answers change
    const answersRef = useRef(answers);
    useEffect(() => { answersRef.current = answers; }, [answers]);

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
                            } else if (parts.length === 3 && parts[0] === 'auth' && parts[1] === 'users') {
                                // Resolving from session user data
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

                setAnswers(existingAnswers);
                
                // 5.5 If already submitted, go to review screen
                if (appData.status === 'SUBMITTED') {
                    // We need to compute eligibility before showing review
                    // But fields might not be in state yet, so we pass them directly if needed
                    // For now, since useEffects will trigger, we can just set the flag 
                    // and ensure computeEligibility uses the data we just fetched.
                    setShowReview(true);
                }

                // 6. Hardened Re-hydration: Local storage takes precedence if it has more data
                if (applicationId) {
                    const storageKey = `nubo_form_draft_${applicationId}`;
                    const savedDraft = localStorage.getItem(storageKey);
                    if (savedDraft) {
                        try {
                            const parsed = JSON.parse(savedDraft);
                            const draftCount = Object.keys(parsed).length;
                            const dbCount = Object.keys(existingAnswers).length;
                            
                            // Only override if draft is potentially newer/more complete
                            if (draftCount >= dbCount) {
                                setAnswers(prev => ({ ...prev, ...parsed }));
                                console.log(`[PartnerForm] Draft restored (Precedence) for ${applicationId}`);
                            }
                        } catch (e) {
                            console.error("[PartnerForm] Failed to parse draft", e);
                        }
                    }
                }

                if (appData.status === 'SUBMITTED') {
                    computeEligibility(existingAnswers, fieldsData || []);
                    setShowReview(true);
                }

                setLoading(false);
            } catch (e) {
                console.error('[PartnerForm] Error loading data:', e);
                setError('Erro ao carregar formulário.');
                setLoading(false);
            }
        };

        fetchData();
    }, [user, applicationId]);

    // ─── Persistence (debounced) ──────────────────────────────────────────

    // Debounced persistence: localStorage + DB save in a single timer
    useEffect(() => {
        if (Object.keys(answers).length === 0 || loading || submitting) return;

        const timer = setTimeout(() => {
            // Persist to localStorage
            if (applicationId) {
                const storageKey = `nubo_form_draft_${applicationId}`;
                localStorage.setItem(storageKey, JSON.stringify(answers));
            }
            // Persist to DB
            saveAnswersToDb();
        }, 1500);

        return () => clearTimeout(timer);
    }, [answers]);

    // Immediate save on visibility change (tab switch) — uses ref to avoid re-registering
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && Object.keys(answersRef.current).length > 0) {
                console.log("[PartnerForm] Tab hidden - triggering immediate save");
                // Also persist to localStorage immediately
                if (applicationId) {
                    const storageKey = `nubo_form_draft_${applicationId}`;
                    localStorage.setItem(storageKey, JSON.stringify(answersRef.current));
                }
                saveAnswersToDb();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [application, submitting]);

    // Handle beforeunload to warn user if saving is pending
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (saving) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [saving]);

    // Notify parent of form dirtiness (debounced to avoid cascading re-renders)
    useEffect(() => {
        if (!onFormDirty) return;
        const timer = setTimeout(() => {
            onFormDirty(Object.keys(answers).length > 0 ? answers : null);
        }, 300);
        return () => clearTimeout(timer);
    }, [answers]);

    // Scroll to top on step transitions or iteration changes
    useEffect(() => {
        if (!loading) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentStepIndex, currentIteration, showReview, loading]);

    // ─── Derived Data ────────────────────────────────────────────────────────
    
    // Flattens answers for JSON Logic evaluation
    const evaluationData = useMemo(() => {
        const flat: Record<string, any> = {};
        
        // Add non-iterable answers
        Object.keys(answers).forEach(key => {
            if (!Array.isArray(answers[key])) {
                flat[key] = answers[key];
            }
        });

        // For iterable steps, use first iteration as fallback for global visibility
        // and current iteration for step-internal field visibility
        steps.forEach(step => {
            if (step.is_iterable && Array.isArray(answers[step.id])) {
                const iterations = answers[step.id];
                if (iterations.length > 0) {
                    // Default to first iteration for cross-step dependencies
                    Object.assign(flat, iterations[0]);
                }
            }
        });

        // Add current global iteration context (default to 0)
        flat['_iteration_index'] = 0;
        flat['is_first_iteration'] = true;

        return flat;
    }, [answers, steps]);

    // Current iteration data (overrides global for field-level visibility)
    const visibleSteps = useMemo(() => {
        return steps.filter(s => {
            if (s.secret_step) return false;
            // Evaluates conditional visibility
            if (s.conditional_rule) {
                try {
                    return evaluateJsonLogic(s.conditional_rule, evaluationData);
                } catch (e) {
                    console.error("Error evaluating step condition:", e);
                    return true;
                }
            }
            return true;
        });
    }, [steps, evaluationData]);

    const currentStep = visibleSteps[currentStepIndex] || null;

    // Current iteration data (overrides global for field-level visibility)
    const currentIterationData = useMemo(() => {
        if (!currentStep?.is_iterable) return evaluationData;
        const iterations = answers[currentStep.id] || [];
        return { 
            ...evaluationData, 
            ...(iterations[currentIteration] || {}),
            _iteration_index: currentIteration,
            is_first_iteration: currentIteration === 0
        };
    }, [evaluationData, currentStep, currentIteration, answers]);

    const currentFields = useMemo(() => {
        let baseFields = [];
        if (!currentStep) {
            baseFields = fields.filter(f => !f.step_id || !steps.find(s => s.id === f.step_id));
        } else {
            baseFields = fields.filter(f => f.step_id === currentStep.id);
        }

        return baseFields.filter(f => {
            if (f.conditional_rule) {
                try {
                    return evaluateJsonLogic(f.conditional_rule, currentIterationData);
                } catch (e) {
                    console.error("Error evaluating field condition:", e);
                    return true;
                }
            }
            return true;
        });
    }, [fields, currentStep, steps, currentIterationData]);

    const isLastStep = currentStepIndex >= visibleSteps.length - 1;

    // ─── Validation ──────────────────────────────────────────────────────────

    const validateCurrentStep = useCallback((): boolean => {
        const errors = new Set<string>();

        for (const field of currentFields) {
            let value = '';
            if (currentStep?.is_iterable) {
                const iterations = answers[currentStep.id] || [];
                value = iterations[currentIteration]?.[field.field_name] || '';
            } else {
                value = answers[field.field_name] || '';
            }

            // Required check
            if (!field.optional && (value === undefined || value === null || String(value).trim() === '')) {
                errors.add(field.field_name);
                continue;
            }

            // Mask validation
            const stringValue = String(value);
            if (field.maskking && stringValue.trim() !== '') {
                const { isValid, error: maskError } = validateMask(stringValue, field.maskking);
                if (!isValid) {
                    errors.add(field.field_name);
                    if (onTriggerChatMessage && errors.size === 1) {
                        onTriggerChatMessage(`O campo "${field.question_text}" está inválido: ${maskError}. Pode me ajudar a corrigir?`);
                    }
                }
            }
        }

        setValidationErrors(errors);
        return errors.size === 0;
    }, [currentFields, answers, currentIteration, currentStep]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleAnswerChange = useCallback((fieldName: string, value: any, maskType?: string | null) => {
        // If it's a numeric mask type and not BRL (which handles commas/dots), strip all non-digits immediately
        let processedValue = value;
        const type = maskType?.toLowerCase();
        
        if (type && ['cpf', 'cnpj', 'phone', 'cep', 'date', 'number'].includes(type) && typeof value === 'string') {
            processedValue = value.replace(/\D/g, '');
        }

        const maskedValue = maskType && typeof processedValue === 'string' ? applyMask(processedValue, maskType) : processedValue;

        // Final safety: Enforce maxLength here too
        const maxLength = getMaxLength(maskType || null);
        const finalValue = (maxLength && typeof maskedValue === 'string') ? maskedValue.slice(0, maxLength) : maskedValue;

        setAnswers(prev => {
            if (currentStep?.is_iterable) {
                const iterations = [...(prev[currentStep.id] || [])];
                if (!iterations[currentIteration]) iterations[currentIteration] = {};
                iterations[currentIteration] = { ...iterations[currentIteration], [fieldName]: finalValue };
                return { ...prev, [currentStep.id]: iterations };
            }
            return { ...prev, [fieldName]: finalValue };
        });

        // Clear validation error for this field
        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
        });
    }, [currentStep, currentIteration]);

    const handleMultiSelectChange = useCallback((fieldName: string, option: string, checked: boolean) => {
        setAnswers(prev => {
            let currentVal = '';
            if (currentStep?.is_iterable) {
                const iterations = prev[currentStep.id] || [];
                currentVal = iterations[currentIteration]?.[fieldName] || '';
            } else {
                currentVal = prev[fieldName] || '';
            }

            const current = Array.isArray(currentVal) 
                ? currentVal 
                : (currentVal ? String(currentVal).split(',').map(s => s.trim()).filter(Boolean) : []);
            const nextArray = checked 
                ? [...new Set([...current, option])] 
                : current.filter(v => v !== option);
            const finalValue = nextArray; // Store as actual array since column is JSONB

            if (currentStep?.is_iterable) {
                const iterations = [...(prev[currentStep.id] || [])];
                if (!iterations[currentIteration]) iterations[currentIteration] = {};
                iterations[currentIteration] = { ...iterations[currentIteration], [fieldName]: finalValue };
                return { ...prev, [currentStep.id]: iterations };
            }
            return { ...prev, [fieldName]: finalValue };
        });

        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
        });
    }, [currentStep, currentIteration]);

    const saveAnswersToDb = async () => {
        if (!application || submitting) return;
        setSaving(true);
        try {
            await supabase
                .from('student_applications')
                .update({ answers, updated_at: new Date().toISOString() })
                .eq('id', application.id);
            setLastSaved(new Date());
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
            computeEligibility();
            setShowReview(true);
        } else {
            setCurrentStepIndex(prev => prev + 1);
            setCurrentIteration(0);
            setValidationErrors(new Set());
        }
    };

    const handleAddIteration = async () => {
        if (!validateCurrentStep()) return;
        
        // Save progress before adding iteration
        await saveAnswersToDb();
        
        setCurrentIteration(prev => prev + 1);
        setValidationErrors(new Set());
    };

    const handlePrev = () => {
        if (showReview) {
            setShowReview(false);
            return;
        }

        if (currentIteration > 0) {
            setCurrentIteration(prev => prev - 1);
            setValidationErrors(new Set());
            return;
        }

        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
            // If going back to a previous step, we go to its LAST iteration
            const prevStep = visibleSteps[currentStepIndex - 1];
            if (prevStep?.is_iterable) {
                const iterations = answers[prevStep.id] || [];
                setCurrentIteration(Math.max(0, iterations.length - 1));
            } else {
                setCurrentIteration(0);
            }
            setValidationErrors(new Set());
        }
    };

    // ─── Eligibility Computation ─────────────────────────────────────────────

    const computeEligibility = (providedAnswers?: Record<string, any>, providedFields?: PartnerFormField[]) => {
        const targetFields = providedFields || fields;
        const targetAnswers = providedAnswers || answers;
        
        const criterionFields = targetFields.filter(f => f.is_criterion);
        const results: EligibilityCriterion[] = criterionFields.map(crit => {
            // Try form answers from student_application.answers (which is targetAnswers)
            // Priority 1: field_name slug (used by frontend form)
            // Priority 2: mapping_source string (used by backend agent pre-fill)
            let userVal = targetAnswers[crit.field_name];
            if ((userVal === null || userVal === undefined || userVal === '') && crit.mapping_source) {
                userVal = targetAnswers[crit.mapping_source];
            }

            let met = false;

            if (userVal !== null && userVal !== undefined && userVal !== '') {
                const rule = crit.criterion_rule;
                if (!rule) {
                    // Similar to the matching phase RPC: if value exists and no rule, consider met
                    met = true;
                } else {
                    // Evaluate rule against the value. 
                    // Providing a context where 'var' can match either the field name or be inside the evaluationData
                    met = Boolean(evaluateJsonLogic(rule, { ...evaluationData, [crit.field_name]: userVal }));
                }
            }

            return {
                field_name: crit.field_name,
                question_text: crit.question_text,
                met,
                user_answer: userVal !== null && userVal !== undefined ? String(userVal) : '',
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

            // 4. Clear local storage
            if (applicationId) {
                localStorage.removeItem(`nubo_form_draft_${applicationId}`);
            }

            // 5. Callback
            if (onComplete) onComplete();
        } catch (e) {
            console.error('[PartnerForm] Error submitting:', e);
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Render Helper ───────────────────────────────────────────────────────

    const getFieldValue = useCallback((fieldName: string): string => {
        if (currentStep?.is_iterable) {
            const iterations = answers[currentStep.id] || [];
            return iterations[currentIteration]?.[fieldName] || '';
        }
        return answers[fieldName] || '';
    }, [answers, currentStep, currentIteration]);

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
                                <p className="text-sm font-medium text-[#3A424E] truncate">{result.question_text}</p>
                                <p className="text-xs text-[#3A424E]/60 truncate">{result.user_answer || '—'}</p>
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
                                {currentStep.is_iterable && (
                                    <span className="ml-2 px-2 py-0.5 bg-[#024F86]/10 rounded-full text-[10px] font-bold">
                                        Entrada #{currentIteration + 1}
                                    </span>
                                )}
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

                {/* Auto-save status */}
                <div className="flex items-center justify-end mt-2 h-4">
                    <AnimatePresence mode="wait">
                        {saving ? (
                            <motion.div
                                key="saving"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-[10px] text-[#024F86]/40"
                            >
                                <Loader2 size={10} className="animate-spin" />
                                Salvando alterações...
                            </motion.div>
                        ) : lastSaved ? (
                            <motion.div
                                key="saved"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-1.5 text-[10px] text-green-500/60"
                            >
                                <CheckCircle2 size={10} />
                                Tudo salvo no banco
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
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
                            currentFields.map(field => (
                                <FormField
                                    key={field.id}
                                    field={field}
                                    value={getFieldValue(field.field_name)}
                                    hasError={validationErrors.has(field.field_name)}
                                    onAnswerChange={handleAnswerChange}
                                    onMultiSelectChange={handleMultiSelectChange}
                                />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
                <div className="flex gap-3 flex-1">
                    {(currentStepIndex > 0 || currentIteration > 0) && (
                        <button
                            onClick={handlePrev}
                            className="flex items-center justify-center gap-2 px-5 py-3 rounded-full border-2 border-gray-200 text-[#3A424E] text-sm font-medium hover:bg-gray-50 transition-all flex-1 sm:flex-none"
                        >
                            <ChevronLeft size={16} />
                            Voltar
                        </button>
                    )}
                    
                    {currentStep?.is_iterable && (!currentStep.repeat_limit || currentIteration + 1 < currentStep.repeat_limit) && (
                        <button
                            onClick={handleAddIteration}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-full border-2 border-[#38B1E4] text-[#024F86] text-sm font-bold hover:bg-[#38B1E4]/5 transition-all"
                        >
                            <Plus size={16} className="text-[#38B1E4]" />
                            Responder mais 1 vez
                        </button>
                    )}
                </div>

                <button
                    onClick={handleNext}
                    disabled={saving}
                    className="flex-1 sm:flex-[1.5] flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#024F86] to-[#38B1E4] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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
                            {currentStep?.is_iterable ? 'Continuar para próxima etapa' : 'Próximo'}
                            <ChevronRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
