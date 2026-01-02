'use client';

import React, { useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

const PHRASES = [
  "Me ajude a encontrar a oportunidade ideal...",
  "Como funciona o processo do SISU?",
  "Tenho direito a bolsas do Prouni?",
  "Quais os prazos de inscrição do ENEM?",
  "Como consigo uma vaga de Jovem Aprendiz?"
];

export default function ConversationStarters() {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.5 // Delay slightly to appear after Hero
      }
    }
  };

  const item: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
  };

const { isAuthenticated, openAuthModal, setPendingAction, pendingAction } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'chat' && pendingAction.payload.message) {
        // Optional: Check if the message is one of our phrases to avoid conflicts, 
        // though typically any pending chat action on this page warrants a redirect.
        if (PHRASES.includes(pendingAction.payload.message)) {
            router.push('/chat');
        }
    }
  }, [isAuthenticated, pendingAction, router]);

  const handleStarterClick = (message: string) => {
    setPendingAction({ type: 'chat', payload: { message } });
    
    if (isAuthenticated) {
      router.push('/chat');
    } else {
      openAuthModal();
    }
  };

  return (
    <div className="w-full max-w-full overflow-hidden"> 
      <div className="container mx-auto px-4 flex justify-center">
        <motion.div 
            className="w-full flex flex-nowrap items-center justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2" // simplified container
            variants={container}
            initial="hidden"
            animate="show"
        >
          {PHRASES.map((phrase, index) => (
            <motion.button
              key={index}
              variants={item}
              onClick={() => handleStarterClick(phrase)}
              className="flex-shrink-0 px-4 py-2 bg-white/50 hover:bg-[#024F86] hover:text-white border border-white/40 rounded-full transition-all duration-300 text-[#024F86] font-medium shadow-sm hover:shadow-md text-xs md:text-[13px] whitespace-nowrap cursor-pointer"
            >
              {phrase}
            </motion.button>
          ))}
        </motion.div>
      </div>
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
