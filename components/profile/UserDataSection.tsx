'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, updateUserProfileService } from '@/services/supabase/profile';
import { UserIncome, getUserIncomeService, updateUserIncomeService } from '@/services/supabase/income';
import { Montserrat } from 'next/font/google';
import { User, MapPin, GraduationCap, Calendar, Save, Loader2, Search, Home, Hash, Building, AlertCircle, DollarSign, Users, Calculator, X, Globe } from 'lucide-react';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface UserDataSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  onOnboardingComplete?: () => void;
  onFormDirty?: (state: any) => void;
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

const SALARIO_MINIMO = 1518.00;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function UserDataSection({ profile, onProfileUpdate, onOnboardingComplete, onFormDirty, onTriggerChatMessage }: UserDataSectionProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [incomeLoading, setIncomeLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Income Calculator State
  const [incomeData, setIncomeData] = useState<Partial<UserIncome>>({});
  const [familyCountStr, setFamilyCountStr] = useState<string>('');
  const [memberIncomesStr, setMemberIncomesStr] = useState<string[]>([]);
  const [socialBenefitsStr, setSocialBenefitsStr] = useState<string>('');
  const [alimonyStr, setAlimonyStr] = useState<string>('');
  const [useCalculator, setUseCalculator] = useState(false);

  useEffect(() => {
    const fetchIncome = async () => {
      setIncomeLoading(true);

      const draftStr = profile?.id ? sessionStorage.getItem(`userincome_draft_${profile.id}`) : null;
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (draft.incomeData && Object.keys(draft.incomeData).length > 0) {
            setIncomeData(draft.incomeData);
            setFamilyCountStr(draft.familyCountStr || '');
            setSocialBenefitsStr(draft.socialBenefitsStr || '');
            setAlimonyStr(draft.alimonyStr || '');
            setMemberIncomesStr(draft.memberIncomesStr || []);
            setIncomeLoading(false);
            return;
          }
        } catch (e) {}
      }

      const { data } = await getUserIncomeService();
      if (data) {
        setIncomeData(data);
        setFamilyCountStr(data.family_count?.toString() || '');
        setSocialBenefitsStr(data.social_benefits?.toString() || '');
        setAlimonyStr(data.alimony?.toString() || '');
        setMemberIncomesStr(data.member_incomes?.map(String) || []);
      }
      setIncomeLoading(false);
    };
    if (profile?.id) fetchIncome();
  }, [profile?.id]);

  useEffect(() => {
    // Save draft
    if (profile?.id && (familyCountStr || memberIncomesStr.length > 0 || Object.keys(incomeData).length > 0)) {
        sessionStorage.setItem(`userincome_draft_${profile.id}`, JSON.stringify({
            incomeData, familyCountStr, socialBenefitsStr, alimonyStr, memberIncomesStr
        }));
    }
  }, [incomeData, familyCountStr, socialBenefitsStr, alimonyStr, memberIncomesStr, profile?.id]);

  useEffect(() => {
    if (useCalculator) {
      const count = parseInt(familyCountStr) || 0;
      const incomes = memberIncomesStr.map(i => parseFloat(i.replace(',', '.'))).filter(n => !isNaN(n)).reduce((a, b) => a + b, 0);
      const benefits = parseFloat(socialBenefitsStr.replace(',', '.')) || 0;
      const alim = parseFloat(alimonyStr.replace(',', '.')) || 0;

      const totalIncome = incomes + benefits + alim;
      const perCapita = count > 0 ? totalIncome / count : 0;

      setIncomeData(prev => ({ ...prev, per_capita_income: perCapita }));
    }
  }, [familyCountStr, memberIncomesStr, socialBenefitsStr, alimonyStr, useCalculator]);

  const handleFamilyCountChange = (val: string) => {
    setFamilyCountStr(val);
    const count = parseInt(val);
    if (!isNaN(count) && count > 0) {
      setMemberIncomesStr(prev => {
        const newIncomes = [...prev];
        if (count > prev.length) {
          for (let i = prev.length; i < count; i++) newIncomes.push('');
        } else {
          newIncomes.splice(count);
        }
        return newIncomes;
      });
    } else {
      setMemberIncomesStr([]);
    }
  };

  const handleMemberIncomeChange = (idx: number, val: string) => {
    setMemberIncomesStr(prev => {
      const newArr = [...prev];
      newArr[idx] = val;
      return newArr;
    });
  };

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
          income: incomeData,
          focused_field: focusedField
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData, incomeData, focusedField, onFormDirty]);

  useEffect(() => {
    if (profile) {
      const draftStr = sessionStorage.getItem(`userdata_draft_${profile.id}`);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (Object.keys(draft).length > 0) {
            setFormData(draft);
            return;
          }
        } catch(e) {}
      }

      let formattedZip = profile.zip_code || '';
      if (formattedZip.length === 8 && !formattedZip.includes('-')) {
        formattedZip = formattedZip.slice(0, 5) + '-' + formattedZip.slice(5, 8);
      }
      setFormData({
        full_name: profile.full_name || '',
        age: profile.age || null,
        city: profile.city || '',
        state: profile.state || '',
        zip_code: formattedZip,
        street: profile.street || '',
        street_number: profile.street_number || '',
        complement: profile.complement || '',
        neighborhood: profile.neighborhood || '',
        country: profile.country || '',
        education: profile.education || '',
        education_year: profile.education_year || '',
        birth_date: profile.birth_date || '',
        outside_brazil: profile.outside_brazil || false,
      });
    }
  }, [profile]);

  useEffect(() => {
      // Save form draft
      if (profile?.id && Object.keys(formData).length > 0) {
          sessionStorage.setItem(`userdata_draft_${profile.id}`, JSON.stringify(formData));
      }
  }, [formData, profile?.id]);

  const cleanZip = (zip?: string | null) => (zip || '').replace(/\D/g, '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when typing
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
        neighborhood: result.bairro || prev.neighborhood || '',
        street: result.logradouro || prev.street || '',
      }));
    } else {
      setCepError('CEP não encontrado');
    }

    setCepLoading(false);
  }, []);

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');

    // Format as 00000-000
    let formatted = raw;
    if (raw.length > 5) {
      formatted = raw.slice(0, 5) + '-' + raw.slice(5, 8);
    }

    setFormData(prev => ({ ...prev, zip_code: formatted }));
    setCepError(null);

    // Auto-lookup when 8 digits
    if (raw.length === 8) {
      handleCEPLookup(raw);
    }
  };

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

    // Education
    if (!formData.education) {
      newErrors.education = true;
      descriptions.push('Escolaridade não selecionada');
    }

    // Address
    const missingAddress: string[] = [];
    if (formData.outside_brazil) {
      if (!formData.country) { newErrors.country = true; missingAddress.push('País'); }
      if (!formData.city) { newErrors.city = true; missingAddress.push('Cidade'); }
      if (!formData.street) { newErrors.street = true; missingAddress.push('Endereço'); }
    } else {
      if (!formData.zip_code || formData.zip_code.replace(/\D/g, '').length < 8) { newErrors.zip_code = true; missingAddress.push('CEP'); }
      if (!formData.state) { newErrors.state = true; missingAddress.push('Estado'); }
      if (!formData.city) { newErrors.city = true; missingAddress.push('Cidade'); }
      if (!formData.neighborhood) { newErrors.neighborhood = true; missingAddress.push('Bairro'); }
      if (!formData.street) { newErrors.street = true; missingAddress.push('Rua'); }
      if (!formData.street_number) { newErrors.street_number = true; missingAddress.push('Número'); }
    }

    if (missingAddress.length > 0) {
      descriptions.push(`Endereço incompleto (faltando: ${missingAddress.join(', ')})`);
    }

    setErrors(newErrors);
    return { errors: newErrors, descriptions };
  };

  const handleSave = async () => {
    const { errors: newErrors, descriptions } = validateForm();

    setLoading(true);

    const formattedName = toTitleCase((formData.full_name || '').trim());

    // Prepare updates object with only valid fields
    const profileUpdates: any = {
      outside_brazil: formData.outside_brazil
    };
    if (!newErrors.full_name) profileUpdates.full_name = formattedName;
    if (!newErrors.birth_date) {
      profileUpdates.birth_date = formData.birth_date;
      profileUpdates.age = calculateAge(formData.birth_date || '');
    }
    if (!newErrors.city) profileUpdates.city = formData.city;
    if (!newErrors.education) profileUpdates.education = formData.education;
    profileUpdates.education_year = formData.education_year || 'N/A';

    if (formData.outside_brazil) {
      if (!newErrors.country) profileUpdates.country = formData.country;
      if (!newErrors.street) profileUpdates.street = formData.street;
      profileUpdates.zip_code = null;
      profileUpdates.state = null;
      profileUpdates.neighborhood = null;
      profileUpdates.street_number = null;
      profileUpdates.complement = null;
    } else {
      if (!newErrors.state) profileUpdates.state = formData.state;
      if (!newErrors.zip_code) profileUpdates.zip_code = (formData.zip_code || '').replace(/\D/g, '') || null;
      if (!newErrors.neighborhood) profileUpdates.neighborhood = formData.neighborhood;
      if (!newErrors.street) profileUpdates.street = formData.street;
      if (!newErrors.street_number) profileUpdates.street_number = formData.street_number;
      profileUpdates.complement = formData.complement;
      profileUpdates.country = 'Brasil';
    }

    const hasValidationErrors = Object.keys(newErrors).length > 0;

    if (!hasValidationErrors && profile?.passport_phase === 'ONBOARDING') {
      profileUpdates.onboarding_completed = true;
      profileUpdates.passport_phase = 'ASK_DEPENDENT';
    }

    const incomeUpdates = {
      family_count: parseInt(familyCountStr) || null,
      social_benefits: parseFloat(socialBenefitsStr.replace(',', '.')) || null,
      alimony: parseFloat(alimonyStr.replace(',', '.')) || null,
      member_incomes: memberIncomesStr.map(i => parseFloat(i.replace(',', '.'))).filter(n => !isNaN(n)),
      per_capita_income: incomeData.per_capita_income || null,
    };

    const [profileRes, incomeRes] = await Promise.all([
      updateUserProfileService(profileUpdates),
      updateUserIncomeService(incomeUpdates as UserIncome)
    ]);

    if (profileRes.error) console.error('Error saving profile:', profileRes.error);
    if (incomeRes.error) console.error('Error saving income:', incomeRes.error);

    if (profileRes.data) {
      if (profile?.id) {
        sessionStorage.removeItem(`userdata_draft_${profile.id}`);
        sessionStorage.removeItem(`userincome_draft_${profile.id}`);
      }
      onProfileUpdate(profileRes.data);

      if (profileUpdates.full_name) {
        setFormData(prev => ({ ...prev, full_name: profileUpdates.full_name }));
      }

      if (!hasValidationErrors) {
        const isComplete = formData.outside_brazil 
          ? (profileRes.data.full_name && profileRes.data.age && profileRes.data.country && profileRes.data.city && profileRes.data.street && profileRes.data.education)
          : (profileRes.data.full_name && profileRes.data.age && profileRes.data.city && profileRes.data.education && profileRes.data.zip_code);
        
        if (isComplete && onOnboardingComplete) {
          onOnboardingComplete();
        }
      }
    }

    if (hasValidationErrors && onTriggerChatMessage) {
      const message = `Tentei salvar meu formulário mas alguns campos estão com problema: ${descriptions.join(', ')}. O que preciso corrigir?`;
      onTriggerChatMessage(message);
    }

    setLoading(false);
  };

  return (
    <div className={`bg-transparent md:bg-white/30 backdrop-blur-md md:border border-white/20 md:shadow-lg md:rounded-2xl p-4 md:p-8 ${montserrat.className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#024F86]">Dados do Usuário</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField
          label="Nome Completo"
          name="full_name"
          value={formData.full_name || ''}
          onChange={handleChange}
          icon={User}
          placeholder="Seu nome completo"
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
          placeholder="Sua data de nascimento"
          onFocus={() => setFocusedField('birth_date')}
          onBlur={() => setFocusedField(null)}
          error={errors.birth_date}
        />
      </div>

      {/* Education - Moved Up */}
      <div className="mt-4 pt-4 border-t border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  education_year: (val === 'Ensino Fundamental' || val === 'Ensino Médio Incompleto')
                    ? prev.education_year
                    : ''
                }));
              }}
              onFocus={() => setFocusedField('education')}
              onBlur={() => setFocusedField(null)}
              className={`bg-white/50 border focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all w-full h-[42px]
                ${errors.education
                  ? 'border-red-400 hover:border-red-500 bg-red-50/10'
                  : 'border-white/40 hover:border-white/60'
                }`}
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

          {(formData.education === 'Ensino Fundamental' || formData.education === 'Ensino Médio Incompleto') && (
            <div className="flex flex-col gap-1.5">
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
                className={`bg-white/50 border focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all w-full h-[42px]
                  ${errors.education_year
                    ? 'border-red-400 hover:border-red-500 bg-red-50/10'
                    : 'border-white/40 hover:border-white/60'
                  }`}
              >
                <option value="">Selecione o ano...</option>
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
      </div>

      {/* Income Section */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <h3 className="text-lg font-bold text-[#024F86] mb-4 flex items-center gap-2">
          <DollarSign size={18} />
          Informações de Renda
        </h3>
        {incomeLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-[#38B1E4]" /></div>
        ) : (
          <div className="flex flex-col gap-4 w-full bg-[#F8FAFC] p-4 rounded-xl border border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-[#3A424E]">
                <span className="text-sm font-medium">Renda Per Capita Atual: </span>
                <span className="ml-2 text-lg font-bold text-[#024F86]">
                  {incomeData.per_capita_income != null
                    ? formatCurrency(incomeData.per_capita_income)
                    : 'Não informada'}
                </span>
                {incomeData.per_capita_income != null && (
                  <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full whitespace-nowrap">
                    {(incomeData.per_capita_income / SALARIO_MINIMO).toFixed(2)} salários mínimos
                  </span>
                )}
              </div>
              {!useCalculator && (
                <button
                  onClick={() => setUseCalculator(true)}
                  className="text-xs bg-[#E0F2FE] text-[#024F86] px-3 py-1.5 rounded-lg font-medium hover:bg-[#d0ebfd] transition-colors flex items-center gap-1"
                >
                  <Calculator size={12} />
                  Calcular Renda
                </button>
              )}
            </div>

            {useCalculator && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 border-t pt-4 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Pessoas na casa"
                    name="familyCount"
                    value={familyCountStr}
                    onChange={(e) => handleFamilyCountChange(e.target.value)}
                    type="number"
                    icon={Users}
                    placeholder="Quantas pessoas moram com você?"
                  />
                  <InputField
                    label="Benefícios Sociais (Bolsa Família, etc)"
                    name="socialBenefits"
                    value={socialBenefitsStr}
                    onChange={(e) => setSocialBenefitsStr(e.target.value)}
                    type="number"
                    icon={DollarSign}
                    placeholder="Valor total"
                  />
                  <InputField
                    label="Pensão Alimentícia"
                    name="alimony"
                    value={alimonyStr}
                    onChange={(e) => setAlimonyStr(e.target.value)}
                    type="number"
                    icon={DollarSign}
                    placeholder="Valor total"
                  />
                </div>

                {memberIncomesStr.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-600">Renda por pessoa (sem contar benefícios/pensão)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {memberIncomesStr.map((inc, i) => (
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
                  className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 mt-2"
                >
                  <X size={12} />
                  Ocultar Calculadora (Manter Valor)
                </button>
              </div>
            )}

            {!useCalculator && (
              <div className="grid grid-cols-1 md:grid-cols-2">
                <InputField
                  label="Editar Valor Permanentemente (Manual)"
                  name="per_capita_income"
                  value={incomeData.per_capita_income || ''}
                  onChange={(e) => setIncomeData(prev => ({ ...prev, per_capita_income: parseFloat(e.target.value) || null }))}
                  type="number"
                  icon={DollarSign}
                  placeholder="R$ 0,00"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Address Section */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#024F86] flex items-center gap-2">
            <Home size={18} />
            Endereço
          </h3>
          <div className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              id="outside_brazil"
              name="outside_brazil"
              checked={formData.outside_brazil || false}
              onChange={handleChange}
              className="w-4 h-4 border-white/40 bg-white/50 text-[#38B1E4] rounded focus:ring-[#38B1E4] focus:ring-2 focus:ring-offset-1 accent-[#38B1E4] cursor-pointer outline-none transition-all"
            />
            <label htmlFor="outside_brazil" className="text-sm font-semibold text-[#1BBBCD] hover:text-[#024F86] cursor-pointer transition-colors flex items-center gap-1.5">
              <Globe size={14} />
              Não moro no Brasil
            </label>
          </div>
        </div>

        {formData.outside_brazil ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="País"
              name="country"
              value={formData.country || ''}
              onChange={handleChange}
              icon={Globe}
              placeholder="Ex: Estados Unidos"
              onFocus={() => setFocusedField('country')}
              onBlur={() => setFocusedField(null)}
              error={errors.country}
            />
            <InputField
              label="Cidade"
              name="city"
              value={formData.city || ''}
              onChange={handleChange}
              icon={Building}
              placeholder="Ex: Nova Iorque"
              onFocus={() => setFocusedField('city')}
              onBlur={() => setFocusedField(null)}
              error={errors.city}
            />
            <InputField
              label="Endereço Completo"
              name="street"
              className="md:col-span-2"
              value={formData.street || ''}
              onChange={handleChange}
              icon={Home}
              placeholder="Rua, número, complemento, etc."
              onFocus={() => setFocusedField('street')}
              onBlur={() => setFocusedField(null)}
              error={errors.street}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* CEP */}
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className={`text-sm font-semibold flex items-center gap-2 ${errors.zip_code ? 'text-red-500' : 'text-[#1BBBCD]'}`}>
                  <MapPin size={14} />
                  CEP
                  {errors.zip_code && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="zip_code"
                    value={formData.zip_code || ''}
                    onChange={handleCEPChange}
                    placeholder="00000-000"
                    maxLength={9}
                    onFocus={() => setFocusedField('zip_code')}
                    onBlur={() => setFocusedField(null)}
                    className={`bg-white/50 border focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all placeholder:text-gray-400 w-full pr-10
                      ${errors.zip_code
                        ? 'border-red-400 hover:border-red-500 bg-red-50/10'
                        : 'border-white/40 group-hover:border-white/60'
                      }`}
                  />
                  {cepLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-[#38B1E4]" />
                    </div>
                  )}
                  {!cepLoading && (
                    <button
                      type="button"
                      onClick={() => handleCEPLookup(formData.zip_code || '')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#38B1E4] hover:text-[#2a9ac9] transition-colors"
                      title="Buscar CEP"
                    >
                      <Search size={16} />
                    </button>
                  )}
                  {cepError && (
                    <p className="text-red-500 text-xs mt-1">{cepError}</p>
                  )}
                </div>
              </div>

              {/* State */}
              <InputField
                label="Estado"
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                icon={Building}
                placeholder="UF"
                maxLength={2}
                onFocus={() => setFocusedField('state')}
                onBlur={() => setFocusedField(null)}
                error={errors.state}
              />

              {/* City */}
              <InputField
                label="Cidade"
                name="city"
                className="md:col-span-2"
                value={formData.city || ''}
                onChange={handleChange}
                icon={MapPin}
                placeholder="Sua cidade"
                onFocus={() => setFocusedField('city')}
                onBlur={() => setFocusedField(null)}
                error={errors.city}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
              {/* Bairro */}
              <InputField
                label="Bairro"
                name="neighborhood"
                value={formData.neighborhood || ''}
                onChange={handleChange}
                icon={MapPin}
                placeholder="Seu bairro"
                className="md:col-span-1"
                onFocus={() => setFocusedField('neighborhood')}
                onBlur={() => setFocusedField(null)}
                error={errors.neighborhood}
              />

              {/* Street */}
              <InputField
                label="Rua"
                name="street"
                value={formData.street || ''}
                onChange={handleChange}
                icon={Home}
                placeholder="Nome da rua"
                className="md:col-span-1"
                onFocus={() => setFocusedField('street')}
                onBlur={() => setFocusedField(null)}
                error={errors.street}
              />

              {/* Number */}
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

              {/* Complement */}
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
          </>
        )}
      </div>

      <div className="mt-8 flex justify-end border-t border-white/20 pt-6">
        <button
          onClick={handleSave}
          disabled={loading || incomeLoading}
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
    </div>
  );
}
