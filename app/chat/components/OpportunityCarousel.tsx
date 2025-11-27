'use client';

import React from 'react';
import OpportunityCard from './OpportunityCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data
const MOCK_OPPORTUNITIES = [
  {
    id: '1',
    course_name: 'Medicina',
    institution_name: 'USP - Universidade de São Paulo',
    cutoff_score: 850,
    scholarship_type: 'PROUNI',
    city: 'São Paulo',
    state: 'SP',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    course_name: 'Direito',
    institution_name: 'PUC-SP',
    cutoff_score: 780,
    scholarship_type: 'FIES',
    city: 'São Paulo',
    state: 'SP',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    course_name: 'Engenharia de Software',
    institution_name: 'FIAP',
    cutoff_score: 720,
    scholarship_type: 'BOLSA PRÓPRIA',
    city: 'São Paulo',
    state: 'SP',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
  },
];

export default function OpportunityCarousel() {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % MOCK_OPPORTUNITIES.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + MOCK_OPPORTUNITIES.length) % MOCK_OPPORTUNITIES.length);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Oportunidades para você</h2>
        <p className="text-gray-400">Baseado na sua conversa com a Cloudinha</p>
      </div>

      <div className="relative group">
        {/* Navigation Buttons */}
        <button 
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
        >
          <ChevronLeft size={24} />
        </button>
        
        <button 
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
        >
          <ChevronRight size={24} />
        </button>

        {/* Carousel Viewport */}
        <div className="overflow-hidden py-4 px-2">
          <div className="flex justify-center items-center gap-6">
             <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-md"
                >
                    <OpportunityCard opportunity={MOCK_OPPORTUNITIES[currentIndex]} />
                </motion.div>
             </AnimatePresence>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {MOCK_OPPORTUNITIES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-purple-500 w-6' : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
