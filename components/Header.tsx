'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

import { User } from 'lucide-react';

export default function Header({ transparent = false }: { transparent?: boolean }) {
  const { isAuthenticated, openAuthModal, logout } = useAuth();

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${transparent ? 'bg-transparent border-b border-transparent' : 'bg-white/30 backdrop-blur-md border-b border-white/20 shadow-lg'}`}>
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/assets/logo.png" 
            alt="Nubo Educação" 
            width={225} 
            height={60} 
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link href="/profile" className="p-2 rounded-full hover:bg-black/5 transition-colors text-[#3A424E] hover:text-[#38B1E4]" title="Meu Perfil">
                <User size={24} />
              </Link>
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
