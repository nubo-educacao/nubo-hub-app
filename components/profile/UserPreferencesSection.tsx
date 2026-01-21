'use client';

import React, { useState, useEffect } from 'react';
import { UserPreferences, updateUserPreferencesService, matchOpportunitiesService, MatchOpportunitiesParams } from '@/services/supabase/preferences';
import { MultiSelect, Option } from '@/components/ui/MultiSelect';
import { Montserrat } from 'next/font/google';
import { Settings, Edit2, Save, Loader2, BookOpen, GraduationCap, MapPin, DollarSign, Users, Briefcase, Trash2, Check, Info, Calculator, Plus, X } from 'lucide-react';
import { ConcurrencyTag } from '@/types/concurrency';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { CourseAutocomplete } from '@/components/ui/CourseAutocomplete';

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

const QUOTA_OPTIONS = [
    { id: ConcurrencyTag.AMPLA_CONCORRENCIA, label: 'Ampla Concorrência', description: 'Vagas sem critérios específicos de cota.' },
    { id: ConcurrencyTag.ESCOLA_PUBLICA, label: 'Escola Pública', description: 'Para quem cursou todo o ensino médio em escola pública.' },
    { id: ConcurrencyTag.BAIXA_RENDA, label: 'Baixa Renda', description: 'Para estudantes de baixa renda familiar, conforme critérios do edital.' },
    { id: ConcurrencyTag.PPI, label: 'PPI (Pretos, Pardos e Indígenas)', description: 'Para estudantes autodeclarados pretos, pardos ou indígenas.' },
    { id: ConcurrencyTag.PRETOS_E_PARDOS, label: 'Pretos e Pardos', description: 'Para estudantes autodeclarados pretos ou pardos.' },
    { id: ConcurrencyTag.INDIGENAS, label: 'Indígenas', description: 'Para estudantes indígenas, conforme critérios específicos do edital.' },
    { id: ConcurrencyTag.QUILOMBOLAS, label: 'Quilombolas', description: 'Para estudantes pertencentes a comunidades quilombolas.' },
    { id: ConcurrencyTag.PCD, label: 'Pessoa com Deficiência (PCD)', description: 'Para pessoas com deficiência, conforme laudo exigido no edital.' },
    { id: ConcurrencyTag.TRANS, label: 'Trans / Travesti', description: 'Para pessoas trans ou travestis, quando previsto pela instituição.' },
    { id: ConcurrencyTag.RURAL, label: 'Rural / Campo', description: 'Para estudantes oriundos de áreas rurais ou do campo.' },
    { id: ConcurrencyTag.AGRICULTURA_FAMILIAR, label: 'Agricultura Familiar', description: 'Para estudantes de famílias que vivem da agricultura familiar.' },
    { id: ConcurrencyTag.REFUGIADOS, label: 'Refugiados', description: 'Para pessoas com status de refugiado reconhecido no Brasil.' },
    { id: ConcurrencyTag.CIGANOS, label: 'Ciganos', description: 'Para estudantes pertencentes a comunidades ciganas.' },
    { id: ConcurrencyTag.AUTISMO, label: 'Autismo', description: 'Para pessoas no espectro autista, quando previsto no edital.' },
    { id: ConcurrencyTag.ALTAS_HABILIDADES, label: 'Altas Habilidades', description: 'Para estudantes com altas habilidades ou superdotação.' },
    { id: ConcurrencyTag.EJA_ENCCEJA, label: 'EJA / ENCCEJA', description: 'Para quem concluiu os estudos pelo EJA ou ENCCEJA.' },
    { id: ConcurrencyTag.PROFESSOR, label: 'Professor da Rede Pública', description: 'Para professores que atuam na rede pública de ensino.' },
    { id: ConcurrencyTag.MILITAR, label: 'Militares e Familiares', description: 'Para policiais, bombeiros, militares ou seus familiares, conforme regras específicas.' },
    { id: ConcurrencyTag.EFA, label: 'Escolas Família Agrícola (EFA)', description: 'Para egressos de Escolas Família Agrícola.' },
    { id: ConcurrencyTag.PRIVACAO_LIBERDADE, label: 'Privação de Liberdade', description: 'Para pessoas em privação de liberdade ou que cumprem medidas socioeducativas.' },
    { id: ConcurrencyTag.PCD_AUDITIVA, label: 'Deficiência Auditiva / Surdos', description: 'Para pessoas com deficiência auditiva, candidatos a cursos como Letras-Libras.' },
    { id: ConcurrencyTag.ESCOLA_PRIVADA_BOLSA_INTEGRAL, label: 'Escola Privada com Bolsa', description: 'Para quem estudou em escola privada com bolsa integral.' },
    { id: ConcurrencyTag.OUTROS_ESPECIFICO, label: 'Outros Critérios Específicos', description: 'Outros critérios de cota específicos não listados acima.' },
];

// Helper for Income Calculation
const SALARIO_MINIMO = 1518.00;

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};


export default function UserPreferencesSection({ preferences, onUpdate, onMatchFound }: UserPreferencesSectionProps) {
    const [formData, setFormData] = useState<Partial<UserPreferences>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Income Calculator State
    const [familyCount, setFamilyCount] = useState<string>('');
    const [memberIncomes, setMemberIncomes] = useState<string[]>([]);
    const [socialBenefits, setSocialBenefits] = useState<string>('');
    const [alimony, setAlimony] = useState<string>('');
    const [useCalculator, setUseCalculator] = useState(false);

    useEffect(() => {
        if (useCalculator && isEditing) {
             const count = parseInt(familyCount) || 0;
             const incomes = memberIncomes.map(i => parseFloat(i.replace(',', '.'))).filter(n => !isNaN(n)).reduce((a, b) => a + b, 0);
             const benefits = parseFloat(socialBenefits.replace(',', '.')) || 0;
             const alim = parseFloat(alimony.replace(',', '.')) || 0;
             
             const totalIncome = incomes + benefits + alim;
             const perCapita = count > 0 ? totalIncome / count : 0;
             
             setFormData(prev => ({ ...prev, family_income_per_capita: perCapita }));
        }
    }, [familyCount, memberIncomes, socialBenefits, alimony, useCalculator, isEditing]);

    const handleFamilyCountChange = (val: string) => {
        setFamilyCount(val);
        const count = parseInt(val);
        if (!isNaN(count) && count > 0) {
            setMemberIncomes(prev => {
                const newIncomes = [...prev];
                if (count > prev.length) {
                    for (let i = prev.length; i < count; i++) newIncomes.push('');
                } else {
                    newIncomes.splice(count);
                }
                return newIncomes;
            });
        } else {
            setMemberIncomes([]);
        }
    };

    const handleMemberIncomeChange = (idx: number, val: string) => {
        setMemberIncomes(prev => {
            const newArr = [...prev];
            newArr[idx] = val;
            return newArr;
        });
    };

    const toggleQuota = (id: string) => {
        setFormData(prev => {
            const current = prev.quota_types || [];
            if (current.includes(id)) {
                return { ...prev, quota_types: current.filter(x => x !== id) };
            } else {
                return { ...prev, quota_types: [...current, id] };
            }
        });
    };

    useEffect(() => {
        if (preferences) {
            setFormData(preferences);
        }
    }, [preferences]);

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
            city_names: formData.location_preference ? [formData.location_preference] : null,
            state_names: formData.state_preference ? [formData.state_preference] : null,
            university_preference: formData.university_preference || null,
            page_size: 2880,
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
                
                {/* Course Interest - Autocomplete */}
                <CourseAutocomplete
                    label="Cursos de Interesse"
                    selected={formData.course_interest || []}
                    onChange={(courses) => setFormData(prev => ({ ...prev, course_interest: courses }))}
                    isEditing={isEditing}
                />

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



                 {/* Location Preference - City Autocomplete */}
                 <CityAutocomplete
                    label="Cidade de Preferência"
                    value={formData.location_preference || ''}
                    stateValue={formData.state_preference || ''}
                    onChange={(city) => {
                        if (city) {
                            setFormData(prev => ({
                                ...prev,
                                location_preference: city.name,
                                state_preference: city.state
                            }));
                        } else {
                            setFormData(prev => ({
                                ...prev,
                                location_preference: null,
                                state_preference: null
                            }));
                        }
                    }}
                    isEditing={isEditing}
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

                 {/* Quota Types - Custom Selector */}
                 <div className="flex flex-col gap-1.5 w-full md:col-span-2">
                    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
                        <Users size={14} />
                        Modalidades de Cota
                    </label>
                     {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border rounded-lg p-2 border-white/40 bg-white/30">
                            {QUOTA_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleQuota(opt.id)}
                                    className={`relative flex items-center p-3 rounded-xl border transition-all text-left group ${
                                        (formData.quota_types || []).includes(opt.id)
                                        ? 'border-[#024F86] bg-[#E0F2FE]'
                                        : 'border-white/60 bg-white/40 hover:border-[#024F86]/30'
                                    }`}
                                >
                                    <div className="flex items-center w-full min-w-0">
                                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                                            (formData.quota_types || []).includes(opt.id) ? 'border-[#024F86] bg-[#024F86]' : 'border-gray-300'
                                        }`}>
                                            {(formData.quota_types || []).includes(opt.id) && <Check size={12} className="text-white" />}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                             <span className={`text-xs font-medium leading-tight truncate ${
                                                (formData.quota_types || []).includes(opt.id) ? 'text-[#024F86]' : 'text-gray-600'
                                            }`}>
                                                {opt.label}
                                            </span>
                                        </div>
                                        
                                        {opt.description && (
                                            <div className="group/tooltip relative ml-auto shrink-0 pl-2">
                                                <Info size={14} className="text-gray-400 hover:text-[#024F86] cursor-help" />
                                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                                                    {opt.description}
                                                    <div className="absolute -bottom-1 right-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                     ) : (
                         // Transform IDs back to Labels for display
                        <div className="flex flex-wrap gap-1">
                            {formData.quota_types && formData.quota_types.length > 0 ? (
                                formData.quota_types.map((qId, idx) => {
                                    const opt = QUOTA_OPTIONS.find(o => o.id === qId);
                                    return (
                                        <span key={idx} className="bg-[#E0F2FE] text-[#024F86] text-xs px-2 py-0.5 rounded-full" title={opt?.description}>
                                            {opt?.label || qId}
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="text-gray-400 italic">Não informado</span>
                            )}
                        </div>
                     )}
                </div>

                 {/* Family Income - Advanced Calculator */}
                 <div className="flex flex-col gap-1.5 w-full md:col-span-2 bg-[#F8FAFC] p-4 rounded-xl border border-gray-100">
                     <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2 mb-2">
                        <DollarSign size={14} />
                        Renda Familiar
                     </label>
                     
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <div className="text-[#3A424E]">
                                <span className="text-sm font-medium">Renda Per Capita Atual:</span>
                                <span className="ml-2 text-lg font-bold text-[#024F86]">
                                    {formData.family_income_per_capita 
                                        ? formatCurrency(formData.family_income_per_capita)
                                        : 'Não informado'}
                                </span>
                                {formData.family_income_per_capita && (
                                    <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                        {(formData.family_income_per_capita / SALARIO_MINIMO).toFixed(2)} salários mínimos
                                    </span>
                                )}
                            </div>
                            {isEditing && !useCalculator && (
                                <button 
                                    onClick={() => setUseCalculator(true)}
                                    className="text-xs bg-[#E0F2FE] text-[#024F86] px-3 py-1.5 rounded-lg font-medium hover:bg-[#d0ebfd] transition-colors flex items-center gap-1"
                                >
                                    <Calculator size={12} />
                                    Calcular Renda
                                </button>
                            )}
                        </div>

                        {isEditing && useCalculator && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 border-t pt-4 border-gray-200">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField
                                        label="Pessoas na casa"
                                        name="familyCount"
                                        value={familyCount}
                                        onChange={(e) => handleFamilyCountChange(e.target.value)}
                                        type="number"
                                        icon={Users}
                                        placeholder="Quantas pessoas moram com você?"
                                        isEditing={true}
                                    />
                                    <InputField
                                        label="Benefícios Sociais (Bolsa Família, BPC)"
                                        name="socialBenefits"
                                        value={socialBenefits}
                                        onChange={(e) => setSocialBenefits(e.target.value)}
                                        type="number"
                                        icon={DollarSign}
                                        placeholder="Valor total"
                                        isEditing={true}
                                    />
                                    <InputField
                                        label="Pensão Alimentícia"
                                        name="alimony"
                                        value={alimony}
                                        onChange={(e) => setAlimony(e.target.value)}
                                        type="number"
                                        icon={DollarSign}
                                        placeholder="Valor total"
                                        isEditing={true}
                                    />
                                </div>

                                {memberIncomes.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-gray-600">Renda por pessoa (sem contar benefícios/pensão)</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                            {memberIncomes.map((inc, i) => (
                                                <div key={i} className="bg-white p-2 rounded-lg border border-gray-200">
                                                    <label className="text-xs text-gray-500 mb-1 block">Pessoa {i + 1}</label>
                                                    <input
                                                        type="number"
                                                        value={inc}
                                                        onChange={(e) => handleMemberIncomeChange(i, e.target.value)}
                                                        className="w-full text-sm outline-none text-[#3A424E] placeholder:text-gray-300"
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={() => setUseCalculator(false)}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                    <X size={12} />
                                    Fechar Calculadora (Manter Valor)
                                </button>
                            </div>
                        )}
                        
                        {isEditing && !useCalculator && (
                            <InputField
                                label="Editar Valor Manualmente"
                                name="family_income_per_capita"
                                value={formData.family_income_per_capita || ''}
                                onChange={handleChange}
                                type="number"
                                icon={DollarSign}
                                placeholder="R$ 0,00"
                                isEditing={true}
                            />
                        )}
                     </div>
                 </div>

            </div>

            {isEditing && (
                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => setFormData({
                            course_interest: null,
                            enem_score: null,
                            family_income_per_capita: null,
                            university_preference: null,
                            program_preference: null,
                            preferred_shifts: null,
                            quota_types: null,
                            location_preference: null,
                            state_preference: null
                        })}
                        className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
                    >
                        <Trash2 size={16} />
                        Limpar Preferências
                    </button>
                </div>
            )}
        </div>
    );
}


