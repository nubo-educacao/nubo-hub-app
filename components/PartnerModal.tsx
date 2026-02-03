'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPartnerSolicitation } from '../services/supabase/partner-solicitations';

interface PartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnerModal({ isOpen, onClose }: PartnerModalProps) {
  const [institutionName, setInstitutionName] = useState('');
  const [contactName, setContactName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [howDidYouKnow, setHowDidYouKnow] = useState('');
  const [goals, setGoals] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInstitutionName('');
      setContactName('');
      setWhatsapp('');
      setEmail('');
      setHowDidYouKnow('');
      setGoals('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const hasInstitution = institutionName.trim().length > 0;
    const hasContactName = contactName.trim().length > 0;
    const hasHowDidYouKnow = howDidYouKnow.trim().length > 0;
    
    const hasValidContact = (whatsapp.replace(/\D/g, '').length >= 10) || isValidEmail(email);

    return hasInstitution && hasContactName && hasValidContact && hasHowDidYouKnow;
  };

  useEffect(() => {
    setCanSubmit(validateForm());
  }, [institutionName, contactName, whatsapp, email, howDidYouKnow]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsapp(formatPhone(e.target.value));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    
    // Simulate API call
    try {
      await createPartnerSolicitation({
        institution_name: institutionName,
        contact_name: contactName,
        whatsapp,
        email,
        how_did_you_know: howDidYouKnow,
        goals
      });
      
      toast.success('Solicitação enviada com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[500px] bg-white rounded-[24px] shadow-2xl p-6 md:p-8 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <h2 className="font-montserrat font-bold text-2xl text-[#024F86] text-center">
            Seja um parceiro Nubo
          </h2>
          <p className="font-montserrat font-medium text-sm text-[#636E7C] text-center max-w-[80%]">
            Preencha os dados abaixo e entraremos em contato para formalizar nossa parceria.
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-5">
          
          {/* Institution Name */}
          <div className="space-y-1">
            <label className="block font-montserrat font-medium text-xs text-[#636E7C] ml-1">
              Nome da instituição *
            </label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="Digite o nome da sua instituição"
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 font-montserrat text-sm text-[#3A424E] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] transition-all"
            />
          </div>

          {/* Contact Name */}
          <div className="space-y-1">
            <label className="block font-montserrat font-medium text-xs text-[#636E7C] ml-1">
              Nome do responsável *
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Com quem falaremos?"
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 font-montserrat text-sm text-[#3A424E] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Whatsapp */}
             <div className="space-y-1">
                <label className="block font-montserrat font-medium text-xs text-[#636E7C] ml-1">
                  Whatsapp *
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={handlePhoneChange}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 font-montserrat text-sm text-[#3A424E] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] transition-all"
                />
             </div>

             {/* Email */}
             <div className="space-y-1">
                <label className="block font-montserrat font-medium text-xs text-[#636E7C] ml-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 font-montserrat text-sm text-[#3A424E] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] transition-all"
                />
             </div>
          </div>
          <p className="text-[10px] text-[#94A3B8] px-1 -mt-3">
            * Pelo menos um contato é obrigatório
          </p>

          {/* How did you know */}
          <div className="space-y-1">
            <label className="block font-montserrat font-medium text-xs text-[#636E7C] ml-1">
              Como conheceu a Nubo? *
            </label>
            <textarea
              value={howDidYouKnow}
              onChange={(e) => setHowDidYouKnow(e.target.value)}
              placeholder="Indicação, redes sociais, pesquisa..."
              rows={2}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 font-montserrat text-sm text-[#3A424E] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] transition-all resize-none"
            />
          </div>

          {/* Goals */}
          <div className="space-y-1">
            <label className="block font-montserrat font-medium text-xs text-[#636E7C] ml-1">
              O que busca na parceria?
            </label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Conte um pouco sobre seus objetivos..."
              rows={3}
              className="w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 font-montserrat text-sm text-[#3A424E] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#024F86]/20 focus:border-[#024F86] transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={isLoading || !canSubmit}
            className="
              w-full flex items-center justify-center gap-2 mt-4
              bg-[#024F86] rounded-full
              py-4 px-6
              hover:bg-[#023F6B] active:bg-[#012F50]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#94A3B8]
              transition-all duration-200 shadow-lg shadow-[#024F86]/20
            "
          >
            {isLoading ? (
              <Loader2 className="animate-spin text-white" size={20} />
            ) : (
              <span className="font-montserrat font-bold text-base text-white">
                Enviar solicitação
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
