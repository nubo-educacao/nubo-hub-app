'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

import { useRouter } from 'next/navigation';
import { User, Menu, X, LogOut, MessageCircle, MapPin } from 'lucide-react';

export default function Header({ transparent = false }: { transparent?: boolean }) {
  const router = useRouter();
  const { isAuthenticated, openAuthModal, logout, setPendingAction } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push('/chat');
    } else {
      setPendingAction({ type: 'redirect', payload: { url: '/chat' } });
      openAuthModal();
      setIsMobileMenuOpen(false); // Close mobile menu if open
    }
  };

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
            className="h-8 md:h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation (Centered) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
          <Link 
            href="/#oportunidades" 
            className="flex items-center gap-2 text-[#38B1E4] hover:text-[#38B1E4]/80 text-lg font-bold font-montserrat transition-all border-b-2 border-transparent hover:border-[#38B1E4]"
          >
            <MapPin size={20} strokeWidth={2.5} />
            <span>Oportunidades</span>
          </Link>
          <button 
            onClick={handleChatClick}
            className="flex items-center gap-2 text-[#38B1E4] hover:text-[#38B1E4]/80 text-lg font-bold font-montserrat transition-all border-b-2 border-transparent hover:border-[#38B1E4]"
          >
            <MessageCircle size={20} strokeWidth={2.5} />
            <span>Chat</span>
          </button>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
            <>
              <Link href="/profile" className="p-2 rounded-full hover:bg-[#38B1E4]/5 transition-colors text-[#38B1E4]" title="Meu Perfil">
                <User size={24} strokeWidth={2} />
              </Link>
              <button 
                onClick={logout}
                className="text-[#38B1E4] hover:text-[#38B1E4]/80 text-sm font-bold font-montserrat transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={openAuthModal}
                className="px-6 py-2 rounded-full border border-[#38B1E4] text-[#38B1E4] hover:bg-[#38B1E4]/10 text-base font-bold font-montserrat transition-colors"
              >
                Login
              </button>
              <button 
                onClick={openAuthModal}
                className="bg-[#38B1E4] text-white px-6 py-2 rounded-full text-base font-bold font-montserrat hover:bg-[#38B1E4]/90 transition-colors shadow-sm"
              >
                Começar
              </button>
            </>
          )}
          
          {/* Dev Toggle (apenas para desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => isAuthenticated ? logout() : openAuthModal()}
              className="ml-2 text-xs px-2 py-1 bg-yellow-600/20 text-yellow-600 rounded border border-yellow-600/50 hover:bg-yellow-600/30 transition-colors font-montserrat"
              title="Dev: Toggle Auth"
            >
              🔧 {isAuthenticated ? 'Auth: ON' : 'Auth: OFF'}
            </button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button 
            className="md:hidden p-2 text-[#38B1E4]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
            {isMobileMenuOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 p-4 shadow-xl flex flex-col gap-4 animate-in slide-in-from-top-2 font-montserrat">
            <Link 
                href="/#oportunidades" 
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#38B1E4]/5 text-[#38B1E4]"
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <MapPin size={20} strokeWidth={2} />
                <span className="font-bold">Oportunidades</span>
            </Link>
            <button 
                onClick={handleChatClick}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#38B1E4]/5 text-[#38B1E4] w-full text-left"
            >
                <MessageCircle size={20} strokeWidth={2} />
                <span className="font-bold">Chat</span>
            </button>
            {isAuthenticated ? (
                <>
                    <Link 
                        href="/profile" 
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#38B1E4]/5 text-[#38B1E4]"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <User size={20} strokeWidth={2} />
                        <span className="font-bold">Meu Perfil</span>
                    </Link>
                    <button 
                        onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 w-full text-left"
                    >
                        <LogOut size={20} strokeWidth={2} />
                        <span className="font-bold">Sair</span>
                    </button>
                </>
            ) : (
                <div className="flex flex-col gap-3">
                    <button 
                        onClick={() => { openAuthModal(); setIsMobileMenuOpen(false); }}
                        className="w-full py-3 rounded-full border border-[#38B1E4] text-[#38B1E4] font-bold"
                    >
                        Login
                    </button>
                    <button 
                        onClick={() => { openAuthModal(); setIsMobileMenuOpen(false); }}
                        className="w-full py-3 rounded-full bg-[#38B1E4] text-white font-bold shadow-md"
                    >
                        Começar
                    </button>
                </div>
            )}
        </div>
      )}
    </header>
  );
}
