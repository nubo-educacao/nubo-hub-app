'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, updateUserProfileService } from '@/services/supabase/profile';
import { Montserrat } from 'next/font/google';
import { User, MapPin, GraduationCap, Calendar, Save, Loader2, Search, Home, Hash, Building } from 'lucide-react';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface UserDataSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  onOnboardingComplete?: () => void;
  onFormDirty?: (state: any) => void;
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
}

const InputField = ({ label, name, value, onChange, type = 'text', icon: Icon, placeholder, maxLength, className, suffix, onFocus, onBlur }: InputFieldProps) => (
  <div className={`flex flex-col gap-1.5 ${className || ''}`}>
    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
      <Icon size={14} />
      {label}
    </label>
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

export default function UserDataSection({ profile, onProfileUpdate, onOnboardingComplete, onFormDirty }: UserDataSectionProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
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
    (formData.education || '') !== (profile.education || '')
  ) : Object.keys(formData).length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await updateUserProfileService({
      full_name: formData.full_name,
      age: formData.age ? Number(formData.age) : null,
      city: formData.city,
      state: formData.state,
      zip_code: (formData.zip_code || '').replace(/\D/g, '') || null,
      street: formData.street,
      street_number: formData.street_number,
      complement: formData.complement,
      education: formData.education,
    });

    if (data) {
      onProfileUpdate(data);

      // Check if all required fields are present to trigger completion
      if (data.full_name && data.age && data.city && data.education && data.zip_code) {
        if (onOnboardingComplete) {
          onOnboardingComplete();
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
        <h2 className="text-2xl font-bold text-[#024F86]">Dados do Usuário</h2>
        {hasChanges && (
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
        )}
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
        />
        <InputField
          label="Idade"
          name="age"
          value={formData.age || ''}
          onChange={handleChange}
          type="number"
          icon={Calendar}
          placeholder="Sua idade"
          onFocus={() => setFocusedField('age')}
          onBlur={() => setFocusedField(null)}
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
            <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
              <MapPin size={14} />
              CEP
            </label>
            <div className="relative">
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code || ''}
                onChange={handleCEPChange}
                placeholder="00000-000"
                maxLength={9}
                onFocus={() => setFocusedField('zip_code')}
                onBlur={() => setFocusedField(null)}
                className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all placeholder:text-gray-400 w-full pr-10"
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
            <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
              <GraduationCap size={14} />
              Escolaridade
            </label>
            <select
              name="education"
              value={formData.education || ''}
              onChange={handleChange}
              onFocus={() => setFocusedField('education')}
              onBlur={() => setFocusedField(null)}
              className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all"
            >
              <option value="">Selecione...</option>
              <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
              <option value="Ensino Médio Completo">Ensino Médio Completo</option>
              <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
              <option value="Ensino Superior Completo">Ensino Superior Completo</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
