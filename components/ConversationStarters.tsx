'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export const PHRASES = [
  "Como a Cloudinha funciona?",
  "Me ajude a encontrar a oportunidade ideal...",
  "Como funciona o processo do SISU?",
  "Tenho direito a bolsas do Prouni?",
  "Em quais faculdades eu tenho mais chance com a minha nota?",
  "Quais cursos existem perto de onde eu moro?"
];

export default function ConversationStarters() {
  const [width, setWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.5 
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
        if (PHRASES.includes(pendingAction.payload.message)) {
            router.push('/chat');
        }
    }
  }, [isAuthenticated, pendingAction, router]);

  useEffect(() => {
     const updateConstraints = () => {
         if (carouselRef.current && contentRef.current) {
             const scrollWidth = contentRef.current.scrollWidth;
             const offsetWidth = carouselRef.current.offsetWidth;
             // Width of the drag (negative left constraint) is total scrollable content minus viewport
             // extra buffer to avoid rounding errors
             setWidth(scrollWidth - offsetWidth + 20); 
         }
     };

     // Initial calculation
     updateConstraints();
     
     // Recalculate on load (images/fonts)
     window.addEventListener('load', updateConstraints);
     // Recalculate on resize
     window.addEventListener('resize', updateConstraints);

     // Backup timeout for safety
     const timeout = setTimeout(updateConstraints, 500);

     return () => {
         window.removeEventListener('load', updateConstraints);
         window.removeEventListener('resize', updateConstraints);
         clearTimeout(timeout);
     }
  }, []);

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
      <div className="container mx-auto px-4">
        {/* We use specific overflow handling here to allow drag but clip edges */}
        <motion.div 
            ref={carouselRef} 
            className="cursor-grab active:cursor-grabbing overflow-hidden" 
            whileTap={{ cursor: "grabbing" }}
        >
            <motion.div 
                ref={contentRef}
                className="flex items-center gap-2 w-fit" // simple flex row
                variants={container}
                initial="hidden"
                animate="show"
                drag="x"
                dragConstraints={{ right: 0, left: -width }}
                // Removing momentum to make it feel more controllable or keep it for smooth inertial scrolling?
                // Default inertia is fine, but constraints need to be right.
                onDragStart={() => {
                     // Force re-measure on interactions just in case
                     if (carouselRef.current && contentRef.current) {
                         setWidth(contentRef.current.scrollWidth - carouselRef.current.offsetWidth + 20);
                     }
                }}
            >
            {PHRASES.map((phrase, index) => (
                <motion.button
                key={index}
                variants={item}
                onClick={(e) => {
                    // Prevent click if we were dragging? Framer motion handles tap vs drag usually, 
                    // but we can just leave it as is for now.
                    handleStarterClick(phrase)
                }}
                className="flex-shrink-0 px-4 py-2 bg-white/50 hover:bg-[#024F86] hover:text-white border border-white/40 rounded-full transition-all duration-300 text-[#024F86] font-medium shadow-sm hover:shadow-md text-xs md:text-[13px] whitespace-nowrap"
                >
                {phrase}
                </motion.button>
            ))}
            </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
