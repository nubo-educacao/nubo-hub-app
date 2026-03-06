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
        switch (type) {
            case 'MATCH': return { title: 'Match do Prouni', subtitle: 'Encontre sua oportunidade ideal' };
            case 'PROUNI': return { title: 'Entendendo o Prouni', subtitle: 'Tire suas dúvidas sobre o programa' };
            case 'SISU': return { title: 'Entendendo o Sisu', subtitle: 'Tudo o que você precisa saber' };
            case 'ONBOARDING': return { title: 'Passaporte de Elegibilidade', subtitle: 'O programa ideal pra você' };
        }
    };

    const currentInfo = getFunctionalityInfo(selectedFunctionality);

    const handleSelect = (type: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING') => {
        onSelectFunctionality(type);
        setIsDropdownOpen(false);
    };

    return (
        <div className="w-full h-16 md:h-24 px-4 md:px-8 flex items-center justify-between border-b border-gray-100 bg-white md:bg-white/20 md:backdrop-blur-sm z-20 relative">
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
                        className="flex flex-col select-none mr-2"
                    >
                        <div className="flex items-center gap-1 md:gap-2">
                            <span className="text-[#024F86] font-bold text-base md:text-lg transition-colors leading-tight line-clamp-1">{currentInfo.title}</span>
                        </div>
                        <span className="hidden md:block text-[#636E7C] text-sm transition-colors">{currentInfo.subtitle}</span>
                    </div>
                </div>
            </div>

            {/* CENTER - Match Switch (Conditionally Rendered) */}
            {selectedFunctionality === 'MATCH' && desktopMatchView && onDesktopMatchViewChange && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex z-10">
                    <div className="flex items-center gap-1 bg-white/50 border border-white/40 p-1 rounded-full shadow-sm">
                        <button
                            onClick={() => onDesktopMatchViewChange('OPPORTUNITIES')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-bold ${desktopMatchView === 'OPPORTUNITIES'
                                ? 'bg-[#024F86] text-white shadow-sm'
                                : 'text-[#024F86]/70 hover:bg-[#024F86]/5'
                                }`}
                        >
                            <Sparkles size={14} />
                            Oportunidades
                        </button>
                        <button
                            onClick={() => onDesktopMatchViewChange('PREFERENCES')}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 text-sm font-bold ${desktopMatchView === 'PREFERENCES'
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
