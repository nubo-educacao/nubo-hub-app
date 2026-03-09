'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, updateUserProfileService } from '@/services/supabase/profile';
import { Montserrat } from 'next/font/google';
import { User, MapPin, GraduationCap, Calendar, Save, Loader2, Search, Home, Hash, Building, AlertCircle } from 'lucide-react';

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

export default function UserDataSection({ profile, onProfileUpdate, onOnboardingComplete, onFormDirty, onTriggerChatMessage }: UserDataSectionProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
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

  useEffect(() => {
    if (profile) {
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
        education: profile.education || '',
        education_year: profile.education_year || '',
        birth_date: profile.birth_date || '',
      });
    }
  }, [profile]);

  const cleanZip = (zip?: string | null) => (zip || '').replace(/\D/g, '');

  const hasChanges = profile ? (
    (formData.full_name || '') !== (profile.full_name || '') ||
    String(formData.age || '') !== String(profile.age || '') ||
    (formData.city || '') !== (profile.city || '') ||
    (formData.state || '') !== (profile.state || '') ||
    cleanZip(formData.zip_code) !== cleanZip(profile.zip_code) ||
    (formData.street || '') !== (profile.street || '') ||
    (formData.street_number || '') !== (profile.street_number || '') ||
    (formData.complement || '') !== (profile.complement || '') ||
    (formData.education || '') !== (profile.education || '') ||
    (formData.education_year || '') !== (profile.education_year || '') ||
    (formData.birth_date || '') !== (profile.birth_date || '')
  ) : Object.keys(formData).length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    // Salvamos education_year mesmo se não informado (será N/A no backend ou aqui)
    // Mas para validação de UI, podemos manter opcional ou garantir que ao menos o campo existe

    setErrors(newErrors);
    return { errors: newErrors, descriptions };
  };

  const handleSave = async () => {
    const { errors: newErrors, descriptions } = validateForm();

    setLoading(true);

    const formattedName = toTitleCase((formData.full_name || '').trim());

    // Prepare updates object with only valid fields
    const updates: any = {};
    if (!newErrors.full_name) updates.full_name = formattedName;
    if (!newErrors.birth_date) {
      updates.birth_date = formData.birth_date;
      updates.age = calculateAge(formData.birth_date || '');
    }
    if (!newErrors.city) updates.city = formData.city;
    if (!newErrors.state) updates.state = formData.state;
    if (!newErrors.zip_code) updates.zip_code = (formData.zip_code || '').replace(/\D/g, '') || null;
    if (!newErrors.street) updates.street = formData.street;
    if (!newErrors.street_number) updates.street_number = formData.street_number;

    // Complement is optional and not validated for errors
    updates.complement = formData.complement;

    if (!newErrors.education) updates.education = formData.education;
    // Salva education_year sempre, se vazio vira N/A
    updates.education_year = formData.education_year || 'N/A';

    const hasValidationErrors = Object.keys(newErrors).length > 0;

    // Transição de fase controlada pelo frontend num único request para evitar race conditions
    if (!hasValidationErrors && profile?.passport_phase === 'ONBOARDING') {
      updates.onboarding_completed = true;
      updates.passport_phase = 'ASK_DEPENDENT';
    }

    const { data, error } = await updateUserProfileService(updates);
    console.log('[handleSave] updates:', updates);
    console.log('[handleSave] newErrors:', newErrors);
    console.log('[handleSave] descriptions:', descriptions);
    console.log('[handleSave] supabase response:', { data, error });

    if (data) {
      onProfileUpdate(data);

      // Update local state for formatted name if it was valid
      if (updates.full_name) {
        setFormData(prev => ({ ...prev, full_name: updates.full_name }));
      }

      if (!hasValidationErrors) {
        // Check if all required fields are present to trigger completion
        if (data.full_name && data.age && data.city && data.education && data.zip_code) {
          if (onOnboardingComplete) {
            onOnboardingComplete();
          }
        }
      }
    } else {
      console.error(error);
    }

    // Always notify Cloudinha if there are validation errors, even if partial save failed/returned no data
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

      {/* Address Section */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <h3 className="text-lg font-bold text-[#024F86] mb-4 flex items-center gap-2">
          <Home size={18} />
          Endereço
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CEP */}
          <div className="flex flex-col gap-1.5">
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
            value={formData.city || ''}
            onChange={handleChange}
            icon={MapPin}
            placeholder="Sua cidade"
            onFocus={() => setFocusedField('city')}
            onBlur={() => setFocusedField(null)}
            error={errors.city}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
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
      </div>

      {/* Education */}
      <div className="mt-6 pt-6 border-t border-white/20">
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
                  // Reset year if education doesn't require it
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

          {/* Conditional Year Field */}
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
