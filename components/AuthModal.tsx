'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AuthModal() {
  const router = useRouter();
  const { isAuthModalOpen, closeAuthModal, signInWithWhatsapp, signInWithDemo, verifyOtp, pendingAction, setPendingAction } = useAuth();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // DEMO MODE CONFIGURATION
  const IS_DEMO_MODE = false;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('PHONE');
      setPhone('');
      setOtp('');
      setError(null);
      setAcceptedTerms(false);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const formatPhone = (value: string) => {
    // Remove non-digits
    const numbers = value.replace(/\D/g, '');
    
    // Limit to 11 digits (DDD + 9 digits)
    const limited = numbers.slice(0, 11);
    
    // Apply mask: (XX) XXXXX-XXXX
    if (limited.length <= 2) return limited;
    if (limited.length <= 7) return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
    setError(null);
  };

  const handleSendCode = async () => {
    if (!acceptedTerms) {
      setError('Você precisa aceitar os termos para continuar.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      setError('Por favor, insira um número de telefone válido.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Format to E.164: +55 + DDD + Number
    const formattedPhone = `+55${cleanPhone}`;

    try {
      if (IS_DEMO_MODE) {
        // Demo Mode: Direct Login
        const { error } = await signInWithDemo(formattedPhone);
        if (error) throw error;
        
        // If we have a pending chat action, keep loading (spinner) until redirect happens
        if (pendingAction?.type === 'chat') {
           // Do nothing, keep spinner. The ChatBox component will handle redirect.
           // The modal will be closed by the destination page (ChatPage)
        } else if (pendingAction?.type === 'redirect') {
            router.push(pendingAction.payload.url);
            setPendingAction(null);
            closeAuthModal();
        } else {
           closeAuthModal();
        }
      } else {
        // Production Mode: WhatsApp OTP
        const { error } = await signInWithWhatsapp(formattedPhone);
        if (error) throw error;
        setStep('OTP');
        setIsLoading(false); // Stop loading for OTP step
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.message || 'Erro ao enviar código. Tente novamente.';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (otp.length !== 6) {
      setError('O código deve ter 6 dígitos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = `+55${cleanPhone}`;

    try {
      const { error } = await verifyOtp(formattedPhone, otp);
      if (error) throw error;
      
      // If we have a pending chat action, keep loading (spinner) until redirect happens
      if (pendingAction?.type === 'chat') {
          // Do nothing, keep spinner.
      } else {
          // AuthContext usually handles this
      }
    } catch (err: any) {
      console.error(err);
      setError('Código inválido ou expirado. Verifique e tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-[342px] bg-white rounded-[16px] shadow-2xl p-6 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-1 mb-6">
          <h2 className="font-montserrat font-semibold text-[16px] leading-[24px] text-[#38B1E4] text-center">
            {step === 'PHONE' ? 'Entre no Nubo' : 'Verifique seu número'}
          </h2>
          <p className="font-montserrat font-medium text-[14px] leading-[17.5px] text-[#707A7E] text-center w-[270px]">
            {step === 'PHONE' 
              ? 'Entre sem senha. Rápido e seguro.' 
              : `Enviamos um código para ${phone}`
            }
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {step === 'PHONE' ? (
            <>
              {/* Phone Input */}
              <div>
                {/* 
                   Figma Design:
                   - Blue Border (#38B1E4)
                   - Brazil Flag +55 inside input
                   - Placeholder "Seu número" (user requested "Seu número" implied by image, or standard masking? 
                     User said: "Input de Whatsapp deve ter outline azul", "icon brasil", "+55 antes". 
                     The original placeholder was "(11) ...".
                     I'll keep the mask placeholder but add the prefix visually.
                */}
                <div className="relative group">
                  <div className={`
                    w-full bg-white border border-[#38B1E4] rounded-[8px] 
                    px-3 py-2 flex items-center gap-2 h-[45px]
                    focus-within:ring-1 focus-within:ring-[#38B1E4]
                    transition-all
                  `}>
                     {/* Brazil Flag and Prefix */}
                     <div className="flex items-center gap-2 shrink-0">
                        <div className="relative w-6 h-6 overflow-hidden rounded-full border border-neutral-100">
                          <Image 
                            src="/assets/brasil.png" 
                            alt="Brasil" 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <span className="font-montserrat font-medium text-[16px] text-[#3A424E]">+55</span>
                     </div>

                     <div className="h-4 w-[1px] bg-neutral-200 mx-1"></div>

                     {/* Input Field */}
                     <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(DD) 99999-9999"
                      className="w-full bg-transparent border-none p-0 font-montserrat font-medium text-[16px] text-[#AEAEB2] placeholder-[#D1D1D6] focus:outline-none focus:ring-0 text-[#3A424E]"
                    />
                  </div>
                </div>
              </div>

              {/* Terms Checkbox - Custom Style */}
              <div className="flex items-start gap-2 px-1">
                 <div className="relative flex items-center pt-1">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-[#38B1E4] bg-white transition-all checked:bg-[#38B1E4] checked:border-[#38B1E4]"
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ml-[0.5px] mt-[2px] opacity-0 peer-checked:opacity-100 transition-opacity">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                 </div>
                <label htmlFor="terms" className="text-[11px] font-montserrat font-medium text-[#707A7E] leading-tight select-none cursor-pointer">
                  Li e concordo com os <a href="#" className="text-[#38B1E4] hover:underline">Termos de Serviço</a> e <a href="#" className="text-[#38B1E4] hover:underline">Política de Privacidade</a>.
                </label>
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-red-500 text-xs text-center font-montserrat">
                  {error}
                </div>
              )}

              {/* Action Button - Figma Style */}
              <button 
                onClick={handleSendCode}
                disabled={isLoading || !phone || !acceptedTerms}
                className="
                  w-full flex items-center justify-center gap-[10px] 
                  bg-white border border-[#38B1E4] rounded-[8px] 
                  py-2 px-[10px] h-[38px]
                  hover:bg-[#38B1E4]/5 active:bg-[#38B1E4]/10 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:border-neutral-200
                  transition-all duration-200 group
                "
              >
                {isLoading ? (
                  <Loader2 className="animate-spin text-[#38B1E4]" size={20} />
                ) : (
                  <div className="relative w-[20px] h-[20px]">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382C17.119 14.205 15.385 13.351 15.061 13.234C14.736 13.117 14.5 13.058 14.264 13.411C14.029 13.765 13.351 14.56 13.145 14.795C12.939 15.03 12.732 15.059 12.379 14.882C12.0284 14.7061 10.8932 14.3339 9.549 13.135C8.497 12.197 7.786 11.039 7.58 10.686C7.374 10.332 7.558 10.141 7.734 9.966C7.893 9.808 8.087 9.559 8.264 9.353C8.441 9.147 8.5 8.999 8.618 8.764C8.736 8.529 8.677 8.323 8.588 8.146C8.5 7.97 7.793 6.234 7.5 5.528C7.214 4.841 6.925 4.934 6.703 4.924C6.496 4.914 6.26 4.905 6.024 4.905C5.789 4.905 5.405 4.993 5.081 5.346C4.757 5.7 3.843 6.554 3.843 8.291C3.843 10.028 5.11 11.706 5.287 11.942C5.464 12.177 7.784 15.753 11.455 17.34C13.626 18.279 14.484 18.106 15.192 18.041C16.142 17.954 17.653 17.148 17.969 16.259C18.286 15.369 18.286 14.606 18.196 14.453C18.109 14.301 17.873 14.205 17.472 14.382ZM12.076 21.849C10.273 21.849 8.591 21.373 7.126 20.534L6.812 20.347L3 21.347L4.053 17.653L3.845 17.323C2.909 15.834 2.414 14.076 2.414 12.271C2.414 6.958 6.744 2.636 12.08 2.636C14.662 2.637 17.086 3.642 18.911 5.464C20.735 7.286 21.739 9.709 21.739 12.274C21.739 17.585 17.408 21.849 12.076 21.849Z" fill="#38B1E4"/>
                     </svg>
                  </div>
                )}
                <span className="font-montserrat font-semibold text-[14px] text-[#38B1E4]">
                  Receber código no Whatsapp
                </span>
              </button>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <div className="space-y-1">
                <label className="block font-montserrat font-medium text-[12px] leading-[15px] text-[#3A424E] ml-1">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    setError(null);
                  }}
                  placeholder="000000"
                  className="w-full bg-white border border-[#38B1E4] rounded-[8px] px-3 py-2 font-montserrat font-medium text-[20px] tracking-widest text-center text-[#3A424E] placeholder-[#D1D1D6] focus:outline-none focus:ring-1 focus:ring-[#38B1E4] focus:border-[#38B1E4] transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-100 rounded-lg text-red-500 text-xs text-center font-montserrat">
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button 
                onClick={handleVerifyCode}
                disabled={isLoading || otp.length !== 6}
                className="
                  w-full flex items-center justify-center gap-[10px] 
                  bg-[#38B1E4] rounded-[8px] 
                  py-2 px-[10px] h-[38px]
                  hover:bg-[#2fa0ce] active:bg-[#2892C8]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {isLoading ? (
                  <Loader2 className="animate-spin text-white" size={20} />
                ) : (
                  <Check size={20} className="text-white" />
                )}
                <span className="font-montserrat font-semibold text-[16px] text-white">
                  Confirmar
                </span>
              </button>

              <button 
                onClick={() => setStep('PHONE')}
                className="w-full text-[#707A7E] hover:text-[#38B1E4] text-[12px] font-montserrat font-medium transition-colors"
              >
                Voltar e corrigir número
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
