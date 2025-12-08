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

  // Badge Logic
  const getBadgeStyle = (type: string) => {
    if (type === 'Pública') return 'bg-[#2E7D32] text-white'; // Green for Public/Sisu
    return 'bg-[#A855F7] text-white'; // Purple for Prouni
  };

  return (
    <div className={`group rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden border border-transparent hover:border-[#38B1E4]/50 box-border ${montserrat.className}`}>
      {/* Cloud Background */}
      <div 
        className="absolute inset-0 w-full h-full bg-no-repeat bg-[length:100%_100%] pointer-events-none z-0"
        style={{ backgroundImage: "url('/assets/card-background.svg')" }}
      ></div>

      {/* Header: Badges & Favorite */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${getBadgeStyle(opportunity.type)}`}>
            {opportunity.type === 'Pública' ? 'Sisu' : 'Prouni'}
          </span>
          {opportunity.scholarship_type && (
            <span className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#F97316] text-white uppercase tracking-wider">
              {opportunity.scholarship_type}
            </span>
          )}
        </div>
        <button 
          onClick={handleFavorite}
          className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-50' : 'text-white/70 hover:text-red-400 hover:bg-white'}`}
        >
          <Heart size={22} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
        </button>
      </div>
      
      {/* Body: Title & Info */}
      <div className="mb-4 relative z-10 flex-grow pt-4">
        <h3 className="text-[16px] font-semibold text-[#3A424E] mb-1 leading-tight group-hover:text-[#38B1E4] transition-colors line-clamp-2">
          {opportunity.title}
        </h3>
        
        <p className="text-[#3A424E]/70 text-sm font-medium mb-3 line-clamp-1">
          {opportunity.institution}
        </p>

        <div className="flex flex-col gap-2 mt-4">
           {/* Location */}
          <div className="flex items-center gap-2 text-sm text-[#3A424E]/70">
            <MapPin size={16} className="text-[#38B1E4]" />
            <span>{opportunity.location}</span>
          </div>

          {/* Score */}
          {opportunity.cutoff_score && (
            <div className="flex items-center gap-2 text-sm text-[#3A424E]/70 font-medium">
              <Zap size={16} className="text-[#F59E0B] fill-[#F59E0B]" />
              <span>Nota de corte: <span className="text-[#3A424E] font-bold">{opportunity.cutoff_score.toFixed(2)}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Modality & Link */}
      <div className="mt-auto pt-4 flex items-center justify-between relative z-10 w-full border-t border-gray-100/50">
        <span className="text-[11px] font-semibold text-white bg-[#3A424E]/60 px-3 py-1 rounded-full">
          {opportunity.modality}
        </span>
        <button 
          onClick={handleViewDetails}
          className="text-sm font-medium text-[#38B1E4] hover:text-[#0EA5E9] flex items-center gap-1 transition-colors"
        >
          Ver detalhes
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
