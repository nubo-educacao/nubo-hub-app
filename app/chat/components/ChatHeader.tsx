'use client';

import React from 'react';
import { Home, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export interface ChatHeaderProps {
  selectedFunctionality: 'MATCH' | 'PROUNI' | 'SISU';
  onSelectFunctionality: (func: 'MATCH' | 'PROUNI' | 'SISU') => void;
}

export default function ChatHeader({ selectedFunctionality, onSelectFunctionality }: ChatHeaderProps) {
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

  const getFunctionalityInfo = (type: 'MATCH' | 'PROUNI' | 'SISU') => {
      switch(type) {
          case 'MATCH': return { title: 'Match de Oportunidades', subtitle: 'Encontre sua oportunidade ideal' };
          case 'PROUNI': return { title: 'Entendendo o Prouni', subtitle: 'Tire suas dúvidas sobre o programa' };
          case 'SISU': return { title: 'Entendendo o Sisu', subtitle: 'Tudo o que você precisa saber' };
      }
  };

  const currentInfo = getFunctionalityInfo(selectedFunctionality);

  const handleSelect = (type: 'MATCH' | 'PROUNI' | 'SISU') => {
      onSelectFunctionality(type);
      setIsDropdownOpen(false);
  };

  return (
    <div className="w-full h-24 px-8 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-sm z-20">
      {/* Left - Functionality Select (Icon + Text + Arrow) */}
      <div className="flex items-center gap-4">
          {/* Home Icon - Navigate to Home */}
          <div 
             onClick={() => router.push('/')}
             className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 cursor-pointer hover:bg-white/20 transition-all text-white hover:scale-105"
          >
             <Home size={18} />
          </div>

          {/* Text & Dropdown */}
          <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex flex-col cursor-pointer group select-none"
              >
                 <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-base group-hover:text-white/90 transition-colors">{currentInfo.title}</span>
                    <ChevronDown size={20} className={`text-white transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                 </div>
                 <span className="text-white/60 text-sm group-hover:text-white/70 transition-colors">{currentInfo.subtitle}</span>
              </div>

               {/* Dropdown Menu */}
               {isDropdownOpen && (
                   <div className="absolute top-full left-0 mt-2 w-64 bg-[#0F172A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                       <div className="py-1">
                           <button 
                               onClick={() => handleSelect('MATCH')}
                               className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex flex-col ${selectedFunctionality === 'MATCH' ? 'bg-white/5' : ''}`}
                           >
                               <span className="text-white text-sm font-medium">Match de Oportunidades</span>
                               <span className="text-white/50 text-xs">Encontre sua oportunidade ideal</span>
                           </button>
                           <button 
                               onClick={() => handleSelect('PROUNI')}
                               className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex flex-col ${selectedFunctionality === 'PROUNI' ? 'bg-white/5' : ''}`}
                           >
                               <span className="text-white text-sm font-medium">Entendendo o Prouni</span>
                               <span className="text-white/50 text-xs">Tire suas dúvidas sobre o programa</span>
                           </button>
                           <button 
                               onClick={() => handleSelect('SISU')}
                               className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex flex-col ${selectedFunctionality === 'SISU' ? 'bg-white/5' : ''}`}
                           >
                               <span className="text-white text-sm font-medium">Entendendo o Sisu</span>
                               <span className="text-white/50 text-xs">Tudo o que você precisa saber</span>
                           </button>
                       </div>
                   </div>
               )}
          </div>
      </div>

      {/* Right - User Profile */}
      <button 
        onClick={() => router.push('/profile')} // Assuming profile route exists
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/30 transition-all"
      >
        {/* Placeholder for user avatar - using gradient or image if available */}
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
           U
        </div>
      </button>
    </div>
  );
}
