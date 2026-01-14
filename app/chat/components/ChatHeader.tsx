'use client';

import React from 'react';
import { Home, User, ChevronDown, Sparkles, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ChatHeaderProps {
  selectedFunctionality: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING';
  onSelectFunctionality: (func: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING') => void;
  // New props for Match Switch
  desktopMatchView?: 'OPPORTUNITIES' | 'PREFERENCES';
  onDesktopMatchViewChange?: (view: 'OPPORTUNITIES' | 'PREFERENCES') => void;
}

export default function ChatHeader({ 
    selectedFunctionality, 
    onSelectFunctionality,
    desktopMatchView,
    onDesktopMatchViewChange
}: ChatHeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getFunctionalityInfo = (type: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING') => {
      switch(type) {
          case 'MATCH': return { title: 'Match de Oportunidades', subtitle: 'Encontre sua oportunidade ideal' };
          case 'PROUNI': return { title: 'Entendendo o Prouni', subtitle: 'Tire suas dúvidas sobre o programa' };
          case 'SISU': return { title: 'Entendendo o Sisu', subtitle: 'Tudo o que você precisa saber' };
          case 'ONBOARDING': return { title: 'Configurando Perfil', subtitle: 'Vamos nos conhecer melhor' };
      }
  };

  const currentInfo = getFunctionalityInfo(selectedFunctionality);

  const handleSelect = (type: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING') => {
      onSelectFunctionality(type);
      setIsDropdownOpen(false);
  };

  return (
    <div className="w-full h-20 md:h-24 px-4 md:px-8 flex items-center justify-between border-b border-white/20 bg-white/20 backdrop-blur-sm z-20 relative">
      {/* Left - Functionality Select (Icon + Text + Arrow) */}
      <div className="flex items-center gap-3 md:gap-4 z-10">
          {/* Home Icon - Navigate to Home */}
          <div 
             onClick={() => router.push('/')}
             className="min-w-[40px] w-10 h-10 flex items-center justify-center rounded-xl bg-white/40 border border-white/40 cursor-pointer hover:bg-white/60 transition-all text-[#024F86] hover:scale-105 shadow-sm"
          >
             <Home size={20} />
          </div>

          {/* Text & Dropdown */}
          <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex flex-col cursor-pointer group select-none mr-2"
              >
                 <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-[#024F86] font-bold text-base md:text-lg group-hover:text-[#023F6B] transition-colors leading-tight line-clamp-1">{currentInfo.title}</span>
                    <ChevronDown size={20} className={`text-[#024F86] shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                 </div>
                 <span className="hidden md:block text-[#636E7C] text-sm group-hover:text-[#4B5563] transition-colors">{currentInfo.subtitle}</span>
              </div>

       {/* Dropdown Menu */}
               {isDropdownOpen && (
                   <div className="absolute top-full left-0 mt-3 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                       <div className="py-2">
                           <button 
                               onClick={() => handleSelect('MATCH')}
                               className={`w-full text-left px-5 py-3 hover:bg-[#F0F4FA] transition-colors flex flex-col gap-0.5 border-b border-gray-50 last:border-0 ${selectedFunctionality === 'MATCH' ? 'bg-[#F0F4FA]' : ''}`}
                           >
                               <span className={`text-sm font-bold ${selectedFunctionality === 'MATCH' ? 'text-[#024F86]' : 'text-gray-700'}`}>Match de Oportunidades</span>
                               <span className="text-gray-500 text-xs">Encontre sua oportunidade ideal</span>
                           </button>
                           <button 
                               onClick={() => handleSelect('PROUNI')}
                               className={`w-full text-left px-5 py-3 hover:bg-[#F0F4FA] transition-colors flex flex-col gap-0.5 border-b border-gray-50 last:border-0 ${selectedFunctionality === 'PROUNI' ? 'bg-[#F0F4FA]' : ''}`}
                           >
                               <span className={`text-sm font-bold ${selectedFunctionality === 'PROUNI' ? 'text-[#024F86]' : 'text-gray-700'}`}>Entendendo o Prouni</span>
                               <span className="text-gray-500 text-xs">Tire suas dúvidas sobre o programa</span>
                           </button>
                           <button 
                               onClick={() => handleSelect('SISU')}
                               className={`w-full text-left px-5 py-3 hover:bg-[#F0F4FA] transition-colors flex flex-col gap-0.5 border-b border-gray-50 last:border-0 ${selectedFunctionality === 'SISU' ? 'bg-[#F0F4FA]' : ''}`}
                           >
                               <span className={`text-sm font-bold ${selectedFunctionality === 'SISU' ? 'text-[#024F86]' : 'text-gray-700'}`}>Entendendo o Sisu</span>
                               <span className="text-gray-500 text-xs">Tudo o que você precisa saber</span>
                           </button>
                           <button 
                               onClick={() => handleSelect('ONBOARDING')}
                               className={`w-full text-left px-5 py-3 hover:bg-[#F0F4FA] transition-colors flex flex-col gap-0.5 border-b border-gray-50 last:border-0 ${selectedFunctionality === 'ONBOARDING' ? 'bg-[#F0F4FA]' : ''}`}
                           >
                               <span className={`text-sm font-bold ${selectedFunctionality === 'ONBOARDING' ? 'text-[#024F86]' : 'text-gray-700'}`}>Configurando Perfil</span>
                               <span className="text-gray-500 text-xs">Vamos nos conhecer melhor</span>
                           </button>
                       </div>
                   </div>
               )}
          </div>
      </div>
      
      {/* CENTER - Match Switch (Conditionally Rendered) */}
      {selectedFunctionality === 'MATCH' && desktopMatchView && onDesktopMatchViewChange && (
         <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex z-10">
             <div className="flex items-center gap-1 bg-white/50 border border-white/40 p-1 rounded-full shadow-sm">
                <button 
                    onClick={() => onDesktopMatchViewChange('OPPORTUNITIES')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-bold ${
                        desktopMatchView === 'OPPORTUNITIES' 
                        ? 'bg-[#024F86] text-white shadow-sm' 
                        : 'text-[#024F86]/70 hover:bg-[#024F86]/5'
                    }`}
                >
                    <Sparkles size={14} />
                    Oportunidades
                </button>
                <button 
                    onClick={() => onDesktopMatchViewChange('PREFERENCES')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-bold ${
                        desktopMatchView === 'PREFERENCES' 
                        ? 'bg-[#024F86] text-white shadow-sm' 
                        : 'text-[#024F86]/70 hover:bg-[#024F86]/5'
                    }`}
                >
                    <Settings size={14} />
                    Preferências
                </button>
             </div>
         </div>
      )}

      {/* Right - User Profile */}
      <button 
        onClick={() => router.push('/profile')}
        className="p-2 rounded-full hover:bg-[#024F86]/5 transition-colors text-[#024F86] z-10"
        title="Meu Perfil"
      >
        <User size={28} strokeWidth={2} />
      </button>
    </div>
  );
}
