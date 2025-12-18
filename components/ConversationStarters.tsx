'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';

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

  return (
    <div className="w-full max-w-full overflow-hidden"> 
      <div className="container mx-auto px-4 flex justify-center">
        <motion.div 
            className="w-full flex flex-nowrap items-center justify-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-2" // simplified container
            variants={container}
        >
          {PHRASES.map((phrase, index) => (
            <motion.button
              key={index}
              variants={item}
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
