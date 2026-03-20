'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import FilterPills from './FilterPills';
import OpportunityCard from './OpportunityCard';
import { PartnerCard } from './PartnerCard';
import { CourseDisplayData } from '../types/opportunity';
import { fetchCoursesWithOpportunities } from '../lib/services/opportunities';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Partner, getPartners } from '../services/supabase/partners';
import PartnerModal from './PartnerModal';
import { ImportantDate } from '../types/calendar';
import { getImportantDates } from '../lib/services/opportunities';
import CalendarAccordion from './courses/CalendarAccordion';

function OpportunityCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const catalogRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  // Initialize state from URL params
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('filter') || 'Oportunidades de parceiros');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'proximas');
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(false);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{ city: string, state: string, lat?: number, long?: number } | null>(null);
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [allDates, setAllDates] = useState<ImportantDate[]>([]);

  const ITEMS_PER_PAGE = 15;

  // Scroll restoration on mount if params exist
  useEffect(() => {
    if (isFirstMount.current) {
        // If we have any non-default params, it means we returned to this state, so scroll to catalog
        const hasParams = searchParams.has('filter') || searchParams.has('q') || searchParams.has('sort');
        
        if (hasParams && catalogRef.current) {
            // Small timeout to ensure layout is stable
            setTimeout(() => {
                catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        isFirstMount.current = false;
    }
  }, [searchParams]);

  // Sync state to URL
  const updateUrl = (newFilter: string, newSearch: string, newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newFilter && newFilter !== 'Oportunidades de parceiros') params.set('filter', newFilter);
    else params.delete('filter');

    if (newSearch) params.set('q', newSearch);
    else params.delete('q');

    if (newSort && newSort !== 'proximas') params.set('sort', newSort);
    else params.delete('sort');

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // sort options
  const sortOptions = [
    { label: 'Próximas a você', value: 'proximas' },
    { label: 'Melhores cursos', value: 'melhores' },
    { label: 'Maior nota de corte', value: 'maior_nota' },
    { label: 'Menor nota de corte', value: 'menor_nota' }
  ].filter(option => !isLocationDenied || option.value !== 'proximas');

  // Fetch Logic
  useEffect(() => {
    // Determine if we should fetch based on filter
    if (selectedFilter !== 'Oportunidades de parceiros') {
      loadInitialCourses();
    } else if (selectedFilter === 'Oportunidades de parceiros') {
      loadPartners();
    }
    
    // Update URL whenever these change (via the updateUrl wrapper or effect)
  }, [selectedFilter, sortBy, userLocation]); 

  // Debounce search
  useEffect(() => {
     if (selectedFilter !== 'Oportunidades de parceiros') {
        const timer = setTimeout(() => {
            loadInitialCourses();
            // Update URL for search query here since it's debounced input
            updateUrl(selectedFilter, searchQuery, sortBy);
        }, 600);
        return () => clearTimeout(timer);
     }
  }, [searchQuery]);

  // Effect to handle fallback if location is denied while on 'proximas'
  useEffect(() => {
      if (isLocationDenied && sortBy === 'proximas') {
          handleSortChange('melhores');
      }
  }, [isLocationDenied, sortBy]);

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
            // Using OpenStreetMap Nominatim for better accuracy
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
                headers: {
                    'User-Agent': 'Nubo/1.0' // Good practice for OSM
                }
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.address) {
                     city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county || city;
                     state = data.address.state || state;
                     
                     // Simple brazilian state mapper (fallback)
                     const stateMapping: {[key: string]: string} = {
                         'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA', 'Ceará': 'CE',
                         'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT',
                         'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
                         'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
                         'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
                         'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO'
                     };
    
                     if (state && stateMapping[state]) {
                         state = stateMapping[state];
                     }
                }
            }
        } catch (e) {
            console.error("Error getting address details", e);
        }

        // Always set location if we have coords, even if address lookup failed
        setUserLocation({ city, state, lat: latitude, long: longitude });
        console.log("Geolocation updated:", { city, state, latitude, longitude });
     }, (err) => {
        console.error("Geolocation error", err);
        setIsLocationDenied(true);
     });
  };

  useEffect(() => {
      // Trigger geoloc on mount if "Próximas" is default
      if (sortBy === 'proximas') {
          getUserLocation();
      }

      // Fetch all important dates
      const loadDates = async () => {
        try {
          const dates = await getImportantDates(['general', 'sisu', 'prouni', 'partners']);
          setAllDates(dates);
        } catch (e) {
          console.error("Error loading dates for catalog:", e);
        }
      };
      loadDates();
  }, []);

  const handleSortChange = (value: string) => {
      setSortBy(value);
      setIsSortOpen(false);
      updateUrl(selectedFilter, searchQuery, value);
      if (value === 'proximas' && !userLocation) {
          getUserLocation();
      }
  };

  const loadPartners = async () => {
    // Avoid re-fetching if already loaded, unless we want to refresh
    if (partners.length > 0) return;
    
    setPartnersLoading(true);
    const data = await getPartners();
    setPartners(data);
    setPartnersLoading(false);
  };

  const loadInitialCourses = async () => {
    setLoading(true);
    setError(null);

    const result = await fetchCoursesWithOpportunities(
        0, 
        ITEMS_PER_PAGE, 
        selectedFilter, 
        searchQuery, 
        sortBy, 
        userLocation?.city, 
        userLocation?.state,
        userLocation?.lat,
        userLocation?.long
    );
    console.log('OpportunityCatalog: Initial load result:', result);

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

    const result = await fetchCoursesWithOpportunities(
        nextPage, 
        ITEMS_PER_PAGE,
        selectedFilter, 
        searchQuery, 
        sortBy, 
        userLocation?.city, 
        userLocation?.state,
        userLocation?.lat,
        userLocation?.long
    );
    console.log('OpportunityCatalog: Load more result:', result);

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
    updateUrl(filter, searchQuery, sortBy);
  };

  const renderContent = () => {
    if (selectedFilter === 'Oportunidades de parceiros') {
      if (partnersLoading) {
          return (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#024F86] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#024F86] font-medium">Carregando parceiros...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center gap-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {partners.length > 0 ? (
                partners.map((partner) => (
                  <PartnerCard 
                    key={partner.id} 
                    partner={partner}
                  />
                ))
            ) : (
                <div className="col-span-full text-center py-12 text-[#636E7C]">
                    Nenhum parceiro encontrado no momento.
                </div>
            )}
          </div>

          <button 
            onClick={() => setIsPartnerModalOpen(true)}
            className="px-8 py-3 bg-[#024F86] text-white rounded-full hover:bg-[#023F6B] transition-colors font-bold shadow-md text-lg"
          >
            Seja parceiro Nubo
          </button>
        </div>
      );
    }

    if (selectedFilter !== 'Oportunidades de parceiros') {
      if (loading) {
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
        /* if (selectedFilter === 'Seleção Nubo') {
           return (
             <div className="bg-white/50 border border-white/20 rounded-lg p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
               <h3 className="text-xl font-bold text-[#024F86] mb-2">Em breve</h3>
               <p className="text-[#636E7C]">Estamos trabalhando para trazer mais oportunidades nesta categoria.</p>
             </div>
           );
         } */

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
    // Default placeholder for unknown filters
    return null;
  };

  return (
    <section id="oportunidades" ref={catalogRef} className="relative pb-16 pt-2 scroll-mt-32">
      <div className="container mx-auto px-1 md:px-4">
        <div className="bg-white/60 backdrop-blur-md border border-white/50 shadow-sm rounded-[24px] md:rounded-[40px] p-4 md:p-8 relative min-h-[600px] md:min-h-[800px]">
          
          {/* Title Box */}
          <div className="bg-[#024F86] text-white px-6 py-5 rounded-[12px] shadow-sm mb-6 flex items-center justify-center">
            <h2 className="text-[20px] md:text-[24px] font-black uppercase tracking-wider text-center leading-tight font-montserrat">
              EXPLORE<br className="md:hidden" /> OPORTUNIDADES
            </h2>
          </div>

          {/* Controls Row: Sort and Search */}
          <div className="mb-6 flex flex-row items-center gap-3">
               {/* Sort Dropdown */}
               <div className="relative z-50 flex-1 h-[42px]">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="w-full h-full flex items-center justify-between px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-[#024F86] text-[#024F86] bg-white hover:bg-[#024F86]/5 overflow-hidden"
                    >
                        <span className="truncate">{sortOptions.find(o => o.value === sortBy)?.label || 'Ordenar'}</span>
                        <ChevronDown size={14} className="flex-shrink-0 ml-2" />
                    </button>
                    
                    {isSortOpen && (
                        <div className="absolute top-full mt-2 left-0 w-full min-w-[200px] bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-2">
                             {sortOptions.map(option => (
                                 <button
                                    key={option.value}
                                    onClick={() => handleSortChange(option.value)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${sortBy === option.value ? 'font-bold text-[#024F86]' : 'text-gray-700'}`}
                                 >
                                     {option.label}
                                 </button>
                             ))}
                        </div>
                    )}
                </div>

                {/* Search Input */}
                <div className="relative group flex-1 h-[42px]">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-[#024F86]/60" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Buscar curso..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full pl-9 pr-4 py-2 rounded-full text-[13px] md:text-sm border border-[#024F86] text-[#024F86] placeholder-[#024F86]/60 bg-white focus:outline-none focus:ring-1 focus:ring-[#024F86]"
                    />
                </div>
          </div>

          {/* Location Display if available */}
          {userLocation && sortBy === 'proximas' && (
              <div className="flex items-center justify-center md:justify-start gap-1 text-[#024F86] text-xs font-medium bg-[#024F86]/5 px-3 py-1.5 rounded-full whitespace-nowrap w-fit mx-auto md:mx-0 mb-6 border border-[#024F86]/10">
                  <MapPin size={12} />
                  {userLocation.city} - {userLocation.state}
              </div>
          )}

          <div className="mb-6">
            <FilterPills selectedFilter={selectedFilter} onSelectFilter={handleSelectFilter} />
          </div>

          {/* Calendar Accordion */}
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

          {renderContent()}

        </div>
      </div>

      <PartnerModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} />
    </section>
  );
}

export default function OpportunityCatalog() {
  return (
    <Suspense fallback={
        <div className="py-16 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#024F86] border-t-transparent rounded-full mx-auto"></div>
        </div>
    }>
        <OpportunityCatalogContent />
    </Suspense>
  );
}
