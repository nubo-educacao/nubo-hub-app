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
    <section className="py-16 bg-neutral-950">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Catálogo de Oportunidades
          </h2>
          <p className="text-neutral-400 mb-6">
            Explore bolsas e programas antes mesmo de fazer login.
          </p>
          <FilterPills />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-neutral-400">Carregando oportunidades...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-400 font-semibold mb-2">Erro ao carregar oportunidades</p>
            <p className="text-neutral-400 text-sm mb-4">{error}</p>
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
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
            <p className="text-neutral-400 text-lg">Nenhuma oportunidade encontrada</p>
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
                  className="px-6 py-3 border border-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-900 hover:text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"></div>
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
    </section>
  );
}
