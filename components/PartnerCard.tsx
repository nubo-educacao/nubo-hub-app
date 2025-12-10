'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Heart, ArrowRight, MapPin, GraduationCap, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface PartnerCardProps {
  id?: string;
  name?: string;
  description?: string;
  isFavorite?: boolean;
}

export function PartnerCard({ 
  id = '1', 
  name = 'Fundação Estudar', 
  description = 'Oferecemos bolsas de estudo no Brasil ou exterior, e apoio vitalício para o desenvolvimento de nossos Fellows Estudar.',
  isFavorite: initialFavorite = false
}: PartnerCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div className={`relative w-full h-auto min-h-[500px] rounded-2xl overflow-hidden bg-white shadow-lg flex flex-col ${montserrat.className}`}>
      {/* Top Section with Background and Cover */}
      <div className="relative h-[200px] w-full">
         {/* Cover Image Background (Mocked for now as per reference image which seems to be a full colorful bg) */}
         {/* Providing a base color or gradient as fallback behind the image if needed */}
         <div className="absolute inset-0 bg-gradient-to-b from-[#4FB7E8] to-[#2892C8]"></div>

         {/* Actual Cover Image - Using object-cover to look like the design's header */}
         <Image 
           src="/assets/parceiro-mock-cover.png" 
           alt="Capa do Parceiro"
           fill
           className="object-cover"
         />
        
         {/* Heart Button Top Right */}
         <button 
           onClick={toggleFavorite}
           className="absolute top-4 right-4 p-2 rounded-full z-20 transition-transform hover:scale-110 active:scale-95"
         >
            <Heart 
              size={24} 
              color="white" 
              fill={isFavorite ? "white" : "none"} 
              strokeWidth={2}
            />
         </button>

         {/* Cloud Vector at the bottom of the image section */}
         <div className="absolute bottom-[-1px] left-0 w-full h-[50px] z-10">
            <Image 
              src="/assets/background-parceiro.svg" 
              alt="Cloud Border" 
              fill 
              className="object-cover object-top" // Adjusting to ensure it sits at the bottom of this div
            />
         </div>
      </div>

      {/* Content Section */}
      <div className="relative z-10 px-6 pb-6 pt-0 flex flex-col flex-grow bg-white">
        {/* Partner Name */}
        <h3 className="text-[18px] font-bold text-[#3A424E] mb-2 text-center md:text-left">
          {name}
        </h3>

        {/* Description */}
        <p className="text-[14px] text-[#636E7C] mb-4 text-center md:text-left leading-relaxed">
          {description}
        </p>

        {/* Info Icons / Metadata (Mocked based on visual reference) */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
            <MapPin size={16} className="text-[#2892C8]" />
            <span>Nacional e Internacional</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
             <GraduationCap size={16} className="text-[#FF9900]" />
             <span>Graduação, Pós-graduação e intercâmbio</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
             <Zap size={16} className="text-[#9747FF]" />
             <span>Não especificado</span>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-[#636E7C]">
             <Calendar size={16} className="text-[#FF4D4D]" />
             <span>7/fev - 10/mar</span>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-auto flex justify-end items-center pt-4 border-t border-gray-100/50">
          <button 
            className="text-[14px] font-semibold text-[#2892C8] hover:text-[#005CA9] flex items-center gap-1 transition-colors group"
          >
            Ver detalhes
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
