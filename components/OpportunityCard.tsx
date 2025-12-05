'use client';

import React, { useState, useEffect } from 'react';
import { Opportunity } from '../types/opportunity';
import { Heart, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

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
    <div className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden">
      {/* Cloud Decoration (Simulated) */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-50/50 to-transparent -z-0"></div>

      <button 
        onClick={handleFavorite}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${isFavorite ? 'text-red-500 bg-red-50' : 'text-neutral-300 hover:text-red-400 hover:bg-red-50'}`}
      >
        <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <div className="flex justify-between items-start mb-4 pr-8 relative z-10">
        <div className="flex gap-2 flex-wrap">
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#A855F7] text-white uppercase tracking-wide">
            {opportunity.type === 'Pública' ? 'Sisu' : 'Prouni'}
          </span>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#F97316] text-white uppercase tracking-wide">
            {opportunity.scholarship_type}
          </span>
        </div>
      </div>
      
      <div className="mb-2 relative z-10">
        <h3 className="text-lg font-bold text-neutral-800 mb-1 group-hover:text-[#38B1E4] transition-colors line-clamp-2">
          {opportunity.title}
        </h3>
        <p className="text-neutral-500 text-sm mb-2 line-clamp-1 font-medium">
          {opportunity.institution}
        </p>
        <span className="text-xs text-neutral-400 flex items-center gap-1 mb-3">
          <MapPin size={14} />
          {opportunity.location}
        </span>
        
        {opportunity.cutoff_score && (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-50 px-2 py-1 rounded-md w-fit">
            <span>⚡ Nota de corte: {opportunity.cutoff_score.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex items-center justify-between relative z-10">
        <span className="text-xs font-bold text-white bg-neutral-500 px-3 py-1 rounded-full">
          {opportunity.modality}
        </span>
        <button 
          onClick={handleViewDetails}
          className="text-sm font-bold text-[#38B1E4] hover:text-[#2a9ac9] flex items-center gap-1 transition-colors"
        >
          Ver detalhes
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
