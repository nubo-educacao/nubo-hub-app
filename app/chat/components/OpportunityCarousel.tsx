'use client';

import React, { useEffect, useState } from 'react';
import OpportunityCard from '@/components/OpportunityCard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { CourseDisplayData } from '@/types/opportunity';
import { fetchOpportunitiesByCourseIds } from '@/lib/services/opportunities';

interface OpportunityCarouselProps {
    courseIds?: string[];
    matchedOppsMap?: Record<string, string[]> | null;
}

export default function OpportunityCarousel({ courseIds, matchedOppsMap }: OpportunityCarouselProps) {
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
                      // Restore order based on pageIds (which preserves Search ranking)
                      // .in() clause does not guarantee order, so we force it here
                      const sortedData = data.sort((a, b) => pageIds.indexOf(a.id) - pageIds.indexOf(b.id));
                      setCourses(sortedData);
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
    <div className="w-full max-w-8xl mx-auto flex flex-col h-full bg-transparent p-0 mt-0">


      {/* Grid Viewport */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col justify-start">
          {isLoading ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-[#024F86]/50 gap-2">
                <Loader2 className="animate-spin" size={32} />
                <span className="text-sm">Carregando oportunidades...</span>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {currentCourses.map((course) => (
                    <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        <OpportunityCard 
                            course={course} 
                            highlightedOpportunityIds={matchedOppsMap ? matchedOppsMap[course.id] : undefined}
                        />
                    </motion.div>
                ))}
            </div>
          )}
      </div>

      {/* Paginator - Only show if multiple pages */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4 mt-auto flex-shrink-0">
            {/* Prev Button */}
            <button 
            onClick={prevPage}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/40 border border-[#024F86]/20 text-[#024F86] hover:bg-[#024F86]/10 transition-all shadow-sm"
            >
            <ChevronLeft size={16} />
            </button>

            {/* Indicators / Page Count */}
            <div className="flex items-center gap-2 h-8 bg-[#024F86]/5 rounded-full px-3 backdrop-blur-sm min-w-fit">
                {totalPages <= 7 ? (
                    // Show Dots for small number of pages
                    Array.from({ length: totalPages }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentPage(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                idx === currentPage 
                                    ? 'w-8 bg-[#024F86]' 
                                    : 'w-2 bg-[#024F86]/20 hover:bg-[#024F86]/40'
                            }`}
                            aria-label={`Ir para página ${idx + 1}`}
                        />
                    ))
                ) : (
                    // Show Text "Page X of Y" for large number of pages
                    <span className="text-xs font-bold text-[#024F86] whitespace-nowrap px-2">
                        Página {currentPage + 1} de {totalPages}
                    </span>
                )}
            </div>

            {/* Next Button */}
            <button 
            onClick={nextPage}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/40 border border-[#024F86]/20 text-[#024F86] hover:bg-[#024F86]/10 transition-all shadow-sm"
            >
            <ChevronRight size={16} />
            </button>
        </div>
      )}
    </div>
  );
}
