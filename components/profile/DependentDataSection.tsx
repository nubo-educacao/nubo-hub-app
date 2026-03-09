'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, updateUserProfileService } from '@/services/supabase/profile';
import { supabase } from '@/lib/supabaseClient';
import { Montserrat } from 'next/font/google';
import { User, MapPin, GraduationCap, Calendar, Users, Save, Loader2, Search, Home, Hash, Building, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface DependentDataSectionProps {
    onFormDirty?: (state: any) => void;
    onDependentOnboardingComplete?: () => void;
    onTriggerChatMessage?: (message: string) => void;
}

interface InputFieldProps {
    label: string;
    name: string;
    value: string | number | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    icon: React.ElementType;
    placeholder?: string;
    maxLength?: number;
    className?: string;
    suffix?: React.ReactNode;
    onFocus?: () => void;
    onBlur?: () => void;
    error?: boolean;
}

const InputField = ({ label, name, value, onChange, type = 'text', icon: Icon, placeholder, maxLength, className, suffix, onFocus, onBlur, error }: InputFieldProps) => (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
        <label className={`text-sm font-semibold flex items-center gap-2 ${error ? 'text-red-500' : 'text-[#1BBBCD]'}`}>
            <Icon size={14} />
            {label}
            {error && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
        </label>
        <div className="relative flex items-center group">
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                maxLength={maxLength}
                onFocus={onFocus}
                onBlur={onBlur}
                className={`bg-white/50 border focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all placeholder:text-gray-400 w-full
          ${error
                        ? 'border-red-400 hover:border-red-500 bg-red-50/10'
                        : 'border-white/40 group-hover:border-white/60'
                    }`}
            />
            {suffix}
        </div>
    </div>
);

interface ViaCEPResponse {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    erro?: boolean;
}

async function lookupCEP(cep: string): Promise<ViaCEPResponse | null> {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return null;

    try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (!res.ok) return null;
        const data: ViaCEPResponse = await res.json();
        if (data.erro) return null;
        return data;
    } catch {
        return null;
    }
}

export default function DependentDataSection({ onDependentOnboardingComplete, onFormDirty, onTriggerChatMessage }: DependentDataSectionProps) {
    const { user } = useAuth();
    const [dependentId, setDependentId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        full_name: '',
        age: null,
        city: '',
        state: '',
        zip_code: '',
        street: '',
        street_number: '',
        complement: '',
        education: '',
        education_year: '',
        relationship: ''
    });
    const [originalData, setOriginalData] = useState<Partial<UserProfile> | null>(null);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);
    const [cepError, setCepError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const calculateAge = (birthDate: string) => {
        if (!birthDate) return null;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const toTitleCase = (str: string) => {
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Sync state with parent (debounce 500ms)
    useEffect(() => {
        if (onFormDirty) {
            const timer = setTimeout(() => {
                onFormDirty({
                    data: formData,
                    focused_field: focusedField
                });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [formData, focusedField, onFormDirty]);

    // Load initial dependent data
    useEffect(() => {
        if (!user) return;

        const loadDependentProfile = async () => {
            setLoadingInitial(true);
            try {
                const { data: parentProfile } = await supabase
                    .from('user_profiles')
                    .select('current_dependent_id')
                    .eq('id', user.id)
                    .single();

                if (parentProfile?.current_dependent_id) {
                    setDependentId(parentProfile.current_dependent_id);
                    const { data: dependentProfile } = await supabase
                        .from('user_profiles')
                        .select('*')
                        .eq('id', parentProfile.current_dependent_id)
                        .single();

                    if (dependentProfile) {
                        let formattedZip = dependentProfile.zip_code || '';
                        if (formattedZip.length === 8 && !formattedZip.includes('-')) {
                            formattedZip = formattedZip.slice(0, 5) + '-' + formattedZip.slice(5, 8);
                        }

                        const loadedData = {
                            full_name: dependentProfile.full_name || '',
                            age: dependentProfile.age || null,
                            city: dependentProfile.city || '',
                            state: dependentProfile.state || '',
                            zip_code: formattedZip,
                            street: dependentProfile.street || '',
                            street_number: dependentProfile.street_number || '',
                            complement: dependentProfile.complement || '',
                            education: dependentProfile.education || '',
                            education_year: dependentProfile.education_year || '',
                            relationship: dependentProfile.relationship || '',
                            birth_date: dependentProfile.birth_date || ''
                        };
                        setFormData(loadedData);
                        setOriginalData(loadedData);
                    }
                }
            } catch (err) {
                console.error("[DependentDataSection] Error loading dependent data:", err);
            } finally {
                setLoadingInitial(false);
            }
        };

        loadDependentProfile();
    }, [user]);

    const cleanZip = (zip?: string | null) => (zip || '').replace(/\D/g, '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: false }));
        }
    };

    const handleCEPLookup = useCallback(async (cepValue: string) => {
        const clean = cepValue.replace(/\D/g, '');
        if (clean.length !== 8) return;

        setCepLoading(true);
        setCepError(null);

        const result = await lookupCEP(clean);

        if (result) {
            setFormData(prev => ({
                ...prev,
                zip_code: clean,
                city: result.localidade,
                state: result.uf,
                street: result.logradouro || prev.street || '',
            }));
        } else {
            setCepError('CEP não encontrado');
        }

        setCepLoading(false);
    }, []);

    const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        let formatted = raw;
        if (raw.length > 5) {
            formatted = raw.slice(0, 5) + '-' + raw.slice(5, 8);
        }
        setFormData(prev => ({ ...prev, zip_code: formatted }));
        setCepError(null);
        if (raw.length === 8) {
            handleCEPLookup(raw);
        }
    };

    const hasChanges = originalData ? (
        (formData.full_name || '') !== (originalData.full_name || '') ||
        String(formData.age || '') !== String(originalData.age || '') ||
        (formData.city || '') !== (originalData.city || '') ||
        (formData.state || '') !== (originalData.state || '') ||
        cleanZip(formData.zip_code) !== cleanZip(originalData.zip_code) ||
        (formData.street || '') !== (originalData.street || '') ||
        (formData.street_number || '') !== (originalData.street_number || '') ||
        (formData.complement || '') !== (originalData.complement || '') ||
        (formData.education || '') !== (originalData.education || '') ||
        (formData.education_year || '') !== (originalData.education_year || '') ||
        (formData.relationship || '') !== (originalData.relationship || '') ||
        (formData.birth_date || '') !== (originalData.birth_date || '')
    ) : Object.keys(formData).length > 0;

    const validateForm = (): { errors: Record<string, boolean>; descriptions: string[] } => {
        const newErrors: Record<string, boolean> = {};
        const descriptions: string[] = [];

        // Name: At least 2 words
        const nameParts = (formData.full_name || '').trim().split(/\s+/);
        if (!formData.full_name || nameParts.length < 2) {
            newErrors.full_name = true;
            descriptions.push('Nome incompleto (precisa ter nome e sobrenome)');
        }

        // Birth Date & Age
        const age = calculateAge(formData.birth_date || '');
        if (!formData.birth_date || !age || age < 6 || age > 100) {
            newErrors.birth_date = true;
            if (!formData.birth_date) {
                descriptions.push('Data de nascimento não informada');
            } else {
                descriptions.push(`Data de nascimento inválida. Idade calculada: ${age}. Precisa ser entre 6 e 100 anos`);
            }
        }

        // Relationship
        if (!formData.relationship) {
            newErrors.relationship = true;
            descriptions.push('Grau de parentesco não selecionado');
        }

        // Address
        const missingAddress: string[] = [];
        if (!formData.zip_code || formData.zip_code.replace(/\D/g, '').length < 8) { newErrors.zip_code = true; missingAddress.push('CEP'); }
        if (!formData.state) { newErrors.state = true; missingAddress.push('Estado'); }
        if (!formData.city) { newErrors.city = true; missingAddress.push('Cidade'); }
        if (!formData.street) { newErrors.street = true; missingAddress.push('Rua'); }
        if (!formData.street_number) { newErrors.street_number = true; missingAddress.push('Número'); }

        if (missingAddress.length > 0) {
            descriptions.push(`Endereço incompleto (faltando: ${missingAddress.join(', ')})`);
        }

        // Education
        if (!formData.education) {
            newErrors.education = true;
            descriptions.push('Escolaridade não selecionada');
        }
        // Salvamos education_year mesmo se não informado

        setErrors(newErrors);
        return { errors: newErrors, descriptions };
    };

    const handleSave = async () => {
        if (!dependentId) return;

        const { errors: newErrors, descriptions } = validateForm();

        setLoading(true);

        const formattedName = toTitleCase((formData.full_name || '').trim());

        // Prepare updates object with only valid fields
        const updates: any = {
            target_user_id: dependentId
        };

        if (!newErrors.full_name) updates.full_name = formattedName;
        if (!newErrors.birth_date) {
            updates.birth_date = formData.birth_date;
            updates.age = calculateAge(formData.birth_date || '');
        }
        if (!newErrors.relationship) updates.relationship = formData.relationship;
        if (!newErrors.city) updates.city = formData.city;
        if (!newErrors.state) updates.state = formData.state;
        if (!newErrors.zip_code) updates.zip_code = cleanZip(formData.zip_code);
        if (!newErrors.street) updates.street = formData.street;
        if (!newErrors.street_number) updates.street_number = formData.street_number;

        // Complement is optional and not validated for errors
        updates.complement = formData.complement;

        if (!newErrors.education) updates.education = formData.education;
        updates.education_year = formData.education_year || 'N/A';

        const hasValidationErrors = Object.keys(newErrors).length > 0;

        // Se o formulário do dependente não tiver erros, avançamos a fase dos dois
        if (!hasValidationErrors) {
            updates.onboarding_completed = true;
            updates.passport_phase = 'PROGRAM_MATCH';
        }

        const { data, error } = await updateUserProfileService(updates);
        console.log('[handleSave Dependent] updates:', updates);
        console.log('[handleSave Dependent] newErrors:', newErrors);
        console.log('[handleSave Dependent] descriptions:', descriptions);
        console.log('[handleSave Dependent] supabase response:', { data, error });

        if (data) {
            const savedData = {
                full_name: data.full_name || '',
                age: data.age || null,
                city: data.city || '',
                state: data.state || '',
                zip_code: data.zip_code || '',
                street: data.street || '',
                street_number: data.street_number || '',
                complement: data.complement || '',
                education: data.education || '',
                education_year: data.education_year || '',
                relationship: data.relationship || '',
                birth_date: data.birth_date || ''
            };
            setOriginalData(savedData);

            // Update local state for formatted name if it was valid
            if (updates.full_name) {
                setFormData(prev => ({ ...prev, full_name: updates.full_name }));
            }

            if (!hasValidationErrors) {
                // Atualiza também a fase do pai para PROGRAM_MATCH
                const parentUpdate = await updateUserProfileService({ passport_phase: 'PROGRAM_MATCH' });
                console.log('[handleSave Dependent] parent update response:', parentUpdate);

                if (onDependentOnboardingComplete) {
                    onDependentOnboardingComplete();
                }

                if (onTriggerChatMessage) {
                    onTriggerChatMessage("Terminei de preencher os dados do dependente. E agora?");
                }
            }
        } else {
            console.error(error);
        }

        // Always notify Cloudinha if there are validation errors, even if partial save failed/returned no data
        if (hasValidationErrors && onTriggerChatMessage) {
            const message = `Tentei salvar os dados do meu dependente mas alguns campos estão com problema: ${descriptions.join(', ')}. O que preciso corrigir?`;
            onTriggerChatMessage(message);
        }

        setLoading(false);
    };

    if (loadingInitial) {
        return (
            <div className="w-full flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-[#024F86]" size={40} />
                <p className="text-[#024F86]/60 font-medium">Carregando dados do dependente...</p>
            </div>
        );
    }

    return (
        <div className={`bg-transparent md:bg-white/30 backdrop-blur-md md:border border-white/20 md:shadow-lg md:rounded-2xl p-4 md:p-8 ${montserrat.className}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#024F86]">Dados do Dependente</h2>
                    <p className="text-sm text-[#3A424E] mt-2">
                        Preencha os dados da pessoa que você deseja ajudar a encontrar uma oportunidade educacional.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                    label="Nome Completo"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    icon={User}
                    placeholder="Nome completo do dependente"
                    onFocus={() => setFocusedField('full_name')}
                    onBlur={() => setFocusedField(null)}
                    error={errors.full_name}
                />
                <InputField
                    label="Data de Nascimento"
                    name="birth_date"
                    value={formData.birth_date || ''}
                    onChange={handleChange}
                    type="date"
                    icon={Calendar}
                    placeholder="Data de nascimento"
                    onFocus={() => setFocusedField('birth_date')}
                    onBlur={() => setFocusedField(null)}
                    error={errors.birth_date}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex flex-col gap-1.5">
                    <label className={`text-sm font-semibold flex items-center gap-2 ${errors.relationship ? 'text-red-500' : 'text-[#1BBBCD]'}`}>
                        <Users size={14} />
                        Grau de Parentesco
                        {errors.relationship && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                    </label>
                    <select
                        name="relationship"
                        value={formData.relationship || ''}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('relationship')}
                        onBlur={() => setFocusedField(null)}
                        className={`bg-white/50 border rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all focus:border-[#38B1E4]
              ${errors.relationship ? 'border-red-400 bg-red-50/10' : 'border-white/40'}`}
                    >
                        <option value="">Selecione...</option>
                        <option value="Filho(a)">Filho(a)</option>
                        <option value="Irmão/Irmã">Irmão/Irmã</option>
                        <option value="Sobrinho(a)">Sobrinho(a)</option>
                        <option value="Neto(a)">Neto(a)</option>
                        <option value="Primo(a)">Primo(a)</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>

                <div className="mt-0">
                    <InputField
                        label="CEP"
                        name="zip_code"
                        value={formData.zip_code || ''}
                        onChange={handleCEPChange}
                        icon={Home}
                        placeholder="00000-000"
                        maxLength={9}
                        onFocus={() => setFocusedField('zip_code')}
                        onBlur={() => setFocusedField(null)}
                        error={errors.zip_code}
                        suffix={
                            cepLoading ? (
                                <Loader2 size={16} className="text-[#024F86] animate-spin absolute right-3" />
                            ) : (
                                <Search size={16} className={`absolute right-3 ${cepError ? 'text-red-500' : 'text-[#024F86]/40'}`} />
                            )
                        }
                    />
                    {cepError && <p className="text-[10px] text-red-500 mt-1 ml-1">{cepError}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <InputField
                    label="Estado"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    icon={Building}
                    placeholder="UF"
                    onFocus={() => setFocusedField('state')}
                    onBlur={() => setFocusedField(null)}
                    error={errors.state}
                />
                <InputField
                    label="Cidade"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    icon={MapPin}
                    placeholder="Cidade"
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                    error={errors.city}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <InputField
                    label="Rua"
                    name="street"
                    value={formData.street || ''}
                    onChange={handleChange}
                    icon={Home}
                    placeholder="Nome da rua"
                    onFocus={() => setFocusedField('street')}
                    onBlur={() => setFocusedField(null)}
                    error={errors.street}
                />
                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="Número"
                        name="street_number"
                        value={formData.street_number || ''}
                        onChange={handleChange}
                        icon={Hash}
                        placeholder="Nº"
                        onFocus={() => setFocusedField('street_number')}
                        onBlur={() => setFocusedField(null)}
                        error={errors.street_number}
                    />
                    <InputField
                        label="Complemento"
                        name="complement"
                        value={formData.complement || ''}
                        onChange={handleChange}
                        icon={Building}
                        placeholder="Apto, Bloco, etc."
                        onFocus={() => setFocusedField('complement')}
                        onBlur={() => setFocusedField(null)}
                    />
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                    <label className={`text-sm font-semibold flex items-center gap-2 ${errors.education ? 'text-red-500' : 'text-[#1BBBCD]'}`}>
                        <GraduationCap size={14} />
                        Escolaridade
                        {errors.education && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                    </label>
                    <select
                        name="education"
                        value={formData.education || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                                ...prev,
                                education: val,
                                // Reset year if education doesn't require it
                                education_year: (val === 'Ensino Fundamental' || val === 'Ensino Médio Incompleto')
                                    ? prev.education_year
                                    : ''
                            }));
                            if (errors.education) {
                                setErrors(prev => ({ ...prev, education: false }));
                            }
                        }}
                        onFocus={() => setFocusedField('education')}
                        onBlur={() => setFocusedField(null)}
                        className={`bg-white/50 border rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all focus:border-[#38B1E4]
              ${errors.education ? 'border-red-400 bg-red-50/10' : 'border-white/40'}`}
                    >
                        <option value="">Selecione...</option>
                        <option value="Ensino Fundamental">Ensino Fundamental</option>
                        <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                        <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                        <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
                        <option value="Ensino Superior Completo">Ensino Superior Completo</option>
                        <option value="Pós-Gradução">Pós-Gradução</option>
                    </select>
                </div>

                {['Ensino Fundamental', 'Ensino Médio Incompleto'].includes(formData.education || '') && (
                    <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className={`text-sm font-semibold flex items-center gap-2 ${errors.education_year ? 'text-red-500' : 'text-[#1BBBCD]'}`}>
                            <Calendar size={14} />
                            Ano
                            {errors.education_year && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                        </label>
                        <select
                            name="education_year"
                            value={formData.education_year || ''}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('education_year')}
                            onBlur={() => setFocusedField(null)}
                            className={`bg-white/50 border rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all focus:border-[#38B1E4]
                ${errors.education_year ? 'border-red-400 bg-red-50/10' : 'border-white/40'}`}
                        >
                            <option value="">Selecione...</option>
                            {formData.education === 'Ensino Fundamental' ? (
                                Array.from({ length: 9 }, (_, i) => (
                                    <option key={i + 1} value={`${i + 1}º ano`}>{i + 1}º ano</option>
                                ))
                            ) : (
                                <>
                                    <option value="1º ano EM">1º ano EM</option>
                                    <option value="2º ano EM">2º ano EM</option>
                                    <option value="3º ano EM">3º ano EM</option>
                                </>
                            )}
                        </select>
                    </div>
                )}
            </div>

            {hasChanges && (
                <div className="mt-8 flex justify-end border-t border-white/20 pt-6">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all bg-[#38B1E4] text-white hover:bg-[#2a9ac9] shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
