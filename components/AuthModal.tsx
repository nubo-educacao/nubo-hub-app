'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signInWithWhatsapp, signInWithDemo, verifyOtp, pendingAction } = useAuth();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // DEMO MODE CONFIGURATION
  const IS_DEMO_MODE = true;

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
      setError(err.message || 'Erro ao enviar código. Tente novamente.');
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
          // closeAuthModal(); // AuthContext usually handles this, but we can enforce logic here if needed
          // Actually verifyOtp in AuthContext calls closeAuthModal. 
          // We might need to modify AuthContext or just rely on the fact that if it closes, it closes.
          // But wait, verifyOtp in AuthContext DOES call setIsAuthModalOpen(false).
          // So we can't control it easily from here unless we change AuthContext.
          // However, for Demo Mode (signInWithDemo), AuthContext does NOT close it.
          // So the change above for Demo Mode is correct.
          // For verifyOtp, we might need to check AuthContext.
      }
    } catch (err: any) {
      console.error(err);
      setError('Código inválido ou expirado. Verifique e tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeAuthModal}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#1A1A1A] border border-neutral-800 rounded-2xl shadow-2xl p-8 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button 
          onClick={closeAuthModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 'PHONE' ? 'Entre no Nubo' : 'Verifique seu número'}
          </h2>
          <p className="text-neutral-400">
            {step === 'PHONE' 
              ? 'Use seu WhatsApp para entrar ou criar conta' 
              : `Enviamos um código para ${phone}`
            }
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {step === 'PHONE' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">WhatsApp</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-neutral-900"
                  />
                </div>
                <label htmlFor="terms" className="text-xs text-neutral-400 leading-tight">
                  Li e concordo com os <a href="#" className="text-blue-400 hover:underline">Termos de Serviço</a> e <a href="#" className="text-blue-400 hover:underline">Política de Privacidade</a>.
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button 
                onClick={handleSendCode}
                disabled={isLoading || !phone || !acceptedTerms}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl py-3 px-4 transition-all duration-200"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-5 h-5" />}
                Receber código no WhatsApp
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Código de Verificação</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    setError(null);
                  }}
                  placeholder="000000"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button 
                onClick={handleVerifyCode}
                disabled={isLoading || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl py-3 px-4 transition-all duration-200"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Confirmar
              </button>

              <button 
                onClick={() => setStep('PHONE')}
                className="w-full text-neutral-500 hover:text-white text-sm transition-colors"
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
