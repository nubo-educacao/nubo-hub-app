'use client';

import React, { useState, useEffect } from 'react';
import FilterPills from './FilterPills';
import OpportunityCard from './OpportunityCard';
import { PartnerCard } from './PartnerCard';
import { CourseDisplayData } from '../types/opportunity';
import { fetchCoursesWithOpportunities } from '../lib/services/opportunities';

export default function OpportunityCatalog() {
  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [loading, setLoading] = useState(false); // Start false because default view (Parceiros) is static
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Parceiros');
  
  const ITEMS_PER_PAGE = 15;

  // Mock Partners Data
  const mockPartners = [
    {
      id: "1",
      name: "Fundação Estudar",
      description: "Oferecemos bolsas de estudo no Brasil ou exterior, e apoio vitalício para o desenvolvimento de nossos Fellows Estudar.",
      isFavorite: false
    },
    {
      id: "2",
      name: "Gerando Falcões",
      description: "Ecossistema de desenvolvimento social que atua em rede para acelerar o poder de impacto de líderes em favelas.",
      isFavorite: true
    },
     {
      id: "3",
      name: "Instituto Ismart",
      description: "Bolsas de estudo integrais e desenvolvimento para talentos de baixa renda acessarem educação de excelência.",
      isFavorite: false
    }
  ];

  // Fetch Logic - Only triggered when needed or pre-fetched
  // For now, we keep it simple: fetch if switching to Publicas and list is empty, or just rely on manual calls.
  // Carregar primeira página - Trigger only if viewing 'Públicas' or initially if we want pre-loading
  // For now, let's keep the original behavior of loading on mount, but we could optimize.
  useEffect(() => {
    loadInitialCourses();
  }, []);

  const loadInitialCourses = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchCoursesWithOpportunities(0, ITEMS_PER_PAGE);

    if (result.error) {
      setError(result.error);
    } else {
      setCourses(result.data);
      setHasMore(result.hasMore);
      setCurrentPage(0);
    }

    setLoading(false);
  };

  const loadMoreCourses = async () => {
    setLoadingMore(true);
    const nextPage = currentPage + 1;

    const result = await fetchCoursesWithOpportunities(nextPage, ITEMS_PER_PAGE);

    if (result.error) {
      setError(result.error);
    } else {
      setCourses((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    }

    setLoadingMore(false);
  };

  const handleSelectFilter = (filter: string) => {
    setSelectedFilter(filter);
  };

  const renderContent = () => {
    if (selectedFilter === 'Parceiros') {
      return (
        <div className="flex flex-col items-center gap-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {mockPartners.map((partner) => (
              <PartnerCard 
                key={partner.id} 
                id={partner.id}
                name={partner.name}
                description={partner.description}
                isFavorite={partner.isFavorite}
              />
            ))}
          </div>

          <button className="px-8 py-3 bg-[#024F86] text-white rounded-full hover:bg-[#023F6B] transition-colors font-bold shadow-md text-lg">
            Seja parceiro Nubo
          </button>
        </div>
      );
    }

    if (selectedFilter === 'Públicas') {
      if (loading && courses.length === 0) {
        return (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#024F86] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#024F86] font-medium">Carregando oportunidades...</p>
            </div>
          </div>
        );
      }

      if (error) {
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-[#024F86] text-xl font-bold mb-2">Erro ao carregar oportunidades</h3>
            <p className="text-[#636E7C] mb-6 max-w-md">
              Ocorreu um problema ao buscar as oportunidades. Por favor, verifique sua conexão e tente novamente.
            </p>
            <button
              onClick={loadInitialCourses}
              className="px-8 py-3 bg-[#024F86] text-white rounded-full hover:bg-[#023F6B] transition-colors font-bold shadow-md"
            >
              Tentar novamente
            </button>
          </div>
        );
      }

      if (!loading && !error && courses.length === 0) {
        return (
          <div className="bg-white/50 border border-white/20 rounded-lg p-12 text-center">
            <p className="text-[#024F86] text-lg">Nenhuma oportunidade encontrada</p>
          </div>
        );
      }

      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <OpportunityCard key={course.id} course={course} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-12 text-center">
              <button
                onClick={loadMoreCourses}
                disabled={loadingMore}
                className="px-8 py-3 bg-[#024F86] text-white rounded-full hover:bg-[#023F6B] transition-colors font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Carregando...
                  </span>
                ) : (
                  'Ver mais oportunidades'
                )}
              </button>
            </div>
          )}
        </>
      );
    }
    
    // Default placeholder for other filters
    return (
      <div className="bg-white/50 border border-white/20 rounded-lg p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <h3 className="text-xl font-bold text-[#024F86] mb-2">Em breve</h3>
        <p className="text-[#636E7C]">Estamos trabalhando para trazer mais oportunidades nesta categoria.</p>
      </div>
    );
  };

  return (
    <section className="relative pb-16 pt-8">
      {/* Floating Container */}
      <div className="container mx-auto px-4">
        <div className="bg-[#FFFFFF]/40 backdrop-blur-sm rounded-[40px] p-8 pt-16 relative min-h-[800px]">
          
          {/* Title Pill */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#024F86] text-white px-12 py-4 rounded-xl shadow-lg z-10">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-center">
              Explore oportunidades
            </h2>
          </div>

          <div className="mb-8 mt-4">
            <FilterPills selectedFilter={selectedFilter} onSelectFilter={handleSelectFilter} />
          </div>

          {renderContent()}

        </div>
      </div>
    </section>
  );
}
