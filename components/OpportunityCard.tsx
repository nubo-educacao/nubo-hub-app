'use client';

import React, { useState, useEffect } from 'react';
import { CourseDisplayData, OpportunityDisplay } from '../types/opportunity';
import { toggleFavoriteService, getUserFavoritesService } from '../services/supabase/favorites';
import { Heart, MapPin, TrendingUp, ArrowRight, Sun, Sunset, Moon, SunMoon, Laptop } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface OpportunityCardProps {
  course: CourseDisplayData;
}

export default function OpportunityCard({ course }: OpportunityCardProps) {
  const { isAuthenticated, openAuthModal, pendingAction, setPendingAction, clearPendingAction } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const router = useRouter();

  // Check favorite status on load/auth
  useEffect(() => {
    async function checkFavorite() {
      if (isAuthenticated) {
        const { data } = await getUserFavoritesService();
        if (data && data.courseIds.includes(course.id)) {
          setIsFavorite(true);
        }
      }
    }
    checkFavorite();
  }, [isAuthenticated, course.id]);

  // Logic to handle favorite for the COURSE
  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'favorite' && pendingAction.payload.opportunityId === course.id) {
      // Execute the pending favorite action
      toggleFavoriteService('course', course.id).then(({ error }) => {
          if (!error) setIsFavorite(true);
      });
      clearPendingAction();
    }
    
    if (isAuthenticated && pendingAction?.type === 'redirect' && pendingAction.payload.url === `/courses/${course.id}`) {
      clearPendingAction();
      router.push(`/courses/${course.id}`);
    }
  }, [isAuthenticated, pendingAction, course.id, clearPendingAction, router]);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setPendingAction({ type: 'favorite', payload: { opportunityId: course.id } });
      openAuthModal();
      return;
    }
    
    // Optimistic Update
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    const { error } = await toggleFavoriteService('course', course.id);
    if (error) {
        console.error('Error toggling favorite:', error);
        setIsFavorite(previousState);
    }
  };

  const handleViewDetails = () => {
    if (!isAuthenticated) {
      setPendingAction({ type: 'redirect', payload: { url: `/courses/${course.id}` } });
      openAuthModal();
      return;
    }
    router.push(`/courses/${course.id}`);
  };

  // Logic: Cutoff Score Range
  const cutoffScores = course.opportunities
    .map(o => o.cutoff_score || 0)
    .filter(s => s >= 0); // Include 0
  
  const minCutoff = cutoffScores.length > 0 ? Math.min(...cutoffScores) : 0;
  const maxCutoff = cutoffScores.length > 0 ? Math.max(...cutoffScores) : 0;
  const cutoffDisplay = minCutoff === maxCutoff ? `${minCutoff}` : `${minCutoff} - ${maxCutoff}`;

  // Logic: Unique Opportunity Types for Badges
  const uniqueTypes = Array.from(new Set(course.opportunities.map(o => o.opportunity_type).filter(Boolean))).slice(0, 2); // Limit to 2 for space

  // Logic: Active Shifts
  const activeShifts = new Set(course.opportunities.map(o => o.shift));
  const hasEaD = course.opportunities.some(o => o.shift === 'EaD' || o.shift === 'Curso a distância');
  
  const shiftsConfig = [
    { id: 'matutino', icon: Sun, active: activeShifts.has('Matutino'), label: 'Matutino' },
    { id: 'vespertino', icon: Sunset, active: activeShifts.has('Vespertino'), label: 'Vespertino' },
    { id: 'noturno', icon: Moon, active: activeShifts.has('Noturno'), label: 'Noturno' },
    { id: 'integral', icon: SunMoon, active: activeShifts.has('Integral'), label: 'Integral' },
    { id: 'ead', icon: Laptop, active: hasEaD, label: 'EAD' },
  ];

  return (
    <div 
        onClick={handleViewDetails}
        className={`group rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden bg-white box-border cursor-pointer border border-transparent hover:border-[#FF9900] ${montserrat.className}`}
    >
      {/* Header Section: Background & Location/Favorite */}
      <div className="relative h-[100px] w-full bg-[#C8EEFF]">
        {/* Badge: Top Left */}
        <div className="absolute top-4 left-4 z-30">
             {uniqueTypes.filter(Boolean).map((type, index) => (
                 <span key={`${type}-${index}`} className="text-[12px] font-bold px-3 py-1.5 rounded-full text-white whitespace-nowrap bg-[#9747FF]/90 backdrop-blur-sm shadow-[0_3px_8px_rgba(151,71,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.1)] border border-[#B070FF]/50 uppercase">
                    {type}
                 </span>
             ))}
        </div>

        <div className="absolute top-4 right-4 z-20">
            <button 
            onClick={handleFavorite}
            className="p-2 rounded-full transition-transform hover:scale-110 active:scale-95 bg-white shadow-sm group/btn"
            >
            <Heart 
                size={20} 
                color={isFavorite ? "#ef4444" : "#cbd5e1"} 
                fill={isFavorite ? "#ef4444" : "none"} 
                strokeWidth={2.5}
                className="transition-colors group-hover/btn:text-red-400"
            />
            </button>
        </div>

         {/* Cloud Vector */}
         <div className="absolute bottom-[-1px] left-0 w-full h-[35px] z-10">
           <div className="relative w-full h-full">
             <img 
               src="/assets/card-background.svg" 
               alt="Cloud Border" 
               className="object-cover object-top w-full h-full"
             />
           </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="flex flex-col flex-grow px-6 pb-6 pt-0 relative z-10 bg-white">

        {/* Standardized Info Block */}
        <div className="flex flex-col gap-2 mt-2">
          <h3 className="text-[18px] font-bold text-[#000000] leading-[1.2] transition-colors line-clamp-2">
            {course.title}
          </h3>
          <p className="text-[#3A424E] text-[14px] font-normal line-clamp-1 opacity-70">
            {course.institution}
          </p>
          <div className="flex items-center gap-2 text-[13px] text-[#3A424E] opacity-70">
              <MapPin size={16} className="text-[#38B1E4]" />
              <span className="truncate">{course.location}</span>
          </div>
          <div className="flex items-center gap-2 text-[#3A424E] text-[13px] opacity-70">
                 <TrendingUp size={16} className="text-[#FF9900]" />
                 <span className="font-normal">Nota de corte: <span className="font-bold">{cutoffDisplay}</span></span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-100/50 mt-3 mb-3"></div>

        {/* Spacer */}
        <div className="flex-grow"></div>

        {/* Footer: Shifts + Action */}
        <div className="flex justify-between items-center mt-auto h-[40px]">
            {/* Shifts Pill */}
            <div className="bg-[#FF9900]/90 backdrop-blur-sm shadow-[0_2px_6px_rgba(255,153,0,0.25),inset_0_-2px_4px_rgba(0,0,0,0.1)] border border-[#FFB84D]/50 rounded-[166px] px-[12px] py-[6px] flex items-center gap-3 h-fit transition-all hover:scale-105 hover:shadow-[0_4px_10px_rgba(255,153,0,0.35),inset_0_-2px_4px_rgba(0,0,0,0.1)]">
                    {shiftsConfig.map((shift, index) => (
                        <div key={`${shift.id}-${index}`} className="flex items-center justify-center relative group/icon">
                            <shift.icon 
                                size={18} 
                                color={shift.active ? "#FFFFFF" : "#FFFFFF"} 
                                fill={shift.active ? "currentColor" : "none"}
                                className={`${!shift.active ? "opacity-[0.5]" : "opacity-100 drop-shadow-md"} transition-all duration-300`}
                                strokeWidth={2.5}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800/90 text-white text-[10px] rounded opacity-0 group-hover/icon:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 backdrop-blur-sm">
                                {shift.label}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800/90"></div>
                            </div>
                        </div>
                    ))}
            </div>

            {/* View Details Link */}
            <button 
                onClick={handleViewDetails}
                className="text-[14px] font-medium text-[#38B1E4] hover:text-[#2da0d1] flex items-center gap-1 transition-colors whitespace-nowrap"
            >
                Ver detalhes
                <ArrowRight size={18} strokeWidth={2.5} />
            </button>
        </div>
      </div>
    </div>
  );
}
