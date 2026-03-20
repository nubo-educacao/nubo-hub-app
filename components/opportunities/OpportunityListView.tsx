'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, ChevronDown, Settings, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import FilterPills from '@/components/FilterPills';
import OpportunityCard from '@/components/OpportunityCard';
import { PartnerCard } from '@/components/PartnerCard';
import PartnerModal from '@/components/PartnerModal';
import CalendarAccordion from '@/components/courses/CalendarAccordion';

import { CourseDisplayData } from '@/types/opportunity';
import { ImportantDate } from '@/types/calendar';
import { Partner, getPartners } from '@/services/supabase/partners';
import { fetchCoursesWithOpportunities, fetchOpportunitiesByCourseIds, getImportantDates } from '@/lib/services/opportunities';

interface OpportunityListViewProps {
  mode: 'match' | 'catalog';
  // Props specifically for 'match' mode
  courseIds?: string[];
  matchedOppsMap?: Record<string, string[]> | null;
  onAdjustPreferences?: () => void;
}

export default function OpportunityListView({ 
  mode, 
  courseIds = [], 
  matchedOppsMap,
  onAdjustPreferences 
}: OpportunityListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- CATALOG STATE ---
  const [selectedFilter, setSelectedFilter] = useState(mode === 'catalog' ? (searchParams.get('filter') || 'Oportunidades de parceiros') : 'all');
  const [searchQuery, setSearchQuery] = useState(mode === 'catalog' ? (searchParams.get('q') || '') : '');
  const [sortBy, setSortBy] = useState(mode === 'catalog' ? (searchParams.get('sort') || 'proximas') : 'relevance');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  // --- DATA STATE ---
  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allDates, setAllDates] = useState<ImportantDate[]>([]);
  
  // --- PAGINATION & LOADING ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // --- LOCATION STATE ---
  const [userLocation, setUserLocation] = useState<{ city: string, state: string, lat?: number, long?: number } | null>(null);
  const [isLocationDenied, setIsLocationDenied] = useState(false);

  const ITEMS_PER_PAGE = 15;

  // Sync state to URL (Catalog only)
  const updateUrl = (newFilter: string, newSearch: string, newSort: string) => {
    if (mode !== 'catalog') return;
    const params = new URLSearchParams(searchParams.toString());
    
    if (newFilter && newFilter !== 'Oportunidades de parceiros') params.set('filter', newFilter);
    else params.delete('filter');

    if (newSearch) params.set('q', newSearch);
    else params.delete('q');

    if (newSort && newSort !== 'proximas') params.set('sort', newSort);
    else params.delete('sort');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const sortOptions = [
    { label: 'Próximas a você', value: 'proximas' },
    { label: 'Melhores cursos', value: 'melhores' },
    { label: 'Maior nota de corte', value: 'maior_nota' },
    { label: 'Menor nota de corte', value: 'menor_nota' }
  ].filter(option => !isLocationDenied || option.value !== 'proximas');

  const handleSortChange = (value: string) => {
      setSortBy(value);
      setIsSortOpen(false);
      updateUrl(selectedFilter, searchQuery, value);
      if (value === 'proximas' && !userLocation) {
          getUserLocation();
      }
  };

  const handleSelectFilter = (filter: string) => {
    if (mode !== 'catalog') return;
    setSelectedFilter(filter);
    updateUrl(filter, searchQuery, sortBy);
  };

  const getUserLocation = async () => {
     if (!navigator.geolocation) {
        setIsLocationDenied(true);
        return;
     }

     navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        let city = 'Localização Atual';
        let state = '';
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
                headers: { 'User-Agent': 'Nubo/1.0' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.address) {
                     city = data.address.city || data.address.town || data.address.village || data.address.municipality || city;
                     state = data.address.state || state;
                     const stateMapping: {[key: string]: string} = {
                         'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA', 'Ceará': 'CE',
                         'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT',
                         'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
                         'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
                         'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
                         'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
                     };
                     if (state && stateMapping[state]) state = stateMapping[state];
                }
            }
        } catch (e) {
            console.error("Error getting address details", e);
        }
        setUserLocation({ city, state, lat: latitude, long: longitude });
     }, (err) => {
        setIsLocationDenied(true);
     });
  };

  useEffect(() => {
    if (mode === 'catalog' && sortBy === 'proximas') {
        getUserLocation();
    }
    const loadDates = async () => {
      try {
        const dates = await getImportantDates(['general', 'sisu', 'prouni', 'partners']);
        setAllDates(dates);
      } catch (e) {
        console.error("Error loading dates:", e);
      }
    };
    if (mode === 'catalog') loadDates();
  }, [mode]);

  useEffect(() => {
      if (isLocationDenied && sortBy === 'proximas') {
          handleSortChange('melhores');
      }
  }, [isLocationDenied, sortBy]);

  // --- FETCHING LOGIC ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (mode === 'match') {
          if (courseIds && courseIds.length > 0) {
              try {
                  const data = await fetchOpportunitiesByCourseIds(courseIds);
                  const sortedData = data.sort((a, b) => courseIds.indexOf(a.id) - courseIds.indexOf(b.id));
                  setCourses(sortedData);
              } catch (err) {
                  setError('Erro ao carregar matches.');
              }
          } else {
              setCourses([]);
          }
          setLoading(false);
      } else {
          // Catalog Mode
          if (selectedFilter === 'Oportunidades de parceiros') {
              if (partners.length === 0) {
                  try {
                      const data = await getPartners();
                      setPartners(data);
                  } catch (err) {
                      setError('Erro ao carregar parceiros.');
                  }
              }
              setLoading(false);
          } else {
              // Debounce naturally not strictly needed in useEffect unless we want to delay, 
              // but let's just fetch directly here. A setTimeout could be added.
              const timer = setTimeout(async () => {
                const result = await fetchCoursesWithOpportunities(
                    0, ITEMS_PER_PAGE, selectedFilter, searchQuery, sortBy, 
                    userLocation?.city, userLocation?.state, userLocation?.lat, userLocation?.long
                );
                if (result.error) {
                    setError(result.error);
                } else {
                    setCourses(result.data);
                    setHasMore(result.hasMore);
                    setCurrentPage(0);
                }
                setLoading(false);
              }, searchQuery ? 400 : 0);
              return () => clearTimeout(timer);
          }
      }
    };

    fetchData();
  }, [mode, selectedFilter, sortBy, searchQuery, userLocation, courseIds.join(',')]);

  const loadMoreCatalogCourses = async () => {
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const result = await fetchCoursesWithOpportunities(
        nextPage, ITEMS_PER_PAGE, selectedFilter, searchQuery, sortBy, 
        userLocation?.city, userLocation?.state, userLocation?.lat, userLocation?.long
    );
    if (result.error) {
      setError(result.error);
    } else {
      setCourses((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    }
    setLoadingMore(false);
  };

  // --- RENDER HELPERS ---
  const renderCatalogHeader = () => (
    <>
      <div className="bg-[#024F86] text-white px-6 py-5 rounded-[12px] shadow-sm mb-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background glow for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-pulse"></div>
        <h2 className="text-[20px] md:text-[24px] font-black uppercase tracking-wider text-center leading-tight font-montserrat relative z-10">
          EXPLORE<br className="md:hidden" /> OPORTUNIDADES
        </h2>
      </div>

      <div className="mb-6 flex flex-col md:flex-row items-center gap-3">
        <div className="relative z-50 w-full md:flex-1 h-[42px] md:h-[48px]">
            <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full h-full flex items-center justify-between px-5 py-2 rounded-full text-[14px] font-medium transition-all duration-200 border border-[#024F86]/20 shadow-sm text-[#024F86] bg-white hover:border-[#024F86]/50 overflow-hidden"
            >
                <span className="truncate">{sortOptions.find(o => o.value === sortBy)?.label || 'Ordenar'}</span>
                <ChevronDown size={14} className="flex-shrink-0 ml-2" />
            </button>
            {isSortOpen && (
                <div className="absolute top-full mt-2 left-0 w-full min-w-[200px] bg-white border border-[#024F86]/10 rounded-xl shadow-xl z-50 py-2">
                      {sortOptions.map(option => (
                          <button
                            key={option.value}
                            onClick={() => handleSortChange(option.value)}
                            className={`w-full text-left px-5 py-3 text-sm hover:bg-[#F0F4FA] transition-colors ${sortBy === option.value ? 'font-bold text-[#024F86]' : 'text-[#636E7C]'}`}
                          >
                              {option.label}
                          </button>
                      ))}
                </div>
            )}
        </div>

        <div className="relative group w-full md:flex-1 h-[42px] md:h-[48px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-[#024F86]/50 group-focus-within:text-[#024F86] transition-colors" />
            </div>
            <input 
                type="text"
                placeholder="Buscar curso, faculdade ou cidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-11 pr-4 py-2 rounded-full text-[14px] border border-[#024F86]/20 text-[#024F86] placeholder-[#024F86]/50 bg-white focus:outline-none focus:border-[#024F86]/50 focus:ring-1 focus:ring-[#024F86]/50 shadow-sm transition-all"
            />
        </div>
      </div>

      {userLocation && sortBy === 'proximas' && (
          <div className="flex items-center justify-center md:justify-start gap-1.5 text-[#024F86] text-xs font-medium bg-white border border-[#024F86]/10 px-4 py-2 rounded-full whitespace-nowrap w-fit mx-auto md:mx-0 mb-6 shadow-sm">
              <MapPin size={12} className="text-[#38B1E4]" />
              <span className="truncate max-w-[200px]">{userLocation.city} - {userLocation.state}</span>
          </div>
      )}

      <div className="mb-6">
        <FilterPills selectedFilter={selectedFilter} onSelectFilter={handleSelectFilter} />
      </div>

      {['Oportunidades de parceiros', 'SISU', 'Prouni'].includes(selectedFilter) && allDates.length > 0 && (
        <div className="mb-8">
            <CalendarAccordion 
              dates={allDates.filter(d => {
                const type = d.type.toLowerCase();
                if (selectedFilter === 'Oportunidades de parceiros') return type === 'general' || type === 'partners';
                if (selectedFilter === 'SISU') return type === 'general' || type === 'sisu';
                if (selectedFilter === 'Prouni') return type === 'general' || type === 'prouni';
                return false;
              })} 
            />
        </div>
      )}
    </>
  );

  const renderMatchHeader = () => (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white backdrop-blur-md rounded-[24px] p-6 shadow-sm border border-[#024F86]/10 mb-8 gap-4 relative overflow-hidden">
        {/* Subtle decorative background piece */}
        <div className="absolute -right-4 -top-12 opacity-10 pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" className="text-[#38B1E4]"><path d="M12 2L2 22h20L12 2z"/></svg>
        </div>
        
        <div className="text-center md:text-left relative z-10 w-full md:w-auto">
            <h3 className="text-[20px] font-bold font-montserrat text-[#024F86] mb-1">Matches Encontrados</h3>
            <p className="text-[14px] text-[#636E7C] font-medium leading-tight">Recomendações baseadas no seu perfil e nota.</p>
        </div>
        
        <button 
            onClick={onAdjustPreferences} 
            className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#024F86] hover:bg-[#F1F5F9] hover:border-[#CBD5E1] hover:shadow-sm px-6 py-3 rounded-full font-bold transition-all w-full md:w-auto justify-center text-[14px] relative z-10 group"
        >
            <Settings size={18} className="text-[#38B1E4] group-hover:rotate-45 transition-transform duration-300" /> 
            Ajustar Preferências
        </button>
    </div>
  );

  const renderContent = () => {
    if (loading) {
        return (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="animate-spin text-[#024F86]" size={40} />
            <p className="text-[#024F86] font-medium animate-pulse">
              {mode === 'match' ? 'Buscando seus matches...' : 'Carregando oportunidades...'}
            </p>
          </div>
        );
    }

    if (error) {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/50 rounded-2xl border border-red-100">
            <h3 className="text-[#024F86] text-xl font-bold mb-2">Ops, algo deu errado</h3>
            <p className="text-[#636E7C] mb-6 max-w-sm">
              Não foi possível carregar as informações no momento. Verifique sua conexão.
            </p>
          </div>
        );
    }

    if (mode === 'catalog' && selectedFilter === 'Oportunidades de parceiros') {
        return (
            <div className="flex flex-col items-center gap-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {partners.length > 0 ? (
                    partners.map((partner) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={partner.id}>
                          <PartnerCard partner={partner} />
                      </motion.div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-16 text-[#636E7C] bg-white/50 rounded-2xl">
                        Nenhum parceiro disponível no momento.
                    </div>
                )}
              </div>
              <button 
                onClick={() => setIsPartnerModalOpen(true)}
                className="px-8 py-3 bg-gradient-to-r from-[#024F86] to-[#0360a1] text-white rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all font-bold text-[15px]"
              >
                Seja parceiro Nubo
              </button>
            </div>
        );
    }

    // Default Course List for both Match and Catalog
    if (courses.length === 0) {
        return (
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-2xl p-12 text-center flex flex-col items-center gap-3">
             <div className="w-16 h-16 bg-[#F0F4FA] rounded-full flex items-center justify-center mb-2">
                 <Search size={24} className="text-[#38B1E4]" />
             </div>
             <h3 className="text-[#024F86] text-lg font-bold">Nenhuma oportunidade encontrada</h3>
             <p className="text-[#636E7C] text-sm max-w-sm">
                Tente ajustar seus filtros ou buscar por termos diferentes para encontrar mais opções.
             </p>
          </div>
        );
    }

    return (
        <div className="flex flex-col w-full pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {courses.map((course, idx) => (
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.98 }} 
                     animate={{ opacity: 1, scale: 1 }} 
                     transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                     key={course.id}
                  >
                     <OpportunityCard 
                         course={course} 
                         highlightedOpportunityIds={mode === 'match' && matchedOppsMap ? matchedOppsMap[course.id] : undefined}
                     />
                  </motion.div>
                ))}
            </div>

            {mode === 'catalog' && hasMore && (
                <div className="mt-12 text-center">
                    <button
                        onClick={loadMoreCatalogCourses}
                        disabled={loadingMore}
                        className="px-8 py-3 bg-[#024F86] text-white rounded-full hover:bg-[#0360a1] transition-all font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto min-w-[200px]"
                    >
                        {loadingMore ? <Loader2 className="animate-spin" size={20} /> : 'Carregar mais oportunidades'}
                    </button>
                </div>
            )}
        </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full relative min-h-[60vh] flex flex-col">
       {/* Background styling container */}
       <div className={`w-full h-full bg-white/60 backdrop-blur-md rounded-[24px] md:rounded-[40px] shadow-sm border border-white p-3 sm:p-5 md:p-8 ${mode === 'catalog' ? 'mt-4 md:mt-8' : ''}`}>
           {mode === 'catalog' ? renderCatalogHeader() : renderMatchHeader()}
           {renderContent()}
       </div>
       
       <PartnerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} />
    </div>
  );
}
