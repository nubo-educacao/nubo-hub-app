'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CloudinhaFABProps {
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export default function CloudinhaFAB({ onToggleChat, isChatOpen }: CloudinhaFABProps) {
  return (
    <motion.button
      onClick={onToggleChat}
      aria-label={isChatOpen ? 'Fechar chat da Cloudinha' : 'Abrir chat da Cloudinha'}
      className={`
        fixed z-[60] shadow-2xl rounded-full transition-all duration-300
        bottom-20 right-4 md:bottom-6 md:right-6
        ${isChatOpen
          ? 'w-12 h-12 bg-white/90 backdrop-blur-md border border-gray-200'
          : 'w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#38B1E4] to-[#024F86] hover:shadow-[0_8px_30px_rgba(56,177,228,0.4)]'
        }
        flex items-center justify-center
      `}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      {isChatOpen ? (
        <X size={20} className="text-gray-600" />
      ) : (
        <Image
          src="/assets/cloudinha.png"
          alt="Cloudinha"
          width={36}
          height={36}
          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
        />
      )}
    </motion.button>
  );
}
