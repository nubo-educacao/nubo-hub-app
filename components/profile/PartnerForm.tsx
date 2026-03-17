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
    onGridChange: (fieldName: string, rowIndex: number, columnValue: string, isMulti: boolean) => void;
}

const FormField = React.memo(function FormField({ field, value, hasError, onAnswerChange, onMultiSelectChange, onGridChange }: FormFieldProps) {
    // Determine the string representation from parent state
    const parentStringValue = value !== undefined && value !== null ? String(value) : '';
    // Use local state to handle immediate typing and avoid cursor jumping
    const [localValue, setLocalValue] = useState(parentStringValue);
    
    // Autocomplete state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync from parent if it changes (e.g. from pre-fill or iteration change)
    useEffect(() => {
        setLocalValue(parentStringValue);
    }, [parentStringValue]);

    // Handle clicks outside the dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const isTextArea = e.target.tagName.toLowerCase() === 'textarea';
        const rawVal = e.target.value;
        const newVal = isTextArea ? rawVal.slice(0, 500) : rawVal;
        
        // Update local UI immediately so cursor doesn't jump
        setLocalValue(newVal);
        // Dispatch to parent for data handling and masking
        onAnswerChange(field.field_name, newVal, field.maskking);
    };

    const componentType = getComponentType(field.maskking, field.data_type);
    const isButtonField = field.data_type === 'boolean' || field.data_type === 'multiselect' || field.data_type === 'grid_select' || field.data_type === 'grid_multiselect';

    const innerInputClass = `w-full outline-none bg-transparent text-[#3A424E] text-sm md:text-base
        py-1.5 md:py-4 px-1 md:px-4
        md:rounded-xl md:border-2 md:bg-white/60 md:backdrop-blur-sm md:transition-all md:duration-200
        ${hasError ? 'md:border-red-400 md:ring-2 md:ring-red-100' : 'md:border-gray-200 md:focus:border-[#38B1E4] md:focus:ring-2 md:focus:ring-[#38B1E4]/20'}`;

    return (
        <motion.fieldset
            key={field.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`relative min-w-0 transition-all duration-200 group
                ${isButtonField ? 'border-0 p-0 mt-0' : 'border-2 rounded-xl px-3 pb-1 pt-0 mt-3 bg-white/60 backdrop-blur-sm'}
                ${hasError ? (isButtonField ? '' : 'border-red-400 focus-within:ring-2 focus-within:ring-red-100') : (isButtonField ? '' : 'border-gray-200 focus-within:border-[#38B1E4] focus-within:ring-2 focus-within:ring-[#38B1E4]/20')}
                md:border-0 md:p-0 md:mt-0 md:bg-transparent md:backdrop-blur-none
                md:focus-within:ring-0 md:focus-within:border-transparent`}
        >
            <legend className={`
                px-1 text-[11px] md:text-sm font-bold transition-all duration-200
                ${hasError ? 'text-red-500' : 'text-[#024F86] group-focus-within:text-[#38B1E4] md:group-focus-within:text-[#024F86]'}
                ${isButtonField ? 'bg-transparent mb-1' : 'bg-[#fcfdfe]'} 
                max-w-full whitespace-normal leading-tight rounded-sm
                md:px-0 md:bg-transparent md:mb-2 md:block`}
            >
                {field.question_text}
                {!field.optional && <span className="text-red-400 ml-0.5">*</span>}
            </legend>

            <div className={isButtonField ? "pt-1" : "pt-1 md:pt-0"}>
                {field.data_type === 'boolean' || field.data_type === 'multiselect' || componentType === 'grid' ? null : componentType === 'date' ? (
                    <input
                        type="date"
                        value={localValue}
                        onChange={handleTextChange}
                        className={innerInputClass}
                    />
                ) : componentType === 'textarea' ? (
                    <div className="relative">
                        <textarea
                            value={localValue}
                            onChange={handleTextChange}
                            className={innerInputClass + ' min-h-[120px] resize-none'}
                            placeholder={getPlaceholder(field.maskking, field.data_type)}
                            maxLength={500}
                        />
                        <div className={`absolute bottom-2 right-3 text-[10px] font-medium ${localValue.length >= 500 ? 'text-red-500' : 'text-[#3A424E]/40'}`}>
                            {localValue.length}/500
                        </div>
                    </div>
                ) : componentType === 'select' ? (
                    <select
                        value={localValue}
                        onChange={handleTextChange}
                        className={innerInputClass + ' appearance-none cursor-pointer'}
                    >
                        <option value="">Selecione uma opção...</option>
                        {(Array.isArray(field.options) ? field.options : []).map((opt: string, i: number) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                ) : componentType === 'autocomplete' ? (
                    <div className="relative" ref={dropdownRef}>
                        <input
                            type="text"
                            value={localValue}
                            onChange={(e) => {
                                setLocalValue(e.target.value);
                                setIsDropdownOpen(true);
                                onAnswerChange(field.field_name, e.target.value, field.maskking);
                            }}
                            onClick={() => setIsDropdownOpen(true)}
                            className={innerInputClass}
                            placeholder={getPlaceholder(field.maskking, field.data_type)}
                        />
                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scaleY: 0.95 }}
                                    animate={{ opacity: 1, scaleY: 1 }}
                                    exit={{ opacity: 0, scaleY: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                                    style={{ transformOrigin: "top" }}
                                >
                                    {(() => {
                                        const filteredOptions = (Array.isArray(field.options) ? field.options : []).filter((opt: string) => 
                                            opt.toLowerCase().includes(localValue.toLowerCase())
                                        );
                                        
                                        if (filteredOptions.length === 0) {
                                            return <div className="p-4 text-sm text-gray-400 text-center">Nenhuma opção encontrada</div>;
                                        }

                                        return filteredOptions.map((opt: string, i: number) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setLocalValue(opt);
                                                    setIsDropdownOpen(false);
                                                    onAnswerChange(field.field_name, opt, field.maskking);
                                                }}
                                                className="px-4 py-3 md:py-4 text-sm md:text-base text-[#3A424E] hover:bg-[#38B1E4]/5 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                            >
                                                {opt}
                                            </div>
                                        ));
                                    })()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <input
                        type={(field.maskking?.toLowerCase() || '') === 'email' ? 'email' : (field.maskking?.toLowerCase() || '') === 'link' ? 'url' : (field.maskking?.toLowerCase() || '') === 'phone' ? 'tel' : 'text'}
                        inputMode={(field.maskking?.toLowerCase() || '') === 'phone' || (field.maskking?.toLowerCase() || '') === 'cpf' || (field.maskking?.toLowerCase() || '') === 'cnpj' || (field.maskking?.toLowerCase() || '') === 'cep' ? 'numeric' : undefined}
                        value={localValue}
                        onChange={handleTextChange}
                        className={innerInputClass}
                        placeholder={getPlaceholder(field.maskking, field.data_type)}
                        maxLength={getMaxLength(field.maskking)}
                    />
                )}

            {field.data_type === 'multiselect' && (
                <div className="grid grid-cols-1 gap-2 pt-2">
                    {(Array.isArray(field.options) ? field.options : []).map((opt: string, i: number) => {
                        const currentArray = Array.isArray(value) 
                            ? value 
                            : (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
                        const selected = currentArray.includes(opt);
                        return (
                            <label
                                key={i}
                                className={`flex items-center gap-3 px-4 py-2.5 md:py-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200
                                    ${selected
                                        ? 'border-[#38B1E4] bg-[#38B1E4]/5'
                                        : 'border-gray-200 bg-white/60 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) => onMultiSelectChange(field.field_name, opt, e.target.checked)}
                                    className="w-4 h-4 text-[#38B1E4] rounded border-gray-300 focus:ring-[#38B1E4]"
                                />
                                <span className="text-xs md:text-sm font-medium text-[#3A424E]">{opt}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {field.data_type === 'boolean' && (
                <div className="flex gap-2 pt-2">
                    {['Sim', 'Não'].map(opt => (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => onAnswerChange(field.field_name, opt)}
                            className={`flex-1 px-4 py-2.5 md:py-3.5 rounded-xl border-2 text-xs md:text-sm font-bold transition-all duration-200
                                ${localValue === opt
                                    ? 'border-[#38B1E4] bg-[#38B1E4]/10 text-[#024F86]'
                                    : 'border-gray-200 bg-white/60 text-[#3A424E] hover:border-gray-300'
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {componentType === 'grid' && field.options && typeof field.options === 'object' && !Array.isArray(field.options) && (() => {
                const gridOpts = field.options as { rows: string[]; columns: string[] };
                const rows = gridOpts.rows || [];
                const columns = gridOpts.columns || [];
                const isMulti = field.data_type === 'grid_multiselect';

                // Parse grid answers: { "0": "col_value" } for select, { "0": ["col1", "col2"] } for multiselect
                let gridAnswers: Record<string, string | string[]> = {};
                try {
                    if (typeof value === 'string' && value.startsWith('{')) {
                        gridAnswers = JSON.parse(value);
                    } else if (typeof value === 'object' && value !== null) {
                        gridAnswers = value as unknown as Record<string, string | string[]>;
                    }
                } catch { /* ignore parse errors */ }

                return (
                    <div className="pt-2 overflow-x-auto -mx-1">
                        <table className="w-full border-collapse text-xs md:text-sm">
                            <thead>
                                <tr>
                                    <th className="text-left p-2 md:p-3 min-w-[140px] md:min-w-[200px]"></th>
                                    {columns.map((col, ci) => (
                                        <th key={ci} className="p-1.5 md:p-2 text-center text-[10px] md:text-xs font-semibold text-[#024F86] min-w-[60px] md:min-w-[80px]">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, ri) => {
                                    const rowKey = String(ri);
                                    const rowAnswer = gridAnswers[rowKey];
                                    const selectedValues = isMulti
                                        ? (Array.isArray(rowAnswer) ? rowAnswer : [])
                                        : [];
                                    const selectedSingle = !isMulti ? (typeof rowAnswer === 'string' ? rowAnswer : '') : '';

                                    return (
                                        <tr key={ri} className={`border-t border-gray-100 ${ri % 2 === 0 ? 'bg-white/40' : 'bg-gray-50/40'}`}>
                                            <td className="p-2 md:p-3 text-[#3A424E] font-medium leading-tight">
                                                {ri + 1}) {row}
                                            </td>
                                            {columns.map((col, ci) => {
                                                if (isMulti) {
                                                    const isChecked = selectedValues.includes(col);
                                                    return (
                                                        <td key={ci} className="p-1.5 md:p-2 text-center">
                                                            <label className="flex items-center justify-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={() => onGridChange(field.field_name, ri, col, true)}
                                                                    className="w-4 h-4 md:w-5 md:h-5 text-[#38B1E4] rounded border-gray-300 focus:ring-[#38B1E4] cursor-pointer"
                                                                />
                                                            </label>
                                                        </td>
                                                    );
                                                } else {
                                                    const isSelected = selectedSingle === col;
                                                    return (
                                                        <td key={ci} className="p-1.5 md:p-2 text-center">
                                                            <label className="flex items-center justify-center cursor-pointer">
                                                                <input
                                                                    type="radio"
                                                                    name={`grid_${field.field_name}_row_${ri}`}
                                                                    checked={isSelected}
                                                                    onChange={() => onGridChange(field.field_name, ri, col, false)}
                                                                    className="w-4 h-4 md:w-5 md:h-5 text-[#38B1E4] border-gray-300 focus:ring-[#38B1E4] cursor-pointer"
                                                                />
                                                            </label>
                                                        </td>
                                                    );
                                                }
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );
            })()}

            {hasError && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    Este campo é obrigatório
                </p>
            )}
            </div>
        </motion.fieldset>
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

                // 0. Get the target profile ID (user or dependent)
                const { data: parentProfile } = await supabase
                    .from('user_profiles')
                    .select('active_application_target_id')
                    .eq('id', user.id)
                    .single();

                const targetId = parentProfile?.active_application_target_id || user.id;

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
                const targetProfileId = appData.user_id;
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', targetProfileId)
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
                    computeEligibility(existingAnswers, fieldsData || []);
                    setShowReview(true);
                }

                const targetAppId = applicationId || appData.id;
                // 6. Re-hydration: localStorage always takes precedence for DRAFT applications
                if (targetAppId && appData.status !== 'SUBMITTED') {
                    const storageKey = `nubo_form_draft_${targetAppId}`;
                    const savedDraft = localStorage.getItem(storageKey);
                    if (savedDraft) {
                        try {
                            const parsed = JSON.parse(savedDraft);
                            // Merge: DB data as base, localStorage on top (most recent)
                            setAnswers(prev => ({ ...prev, ...parsed }));
                            console.log(`[PartnerForm] Draft restored from localStorage for ${targetAppId}`);
                        } catch (e) {
                            console.error("[PartnerForm] Failed to parse draft", e);
                        }
                    }
                }

                setLoading(false);
            } catch (e) {
                console.error('[PartnerForm] Error loading data:', e);
                setError('Erro ao carregar formulário.');
                setLoading(false);
            }
        };

        fetchData();
    }, [user?.id, applicationId]);

    // ─── Persistence ──────────────────────────────────────────────────────

    // Helper: persist current answers to localStorage instantly
    const persistToLocalStorage = useCallback((updatedAnswers: Record<string, any>) => {
        const targetAppId = applicationId || application?.id;
        if (targetAppId) {
            const storageKey = `nubo_form_draft_${targetAppId}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedAnswers));
        }
    }, [applicationId, application?.id]);

    // Safety-net: sync to DB every 60s if there are unsaved changes
    const isDirtyRef = useRef(false);
    useEffect(() => {
        if (loading || submitting) return;

        const interval = setInterval(() => {
            if (isDirtyRef.current && Object.keys(answersRef.current).length > 0) {
                console.log('[PartnerForm] Safety-net: syncing to DB');
                saveAnswersToDb();
                isDirtyRef.current = false;
            }
        }, 60000); // 60 seconds

        return () => clearInterval(interval);
    }, [loading, submitting, application]);

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
            const containers = ['chat-content-panel', 'onboarding-scroll-container'];
            containers.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
            });
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
        steps.forEach(step => {
            if (step.is_iterable && Array.isArray(answers[step.id])) {
                const iterations = answers[step.id];
                if (iterations.length > 0) {
                    Object.assign(flat, iterations[0]);
                }
            }
        });

        flat['_iteration_index'] = 0;
        flat['is_first_iteration'] = true;

        return flat;
    }, [answers, steps]);

    const visibleSteps = useMemo(() => {
        return steps.filter(s => {
            if (s.secret_step) return false;
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

            if (!field.optional) {
                // Grid fields: check that all rows have answers
                const isGrid = field.data_type === 'grid_select' || field.data_type === 'grid_multiselect';
                if (isGrid) {
                    const gridOpts = field.options && typeof field.options === 'object' && !Array.isArray(field.options)
                        ? field.options as { rows?: string[] }
                        : null;
                    const rowCount = gridOpts?.rows?.length || 0;
                    let gridAnswers: Record<string, unknown> = {};
                    try {
                        if (typeof value === 'object' && value !== null) {
                            gridAnswers = value as Record<string, unknown>;
                        } else if (typeof value === 'string' && value.startsWith('{')) {
                            gridAnswers = JSON.parse(value);
                        }
                    } catch { /* ignore */ }

                    const answeredRows = Object.keys(gridAnswers).filter(k => {
                        const v = gridAnswers[k];
                        if (Array.isArray(v)) return v.length > 0;
                        return v !== undefined && v !== null && String(v).trim() !== '';
                    }).length;

                    if (answeredRows < rowCount) {
                        errors.add(field.field_name);
                    }
                    continue;
                }

                if (value === undefined || value === null || String(value).trim() === '') {
                    errors.add(field.field_name);
                    continue;
                }
            }

            const stringValue = String(value);
            if (field.maskking && stringValue.trim() !== '') {
                const { isValid, error: maskError } = validateMask(stringValue, field.maskking);
                if (!isValid) {
                    errors.add(field.field_name);
                }
            }
        }

        setValidationErrors(errors);
        return errors.size === 0;
    }, [currentFields, answers, currentIteration, currentStep]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handleAnswerChange = useCallback((fieldName: string, value: any, maskType?: string | null) => {
        let processedValue = value;
        const type = maskType?.toLowerCase();
        
        if (type && ['cpf', 'cnpj', 'phone', 'cep', 'number'].includes(type) && typeof value === 'string') {
            processedValue = value.replace(/\D/g, '');
        }

        const maskedValue = maskType && typeof processedValue === 'string' && type !== 'date' ? applyMask(processedValue, maskType) : processedValue;
        const maxLength = getMaxLength(maskType || null);
        const finalValue = (maxLength && typeof maskedValue === 'string' && type !== 'date') ? maskedValue.slice(0, maxLength) : maskedValue;

        setAnswers(prev => {
            let next: Record<string, any>;
            if (currentStep?.is_iterable) {
                const iterations = [...(prev[currentStep.id] || [])];
                if (!iterations[currentIteration]) iterations[currentIteration] = {};
                iterations[currentIteration] = { ...iterations[currentIteration], [fieldName]: finalValue };
                next = { ...prev, [currentStep.id]: iterations };
            } else {
                next = { ...prev, [fieldName]: finalValue };
            }
            persistToLocalStorage(next);
            isDirtyRef.current = true;
            return next;
        });

        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
        });
    }, [currentStep, currentIteration, persistToLocalStorage]);

    const handleMultiSelectChange = useCallback((fieldName: string, option: string, checked: boolean) => {
        setAnswers(prev => {
            let currentVal: any = '';
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

            let next: Record<string, any>;
            if (currentStep?.is_iterable) {
                const iterations = [...(prev[currentStep.id] || [])];
                if (!iterations[currentIteration]) iterations[currentIteration] = {};
                iterations[currentIteration] = { ...iterations[currentIteration], [fieldName]: nextArray };
                next = { ...prev, [currentStep.id]: iterations };
            } else {
                next = { ...prev, [fieldName]: nextArray };
            }
            persistToLocalStorage(next);
            isDirtyRef.current = true;
            return next;
        });

        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
        });
    }, [currentStep, currentIteration, persistToLocalStorage]);

    const handleGridChange = useCallback((fieldName: string, rowIndex: number, columnValue: string, isMulti: boolean) => {
        setAnswers(prev => {
            let currentVal: Record<string, string | string[]> = {};
            if (currentStep?.is_iterable) {
                const iterations = prev[currentStep.id] || [];
                const raw = iterations[currentIteration]?.[fieldName];
                if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
                    currentVal = raw as Record<string, string | string[]>;
                } else if (typeof raw === 'string' && raw.startsWith('{')) {
                    try { currentVal = JSON.parse(raw); } catch { /* ignore */ }
                }
            } else {
                const raw = prev[fieldName];
                if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
                    currentVal = raw as Record<string, string | string[]>;
                } else if (typeof raw === 'string' && raw.startsWith('{')) {
                    try { currentVal = JSON.parse(raw); } catch { /* ignore */ }
                }
            }

            const rowKey = String(rowIndex);
            if (isMulti) {
                const currentArr = Array.isArray(currentVal[rowKey]) ? (currentVal[rowKey] as string[]) : [];
                const has = currentArr.includes(columnValue);
                currentVal = {
                    ...currentVal,
                    [rowKey]: has ? currentArr.filter(v => v !== columnValue) : [...currentArr, columnValue]
                };
            } else {
                currentVal = { ...currentVal, [rowKey]: columnValue };
            }

            let next: Record<string, unknown>;
            if (currentStep?.is_iterable) {
                const iterations = [...(prev[currentStep.id] || [])];
                if (!iterations[currentIteration]) iterations[currentIteration] = {};
                iterations[currentIteration] = { ...iterations[currentIteration], [fieldName]: currentVal };
                next = { ...prev, [currentStep.id]: iterations };
            } else {
                next = { ...prev, [fieldName]: currentVal };
            }
            persistToLocalStorage(next as Record<string, string>);
            isDirtyRef.current = true;
            return next as Record<string, string>;
        });

        setValidationErrors(prev => {
            const next = new Set(prev);
            next.delete(fieldName);
            return next;
        });
    }, [currentStep, currentIteration, persistToLocalStorage]);

    const saveAnswersToDb = async () => {
        if (!application || submitting) return;
        setSaving(true);
        try {
            await supabase.rpc('update_student_application_answers', {
                p_application_id: application.id,
                p_answers: answers
            });
            setLastSaved(new Date());
        } catch (e) {
            console.error('[PartnerForm] Error saving answers:', e);
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        if (!validateCurrentStep()) return;
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

    const computeEligibility = (providedAnswers?: Record<string, any>, providedFields?: PartnerFormField[]) => {
        const targetFields = providedFields || fields;
        const targetAnswers = providedAnswers || answers;
        
        const criterionFields = targetFields.filter(f => f.is_criterion);
        const results: EligibilityCriterion[] = criterionFields.map(crit => {
            let userVal = targetAnswers[crit.field_name];
            if ((userVal === null || userVal === undefined || userVal === '') && crit.mapping_source) {
                userVal = targetAnswers[crit.mapping_source];
            }

            let met = false;
            if (userVal !== null && userVal !== undefined && userVal !== '') {
                const rule = crit.criterion_rule;
                if (!rule) {
                    met = true;
                } else {
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

    const handleSubmit = async () => {
        if (!application || !user) return;
        setSubmitting(true);

        try {
            await supabase.rpc('update_student_application_answers', {
                p_application_id: application.id,
                p_answers: answers
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

            if (onTriggerChatMessage) {
                await new Promise(r => setTimeout(r, 1500));
                const metCount = eligibilityResults.filter(r => r.met).length;
                const totalCount = eligibilityResults.length;
                onTriggerChatMessage(
                    `Acabei de enviar minha candidatura para o programa ${partnerName}. ` +
                    `Atendi ${metCount} de ${totalCount} critérios de elegibilidade. ` +
                    `Por favor, confirme o recebimento e me diga os próximos passos.`
                );
            }

            if (applicationId) {
                localStorage.removeItem(`nubo_form_draft_${applicationId}`);
            }

            if (onComplete) onComplete();
        } catch (e) {
            console.error('[PartnerForm] Error submitting:', e);
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldValue = useCallback((fieldName: string): string => {
        let raw: unknown;
        if (currentStep?.is_iterable) {
            const iterations = answers[currentStep.id] || [];
            raw = iterations[currentIteration]?.[fieldName];
        } else {
            raw = answers[fieldName];
        }
        if (raw === undefined || raw === null) return '';
        if (typeof raw === 'object') return JSON.stringify(raw);
        return String(raw);
    }, [answers, currentStep, currentIteration]);

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

    if (showReview) {
        const metCount = eligibilityResults.filter(r => r.met).length;
        const totalCount = eligibilityResults.length;

        return (
            <div className={`bg-transparent md:bg-white/30 backdrop-blur-md md:border border-white/20 md:shadow-lg md:rounded-2xl p-4 md:p-6 flex flex-col h-full ${montserrat.className}`}>
                <div className="text-center mb-4">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-10 h-10 bg-[#024F86]/10 rounded-full flex items-center justify-center mx-auto mb-2"
                    >
                        <CheckCircle2 className="text-[#024F86]" size={20} />
                    </motion.div>
                    <h2 className="text-base font-bold text-[#024F86]">Revisão</h2>
                    <p className="text-[10px] text-[#3A424E]/70 mt-0.5">
                        Confira seus critérios para <strong>{partnerName}</strong>
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {totalCount > 0 && (
                        <div className={`p-3 rounded-xl border-2 text-center mb-2 ${metCount === totalCount
                            ? 'border-green-300 bg-green-50'
                            : metCount > 0
                                ? 'border-amber-300 bg-amber-50'
                                : 'border-red-300 bg-red-50'
                            }`}>
                            <p className="text-base font-bold text-[#024F86]">
                                {metCount}/{totalCount} atendidos
                            </p>
                        </div>
                    )}

                    {eligibilityResults.map((result, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`flex items-center gap-2 p-2 rounded-xl border-2 ${result.met
                                ? 'border-green-200 bg-green-50/50'
                                : 'border-red-200 bg-red-50/50'
                                }`}
                        >
                            {result.met ? (
                                <CheckCircle2 className="text-green-500 shrink-0" size={16} />
                            ) : (
                                <XCircle className="text-red-400 shrink-0" size={16} />
                            )}
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-[#3A424E] truncate">{result.question_text}</p>
                                <p className="text-[10px] text-[#3A424E]/60 truncate">{result.user_answer || '—'}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button
                        onClick={handlePrev}
                        className="flex items-center gap-1 px-4 py-2.5 rounded-full border-2 border-gray-200 text-[#3A424E] text-[11px] font-bold hover:bg-gray-50 transition-all"
                    >
                        <ChevronLeft size={14} />
                        Voltar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#024F86] to-[#38B1E4] text-white text-[11px] font-black uppercase tracking-wider shadow-lg shadow-[#024F86]/20 hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {submitting ? (
                            <Loader2 className="animate-spin" size={14} />
                        ) : (
                            <>
                                <Send size={14} />
                                Enviar
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    const totalSteps = visibleSteps.length;
    const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 100;

    return (
        <div className={`bg-transparent md:bg-white/30 backdrop-blur-md md:border border-white/20 md:shadow-lg md:rounded-2xl p-4 md:p-6 lg:p-8 flex flex-col h-full ${montserrat.className}`}>
            {/* Header */}
            <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-[#024F86]/10 rounded-full flex items-center justify-center shrink-0">
                        <FileText className="text-[#024F86]" size={16} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm md:text-base font-bold text-[#024F86] truncate leading-tight">{partnerName}</h2>
                        {currentStep && (
                            <p className="text-[9px] md:text-xs text-[#3A424E]/60 flex items-center flex-wrap gap-x-2 md:gap-x-3 mt-0.5">
                                <span>Etapa {currentStepIndex + 1}/{totalSteps}: <span className="font-semibold">{currentStep.step_name}</span></span>
                                {currentStep.is_iterable && (
                                    <span className="px-1.5 py-0.5 bg-[#024F86]/10 rounded-full text-[8px] md:text-[10px] font-bold text-[#024F86]">
                                        #{currentIteration + 1}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    {totalSteps > 1 && (
                        <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <motion.div
                                className="h-full bg-gradient-to-r from-[#024F86] to-[#38B1E4] rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Fields */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep?.id || (currentStepIndex + '-' + currentIteration)}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 md:space-y-6 pt-4 md:pt-6"
                    >
                        {currentStep?.introduction && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-[#024F86]/5 border border-[#024F86]/10 text-xs text-[#024F86] mb-1"
                            >
                                {currentStep.introduction}
                            </motion.div>
                        )}

                        {currentFields.length === 0 ? (
                            <div className="text-center py-6 text-[#3A424E]/60 text-xs">
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
                                    onGridChange={handleGridChange}
                                />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0 pt-4 md:pt-6 border-t border-gray-100">
                <div className="flex gap-2 md:gap-3 flex-1 md:flex-initial">
                    {(currentStepIndex > 0 || currentIteration > 0) && (
                        <button
                            onClick={handlePrev}
                            className="flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full border-2 border-gray-200 text-[#3A424E] text-[11px] md:text-sm font-bold hover:bg-gray-50 transition-all flex-1 md:flex-none"
                        >
                            <ChevronLeft size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            Voltar
                        </button>
                    )}
                    
                    {currentStep?.is_iterable && (!currentStep.repeat_limit || currentIteration + 1 < currentStep.repeat_limit) && (
                        <button
                            onClick={handleAddIteration}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full border-2 border-[#38B1E4] text-[#024F86] text-[11px] md:text-sm font-bold hover:bg-[#38B1E4]/5 transition-all"
                        >
                            <Plus size={16} className="text-[#38B1E4] w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="md:hidden">Outro</span>
                            <span className="hidden md:inline">Responder mais 1 vez</span>
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                    <button
                        onClick={handleNext}
                        disabled={saving}
                        className="flex-[2] md:flex-none w-full md:w-auto flex items-center justify-center gap-1 md:gap-2 px-4 md:px-8 py-2.5 md:py-3.5 rounded-full bg-gradient-to-r from-[#024F86] to-[#38B1E4] text-white text-[11px] md:text-sm font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin w-4 h-4 md:w-5 md:h-5" />
                        ) : isLastStep ? (
                            <>
                                <span className="md:hidden">Revisar</span>
                                <span className="hidden md:inline">Revisar e Enviar</span>
                                <ChevronRight size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </>
                        ) : (
                            <>
                                Próximo
                                <ChevronRight size={16} className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
