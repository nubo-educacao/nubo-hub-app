'use client';

import React from 'react';
import { MapPin, GraduationCap, Trophy } from 'lucide-react';

interface Opportunity {
  id: string;
  course_name: string;
  institution_name: string;
  cutoff_score: number;
  scholarship_type: string;
  city: string;
  state: string;
  image: string;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group shadow-xl">
      {/* Image Header */}
      <div className="h-48 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <img 
          src={opportunity.image} 
          alt={opportunity.institution_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-4 left-4 z-20">
          <span className="px-3 py-1 rounded-full bg-purple-600/90 text-xs font-bold text-white mb-2 inline-block backdrop-blur-sm">
            {opportunity.scholarship_type}
          </span>
          <h3 className="text-xl font-bold text-white leading-tight">{opportunity.course_name}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Instituição</p>
            <p className="font-medium text-white">{opportunity.institution_name}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm mb-1">Nota de Corte</p>
            <div className="flex items-center gap-1 text-green-400 font-bold">
              <Trophy size={16} />
              {opportunity.cutoff_score}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-400 text-sm border-t border-white/10 pt-4">
          <MapPin size={16} />
          {opportunity.city}, {opportunity.state}
        </div>

        <button className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 transition-colors mt-2">
          Ver Detalhes
        </button>
      </div>
    </div>
  );
}
