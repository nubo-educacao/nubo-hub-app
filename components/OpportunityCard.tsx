'use client';

import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types/opportunity';
import { Heart, MapPin, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { isAuthenticated, openAuthModal, pendingAction, setPendingAction, clearPendingAction } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'favorite' && pendingAction.payload.opportunityId === opportunity.id) {
      setIsFavorite(true);
      clearPendingAction();
    }
    
    if (isAuthenticated && pendingAction?.type === 'redirect' && pendingAction.payload.url === `/opportunities/${opportunity.id}`) {
      clearPendingAction();
      router.push(`/opportunities/${opportunity.id}`);
    }
  }, [isAuthenticated, pendingAction, opportunity.id, clearPendingAction, router]);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setPendingAction({ type: 'favorite', payload: { opportunityId: opportunity.id } });
      openAuthModal();
      return;
    }
    setIsFavorite(!isFavorite);
  };

  const handleViewDetails = () => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'redirect', payload: { url: `/opportunities/${opportunity.id}` } });
      openAuthModal();
      return;
    }
    router.push(`/opportunities/${opportunity.id}`);
  };

  return (
    <div className={`group rounded-[16px] shadow-[0px_24px_44px_-11px_rgba(181,183,192,0.3)] hover:shadow-lg transition-all duration-300 flex flex-col h-full relative overflow-hidden bg-white box-border ${montserrat.className}`}>
      {/* Header Section: Background & Badges/Favorite */}
      <div className="relative h-[140px] w-full bg-[#C8EEFF]">
        {/* Badges and Heart positioned absolute in the header */}
        <div className="absolute top-4 left-4 z-20 flex gap-2 flex-wrap max-w-[80%]">
          {/* Main Badge */}
          <span className={`text-[13px] font-medium px-3 py-1 rounded-full text-white whitespace-nowrap ${
            opportunity.type === 'Pública' ? 'bg-[#FF9900]' : 'bg-[#9747FF]'
          }`}>
            {opportunity.type === 'Pública' ? 'Sisu' : 'Prouni'}
          </span>
          
          {/* Secondary Badge */}
          {opportunity.scholarship_type && (
            <span className="text-[13px] font-medium px-3 py-1 rounded-full bg-[#FF9900] text-white whitespace-nowrap">
              {opportunity.scholarship_type}
            </span>
          )}
        </div>

        <button 
          onClick={handleFavorite}
          className={`absolute top-4 right-4 z-20 p-1.5 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-white' : 'text-[#3A424E]/50 hover:text-red-400 hover:bg-white/50'}`}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>

        {/* Cloud Vector at the bottom of the header section */}
        <div className="absolute bottom-[-1px] left-0 w-full h-[50px] z-10">
           <div className="relative w-full h-full">
             {/* Using standard img tag if Image component not imported or to be safe, but expecting Image import below */}
             <img 
               src="/assets/card-background.svg" 
               alt="Cloud Border" 
               className="object-cover object-top w-full h-full"
             />
           </div>
        </div>
      </div>
      
      {/* Body: Institution & Title & Footer */}
      <div className="flex flex-col flex-grow p-4 pt-0 relative z-10 bg-white">
        <div className="mb-2 flex-grow">
          <p className="text-[#3A424E] text-[14px] font-medium mb-1 line-clamp-1">
            {opportunity.institution}
          </p>
          <h3 className="text-[16px] font-semibold text-[#3A424E] leading-[1.25] group-hover:text-[#005CA9] transition-colors line-clamp-2">
            {opportunity.title}
          </h3>

          <div className="flex flex-col gap-1.5 mt-3">
             {/* Location */}
            <div className="flex items-center gap-1.5 text-[13px] text-[#3A424E]">
              <MapPin size={14} className="text-[#3A424E]" />
              <span>{opportunity.location}</span>
            </div>

            {/* Score */}
            {opportunity.cutoff_score && (
              <div className="flex items-center gap-1.5 text-[13px] text-[#3A424E] font-medium">
                <Zap size={14} className="text-[#3A424E] fill-[#3A424E]" />
                <span>Nota de corte: <span className="font-bold">{opportunity.cutoff_score.toFixed(2)}</span></span>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Modality & Link */}
        <div className="mt-auto pt-3 flex items-center justify-between w-full border-t border-gray-100/50">
          <span className="text-[11px] font-semibold text-white bg-[#3A424E] px-3 py-1 rounded-full">
            {opportunity.modality}
          </span>
          <button 
            onClick={handleViewDetails}
            className="text-[14px] font-medium text-[#005CA9] hover:text-[#004A87] flex items-center gap-1 transition-colors"
          >
            Ver detalhes
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
