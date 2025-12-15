'use client';

import React from 'react';
import { Home, User, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatHeader() {
  const router = useRouter();

  return (
    <div className="w-full h-24 px-8 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-sm z-20">
      {/* Left - Functionality Select (Icon + Text + Arrow) */}
      <div className="flex items-center gap-4 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-colors">
          {/* Icon */}
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10">
             <Home size={18} className="text-white" />
          </div>

          {/* Text */}
          <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <span className="text-white font-medium text-base">Match de Oportunidades</span>
                <ChevronDown size={20} className="text-white" />
             </div>
             <span className="text-white/60 text-sm">Encontre sua oportunidade ideal</span>
          </div>
      </div>

      {/* Right - User Profile */}
      <button 
        onClick={() => router.push('/profile')} // Assuming profile route exists
        className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10"
      >
        {/* Placeholder for user avatar - using gradient or image if available */}
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
           U
        </div>
      </button>
    </div>
  );
}
