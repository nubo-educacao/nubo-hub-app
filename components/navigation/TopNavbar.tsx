'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { MapPin, User, LogOut, FileText } from 'lucide-react';

export default function TopNavbar() {
  const pathname = usePathname();
  const { isAuthenticated, openAuthModal, logout } = useAuth();

  return (
    <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" aria-label="Nubo Home">
          <Image 
            src="/assets/logo.png" 
            alt="Nubo Educação" 
            width={180} 
            height={48} 
            className="h-9 w-auto hover:opacity-90 transition-opacity"
            priority
          />
        </Link>

        {/* Central Navigation */}
        <nav className="flex items-center gap-8">
          <Link 
            href="/oportunidades" 
            className={`flex items-center gap-2 text-sm font-bold font-montserrat transition-all border-b-2 py-2 ${
              pathname.startsWith('/oportunidades') 
              ? 'text-[#024F86] border-[#38B1E4]' 
              : 'text-gray-500 border-transparent hover:text-[#38B1E4]'
            }`}
          >
            <MapPin size={18} strokeWidth={2.5} />
            <span>Oportunidades</span>
          </Link>
          <Link 
            href="/candidaturas" 
            className={`flex items-center gap-2 text-sm font-bold font-montserrat transition-all border-b-2 py-2 ${
              pathname.startsWith('/candidaturas') 
              ? 'text-[#024F86] border-[#38B1E4]' 
              : 'text-gray-500 border-transparent hover:text-[#38B1E4]'
            }`}
          >
            <FileText size={18} strokeWidth={2.5} />
            <span>Candidaturas</span>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link 
                href="/profile" 
                className="p-2 rounded-full hover:bg-[#38B1E4]/5 hover:text-[#38B1E4] text-gray-500 transition-colors" 
                title="Meu Perfil"
              >
                <User size={22} strokeWidth={2} />
              </Link>
              <button 
                onClick={logout}
                className="p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                title="Sair"
              >
                <LogOut size={20} strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={openAuthModal}
                className="px-5 py-2 rounded-full border border-[#38B1E4] text-[#38B1E4] hover:bg-[#38B1E4]/5 text-sm font-bold font-montserrat transition-colors"
              >
                Login
              </button>
              <button 
                onClick={openAuthModal}
                className="bg-[#38B1E4] text-white px-5 py-2 rounded-full text-sm font-bold font-montserrat hover:bg-[#024F86] transition-colors shadow-sm"
              >
                Criar conta
              </button>
            </>
          )}

          {/* Dev Toggle */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => isAuthenticated ? logout() : openAuthModal()}
              className="ml-2 text-[10px] px-2 py-1 bg-yellow-100 text-yellow-700 rounded border border-yellow-300 hover:bg-yellow-200 transition-colors font-mono"
              title="Dev: Toggle Auth"
            >
              {isAuthenticated ? 'AUTH: ON' : 'AUTH: OFF'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
