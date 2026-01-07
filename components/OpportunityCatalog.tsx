'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import FilterPills from './FilterPills';
import OpportunityCard from './OpportunityCard';
import { PartnerCard } from './PartnerCard';
import { CourseDisplayData } from '../types/opportunity';
import { fetchCoursesWithOpportunities } from '../lib/services/opportunities';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

function OpportunityCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const catalogRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  // Initialize state from URL params
  const [selectedFilter, setSelectedFilter] = useState(searchParams.get('filter') || 'Parceiros');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'proximas');

  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [userLocation, setUserLocation] = useState<{ city: string, state: string, lat?: number, long?: number } | null>(null);
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

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
    
    if (newFilter && newFilter !== 'Parceiros') params.set('filter', newFilter);
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
    // Determine if we should fetch based on filter
    if (selectedFilter !== 'Parceiros' && selectedFilter !== 'Fáceis de entrar') {
      loadInitialCourses();
    }
    
    // Update URL whenever these change (via the updateUrl wrapper or effect)
    // Actually, let's do it in the handlers to avoid effect loops, or careful effect usage.
    // Here we just fetch.
  }, [selectedFilter, sortBy, userLocation]); // removed searchQuery from dependency to avoid aggressive fetching, will handle debouncing separately or manually

  // Debounce search
  useEffect(() => {
     if (selectedFilter !== 'Parceiros' && selectedFilter !== 'Fáceis de entrar') {
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
        try {
            // Using OpenStreetMap Nominatim for better accuracy
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`, {
                headers: {
                    'User-Agent': 'Nubo/1.0' // Good practice for OSM
                }
            });
            const data = await res.json();
            
            if (data.address) {
                 // Nominatim can return city in various fields depending on the location type
                 const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.county;
                 
                 // State parsing - try to get a 2-letter code if possible, or just use the name
                 // Nominatim returns full state name usually. We'll stick to a simple mapping if needed, 
                 // but for now let's use the ISO-3166-2 code if available in 'ISO3166-2-lvl4' which is sometimes in address or extratags.
                 // The standard address object has 'state'.
                 // We will try to map common Brazilian states or just display what we get if it's short.
                 // Actually, let's just use the state name for display, or try to extract initials.
                 let state = data.address.state;
                 
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

                 setUserLocation({ city: city || 'Localização detectada', state: state || '', lat: latitude, long: longitude });
                 console.log("Geolocation updated:", { city, state, latitude, longitude });
            }
        } catch (e) {
            console.error("Error getting location", e);
        }
     }, (err) => {
        console.error("Geolocation error", err);
        // If denied or unavailable, update state. The Effect will handle the fallback if needed.
        setIsLocationDenied(true);
     });
  };

  useEffect(() => {
      // Trigger geoloc on mount if "Próximas" is default
      if (sortBy === 'proximas') {
          getUserLocation();
      }
  }, []);

  const handleSortChange = (value: string) => {
      setSortBy(value);
      setIsSortOpen(false);
      updateUrl(selectedFilter, searchQuery, value);
      if (value === 'proximas' && !userLocation) {
          getUserLocation();
      }
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

    if (selectedFilter !== 'Parceiros' && selectedFilter !== 'Fáceis de entrar') {
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
    <section ref={catalogRef} className="relative pb-16 pt-8 scroll-mt-32">
      {/* Floating Container */}
      <div className="container mx-auto px-4">
        <div className="bg-white/30 backdrop-blur-md border border-white/20 shadow-xl rounded-[40px] p-8 pt-16 relative min-h-[800px]">
          
          {/* Title Pill */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#024F86] text-white px-12 py-4 rounded-xl shadow-lg z-10">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-wider text-center">
              Explore oportunidades
            </h2>
          </div>

          <div className="mb-8 mt-4">
            <FilterPills selectedFilter={selectedFilter} onSelectFilter={handleSelectFilter}>
               {/* Sort Dropdown */}
               <div className="relative z-50">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border border-[#024F86] text-[#024F86] bg-white/10 hover:bg-[#024F86]/5 whitespace-nowrap"
                    >
                        {sortOptions.find(o => o.value === sortBy)?.label || 'Ordenar'}
                        <ChevronDown size={14} />
                    </button>
                    
                    {isSortOpen && (
                        <div className="absolute top-full mt-2 left-0 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-2">
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
                <div className="relative group w-48 md:w-64">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search size={14} className="text-[#024F86]" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Buscar curso..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-full text-sm border border-[#024F86] text-[#024F86] placeholder-[#024F86]/60 bg-white/10 focus:outline-none focus:ring-1 focus:ring-[#024F86]"
                    />
                </div>

                {/* Location Display if available */}
                {userLocation && sortBy === 'proximas' && (
                    <div className="hidden md:flex items-center gap-1 text-[#024F86] text-xs font-medium bg-[#024F86]/5 px-3 py-1 rounded-full whitespace-nowrap">
                        <MapPin size={12} />
                        {userLocation.city} - {userLocation.state}
                    </div>
                )}
            </FilterPills>
          </div>

          {renderContent()}

        </div>
      </div>
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
