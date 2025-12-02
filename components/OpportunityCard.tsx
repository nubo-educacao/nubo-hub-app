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
    <div className="group bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-indigo-500/50 hover:bg-neutral-800/50 transition-all duration-300 flex flex-col h-full relative">
      <button 
        onClick={handleFavorite}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-red-500/10' : 'text-neutral-500 hover:text-red-400 hover:bg-neutral-800'}`}
      >
        <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
      </button>

      <div className="flex justify-between items-start mb-3 pr-8">
        <div className="flex gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
            opportunity.type === 'Pública' ? 'bg-green-900/30 text-green-400' :
            opportunity.type === 'Privada' ? 'bg-blue-900/30 text-blue-400' :
            'bg-purple-900/30 text-purple-400'
          }`}>
            {opportunity.scholarship_type}
          </span>
          {opportunity.cutoff_score && (
            <span className="text-xs font-semibold px-2 py-1 rounded-md bg-amber-900/30 text-amber-400">
              Nota: {opportunity.cutoff_score.toFixed(2)}
            </span>
          )}
        </div>
      </div>
      
      <div className="mb-1">
        <span className="text-xs text-neutral-500 flex items-center gap-1 mb-2">
          <MapPin size={12} />
          {opportunity.location}
        </span>
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors line-clamp-2">
          {opportunity.title}
        </h3>
        <p className="text-neutral-400 text-sm mb-4 line-clamp-1">
          {opportunity.institution}
        </p>
      </div>

      <div className="mt-auto pt-4 border-t border-neutral-800 flex items-center justify-between">
        <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-1 rounded">
          {opportunity.modality}
        </span>
        <button 
          onClick={handleViewDetails}
          className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          Ver detalhes
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
