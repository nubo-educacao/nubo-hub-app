'use client';

import React from 'react';
import { X, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
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
          <h2 className="text-2xl font-bold text-white mb-2">Entre no Nubo</h2>
          <p className="text-neutral-400">Crie sua conta gratuita para continuar</p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3 mb-6">
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-xl py-3 px-4 transition-all duration-200 font-medium"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continuar com Google
          </button>
          
          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-800 rounded-xl py-3 px-4 transition-all duration-200 font-medium"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            Continuar com GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1A1A1A] text-neutral-500">OU</span>
          </div>
        </div>

        {/* Email Button */}
        <button 
          onClick={login}
          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black rounded-xl py-3 px-4 transition-all duration-200 font-bold"
        >
          <Mail size={20} />
          Continuar com Email
        </button>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          Ao continuar, você concorda com nossos <a href="#" className="underline hover:text-neutral-300">Termos de Serviço</a> e <a href="#" className="underline hover:text-neutral-300">Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}
