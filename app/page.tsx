'use client';

import { useEffect, useState, Suspense } from "react";
import CloudBackground from "@/components/CloudBackground";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Building2, ArrowRight, Loader2, Sparkles, ClipboardCheck, GraduationCap, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { supabase } from "@/lib/supabaseClient";
import { PartnerCard } from "@/components/PartnerCard";
import OpportunityCard from "@/components/OpportunityCard";
import { Partner, getPartners } from "@/services/supabase/partners";
import { CourseDisplayData } from "@/types/opportunity";
import { fetchCoursesWithOpportunities, getImportantDates, fetchOpportunitiesByCourseIds } from "@/lib/services/opportunities";
import { ImportantDate } from "@/types/calendar";
import CalendarAccordion from "@/components/courses/CalendarAccordion";
import { getUserProfileService, UserProfile } from "@/services/supabase/profile";
import ProfileModal from "@/components/profile/ProfileModal";

function HomeContent() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { openDrawer } = useChat();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasMatch, setHasMatch] = useState(false);
  const [hasApplication, setHasApplication] = useState(false);
  const [isApplicationConcluded, setIsApplicationConcluded] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [partners, setPartners] = useState<Partner[]>([]);
  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);

  // Fetch specific user states
  const refreshUserStates = async () => {
    if (isAuthenticated && user) {
      const [profileRes, prefsRes, appsRes] = await Promise.all([
        getUserProfileService(),
        supabase.from('user_preferences').select('workflow_data').eq('user_id', user.id).maybeSingle(),
        supabase.from('student_applications').select('status').eq('user_id', user.id)
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      
      const wf = prefsRes.data?.workflow_data as any;
      if (wf && Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
        setHasMatch(true);
      } else {
        setHasMatch(false);
      }

      if (appsRes.data && appsRes.data.length > 0) {
        setHasApplication(true);
        const inProgress = appsRes.data.some(app => !['APPROVED', 'REJECTED'].includes(app.status));
        setIsApplicationConcluded(!inProgress);
      } else {
        setHasApplication(false);
        setIsApplicationConcluded(false);
      }
    }
  };

  useEffect(() => {
    refreshUserStates();
  }, [isAuthenticated, user]);

  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      
      let courseData: CourseDisplayData[] = [];
      let fetchDefaultCourses = true;

      // Try personalized first if authenticated
      if (isAuthenticated && user) {
         try {
           const { data: prefs } = await supabase.from('user_preferences').select('workflow_data').eq('user_id', user.id).maybeSingle();
           const wf = prefs?.workflow_data as any;
           if (wf && Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
               const matched = await fetchOpportunitiesByCourseIds(wf.last_course_ids.slice(0, 6));
               if (matched && matched.length > 0) {
                   courseData = matched;
                   fetchDefaultCourses = false;
               }
           }
         } catch (e) {
             console.error('Error fetching personalized courses for home:', e);
         }
      }

      const promises: Promise<any>[] = [
        getPartners(),
        getImportantDates(['general', 'sisu', 'prouni', 'partners']).catch(() => [])
      ];

      if (fetchDefaultCourses) {
          promises.push(fetchCoursesWithOpportunities(0, 6, 'Oportunidades de parceiros', '', 'melhores'));
      }

      const results = await Promise.all(promises);
      const partnersData = results[0];
      const datesRes = results[1];
      
      if (fetchDefaultCourses) {
          const coursesRes = results[2];
          courseData = coursesRes?.data || [];
      }

      setPartners(partnersData.slice(0, 10));
      setCourses(courseData);
      setDates(datesRes as ImportantDate[]);
      
      setDataLoading(false);
      setLoading(false);
    }
    loadData();
  }, [isAuthenticated, user]);

  const renderCTA = () => {
    // 1. Visitante (Não Autenticado)
    if (!isAuthenticated) {
      return (
        <div 
          onClick={openAuthModal} 
          className="bg-gradient-to-br from-[#38B1E4] to-[#024F86] rounded-3xl p-6 text-white shadow-lg cursor-pointer flex justify-between items-center group hover:shadow-xl transition-all"
        >
          <div>
            <h3 className="text-xl font-bold font-montserrat mb-1 flex items-center gap-2">
              Descubra seu caminho <Sparkles size={18} className="text-yellow-300 fill-yellow-300" />
            </h3>
            <p className="opacity-90 text-[13px] max-w-[200px]">Cria sua conta grátis para receber indicações de bolsas e vagas ideais.</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors shrink-0">
            <ArrowRight size={24} />
          </div>
        </div>
      );
    }

    // 2. Estudante Logado (Sem Perfil)
    if (!profile?.full_name) {
      return (
        <div 
          onClick={() => setIsProfileModalOpen(true)} 
          className="bg-white border-2 border-[#38B1E4]/30 rounded-3xl p-6 text-[#024F86] shadow-md cursor-pointer flex justify-between items-center group hover:border-[#38B1E4] transition-all"
        >
          <div className="flex-1">
            <div className="bg-[#38B1E4]/10 text-[#38B1E4] text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-2">PRÓXIMO PASSO</div>
            <h3 className="text-lg font-bold font-montserrat mb-1">Complete seu Perfil</h3>
            <p className="text-gray-500 text-[13px] max-w-[240px]">Precisamos de alguns detalhes para gerar seus matches de bolsa e cursos.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#38B1E4] text-white flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <GraduationCap size={24} />
          </div>
        </div>
      );
    }

    // 3. Estudante Com Perfil (Sem Match)
    if (!hasMatch) {
      return (
        <div 
          onClick={() => openDrawer('Quero ver meus matches de cursos e bolsas')} 
          className="bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] border border-[#38B1E4]/20 rounded-3xl p-6 shadow-md cursor-pointer flex justify-between items-center group hover:shadow-lg transition-all"
        >
          <div className="flex-1">
            <h3 className="text-lg font-bold font-montserrat text-[#024F86] mb-1">Encontre seu Match</h3>
            <p className="text-gray-600 text-[13px] max-w-[240px]">Converse com a Cloudinha para descobrir oportunidades recomendadas para você.</p>
          </div>
          <div className="relative shrink-0 ml-4">
             <div className="absolute inset-0 bg-[#38B1E4]/20 rounded-full blur-xl animate-pulse" />
             <img src="/assets/cloudinha.png" alt="Cloudinha" className="w-[84px] h-[84px] drop-shadow-xl relative z-10 group-hover:rotate-6 transition-transform" />
          </div>
        </div>
      );
    }

    // 4. Estudante com Match (Sem Application)
    if (!hasApplication) {
      return (
        <div 
          onClick={() => openDrawer('Quero ajuda para iniciar uma candidatura em um curso')} 
          className="bg-[#024F86] rounded-3xl p-6 text-white shadow-lg cursor-pointer flex justify-between items-center group hover:bg-[#024F86]/90 transition-all"
        >
          <div>
            <div className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit mb-2">MATCH ENCONTRADO!</div>
            <h3 className="text-lg font-bold font-montserrat mb-1">Inicie sua Candidatura</h3>
            <p className="opacity-80 text-[13px] max-w-[240px]">Você já tem cursos recomendados. Vamos dar o próximo passo?</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
            <ArrowRight size={24} />
          </div>
        </div>
      );
    }

    // 5. Candidatura em Andamento (ou concluída)
    return (
      <div className="grid grid-cols-2 gap-4">
        <Link 
          href="/oportunidades?tab=Para+Você" 
          className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-full bg-[#38B1E4]/10 text-[#38B1E4] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Search size={20} />
          </div>
          <h3 className="font-bold font-montserrat text-[#024F86] text-[15px] leading-tight">Buscar Novas<br />Oportunidades</h3>
        </Link>
        <Link 
          href="/candidaturas" 
          className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
            <ClipboardCheck size={20} />
            {!isApplicationConcluded && (
               <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce" />
            )}
          </div>
          <h3 className="font-bold font-montserrat text-[#024F86] text-[15px] leading-tight">Minhas<br />Inscrições</h3>
        </Link>
      </div>
    );
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col w-full h-full">
      <div className="absolute inset-0 z-0">
        <CloudBackground />
      </div>

      <div className="relative z-10 flex flex-col flex-1 w-full max-w-7xl mx-auto md:px-6">
        {/* Dynamic Greeting */}
        <section className="pt-8 pb-6 px-4 md:px-0 flex flex-col items-start text-left">
            <h1 className="text-3xl font-extrabold font-montserrat text-[#024F86] mb-1">
                 {isAuthenticated ? `Olá, ${profile?.full_name?.split(' ')[0] || (user as any)?.user_metadata?.first_name || (user as any)?.user_metadata?.name?.split(' ')[0] || 'Estudante'}!` : 'Bem-vindo!'}
            </h1>
            <p className="text-gray-500 font-medium">Bolsas e ferramentas para você chegar lá.</p>
        </section>

        {/* Buscador Inteligente */}
        <section className="px-4 md:px-0 pb-6 w-full z-10">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const q = new FormData(e.currentTarget).get('q');
              if (q) router.push(`/oportunidades?q=${encodeURIComponent(q.toString())}&filter=SISU`);
            }}
            className="flex items-center bg-white/40 backdrop-blur-md rounded-full p-2 shadow-lg border border-white/50 hover:shadow-xl hover:bg-white/50 transition-all"
          >
            <input 
              name="q"
              type="text" 
              placeholder="Busque por faculdade, curso, cidade, estado..." 
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[#024F86] placeholder:text-[#024F86]/60 font-medium text-[13.5px] sm:text-base md:text-lg pl-4 md:pl-6"
            />
            <button type="submit" className="bg-[#38B1E4] hover:bg-[#024F86] text-white w-[42px] h-[42px] md:w-[52px] md:h-[52px] rounded-full font-bold transition-colors flex items-center justify-center shadow-md shrink-0 ml-2" title="Buscar">
              <Search size={20} strokeWidth={3} />
            </button>
          </form>
        </section>

        {/* Dynamic Action Section - Phase 7 */}
        <section className="px-4 md:px-0 pb-12 min-h-[120px]">
           {renderCTA()}
        </section>

        {dataLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-3">
               <Loader2 className="animate-spin text-[#024F86]" size={32} />
               <p className="font-medium text-[#024F86]/60">Buscando oportunidades...</p>
             </div>
        ) : (
          <>
            {/* Showcase Carousel: Highlighted Opportunities */}
            {courses.length > 0 && (
              <section className="pb-12 pl-4 md:px-0 overflow-hidden">
                <div className="flex items-center justify-between pr-4 md:pr-0 mb-6">
                  <h2 className="text-2xl font-bold font-montserrat text-[#024F86]">Encontre Oportunidades</h2>
                  <Link href="/oportunidades" className="text-[#38B1E4] font-bold text-sm flex items-center gap-1 hover:underline">
                    Ver todas <ArrowRight size={16} />
                  </Link>
                </div>
                
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x">
                  {courses.map(course => (
                     <div key={course.id} className="w-[85vw] sm:w-[calc(50%-24px)] lg:w-[calc(33.333%-24px)] snap-center shrink-0">
                        <OpportunityCard course={course} isCompact={false} />
                     </div>
                  ))}
                  <div className="min-w-[24px] shrink-0"></div>
                </div>
              </section>
            )}

            {/* Showcase Carousel: Partners */}
            {partners.length > 0 && (
              <section className="pb-12 pl-4 md:px-0 overflow-hidden">
                <div className="flex items-center justify-between pr-4 md:pr-0 mb-6">
                  <h2 className="text-2xl font-bold font-montserrat text-[#024F86]">Se aplique em parceiros</h2>
                  <Link href="/oportunidades?filter=Oportunidades+de+parceiros" className="text-[#38B1E4] font-bold text-sm flex items-center gap-1 hover:underline">
                    Ver todos <ArrowRight size={16} />
                  </Link>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x">
                  {partners.map(partner => (
                    <div key={partner.id} className="w-[85vw] sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-16px)] snap-center shrink-0">
                       <PartnerCard partner={partner} isCompact={true} />
                    </div>
                  ))}
                  <div className="min-w-[24px] shrink-0"></div>
                </div>
              </section>
            )}

            {/* Important Dates (Calendar) */}
            {dates.length > 0 && (
              <section className="px-4 md:px-0 pb-12 w-full max-w-4xl mx-auto">
                <CalendarAccordion dates={dates} />
              </section>
            )}
          </>
        )}
      </div>

      <Footer />

      {/* Modals */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        onUpdate={refreshUserStates}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[100dvh] bg-[#F0F4FA]">
          <Loader2 className="animate-spin text-[#024F86]" size={40} />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
