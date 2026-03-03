'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, updateUserProfileService } from '@/services/supabase/profile';
import { supabase } from '@/lib/supabaseClient';
import { Montserrat } from 'next/font/google';
import { User, MapPin, GraduationCap, Calendar, Users, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface DependentDataSectionProps {
    onFormDirty?: (state: any) => void;
    onDependentOnboardingComplete?: () => void;
}

interface InputFieldProps {
    label: string;
    name: string;
    value: string | number | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    icon: React.ElementType;
    placeholder?: string;
    isEditing: boolean;
    displayValue: React.ReactNode;
    maxLength?: number;
    className?: string;
    onFocus?: () => void;
    onBlur?: () => void;
}

const InputField = ({ label, name, value, onChange, type = 'text', icon: Icon, placeholder, isEditing, displayValue, maxLength, className, onFocus, onBlur }: InputFieldProps) => (
    <div className={`flex flex-col gap-1.5 ${className || ''}`}>
        <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
            <Icon size={14} />
            {label}
        </label>
        {isEditing ? (
            <div className="relative flex items-center">
                <input
                    type={type}
                    name={name}
                    value={value || ''}
                    onChange={onChange}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all placeholder:text-gray-400 w-full"
                />
            </div>
        ) : (
            <div className="text-[#3A424E] font-medium px-1">
                {displayValue || <span className="text-gray-400 italic">Não informado</span>}
            </div>
        )}
    </div>
);

export default function DependentDataSection({ onDependentOnboardingComplete, onFormDirty }: DependentDataSectionProps) {
    const { user } = useAuth();
    const [dependentId, setDependentId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<UserProfile>>({
        full_name: '',
        age: null,
        city: '',
        education: '',
        relationship: ''
    });

    const [isEditing, setIsEditing] = useState(true);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

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
            // First get parent's profile to find current dependent ID
            const { data: parentProfile } = await supabase
                .from('user_profiles')
                .select('current_dependent_id')
                .eq('id', user.id)
                .single();

            if (parentProfile?.current_dependent_id) {
                setDependentId(parentProfile.current_dependent_id);
                // Load dependent's actual profile
                const { data: dependentProfile } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', parentProfile.current_dependent_id)
                    .single();

                if (dependentProfile) {
                    setFormData({
                        full_name: dependentProfile.full_name || '',
                        age: dependentProfile.age || null,
                        city: dependentProfile.city || '',
                        education: dependentProfile.education || '',
                        relationship: dependentProfile.relationship || ''
                    });
                }
            }
        };

        loadDependentProfile();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!dependentId) return;

        setLoading(true);
        const { data, error } = await updateUserProfileService({
            target_user_id: dependentId,
            full_name: formData.full_name,
            age: formData.age ? Number(formData.age) : null,
            city: formData.city,
            education: formData.education,
            relationship: formData.relationship
        });

        if (data) {
            // Check if all required fields are present to trigger completion
            if (data.full_name && data.age && data.city && data.education && data.relationship) {
                if (onDependentOnboardingComplete) {
                    onDependentOnboardingComplete();
                }
            }
        } else {
            console.error(error);
        }
        setLoading(false);
    };

    return (
        <div className={`bg-white/30 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-6 md:p-8 ${montserrat.className}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-[#024F86]">Dados do Dependente</h2>
                    <p className="text-sm text-[#3A424E] mt-2">
                        Preencha os dados da pessoa que você deseja ajudar a encontrar uma oportunidade educacional.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all bg-[#38B1E4] text-white hover:bg-[#2a9ac9] shadow-md disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <>
                            <Save size={16} />
                            Salvar
                        </>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                    label="Nome Completo"
                    name="full_name"
                    value={formData.full_name || ''}
                    onChange={handleChange}
                    icon={User}
                    placeholder="Nome do dependente"
                    isEditing={isEditing}
                    displayValue={formData.full_name}
                    onFocus={() => setFocusedField('full_name')}
                    onBlur={() => setFocusedField(null)}
                />
                <InputField
                    label="Idade"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleChange}
                    type="number"
                    icon={Calendar}
                    placeholder="Idade do dependente"
                    isEditing={isEditing}
                    displayValue={formData.age}
                    onFocus={() => setFocusedField('age')}
                    onBlur={() => setFocusedField(null)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                        <Users size={14} />
                        Grau de Parentesco
                    </label>
                    {isEditing ? (
                        <select
                            name="relationship"
                            value={formData.relationship || ''}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('relationship')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all"
                        >
                            <option value="">Selecione...</option>
                            <option value="Filho(a)">Filho(a)</option>
                            <option value="Irmão/Irmã">Irmão/Irmã</option>
                            <option value="Sobrinho(a)">Sobrinho(a)</option>
                            <option value="Neto(a)">Neto(a)</option>
                            <option value="Primo(a)">Primo(a)</option>
                            <option value="Outro">Outro</option>
                        </select>
                    ) : (
                        <div className="text-[#3A424E] font-medium px-1">
                            {formData.relationship || <span className="text-gray-400 italic">Não informado</span>}
                        </div>
                    )}
                </div>

                <InputField
                    label="Cidade"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    icon={MapPin}
                    placeholder="Cidade onde mora"
                    isEditing={isEditing}
                    displayValue={formData.city}
                    onFocus={() => setFocusedField('city')}
                    onBlur={() => setFocusedField(null)}
                />
            </div>

            <div className="mt-6">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                        <GraduationCap size={14} />
                        Escolaridade
                    </label>
                    {isEditing ? (
                        <select
                            name="education"
                            value={formData.education || ''}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('education')}
                            onBlur={() => setFocusedField(null)}
                            className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all"
                        >
                            <option value="">Selecione...</option>
                            <option value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</option>
                            <option value="Ensino Fundamental Completo">Ensino Fundamental Completo</option>
                            <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                            <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                        </select>
                    ) : (
                        <div className="text-[#3A424E] font-medium px-1">
                            {formData.education || <span className="text-gray-400 italic">Não informado</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
