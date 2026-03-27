'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Heart, ArrowRight, MapPin, GraduationCap, Calendar, DollarSign, X } from 'lucide-react';
import { Montserrat } from 'next/font/google';
import { useAuth } from '../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Partner } from '../services/supabase/partners';
import { toggleFavoriteService, getUserFavoritesService } from '../services/supabase/favorites';
import { registerPartnerClick } from '../services/supabase/partners-click';
import { registerExternalRedirectClick } from '../services/supabase/external-redirect-clicks';

// Removed hardcoded EXTERNAL_REDIRECT_CONFIGS as it's now database-driven via partner.external_redirect_config

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
  applications_open?: boolean;
  matchScore?: {
    total: number;
    met: number;
  };
  onApply?: (partnerId: string, partnerName: string) => void;
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
  applications_open = partner?.applications_open ?? true,
  isFavorite: initialFavorite = false,
  matchScore,
  onApply
}: PartnerCardProps) {
  const { isAuthenticated, openAuthModal, pendingAction, setPendingAction, clearPendingAction } = useAuth();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [showExternalRedirectModal, setShowExternalRedirectModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const redirectConfig = (partner as any)?.external_redirect_config;
  const isExternalRedirect = !!redirectConfig && pathname === '/chat';

  // Parse dates if available to show simpler string
  const dateDisplay = React.useMemo(() => {
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return 'Datas disponíveis no site';
    }

    const toUtcDate = (dateStr: string) => {
      const date = new Date(dateStr);
      // Add the timezone offset to get the correct date in UTC-as-local representation
      // Or simpler: treat the string as UTC and format it in UTC.
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    };

    // Better approach: Let's just treat the YYYY-MM-DD as UTC and ask for UTC formatting
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      // "UTC" timezone ensures 2026-02-03T00:00:00.000Z stays 03 in output
      return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    };

    const firstDate = dates[0];
    if (!firstDate?.start_date) return 'Datas disponíveis no site';

    const startStr = formatDate(firstDate.start_date);
    if (!startStr) return 'Datas disponíveis no site';

    if (firstDate.end_date) {
      const endStr = formatDate(firstDate.end_date);
      if (endStr) {
        return `${startStr} - ${endStr}`;
      }
    }

    return startStr;
  }, [dates]);


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
    if (isAuthenticated) {
      if (pendingAction?.type === 'favorite' && pendingAction.payload.opportunityId === id) {
        // Perform the actual toggle since we just logged in to do it
        toggleFavoriteService('partner', id).then(({ error }) => {
          if (!error) {
            setIsFavorite(true);
          }
        });
        clearPendingAction();
      } else if (pendingAction?.type === 'partner_click' && pendingAction.payload.partnerId === id) {
        // Register click and open link
        registerPartnerClick(id);
        if (pendingAction.payload.link) {
          router.push(pendingAction.payload.link);
        }
        clearPendingAction();
      } else if (pendingAction?.type === 'start_workflow') {
        // The redirection is handled by AuthContext or we are already going to /chat.
        // We can register the click here if we want, but let's just clear it in /chat.
      }
    }
  }, [isAuthenticated, pendingAction, id, clearPendingAction, router]);

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

  const handleCardClick = async () => {
    if (!applications_open) return;
    
    // External redirect exception: open modal instead of chat
    if (isExternalRedirect) {
      registerPartnerClick(id);
      setShowExternalRedirectModal(true);
      return;
    }

    // Fire and forget click registration
    registerPartnerClick(id);

    // Set pending action for the chat page to consume
    setPendingAction({
      type: 'start_workflow',
      payload: {
        workflow: 'passport_workflow',
        message: `Tenho interesse em me aplicar na ${name}`
      }
    });

    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    // If authenticated, go to chat
    router.push('/chat');
  };

  const handleExternalRedirectClick = () => {
    if (!redirectConfig) return;
    registerExternalRedirectClick(id, redirectConfig.url, 'partner_card');
    window.open(redirectConfig.url, '_blank');
    setShowExternalRedirectModal(false);
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

        {/* Match Score Tag Top Left */}
        {matchScore && (() => {
          const pct = matchScore.total > 0 ? (matchScore.met / matchScore.total) * 100 : 0;
          const dotColor = pct >= 90 ? 'bg-emerald-500' : pct > 30 ? 'bg-yellow-500' : 'bg-red-500';
          const textColor = pct >= 90 ? 'text-emerald-700' : pct > 30 ? 'text-yellow-700' : 'text-red-700';
          const bgColor = 'bg-white/60';
          const borderColor = 'border-white/30';
          return (
            <div className="absolute top-4 left-4 z-20">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md border ${bgColor} ${borderColor} shadow-sm`}>
                <span className={`flex h-2 w-2 rounded-full ${dotColor}`}></span>
                <span className="text-[11px] md:text-[12px] font-bold text-gray-800 whitespace-nowrap">
                  {matchScore.met}/{matchScore.total} Critérios Atendidos
                </span>
              </div>
            </div>
          );
        })()}

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
      <div className="relative z-10 px-4 pb-5 pt-0 flex flex-col flex-grow bg-white">
        {/* Partner Name and Site Link */}
        <div className="flex flex-col items-center justify-center md:items-start md:justify-start min-h-[56px] mb-2 mt-2">
          <h3 className="text-[16px] md:text-[18px] font-bold text-[#3A424E] text-center md:text-left line-clamp-2 leading-tight">
            {name}
          </h3>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                registerPartnerClick(id);
              }}
              className="text-[13px] text-[#38B1E4] hover:text-[#2da0d1] hover:underline mt-1 transition-colors"
            >
              Ver site
            </a>
          )}
        </div>

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
            <DollarSign size={16} className="text-[#9747FF] flex-shrink-0" />
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
            disabled={!applications_open}
            onClick={(e) => {
              e.stopPropagation();
              if (!applications_open) return;
              if (isExternalRedirect) {
                setShowExternalRedirectModal(true);
                return;
              }
              if (onApply) {
                onApply(id, name);
              } else {
                handleCardClick();
              }
            }}
            className={`text-[14px] font-bold text-white px-4 py-2 rounded-full flex items-center gap-1 transition-colors shadow-sm ${
              applications_open ? 'bg-[#024F86] hover:bg-[#023F6B]' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {applications_open ? 'Inscreva-se' : 'Inscrições Encerradas'}
          </button>
        </div>
      </div>

      {/* Generalized External Redirect Modal — rendered via portal to cover full screen */}
      {showExternalRedirectModal && redirectConfig && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowExternalRedirectModal(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-[342px] bg-white rounded-[16px] shadow-2xl p-6 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
            {/* Close Button */}
            <button
              onClick={() => setShowExternalRedirectModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center gap-1 mb-6">
              <h2 className={`font-montserrat font-semibold text-[16px] leading-[24px] text-[#38B1E4] text-center ${montserrat.className}`}>
                {redirectConfig.title || 'Inscrição Externa'}
              </h2>
              <p className={`font-montserrat font-medium text-[14px] leading-[17.5px] text-[#707A7E] text-center w-[270px] ${montserrat.className}`}>
                {name}
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col items-center gap-4 text-center">
              <p className={`text-[14px] text-[#3A424E] leading-relaxed px-2 font-montserrat font-medium ${montserrat.className}`}>
                {redirectConfig.message || 'A inscrição não é realizada diretamente pela Cloudinha. Para continuar, siga para o link oficial.'}
              </p>
              <p className={`text-[13px] text-[#AEAEB2] leading-relaxed px-2 mb-2 font-montserrat font-medium ${montserrat.className}`}>
                Caso tenha dúvidas, retorne à Cloudinha para obter ajuda.
              </p>

              <button
                onClick={handleExternalRedirectClick}
                className={`
                  w-full flex items-center justify-center gap-[10px] 
                  ${redirectConfig.type === 'whatsapp' ? 'bg-[#25D366] hover:bg-[#1da851] active:bg-[#1da851]' : 'bg-[#024F86] hover:bg-[#023F6B]'} 
                  rounded-[8px] 
                  py-2 px-[10px] h-[38px]
                  transition-all duration-200
                `}
              >
                {redirectConfig.type === 'whatsapp' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                ) : (
                  <ArrowRight size={20} color="white" />
                )}
                <span className={`font-montserrat font-semibold text-[16px] text-white ${montserrat.className}`}>
                  {redirectConfig.buttonText || 'Continuar para inscrição'}
                </span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
