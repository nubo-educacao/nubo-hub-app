'use client';

import React from 'react';
import OpportunityCard from '@/components/OpportunityCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { CourseDisplayData } from '@/types/opportunity';

// Mock Data
const MOCK_COURSES: CourseDisplayData[] = Array(12).fill(null).map((_, i) => ({
    id: `${i + 1}`,
    title: i % 2 === 0 ? 'Administração' : 'Engenharia',
    institution: 'Pontifícia Universidade Católica do Paraná',
    location: 'São Paulo, SP',
    city: 'São Paulo',
    state: 'SP',
    min_cutoff_score: 558.50,
    opportunities: [
        {
            id: `opp-${i}`,
            shift: i % 3 === 0 ? 'Matutino' : 'Integral',
            modality: 'Presencial',
            type: 'Pública',
            opportunity_type: 'Vestibular',
            cutoff_score: 558.50,
            scholarship_type: 'Prouni'
        }
    ]
}));

export default function OpportunityCarousel() {
  const [currentPage, setCurrentPage] = React.useState(0);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(MOCK_COURSES.length / itemsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const currentCourses = MOCK_COURSES.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full">
      {/* Header */}
      <div className="mb-4 text-center flex-shrink-0">
        <h2 className="text-xl font-medium text-white/90 mb-1">Oportunidades em destaque</h2>
        <p className="text-sm text-white/60">{MOCK_COURSES.length} oportunidades encontradas</p>
      </div>

      {/* Grid Viewport */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
             {currentCourses.map((course) => (
                <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    <OpportunityCard course={course} />
                </motion.div>
             ))}
          </div>
      </div>

      {/* Paginator */}
      <div className="flex justify-center items-center gap-4 py-6 mt-auto flex-shrink-0">
        {/* Prev Button */}
        <button 
          onClick={prevPage}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Indicators */}
        <div className="flex items-center gap-2 h-2 bg-black/20 rounded-full px-2 py-3 backdrop-blur-sm">
             {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentPage 
                            ? 'w-8 bg-white' 
                            : 'w-2 bg-white/30 hover:bg-white/50'
                    }`}
                />
             ))}
        </div>

        {/* Next Button */}
        <button 
          onClick={nextPage}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
