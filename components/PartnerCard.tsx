'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, ArrowRight, MapPin, GraduationCap, Calendar, Zap } from 'lucide-react';
import { Montserrat } from 'next/font/google';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Partner } from '../services/supabase/partners';
import { toggleFavoriteService, getUserFavoritesService } from '../services/supabase/favorites';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface PartnerCardProps {
  partner?: Partner;
  // Fallback props for backward compatibility or direct usage
  id?: string;
  name?: string;
  description?: string;
  location?: string;
  type?: string;
  income?: string;
  dates?: any;
  link?: string;
  coverimage?: string;
  isFavorite?: boolean;
}

export function PartnerCard({ 
  partner,
  id = partner?.id || '1', 
  name = partner?.name || 'Parceiro Nubo', 
  description = partner?.description || 'Descrição não disponível.',
  location = partner?.location || 'Nacional',
  type = partner?.type || 'Bolsas de Estudo',
  income = partner?.income || 'Renda não informada',
  dates = partner?.dates,
  link = partner?.link || undefined,
  coverimage = partner?.coverimage || undefined,
  isFavorite: initialFavorite = false // Logic regarding favorite state from partner object to be added if exists in schema
}: PartnerCardProps) {
  const { isAuthenticated, openAuthModal, pendingAction, setPendingAction, clearPendingAction } = useAuth();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const router = useRouter();

  // Parse dates if available to show simpler string
  const dateDisplay = dates && Array.isArray(dates) && dates.length > 0 
    ? `${new Date(dates[0].start_date).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})} - ${new Date(dates[0].end_date).toLocaleDateString('pt-BR', {day: 'numeric', month: 'short'})}`
    : 'Datas disponíveis no site';


  // Check favorite status on load/auth
  useEffect(() => {
    async function checkFavorite() {
      if (isAuthenticated) {
        const { data } = await getUserFavoritesService();
        if (data && data.partnerIds.includes(id)) {
          setIsFavorite(true);
        } else {
          // Only reset to false if we explicitly know it's not a favorite? 
          // Or just leave as is? Better to sync truth.
          // Check if it WAS handled by pending action first?
          // Pending action sets it to true, so we should be careful not to overwrite immediate optimistic updates if we re-fetch.
          // But fetching happens on mount/auth change.
          // If pendingAction triggered, it sets isFavorite(true).
          // We should probably check if *not* in pending state?
          // Actually, if pendingAction handled it, we likely want to TRUST that or the eventual consistency.
          // But for now, let's just check server status.
          // Note: If the user just logged in via pending action, the server might not have it yet if we haven't sent the toggle yet?
          // Wait, pendingAction in PartnerCard just sets local state, it doesn't call API?
          // The previous code: `setIsFavorite(true); clearPendingAction();`
          // It didn't call the API. We need to handle that.
        }
      }
    }
    checkFavorite();
  }, [isAuthenticated, id]);

  // Handle pending action execution
  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'favorite' && pendingAction.payload.opportunityId === id) { 
      // Perform the actual toggle since we just logged in to do it
      toggleFavoriteService('partner', id).then(({ error }) => {
        if (!error) {
            setIsFavorite(true);
        }
      });
      clearPendingAction();
    }
  }, [isAuthenticated, pendingAction, id, clearPendingAction]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
        setPendingAction({ type: 'favorite', payload: { opportunityId: id } }); 
        openAuthModal();
        return;
    }
    
    // Optimistic Update
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    const { error } = await toggleFavoriteService('partner', id);
    if (error) {
        console.error('Error toggling favorite:', error);
        setIsFavorite(previousState); // Revert
    }
  };

  const handleCardClick = () => {
      if (link) {
          window.open(link, '_blank', 'noopener,noreferrer');
      }
  };

  // Helper to resolve image src - use specific partner image if exists, else fallback
  // Assuming coverimage is a full URL or a path relative to some bucket base URL?
  // If it's just a filename, we might need to prepend base URL. 
  // For now assuming full URL or local asset path. 
  // If undefined, use default mock.
  const imageSrc = coverimage || "/assets/parceiro-mock-cover.png";

  return (
    <div 
        onClick={handleCardClick}
        className={`group relative w-full h-auto min-h-[500px] rounded-2xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#FF9900] flex flex-col cursor-pointer ${montserrat.className}`}
    >
      {/* Top Section with Background and Cover */}
      <div className="relative h-[200px] w-full bg-gray-100">
         {/* Cover Image Background Fallback */}
         <div className="absolute inset-0 bg-gradient-to-b from-[#4FB7E8] to-[#2892C8]"></div>

         {/* Actual Cover Image */}
         <Image 
           src={imageSrc} 
           alt={`Capa ${name}`}
           fill
           className="object-cover"
           // Add onError handler in real app to fallback if image fails
         />
        
         {/* Heart Button Top Right */}
         <button 
           onClick={toggleFavorite}
           className="absolute top-4 right-4 p-2 rounded-full z-20 transition-transform hover:scale-110 active:scale-95 bg-white shadow-sm group/btn"
         >
            <Heart 
              size={20} 
              color={isFavorite ? "#ef4444" : "#cbd5e1"} 
              fill={isFavorite ? "#ef4444" : "none"} 
              strokeWidth={2.5}
              className="transition-colors group-hover/btn:text-red-400"
            />
         </button>

         {/* Cloud Vector at the bottom of the image section */}
         <div className="absolute bottom-[-1px] left-0 w-full h-[50px] z-10 pointer-events-none">
            <Image 
              src="/assets/background-parceiro.svg" 
              alt="Cloud Border" 
              fill 
              className="object-cover object-top" 
            />
         </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10 px-6 pb-6 pt-0 flex flex-col flex-grow bg-white">
        {/* Partner Name */}
        <h3 className="text-[18px] font-bold text-[#3A424E] mb-2 text-center md:text-left line-clamp-2 min-h-[56px] flex items-center justify-center md:justify-start">
          {name}
        </h3>

        {/* Description */}
        <p className="text-[14px] text-[#636E7C] mb-4 text-center md:text-left leading-relaxed line-clamp-3">
          {description}
        </p>

        {/* Info Icons / Metadata */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
            <MapPin size={16} className="text-[#38B1E4] flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
             <GraduationCap size={16} className="text-[#FF9900] flex-shrink-0" />
             <span className="truncate">{type}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
             <Zap size={16} className="text-[#9747FF] flex-shrink-0" />
             <span className="truncate">{income}</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
             <Calendar size={16} className="text-[#FF4D4D] flex-shrink-0" />
             <span className="truncate">{dateDisplay}</span>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-auto flex justify-end items-center pt-4 border-t border-gray-100/50">
          <button 
            className="text-[14px] font-medium text-[#38B1E4] hover:text-[#2da0d1] flex items-center gap-1 transition-colors group"
          >
            Ver link
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
