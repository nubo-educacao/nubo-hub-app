'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { supabase } from '@/lib/supabaseClient';
import { FileText, Layout, ChevronRight, Loader2, ArrowRight, CheckCircle2, Clock, Check, FolderOpen } from 'lucide-react';
import CloudBackground from '@/components/CloudBackground';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CourseDisplayData } from '@/types/opportunity';
import { getUserFavoritesDetailsService } from '@/services/supabase/favorites';
import OpportunityCard from '@/components/OpportunityCard';

interface ApplicationItem {
  id: string;
  partner_id: string;
  partner_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; step: number }> = {
  DRAFT: { label: 'Rascunho', bg: 'bg-amber-100', text: 'text-amber-700', step: 0 },
  SUBMITTED: { label: 'Enviada', bg: 'bg-blue-100', text: 'text-blue-700', step: 1 },
  ANALYSIS: { label: 'Em Análise', bg: 'bg-purple-100', text: 'text-purple-700', step: 2 },
  APPROVED: { label: 'Aprovado', bg: 'bg-green-100', text: 'text-green-700', step: 3 },
  REJECTED: { label: 'Não Aprovado', bg: 'bg-red-100', text: 'text-red-700', step: 3 },
};

const TRACKING_STEPS = ['Candidatura Enviada', 'Em Análise', 'Resultado'];

function CandidaturasContent() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { openDrawer } = useChat();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [favorites, setFavorites] = useState<CourseDisplayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (!user) return;

    const fetchApplications = async () => {
      setLoading(true);

      const [appRes, favRes] = await Promise.all([
        supabase
          .from('student_applications')
          .select('id, partner_id, status, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        getUserFavoritesDetailsService()
      ]);

      if (favRes.data?.courses) {
        setFavorites(favRes.data.courses);
      }

      if (appRes.error || !appRes.data) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const partnerIds = [...new Set(appRes.data.map(a => a.partner_id))];
      const { data: partners } = await supabase
        .from('partners')
        .select('id, name')
        .in('id', partnerIds);

      const partnerMap: Record<string, string> = {};
      partners?.forEach(p => { partnerMap[p.id] = p.name; });

      const items: ApplicationItem[] = appRes.data.map(app => ({
        id: app.id,
        partner_id: app.partner_id,
        partner_name: partnerMap[app.partner_id] || 'Parceiro desconhecido',
        status: app.status,
        created_at: app.created_at,
        updated_at: app.updated_at,
      }));

      setApplications(items);
      setLoading(false);
    };

    fetchApplications();
  }, [user, isAuthenticated]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden flex flex-col items-center">
      <div className="absolute inset-0 z-0">
        <CloudBackground />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 py-8 md:py-12 flex flex-col gap-8 h-full">
        <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-montserrat text-[#024F86]">
              Minhas Candidaturas
            </h1>
            <p className="text-gray-600 mt-2 font-medium">
              Acompanhe o status das vagas que você se aplicou em nossos parceiros.
            </p>
          </div>
          {isAuthenticated && !loading && applications.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                 onClick={() => openDrawer('Pode me explicar detalhadamente o status das minhas candidaturas atuais?')}
                 className="bg-white border-2 border-[#38B1E4]/30 text-[#024F86] hover:border-[#38B1E4] px-4 py-2.5 rounded-full font-bold shadow-sm transition-colors flex flex-shrink-0 items-center justify-center gap-2 w-full sm:w-auto"
              >
                 Dúvidas sobre o processo?
              </button>
              <button
                 onClick={() => router.push('/oportunidades')}
                 className="bg-[#38B1E4] hover:bg-[#024F86] text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-colors flex flex-shrink-0 items-center justify-center gap-2 w-full sm:w-auto"
              >
                 Nova Candidatura <ArrowRight size={18} />
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 flex flex-col w-full text-[#024F86] gap-4 mt-6">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/40 shadow-xl text-center">
              <Layout size={40} className="text-[#024F86]/60 mb-4" />
              <h2 className="text-2xl font-bold font-montserrat text-[#024F86] mb-2">Faça Login</h2>
              <p className="text-gray-600 mb-6 max-w-md">Para acompanhar suas candidaturas e visualizar formulários de parceiros, você precisa estar autenticado.</p>
              <button onClick={openAuthModal} className="bg-[#38B1E4] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#024F86] transition-colors">
                Fazer Login
              </button>
            </div>
          ) : loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white/40 backdrop-blur-md rounded-[32px]">
               <Loader2 className="animate-spin text-[#024F86]" size={32} />
               <p className="font-medium text-[#024F86]/60">Buscando suas candidaturas...</p>
             </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/40 shadow-xl text-center">
              <div className="w-20 h-20 bg-[#024F86]/10 rounded-full flex items-center justify-center mb-4">
                <Layout size={40} className="text-[#024F86]" />
              </div>
              <h2 className="text-2xl font-bold font-montserrat text-[#024F86] mb-2">Painel de Candidaturas Vazio</h2>
              <p className="text-gray-600 max-w-md mb-6">
                Você ainda não se aplicou a nenhuma vaga de parceiros. Quando aplicar, o status de acompanhamento aparecerá aqui.
              </p>
              <button
                onClick={() => router.push('/oportunidades')}
                className="bg-[#38B1E4] text-white px-8 py-3 rounded-full font-bold font-montserrat hover:bg-[#024F86] transition-colors shadow-md flex items-center gap-2"
              >
                Explorar Vagas
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.map((app, idx) => {
                const statusConfig = STATUS_CONFIG[app.status] || { label: app.status, bg: 'bg-gray-100', text: 'text-gray-600', step: 0 };
                const currentStep = statusConfig.step;

                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden group hover:shadow-xl transition-all p-6 relative"
                  >
                     <div className="flex items-start justify-between">
                       <div className="flex items-center gap-3">
                         <div className="w-12 h-12 bg-[#024F86]/10 rounded-2xl flex items-center justify-center">
                           <FileText className="text-[#024F86]" size={24} />
                         </div>
                         <div>
                           <h3 className="text-lg font-bold text-[#024F86]">{app.partner_name}</h3>
                           <p className="text-xs text-gray-500 mt-1">Atualizado em {formatDate(app.updated_at)}</p>
                         </div>
                       </div>
                       <ChevronRight size={20} className="text-gray-300 group-hover:text-[#38B1E4] transition-colors cursor-pointer" />
                     </div>

                     {/* Visual Timeline Tracking */}
                     {app.status !== 'DRAFT' && (
                       <div className="mt-8 mb-4 relative px-2">
                          <div className="absolute top-3 left-4 right-4 h-1 bg-gray-100 rounded-full z-0">
                             <div 
                                className="h-full bg-green-500 rounded-full transition-all duration-500" 
                                style={{ width: `${((Math.max(1, currentStep) - 1) / (TRACKING_STEPS.length - 1)) * 100}%` }}
                             />
                          </div>
                          
                          <div className="flex justify-between relative z-10">
                             {TRACKING_STEPS.map((stepLabel, stepIdx) => {
                                const isCompleted = currentStep > (stepIdx + 1);
                                const isCurrent = currentStep === (stepIdx + 1);
                                const isPending = currentStep < (stepIdx + 1);

                                return (
                                  <div key={stepIdx} className="flex flex-col items-center gap-2">
                                     <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors border-2 ${
                                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                                        isCurrent ? 'bg-white border-green-500 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                                        'bg-white border-gray-200 text-gray-300'
                                     }`}>
                                        {isCompleted ? <Check size={14} strokeWidth={3} /> : <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-green-500' : 'bg-transparent'}`} />}
                                     </div>
                                     <span className={`text-[10px] font-bold text-center max-w-[80px] leading-tight ${
                                        isCurrent || isCompleted ? 'text-[#024F86]' : 'text-gray-400'
                                     }`}>
                                        {stepLabel}
                                     </span>
                                  </div>
                                );
                             })}
                          </div>
                       </div>
                     )}

                     {/* Divider and Actions */}
                     <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                       <button 
                         className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 py-2 px-3 rounded-lg cursor-not-allowed border border-gray-100"
                         title="Em breve"
                       >
                         <FolderOpen size={14} />
                         Ver Documentos
                       </button>
                       <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                         {statusConfig.label}
                       </span>
                     </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Favoritos Secundários */}
          {isAuthenticated && !loading && favorites.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200/50">
               <h3 className="text-xl font-bold font-montserrat text-[#024F86] mb-4">Cursos Favoritos</h3>
               <p className="text-gray-600 text-sm mb-6">Programas que você salvou para se aplicar depois.</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.slice(0, 4).map(course => (
                     <OpportunityCard key={course.id} course={course} isCompact={true} />
                  ))}
               </div>
               {favorites.length > 4 && (
                 <button onClick={() => router.push('/oportunidades')} className="mt-6 w-full py-3 rounded-full border-2 border-[#024F86]/10 text-[#024F86] font-bold hover:bg-[#024F86]/5 transition-colors">
                    Ver todos em Oportunidades
                 </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CandidaturasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[100dvh] bg-[#F0F4FA]">
          <Loader2 className="animate-spin text-[#024F86]" size={40} />
        </div>
      }
    >
      <CandidaturasContent />
    </Suspense>
  );
}
