'use client';

import React, { useState, useEffect } from 'react';
import { CourseDisplayData, OpportunityDisplay } from '../types/opportunity';
import { Heart, MapPin, Zap, ArrowRight, Clock, GraduationCap } from 'lucide-react';
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

  // Logic to handle favorite for the COURSE (or potentially specific opportunity, but simplify to course for now if ID matches)
  useEffect(() => {
    if (isAuthenticated && pendingAction?.type === 'favorite' && pendingAction.payload.opportunityId === course.id) {
       // Note: payload ID might need adjustment if we track favorites by course ID vs opportunity ID
      setIsFavorite(true);
      clearPendingAction();
    }
    
    // Check if we need to redirect to this course details
    if (isAuthenticated && pendingAction?.type === 'redirect' && pendingAction.payload.url === `/courses/${course.id}`) {
      clearPendingAction();
      router.push(`/courses/${course.id}`);
    }
  }, [isAuthenticated, pendingAction, course.id, clearPendingAction, router]);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setPendingAction({ type: 'favorite', payload: { opportunityId: course.id } }); // Using course ID for now
      openAuthModal();
      return;
    }
    setIsFavorite(!isFavorite);
  };

  const handleViewDetails = () => {
    // Redirect to course details page (assuming it exists or will be created)
    // If not, maybe select the first opportunity? For now, go to course page.
    if (!isAuthenticated) {
      setPendingAction({ type: 'redirect', payload: { url: `/courses/${course.id}` } });
      openAuthModal();
      return;
    }
    router.push(`/courses/${course.id}`);
  };

  // Helper to render opportunity badge
  const renderOpportunityBadge = (opp: OpportunityDisplay) => {
    const isPublic = opp.type === 'Pública';
    const bgColor = isPublic ? 'bg-[#FF9900]' : 'bg-[#9747FF]';
    const label = isPublic ? 'Sisu' : 'Prouni'; // Default labels based on old logic, can be adjusted
    
    return (
      <span key={opp.id} className={`text-[11px] font-medium px-2 py-0.5 rounded-full text-white whitespace-nowrap ${bgColor}`}>
        {label}
        {opp.scholarship_type && !isPublic ? ` - ${opp.scholarship_type}` : ''}
      </span>
    );
  };

  return (
    <div className={`group rounded-[16px] shadow-[0px_24px_44px_-11px_rgba(181,183,192,0.3)] hover:shadow-lg transition-all duration-300 flex flex-col h-full relative overflow-hidden bg-white box-border ${montserrat.className}`}>
      {/* Header Section: Background & Location/Favorite */}
      <div className="relative h-[80px] w-full bg-[#C8EEFF]">
        <div className="absolute top-3 right-3 z-20">
            <button 
            onClick={handleFavorite}
            className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-red-500 bg-white' : 'text-[#3A424E]/50 hover:text-red-400 hover:bg-white/50'}`}
            >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
            </button>
        </div>

         {/* Cloud Vector at the bottom of the header section */}
         <div className="absolute bottom-[-1px] left-0 w-full h-[40px] z-10">
           <div className="relative w-full h-full">
             <img 
               src="/assets/card-background.svg" 
               alt="Cloud Border" 
               className="object-cover object-top w-full h-full"
             />
           </div>
        </div>
      </div>
      
      {/* Body: Institution & Title & Opportunities */}
      <div className="flex flex-col flex-grow p-4 pt-0 relative z-10 bg-white">
        
        {/* Course Info */}
        <div className="mb-3">
          <p className="text-[#3A424E] text-[13px] font-medium mb-0.5 line-clamp-1 opacity-70">
            {course.institution}
          </p>
          <h3 className="text-[16px] font-bold text-[#3A424E] leading-[1.25] group-hover:text-[#005CA9] transition-colors line-clamp-2 min-h-[40px]">
            {course.title}
          </h3>
          <div className="flex items-center gap-1 text-[13px] text-[#3A424E] mt-1">
              <MapPin size={13} className="text-[#3A424E]" />
              <span className="truncate">{course.location}</span>
          </div>
        </div>

        {/* Opportunities List */}
        <div className="flex-grow flex flex-col gap-2 mb-3">
            <p className="text-[12px] font-semibold text-[#3A424E] mb-1">Oportunidades encontradas:</p>
            {course.opportunities.length > 0 ? (
                course.opportunities.slice(0, 3).map(opp => (
                    <div key={opp.id} className="flex justify-between items-center text-[12px] border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2">
                             {renderOpportunityBadge(opp)}
                             <span className="text-[#3A424E] opacity-80 flex items-center gap-1">
                                <Clock size={10} /> {opp.shift}
                             </span>
                        </div>
                        {opp.cutoff_score && (
                            <div className="flex items-center gap-1 text-[#3A424E] font-medium">
                                <Zap size={10} className="fill-[#3A424E]" />
                                <span>{opp.cutoff_score.toFixed(0)}</span>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p className="text-[12px] text-gray-400 italic">Nenhuma oportunidade disponível no momento.</p>
            )}
            {course.opportunities.length > 3 && (
                <p className="text-[11px] text-[#005CA9] font-medium mt-1 text-center">
                    + {course.opportunities.length - 3} outras opções
                </p>
            )}
        </div>

        {/* Footer: Action */}
        <div className="mt-auto pt-3 border-t border-gray-100/50 flex justify-end">
          <button 
            onClick={handleViewDetails}
            className="text-[13px] font-bold text-[#005CA9] hover:text-[#004A87] flex items-center gap-1 transition-colors"
          >
            Ver cursos
            <ArrowRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
