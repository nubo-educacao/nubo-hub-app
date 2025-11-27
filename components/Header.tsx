'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isAuthenticated, openAuthModal, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
            N
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Nubo Hub</span>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
            Oportunidades
          </Link>
          <Link href="#" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
            Instituições
          </Link>
          <Link href="#" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
            Como funciona
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-neutral-400 text-sm hidden md:inline">Bem-vindo!</span>
              <button 
                onClick={logout}
                className="text-neutral-300 hover:text-white text-sm font-medium transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={openAuthModal}
                className="text-neutral-300 hover:text-white text-sm font-medium transition-colors"
              >
                Login
              </button>
              <button 
                onClick={openAuthModal}
                className="bg-white text-neutral-950 px-4 py-2 rounded-full text-sm font-semibold hover:bg-neutral-200 transition-colors"
              >
                Começar
              </button>
            </>
          )}
          
          {/* Dev Toggle (apenas para desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => isAuthenticated ? logout() : openAuthModal()}
              className="ml-2 text-xs px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded border border-yellow-600/50 hover:bg-yellow-600/30 transition-colors"
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
