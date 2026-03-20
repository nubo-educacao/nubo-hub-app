'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import OpportunityListView from '@/components/opportunities/OpportunityListView';
import UserDataSection from '@/components/profile/UserDataSection';
import UserPreferencesSection from '@/components/profile/UserPreferencesSection';
import { UserPreferences } from '@/services/supabase/preferences';
import { getUserProfileService, UserProfile } from '@/services/supabase/profile';
import CloudBackground from '@/components/CloudBackground';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, Globe, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

function OportunidadesContent() {
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'MATCH' | 'CATALOG'>('MATCH');
  
  const [activeCourseIds, setActiveCourseIds] = useState<string[]>([]);
  const [matchedOppsMap, setMatchedOppsMap] = useState<Record<string, string[]> | null>(null);
  const [isLoadingMatch, setIsLoadingMatch] = useState(true);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadMatchData = async () => {
    if (!user) return;
    setIsLoadingMatch(true);
    
    const [prefsRes, profileRes] = await Promise.all([
      supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
      getUserProfileService()
    ]);
    
    if (profileRes.data) {
       setUserProfile(profileRes.data);
    }

    const { data } = prefsRes;
    if (data) {
       setUserPrefs(data as UserPreferences);
       const wf = data.workflow_data as any;
       if (wf && Array.isArray(wf.last_course_ids)) {
          setActiveCourseIds(wf.last_course_ids);
       } else {
          setActiveCourseIds([]);
       }
       if (wf && wf.last_opportunity_map) {
          setMatchedOppsMap(wf.last_opportunity_map);
       }
    } else {
       setActiveCourseIds([]);
    }
    setIsLoadingMatch(false);
  };

  useEffect(() => {
    if (!isAuthenticated && activeTab === 'MATCH') {
      // Allow them to see the placeholder, or redirect to catalog?
      // PRD says: "Requer autenticação para a aba Match."
      // We will show a placeholder with a login button.
      setIsLoadingMatch(false);
      return;
    }

    if (isAuthenticated && user && activeTab === 'MATCH') {
      loadMatchData();
    }
  }, [isAuthenticated, user, activeTab]);

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center">
      <div className="absolute inset-0 z-0">
        <CloudBackground />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col gap-6 h-full">
        <header className="flex flex-col items-center gap-6">
          <h1 className="text-3xl md:text-4xl font-extrabold font-montserrat text-[#024F86] text-center">
            Encontre sua Vaga
          </h1>
          
          {/* Segmented Controls */}
          <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-full border border-gray-200/50 shadow-sm w-full max-w-md relative">
            <button
              onClick={() => setActiveTab('MATCH')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold font-montserrat transition-colors relative z-10 ${
                activeTab === 'MATCH' ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles size={16} />
              Para Você
            </button>
            <button
              onClick={() => setActiveTab('CATALOG')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-bold font-montserrat transition-colors relative z-10 ${
                activeTab === 'CATALOG' ? 'text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe size={16} />
              Explorar Todas
            </button>

            {/* Sliding background */}
            <motion.div
              layoutId="segmented-bg"
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#38B1E4] rounded-full shadow-md z-0"
              initial={false}
              animate={{
                left: activeTab === 'MATCH' ? '6px' : 'calc(50% + 0px)'
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </div>
        </header>

        <section className="flex-1 w-full mt-4">
          {activeTab === 'CATALOG' ? (
            <OpportunityListView mode="catalog" />
          ) : (
            <div className="w-full flex flex-col items-center justify-center h-full min-h-[50vh]">
              {!isAuthenticated ? (
                <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 max-w-md text-center border border-white/50 shadow-xl flex flex-col items-center">
                  <Sparkles size={48} className="text-[#38B1E4] mb-4" />
                  <h3 className="text-xl font-bold font-montserrat text-[#024F86] mb-2">Matches Personalizados</h3>
                  <p className="text-gray-600 mb-6 font-medium">Crie sua conta ou faça login para a Cloudinha encontrar as vagas perfeitas para a sua nota e renda.</p>
                  <button onClick={openAuthModal} className="w-full bg-[#38B1E4] text-white py-3 rounded-full font-bold shadow-md hover:bg-[#024F86] transition-colors">
                    Fazer Login
                  </button>
                </div>
              ) : isLoadingMatch ? (
                <div className="w-10 h-10 border-4 border-[#38B1E4] border-t-transparent rounded-full animate-spin"></div>
              ) : activeCourseIds.length > 0 ? (
                <div className="w-full max-w-5xl mx-auto pb-12 w-full">
                    <OpportunityListView 
                        mode="match"
                        courseIds={activeCourseIds}
                        matchedOppsMap={matchedOppsMap}
                        onAdjustPreferences={() => setActiveCourseIds([])}
                    />
                </div>
              ) : (
                <div className="w-full max-w-3xl mx-auto py-4 flex flex-col gap-6">
                   {/* Render UserDataSection only if profile is incomplete */}
                   {(!userProfile?.full_name || !userProfile?.city || !userProfile?.education) && (
                     <div className="w-full">
                       <UserDataSection 
                           profile={userProfile} 
                           onProfileUpdate={(updated) => setUserProfile(updated)} 
                       />
                     </div>
                   )}
                   <UserPreferencesSection 
                       preferences={userPrefs}
                       onUpdate={(updated) => setUserPrefs(updated)}
                       onMatchFound={() => {
                          loadMatchData();
                       }}
                   />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function OportunidadesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[100dvh] bg-[#F0F4FA]">
          <div className="w-12 h-12 border-4 border-[#024F86] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <OportunidadesContent />
    </Suspense>
  );
}
