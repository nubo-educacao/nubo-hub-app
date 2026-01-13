'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, updateUserProfileService } from '@/services/supabase/profile';
import { Montserrat } from 'next/font/google';
import { User, MapPin, GraduationCap, Calendar, Save, Loader2 } from 'lucide-react';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface UserDataSectionProps {
  profile: UserProfile | null;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
  onOnboardingComplete?: () => void;
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
}

const InputField = ({ label, name, value, onChange, type = 'text', icon: Icon, placeholder, isEditing, displayValue }: InputFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-[#1BBBCD] flex items-center gap-2">
      <Icon size={14} />
      {label}
    </label>
    {isEditing ? (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all placeholder:text-gray-400"
      />
    ) : (
      <div className="text-[#3A424E] font-medium px-1">
        {displayValue || <span className="text-gray-400 italic">Não informado</span>}
      </div>
    )}
  </div>
);

export default function UserDataSection({ profile, onProfileUpdate, onOnboardingComplete }: UserDataSectionProps) {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        age: profile.age || null,
        city: profile.city || '',
        education: profile.education || '',
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    const { data, error } = await updateUserProfileService({
      full_name: formData.full_name,
      age: formData.age ? Number(formData.age) : null,
      city: formData.city,
      education: formData.education,
    });

    if (data) {
      onProfileUpdate(data);
      setIsEditing(false);
      
      // Check if all required fields are present to trigger completion
      if (data.full_name && data.age && data.city && data.education) {
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
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
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
            'Editar'
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
            placeholder="Seu nome completo" 
            isEditing={isEditing}
            displayValue={formData.full_name}
        />
        <InputField 
            label="Idade" 
            name="age" 
            value={formData.age || ''} 
            onChange={handleChange} 
            type="number" 
            icon={Calendar} 
            placeholder="Sua idade" 
            isEditing={isEditing}
            displayValue={formData.age}
        />
        <InputField 
            label="Localização" 
            name="city" 
            value={formData.city || ''} 
            onChange={handleChange} 
            icon={MapPin} 
            placeholder="Sua cidade" 
            isEditing={isEditing}
            displayValue={formData.city}
        />
        
        {/* Education Select - Using basic select for now */}
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
              className="bg-white/50 border border-white/40 focus:border-[#38B1E4] rounded-lg px-3 py-2 text-[#3A424E] outline-none transition-all"
            >
              <option value="">Selecione...</option>
              <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
              <option value="Ensino Médio Completo">Ensino Médio Completo</option>
              <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
              <option value="Ensino Superior Completo">Ensino Superior Completo</option>
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
