'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isAuthenticated, openAuthModal, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center text-[#38B1E4] font-bold text-2xl">
            ☁️
          </div>
          <span className="text-neutral-900 font-bold text-xl tracking-tight">Nubo educação</span>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-12">
          <Link href="#" className="text-neutral-600 hover:text-[#38B1E4] transition-colors text-base font-medium">
            Oportunidades
          </Link>
          <Link href="#" className="text-neutral-600 hover:text-[#38B1E4] transition-colors text-base font-medium">
            Instituições
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-neutral-600 text-sm hidden md:inline">Bem-vindo!</span>
              <button 
                onClick={logout}
                className="text-neutral-600 hover:text-[#38B1E4] text-sm font-medium transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={openAuthModal}
                className="px-6 py-2 rounded-full border border-[#38B1E4] text-[#38B1E4] hover:bg-[#38B1E4]/10 text-base font-bold transition-colors"
              >
                Login
              </button>
              <button 
                onClick={openAuthModal}
                className="bg-[#38B1E4] text-white px-6 py-2 rounded-full text-base font-bold hover:bg-[#2a9ac9] transition-colors shadow-sm"
              >
                Começar
              </button>
            </>
          )}
          
          {/* Dev Toggle (apenas para desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => isAuthenticated ? logout() : openAuthModal()}
              className="ml-2 text-xs px-2 py-1 bg-yellow-600/20 text-yellow-600 rounded border border-yellow-600/50 hover:bg-yellow-600/30 transition-colors"
              title="Dev: Toggle Auth"
            >
              🔧 {isAuthenticated ? 'Auth: ON' : 'Auth: OFF'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
