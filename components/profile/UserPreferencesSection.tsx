'use client';

import React, { useState, useEffect } from 'react';
import { UserPreferences, updateUserPreferencesService, getAvailableCoursesService, matchOpportunitiesService, MatchOpportunitiesParams } from '@/services/supabase/preferences';
import { MultiSelect, Option } from '@/components/ui/MultiSelect';
import { Montserrat } from 'next/font/google';
import { Settings, Edit2, Save, Loader2, BookOpen, GraduationCap, MapPin, DollarSign, Users, Briefcase } from 'lucide-react';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface UserPreferencesSectionProps {
  preferences: UserPreferences | null;
  onUpdate: (updated: UserPreferences) => void;
  onMatchFound?: (courseIds: string[]) => void;
}

interface InputFieldProps {
  label: string;
  name: string;
  value: string | number | string[] | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  icon: React.ElementType;
  placeholder?: string;
  isEditing: boolean;
  displayValue?: React.ReactNode;
  options?: { label: string; value: string }[];
}

// Helper to display array as comma separated string or pills
const ArrayDisplay = ({ items }: { items: string[] | null | undefined }) => (
    <div className="flex flex-wrap gap-1">
        {items && items.length > 0 ? (
            items.map((item, idx) => (
                <span key={idx} className="bg-[#E0F2FE] text-[#024F86] text-xs px-2 py-0.5 rounded-full">
                    {item}
                </span>
            ))
        ) : (
            <span className="text-gray-400 italic">Não informado</span>
        )}
    </div>
);

const InputField = ({ label, name, value, onChange, type = 'text', icon: Icon, placeholder, isEditing, displayValue, options }: InputFieldProps) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                <Icon size={14} />
                {label}
            </label>
            {isEditing ? (
                options ? (
                    <select
                        name={name}
                        value={String(value || '')}
                        onChange={onChange}
                        className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all w-full"
                    >
                        <option value="">Selecione...</option>
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={type}
                        name={name}
                        value={String(value || '')}
                        onChange={onChange}
                        placeholder={placeholder}
                        className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all w-full placeholder:text-gray-400"
                    />
                )
            ) : (
                <div className="text-[#3A424E] font-medium px-1 truncate min-h-[24px]">
                    {displayValue || <span className="text-gray-400 italic">Não informado</span>}
                </div>
            )}
        </div>
    );
};


// ENUMS
const SHIFTS_OPTIONS: Option[] = [
    { label: 'Matutino', value: 'Matutino' },
    { label: 'Vespertino', value: 'Vespertino' },
    { label: 'Noturno', value: 'Noturno' },
    { label: 'Integral', value: 'Integral' },
    { label: 'EAD', value: 'EAD' }
];

const QUOTA_OPTIONS: Option[] = [
    { label: 'PPI (Pretos, Pardos e Indígenas)', value: 'PPI' },
    { label: 'Escola Pública', value: 'ESCOLA_PUBLICA' },
    { label: 'Baixa Renda (até 1,5 SM)', value: 'BAIXA_RENDA' },
    { label: 'PCD (Pessoas com Deficiência)', value: 'PCD' },
    { label: 'Quilombolas', value: 'QUILOMBOLAS' },
    { label: 'Trans', value: 'TRANS' },
    { label: 'Rural/Campo', value: 'RURAL' },
];


export default function UserPreferencesSection({ preferences, onUpdate, onMatchFound }: UserPreferencesSectionProps) {
    const [formData, setFormData] = useState<Partial<UserPreferences>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<Option[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    useEffect(() => {
        if (preferences) {
            setFormData(preferences);
        }
    }, [preferences]);

    useEffect(() => {
        // Fetch courses once
        const fetchCourses = async () => {
            setCoursesLoading(true);
            const { data } = await getAvailableCoursesService();
            if (data) {
                setAvailableCourses(data.map(c => ({ label: c, value: c })));
            }
            setCoursesLoading(false);
        };
        fetchCourses();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (field: keyof UserPreferences, selected: string[]) => {
        setFormData(prev => ({ ...prev, [field]: selected }));
    };

    const handleSave = async () => {
        setLoading(true);
        const { data, error } = await updateUserPreferencesService(formData);

        if (data) {
            onUpdate(data);
            setIsEditing(false);
        } else {
            console.error(error);
        }
        setLoading(false);
    };

    const handleMatch = async () => {
        setLoading(true);
        
        // Ensure we save current preferences first? Or just use what is in formData usually?
        // Let's use formData to be immediate.
        
        const params: MatchOpportunitiesParams = {
            course_interests: formData.course_interest && formData.course_interest.length > 0 ? formData.course_interest : null,
            enem_score: formData.enem_score || null,
            income_per_capita: formData.family_income_per_capita || null,
            quota_types: formData.quota_types && formData.quota_types.length > 0 ? formData.quota_types : null,
            preferred_shifts: formData.preferred_shifts && formData.preferred_shifts.length > 0 ? formData.preferred_shifts : null,
            program_preference: formData.program_preference || null,
            user_lat: null, // location not implemented in UI yet
            user_long: null,
            city_name: formData.location_preference || null,
            page_size: 145,
            page_number: 0
        };

        const { data, error } = await matchOpportunitiesService(params);
        setLoading(false);

        if (error) {
            alert('Erro ao buscar matches: ' + error.message);
        } else if (data) {
            console.log('Match Results:', data);
            
            // Extract IDs
            const ids = data.map((item: any) => item.course_id || item.id).filter(Boolean);
            
            if (ids.length > 0) {
               if (onMatchFound) {
                   onMatchFound(ids);
               } else {
                   alert(`Encontrados ${data.length} cursos correspondentes via Match! Detalhes no console.`);
               }
            } else {
                alert('Nenhum curso encontrado com esses critérios. Tente flexibilizar seus filtros.');
            }
        }
    };

    return (
        <div className={`bg-white/30 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-6 md:p-8 ${montserrat.className}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-[#E0F2FE] rounded-lg text-[#024F86]">
                        <Settings size={24} />
                     </div>
                    <div>
                        <h2 className="text-xl font-bold text-[#024F86]">Preferências de Busca</h2>
                        <p className="text-sm text-[#636E7C]">Personalize seus critérios para o algortimo de match.</p>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Match Button */}
                    <button
                        onClick={handleMatch}
                        disabled={loading}
                        className="flex-1 md:flex-none px-4 py-2 bg-[#1BBBCD] text-white hover:bg-[#158fa0] rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {loading ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />} 
                       Gerar Match
                    </button>

                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        disabled={loading}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${
                            isEditing 
                            ? 'bg-[#38B1E4] text-white hover:bg-[#2a9ac9] shadow-md' 
                            : 'bg-white/50 text-[#38B1E4] hover:bg-white border border-[#38B1E4]/30'
                        } disabled:opacity-50`}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : isEditing ? (
                            <>
                                <Save size={16} />
                                Salvar
                            </>
                        ) : (
                            <>
                                <Edit2 size={16} />
                                Editar
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Course Interest - MultiSelect */}
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                        <BookOpen size={14} />
                        Cursos de Interesse
                    </label>
                     {isEditing ? (
                        <MultiSelect 
                            options={availableCourses}
                            selected={formData.course_interest || []}
                            onChange={(vals) => handleMultiSelectChange('course_interest', vals)}
                            placeholder="Selecione cursos..."
                            disabled={coursesLoading}
                        />
                     ) : (
                        <ArrayDisplay items={formData.course_interest} />
                     )}
                </div>

                 {/* Enem Score */}
                 <InputField
                    label="Nota do ENEM"
                    name="enem_score"
                    value={formData.enem_score || ''}
                    onChange={handleChange}
                    type="number"
                    icon={GraduationCap}
                    placeholder="Ex: 650.50"
                    isEditing={isEditing}
                    displayValue={formData.enem_score}
                />

                {/* Family Income */}
                <InputField
                    label="Renda Per Capita (R$)"
                    name="family_income_per_capita"
                    value={formData.family_income_per_capita || ''}
                    onChange={handleChange}
                    type="number"
                    icon={DollarSign}
                    placeholder="Ex: 1500.00"
                    isEditing={isEditing}
                    displayValue={formData.family_income_per_capita ? `R$ ${formData.family_income_per_capita}` : null}
                />

                {/* University Preference */}
                <InputField
                    label="Tipo de Universidade"
                    name="university_preference"
                    value={formData.university_preference || ''}
                    onChange={handleChange}
                    icon={Users}
                    isEditing={isEditing}
                    displayValue={formData.university_preference === 'publica' ? 'Pública' : formData.university_preference === 'privada' ? 'Privada' : formData.university_preference === 'indiferente' ? 'Indiferente' : null}
                    options={[
                        { label: 'Pública', value: 'publica' },
                        { label: 'Privada', value: 'privada' },
                        { label: 'Indiferente', value: 'indiferente' }
                    ]}
                />

                {/* Program Preference */}
                <InputField
                    label="Programa de Interesse"
                    name="program_preference"
                    value={formData.program_preference || ''}
                    onChange={handleChange}
                    icon={BookOpen}
                    isEditing={isEditing}
                    displayValue={formData.program_preference ? formData.program_preference.toUpperCase() : null}
                    options={[
                        { label: 'Sisu', value: 'sisu' },
                        { label: 'Prouni', value: 'prouni' },
                        { label: 'Indiferente', value: 'indiferente' }
                    ]}
                />

                {/* Preferred Shifts - MultiSelect */}
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                        <Briefcase size={14} />
                        Turnos de Preferência
                    </label>
                     {isEditing ? (
                        <MultiSelect 
                            options={SHIFTS_OPTIONS}
                            selected={formData.preferred_shifts || []}
                            onChange={(vals) => handleMultiSelectChange('preferred_shifts', vals)}
                            placeholder="Selecione turnos..."
                        />
                     ) : (
                        <ArrayDisplay items={formData.preferred_shifts} />
                     )}
                </div>

                 {/* Quota Types - MultiSelect */}
                 <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                        <Users size={14} />
                        Cotas
                    </label>
                     {isEditing ? (
                        <MultiSelect 
                            options={QUOTA_OPTIONS}
                            selected={formData.quota_types || []}
                            onChange={(vals) => handleMultiSelectChange('quota_types', vals)}
                            placeholder="Selecione cotas..."
                        />
                     ) : (
                        <ArrayDisplay items={formData.quota_types} />
                     )}
                </div>

                 {/* Location Preference */}
                 <InputField
                    label="Cidade de Preferência"
                    name="location_preference"
                    value={formData.location_preference || ''}
                    onChange={handleChange}
                    icon={MapPin}
                    placeholder="Ex: São Paulo"
                    isEditing={isEditing}
                    displayValue={formData.location_preference}
                />

                 {/* State Preference */}
                 <InputField
                    label="Estado"
                    name="state_preference"
                    value={formData.state_preference || ''}
                    onChange={handleChange}
                    icon={MapPin}
                    placeholder="Ex: SP"
                    isEditing={isEditing}
                    displayValue={formData.state_preference}
                />

            </div>
        </div>
    );
}


