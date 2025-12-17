'use client';

import React, { useEffect, useState } from 'react';
import OpportunityCard from '@/components/OpportunityCard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { CourseDisplayData } from '@/types/opportunity';
import { fetchOpportunitiesByCourseIds } from '@/lib/services/opportunities';

interface OpportunityCarouselProps {
    courseIds?: string[];
}

export default function OpportunityCarousel({ courseIds }: OpportunityCarouselProps) {
  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const itemsPerPage = 6;

  useEffect(() => {
      async function loadOpportunities() {
          if (courseIds && courseIds.length > 0) {
              setIsLoading(true);
              try {
                  // Calculate the slice of IDs for the current page
                  const start = currentPage * itemsPerPage;
                  const end = start + itemsPerPage;
                  const pageIds = courseIds.slice(start, end);

                  if (pageIds.length > 0) {
                      const data = await fetchOpportunitiesByCourseIds(pageIds);
                      setCourses(data);
                  } else {
                      setCourses([]);
                  }
              } catch (error) {
                  console.error("Failed to load opportunities", error);
              } finally {
                  setIsLoading(false);
              }
          }
      }
      loadOpportunities();
  }, [courseIds, currentPage]);

  // If no IDs passed or empty result, don't render anything
  if (!courseIds || courseIds.length === 0) return null;

  const totalPages = Math.ceil(courseIds.length / itemsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // 'courses' now only contains the current page data
  const currentCourses = courses;

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col h-full bg-white/5 rounded-xl p-4 mt-4 border border-white/10">
      {/* Header */}
      <div className="mb-4 text-center flex-shrink-0">
        <h2 className="text-xl font-medium text-white/90 mb-1">Oportunidades Encontradas</h2>
        <p className="text-sm text-white/60">{courses.length} cursos disponíveis</p>
      </div>

      {/* Grid Viewport */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-center">
          {isLoading ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-2">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-sm">Carregando oportunidades...</span>
             </div>
          ) : (
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
          )}
      </div>

      {/* Paginator - Only show if multiple pages */}
      {totalPages > 1 && (
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
      )}
    </div>
  );
}
