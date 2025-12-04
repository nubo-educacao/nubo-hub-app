'use client';

import React, { useState, useEffect } from 'react';
import FilterPills from './FilterPills';
import OpportunityCard from './OpportunityCard';
import { Opportunity } from '../types/opportunity';
import { fetchOpportunities } from '../lib/services/opportunities';

export default function OpportunityCatalog() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // Carregar primeira página
  useEffect(() => {
    loadInitialOpportunities();
  }, []);

  const loadInitialOpportunities = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchOpportunities(0, ITEMS_PER_PAGE);

    if (result.error) {
      setError(result.error);
    } else {
      setOpportunities(result.data);
      setHasMore(result.hasMore);
      setCurrentPage(0);
    }

    setLoading(false);
  };

  const loadMoreOpportunities = async () => {
    setLoadingMore(true);
    const nextPage = currentPage + 1;

    const result = await fetchOpportunities(nextPage, ITEMS_PER_PAGE);

    if (result.error) {
      setError(result.error);
    } else {
      setOpportunities((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    }

    setLoadingMore(false);
  };

  return (
    <section className="relative pb-16 pt-8">
      {/* Floating Container */}
      <div className="container mx-auto px-4">
        <div className="bg-[#A6D4EA]/40 backdrop-blur-sm rounded-t-[40px] p-8 pt-16 relative min-h-[800px]">
          
          {/* Title Pill */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#024F86] text-white px-12 py-4 rounded-xl shadow-lg z-10">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-center">
              Catálogo de Oportunidades
            </h2>
          </div>

          <div className="mb-8 mt-4">
            <FilterPills />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#024F86] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[#024F86] font-medium">Carregando oportunidades...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 font-semibold mb-2">Erro ao carregar oportunidades</p>
              <p className="text-red-500 text-sm mb-4">{error}</p>
              <button
                onClick={loadInitialOpportunities}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && opportunities.length === 0 && (
            <div className="bg-white/50 border border-white/20 rounded-lg p-12 text-center">
              <p className="text-[#024F86] text-lg">Nenhuma oportunidade encontrada</p>
            </div>
          )}

          {/* Opportunities Grid */}
          {!loading && !error && opportunities.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="mt-12 text-center">
                  <button
                    onClick={loadMoreOpportunities}
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
          )}
        </div>
      </div>
    </section>
  );
}
