'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Montserrat } from 'next/font/google';
import CloudBackground from '@/components/CloudBackground';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { getPartners, Partner } from '@/services/supabase/partners';
import { Building2, MapPin, Calendar, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function PartnerDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPartner() {
      // In a real app we'd have a specific getPartner(id) service
      const allPartners = await getPartners();
      const found = allPartners.find(p => p.id === id);
      setPartner(found || null);
      setLoading(false);
    }
    if (id) {
       loadPartner();
    } else {
       setLoading(false);
    }
  }, [id]);

  const handleApply = () => {
    if (!partner) return;
    
    // Instituto Sol specific logic fallback based on PartnerCard
    if (partner.name === 'Instituto Sol') {
        window.open('https://api.whatsapp.com/send?phone=5511943794350&text=Ol%C3%A1%2C%20tenho%20interesse%20em%20saber%20mais%20sobre%20as%20bolsas%20do%20Instituto%20Sol', '_blank');
        return;
    }

    const actionPayload = {
        id: 'passport_workflow',
        action: 'start_workflow',
        params: { partner_id: partner.id, partner_name: partner.name }
    };
    const pendingActionStr = JSON.stringify(actionPayload);
    const urlObj = new URL('/chat', window.location.origin);
    urlObj.searchParams.set('pending_action', btoa(pendingActionStr));
    urlObj.searchParams.set('message', `Tenho interesse em me aplicar na ${partner.name}`);
    router.push(urlObj.toString());
  };

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#F0F4FA]">
           <Loader2 className="animate-spin text-[#024F86]" size={40} />
        </div>
     );
  }

  if (!partner) {
    return (
        <div className="relative min-h-[100dvh] w-full flex flex-col items-center overflow-x-hidden bg-[#F0F8FF]">
            <CloudBackground />
            <Header />
            <div className="z-10 flex-1 flex items-center justify-center w-full px-4">
                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl">
                     <h1 className={`${montserrat.className} text-2xl font-bold text-[#024F86]`}>Parceiro não encontrado</h1>
                     <p className="text-[#3A424E]">Não foi possível localizar os detalhes deste parceiro.</p>
                     <button onClick={() => router.back()} className="px-6 py-2 bg-[#38B1E4] text-white rounded-full font-semibold hover:bg-[#2da0d1] transition-colors">
                        Voltar
                     </button>
                </div>
            </div>
            <Footer />
        </div>
    );
  }

  return (
    <div className={`relative min-h-[100dvh] w-full flex flex-col items-center overflow-x-hidden bg-[#F0F8FF] ${montserrat.className}`}>
      <CloudBackground />
      <Header />

      <div className="relative z-10 w-full max-w-[1000px] px-4 py-8 md:py-12 flex flex-col gap-6 mt-16 md:mt-20 flex-1">
        <div className="w-full bg-white/40 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.07)] rounded-3xl p-6 md:p-10 flex flex-col gap-8">
            
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-[#024F86]/10 pb-8">
                <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-2">
                        {partner.coverimage ? (
                            <img src={partner.coverimage} alt={partner.name} className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="w-8 h-8 text-gray-300" />
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="bg-[#E0F2FE] text-[#024F86] text-xs font-bold px-2.5 py-1 rounded-full">{partner.type || 'Instituição'}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-[#024F86] leading-tight flex items-center gap-2">
                            {partner.name}
                            <CheckCircle2 size={24} className="text-[#38B1E4] shrink-0" />
                        </h1>
                        {partner.location && (
                            <p className="flex items-center gap-1.5 text-gray-500 font-medium">
                                <MapPin size={16} /> 
                                {partner.location}
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-3 items-center">
                    <BackButton />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 flex flex-col gap-6">
                    <div>
                        <h2 className="text-xl font-bold text-[#024F86] mb-3">Sobre o Programa</h2>
                        <div className="text-gray-600 leading-relaxed font-medium space-y-4">
                            {partner.description ? (
                                partner.description.split('\n').map((paragraph, idx) => (
                                    <p key={idx}>{paragraph}</p>
                                ))
                            ) : (
                                <p>Informações detalhadas sobre este parceiro não estão disponíveis no momento.</p>
                            )}
                        </div>
                    </div>

                    {partner.income && (
                        <div className="bg-[#F0F9FF] border border-[#38B1E4]/20 rounded-2xl p-5">
                            <h3 className="font-bold text-[#024F86] mb-2">Requisitos de Renda</h3>
                            <p className="text-gray-600 text-sm font-medium">{partner.income}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                        <h3 className="font-bold text-[#024F86] pb-2 border-b border-gray-100">Candidatura</h3>
                        
                        {partner.dates && (
                            <div className="flex flex-col gap-2 mb-2">
                                {Object.entries(partner.dates).map(([key, value]: any) => (
                                    <div key={key} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-1.5"><Calendar size={14} /> {key}</span>
                                        <span className="font-bold text-[#024F86]">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleApply}
                            className="w-full bg-[#38B1E4] hover:bg-[#024F86] text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                            Inscreva-se <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
