'use client';

import React from 'react';
import { FavoriteDetails } from '@/services/supabase/favorites';
import { CourseDisplayData } from '@/types/opportunity';
import { Partner } from '@/services/supabase/partners';
import OpportunityCard from '@/components/OpportunityCard';
import { PartnerCard } from '@/components/PartnerCard';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface FavoritesSectionProps {
  favorites: FavoriteDetails;
}

// Helper Component for Carousel
interface CarouselProps {
  items: any[];
  renderItem: (item: any) => React.ReactNode;
  title: string;
  count: number;
  iconColor: string;
  countColor: string;
}

function CarouselSection({ items, renderItem, title, count, iconColor, countColor }: CarouselProps) {
  const [startIndex, setStartIndex] = React.useState(0);
  const ITEMS_PER_PAGE = 2; // As requested

  const nextParams = () => {
    if (startIndex + ITEMS_PER_PAGE < items.length) {
      setStartIndex(prev => prev + ITEMS_PER_PAGE);
    }
  };

  const prevParams = () => {
    if (startIndex - ITEMS_PER_PAGE >= 0) {
      setStartIndex(prev => prev - ITEMS_PER_PAGE);
    }
  };

  const visibleItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const showNext = startIndex + ITEMS_PER_PAGE < items.length;
  const showPrev = startIndex > 0;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
          <h2 className={`text-2xl font-bold ${iconColor}`}>{title}</h2>
          <span className={`${countColor} text-white text-xs font-bold px-2 py-1 rounded-full`}>{count}</span>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4 relative group">
        {/* Prev Button */}
        <button 
            onClick={prevParams}
            disabled={!showPrev}
            className={`p-3 rounded-full transition-all shrink-0 ${
                showPrev 
                ? 'text-[#024F86] bg-white/50 hover:bg-white shadow-sm cursor-pointer' 
                : 'text-[#024F86]/30 bg-white/10 cursor-not-allowed'
            }`}
        >
            <ChevronLeft size={32} />
        </button>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {visibleItems.map(item => (
                <div key={item.id} className="h-full">
                    {renderItem(item)}
                </div>
            ))}
            {/* Provide empty placeholders to maintain grid shape if odd number? 
                Not strictly necessary if we just want 2 items max, but helps stability. 
                However, existing code slices to ITEMS_PER_PAGE. */}
        </div>
        
        {/* Next Button */}
        <button 
            onClick={nextParams}
            disabled={!showNext}
            className={`p-3 rounded-full transition-all shrink-0 ${
                showNext
                ? 'text-[#024F86] bg-white/50 hover:bg-white shadow-sm cursor-pointer' 
                : 'text-[#024F86]/30 bg-white/10 cursor-not-allowed'
            }`}
        >
            <ChevronRight size={32} />
        </button>
      </div>
    </section>
  );
}

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FavoritesSection({ favorites }: FavoritesSectionProps) {
  const hasCourses = favorites.courses && favorites.courses.length > 0;
  const hasPartners = favorites.partners && favorites.partners.length > 0;

  if (!hasCourses && !hasPartners) {
    return (
      <div className={`bg-white/30 backdrop-blur-md border border-white/20 shadow-lg rounded-2xl p-8 text-center ${montserrat.className}`}>
         <h2 className="text-2xl font-bold text-[#024F86] mb-2">Oportunidades Favoritas</h2>
         <p className="text-[#636E7C]">Você ainda não favoritou nenhuma oportunidade ou parceiro.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-12 ${montserrat.className}`}>
      
      {/* COURSES */}
      {hasCourses && (
        <CarouselSection 
            items={favorites.courses}
            title="Cursos Favoritos"
            count={favorites.courses.length}
            iconColor="text-[#024F86]"
            countColor="bg-[#FF9900]"
            renderItem={(course: CourseDisplayData) => <OpportunityCard course={course} />}
        />
      )}

      {/* PARTNERS */}
      {hasPartners && (
        <CarouselSection 
            items={favorites.partners}
            title="Parceiros Favoritos"
            count={favorites.partners.length}
            iconColor="text-[#024F86]"
            countColor="bg-[#38B1E4]"
            renderItem={(partner: Partner) => <PartnerCard partner={partner} isFavorite={true} />}
        />
      )}

    </div>
  );
}
