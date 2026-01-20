'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
import MatchPlaceholder from './components/MatchPlaceholder';
import MatchWizard from './components/MatchWizard';
import ChatHeader from './components/ChatHeader';
import AuthModal from '@/components/AuthModal'; 
import { Layout } from 'lucide-react';
import CloudBackground from '@/components/CloudBackground';
import UserDataSection from '@/components/profile/UserDataSection';
import UserPreferencesSection from '@/components/profile/UserPreferencesSection';
import MobileTabSwitch from './components/MobileTabSwitch';
import { getUserProfileService, UserProfile } from '@/services/supabase/profile';
import { supabase } from '@/lib/supabaseClient';

function ChatPageContent() {
  const { isAuthModalOpen, closeAuthModal, pendingAction, clearPendingAction, isAuthenticated, isLoading, user } = useAuth();
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [activeCourseIds, setActiveCourseIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [savedMatchStatus, setSavedMatchStatus] = useState<'reviewing' | 'finished' | null>(null);
  const [showMatchWizard, setShowMatchWizard] = useState(false);
  const [wizardChecked, setWizardChecked] = useState(false);
  
  const [selectedFunctionality, setSelectedFunctionality] = useState<'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING'>('MATCH');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'CONTENT'>('CHAT');
  
  const [desktopMatchView, setDesktopMatchView] = useState<'OPPORTUNITIES' | 'PREFERENCES'>('OPPORTUNITIES');
  
  const [isPending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<'CHAT' | 'CONTENT' | null>(null);

  // Auto-Trigger State for Post-Wizard Search
  const [postWizardTrigger, setPostWizardTrigger] = useState<string | null>(null);

  const handleTabSwitch = (tab: 'CHAT' | 'CONTENT') => {
    if (activeTab === tab) return;
    setPendingTarget(tab);
    startTransition(() => {
        setActiveTab(tab);
    });
  };

  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. Auth & Readiness
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
      return;
    }

    // Ensure modal is closed
    if (closeAuthModal) closeAuthModal();

    // Check for pending chat action
    if (pendingAction?.type === 'chat') {
      setInitialMessage(pendingAction.payload.message);
      clearPendingAction();
    } else {
        // Check for URL message param
        const msgParam = searchParams.get('message');
        if (msgParam) {
            setInitialMessage(msgParam);
            const params = new URLSearchParams(searchParams.toString());
            params.delete('message');
            router.replace(`/chat?${params.toString()}`, { scroll: false });
        }
    }
    setIsReady(true);
  }, [isLoading, isAuthenticated, closeAuthModal, pendingAction, clearPendingAction, searchParams, router]);

  // 2. Data Loading (Profile -> Prefs -> Wizard Check)
  useEffect(() => {
    if (user) {
        const init = async () => {
            // A. Fetch Profile
            const { data: profileData } = await getUserProfileService();
            console.log("[ChatPage] Profile fetched:", profileData?.onboarding_completed);
            if (profileData) setProfile(profileData);

            // B. Gating: Must complete Onboarding first
            if (!profileData?.onboarding_completed) {
                console.log("[ChatPage] Onboarding incomplete. Skipping Wizard check.");
                setSelectedFunctionality('ONBOARDING');
                return;
            }

            // C. Fetch Preferences & Match State
             const { data: prefData } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
             
             let hasQuotas = false;
             let hasIncome = false;

             if (prefData) {
                 setPreferences(prefData);
                 hasQuotas = prefData.quota_types !== null;
                 hasIncome = prefData.family_income_per_capita !== null;

                 if (prefData.workflow_data) {
                     const wf = prefData.workflow_data as any;
                     if (Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
                         setActiveCourseIds(wf.last_course_ids);
                     }
                     if (wf.match_status) {
                         setSavedMatchStatus(wf.match_status);
                     }
                 }
             }

             // D. Fetch ENEM Scores Presence (Legacy Check - Optional now if we trust registration_step)
             // We can skip this if we rely on registration_step.
             // But for robustness, let's just rely on preferences state.

             // E. Show Wizard if Missing Data (Based on Step)
             const regStep = (prefData as any)?.registration_step;
             const isWizardComplete = regStep === 'completed';

             if (!isWizardComplete) {
                 setShowMatchWizard(true);
             }
             setWizardChecked(true);
        };
        
        init();
    }
  }, [user]);

  // Auto-Trigger logic when Onboarding finishes (via Chat or UI)
  useEffect(() => {
    // Wait for profile to be loaded
    if (!profile) return;

    if (profile.onboarding_completed) {
        const triggerMsg = localStorage.getItem('nubo_onboarding_trigger') || "Vamos começar! O que você pode fazer?";
        
        // Only trigger if we haven't already (prevent loops if profile updates multiple times)
        // We can use a ref or just consume the localStorage item.
        // Since we remove the item, it effectively acts as a one-time flag if we rely on it.
        // BUT if we use a default string, we might loop.
        // So we should check if the ITEM existed, OR if we want to force the default logic once.
        
        // Better logic: Check if we are in a 'just finished' state.
        // Actually, let's just use the localStorage + simple flag or just localStorage consumption.
        // If we use default, we need to be careful not to trigger on every page load for already onboarded users.
        
        // Fix: Only trigger if we Just Finished (detected via transition?) 
        // OR: Rely on the fact that for ALREADY onboarded users, the localStorage won't exist.
        // So we ONLY use the Default Trigger if we came from the UI Onboarding flow (which might set a flag?).
        
        // Let's rely on localStorage 'nubo_onboarding_trigger'. 
        // If it's there -> Send it.
        // If NOT there -> Do NOTHING (assume user knows what to do, or it's a fresh session).
        // The User said "depois do onboarding... reenviar a intialMessage". That implies initialMessage WAS there.
        
        if (triggerMsg && localStorage.getItem('nubo_onboarding_trigger')) { 
             console.log("[ChatPage] Onboarding complete. Triggering intent:", triggerMsg);
             setTimeout(() => setInitialMessage(triggerMsg), 500);
             localStorage.removeItem('nubo_onboarding_trigger');
        } else {
             // If NO stored trigger, but we just finished UI onboarding?
             // Maybe handleUIOnboardingComplete sets it?
        }
    }
  }, [profile]);
  
  // Re-write handleUIOnboardingComplete to set the trigger if missing
  const handleUIOnboardingComplete = () => {
       // On successful save from UI, allow user to proceed
       if (user) {
           // Set a default trigger if none exists, to ensure continuity
           if (!localStorage.getItem('nubo_onboarding_trigger')) {
               localStorage.setItem('nubo_onboarding_trigger', "Vamos começar! O que você pode fazer?");
           }
           
           getUserProfileService().then(({ data }) => {
               if (data) setProfile(data);
               setSelectedFunctionality('MATCH');
           });
       }
  };

  const handleInitialMessageSent = () => {
    setInitialMessage(undefined);
  };

  const handleOpportunitiesFound = (ids: string[]) => {
      setActiveCourseIds(ids);
      setDesktopMatchView('OPPORTUNITIES');
      
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setActiveTab('CONTENT');
      }
  };

  if (!isReady) return null; 

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#F0F4FA]">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
          <CloudBackground />
      </div>

      {/* Main Content Grid - z-10 */}
      <div className="relative z-10 flex flex-col md:grid md:grid-cols-4 h-full w-full">
          
          {/* Mobile Tab Navigation */}
          <div className={`md:hidden fixed top-28 left-1/2 -translate-x-1/2 z-50 w-max transition-all duration-300 ${activeTab === 'CHAT' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
             <MobileTabSwitch 
                activeTab={activeTab}
                onTabSwitch={handleTabSwitch}
                isPending={isPending}
                pendingTarget={pendingTarget}
             />
          </div>

          {/* Left Side - Chat */}
          <div className={`
            ${activeTab === 'CHAT' ? 'flex' : 'hidden'} 
            md:flex col-span-1 flex-col h-full overflow-hidden
            bg-white/30 backdrop-blur-lg border-r border-white/40 shadow-xl z-20
          `}>
            <ChatCloudinha 
              initialMessage={initialMessage} 
              onInitialMessageSent={handleInitialMessageSent}
              onOpportunitiesFound={handleOpportunitiesFound}
              onFunctionalitySwitch={setSelectedFunctionality}
              initialMatchStatus={savedMatchStatus}
              onProfileUpdated={async () => {
                  if (user) {
                      console.log("[ChatPage] onProfileUpdated triggered. Fetching profile & prefs...");
                      getUserProfileService().then(({ data }) => data && setProfile(data));
                      
                      try {
                          // Use select() instead of maybeSingle() to avoid 406 issues
                          const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', user.id);

                          if (error) {
                              console.error("[ChatPage] Error fetching preferences:", error);
                              return;
                          }
                          
                          const prefs = data && data.length > 0 ? data[0] : null;
                          console.log("[ChatPage] Preferences fetched:", prefs ? "Found" : "Null", "WF Data:", prefs?.workflow_data);

                          setPreferences(prefs);
                          if (prefs?.workflow_data) {
                              const wf = prefs.workflow_data as any;
                              if (Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
                                  console.log("[ChatPage] Found saved course IDs:", wf.last_course_ids.length);
                                  handleOpportunitiesFound(wf.last_course_ids);
                              } else {
                                  console.log("[ChatPage] No course IDs in workflow_data.");
                              }
                          }
                      } catch (err) {
                           console.error("[ChatPage] Unexpected error in onProfileUpdated:", err);
                      }
                  }
              }}
              onClearOpportunities={() => setActiveCourseIds([])}
              
              activeTab={activeTab}
              onTabSwitch={handleTabSwitch}
              isPending={isPending}
              pendingTarget={pendingTarget}
              
              inputDisabled={showMatchWizard}
              onWizardRequest={() => {
                  setWizardChecked(true);
                  setShowMatchWizard(true);
                  setSelectedFunctionality('MATCH');
              }}
              
              triggerMessage={postWizardTrigger}
              onTriggerMessageSent={() => setPostWizardTrigger(null)}
            />
          </div>

          {/* Right Side - Content Panel */}
          <div className={`
            ${activeTab === 'CONTENT' ? 'flex' : 'hidden'}
            md:flex col-span-3 flex-col relative overflow-hidden h-full
          `}>
             <div className="flex flex-col h-full p-4 md:p-6 pb-4 md:pb-6 gap-4">
                 <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/40 shadow-xl overflow-hidden flex flex-col relative">
                     
                     <div className="relative z-20 bg-white/30 backdrop-blur-xl border-b border-white/20 flex flex-col">
                        <ChatHeader 
                            selectedFunctionality={selectedFunctionality} 
                            onSelectFunctionality={setSelectedFunctionality}
                            desktopMatchView={desktopMatchView}
                            onDesktopMatchViewChange={setDesktopMatchView}
                        />
                     </div>

                     <div className="flex-1 relative z-10 p-4 md:p-8 flex flex-col overflow-hidden">
                        
                        {/* MATCH Workflow */}
                        {selectedFunctionality === 'MATCH' && (
                            <div className="w-full h-full flex flex-col">
                                {showMatchWizard && wizardChecked ? (
                                    <MatchWizard onComplete={() => {
                                        setShowMatchWizard(false);
                                        // TRIGGER: Send hidden message to agent
                                        setPostWizardTrigger("Acabei de preencher meus dados (Nota e Renda). Por favor verifique oportunidades com base nisso e me dê um resumo.");
                                        
                                         if (user) {
                                             supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
                                             .then(({data}) => setPreferences(data));
                                         }
                                    }} />
                                ) : (
                                    desktopMatchView === 'OPPORTUNITIES' ? (
                                        activeCourseIds.length > 0 ? (
                                            <OpportunityCarousel courseIds={activeCourseIds} />
                                        ) : (
                                            <MatchPlaceholder />
                                        )
                                    ) : (
                                        <div className="w-full h-full overflow-y-auto">
                                            <div className="min-h-full flex flex-col justify-center p-4 md:p-8">
                                                <UserPreferencesSection 
                                                    preferences={preferences} 
                                                    onUpdate={(updated) => setPreferences(updated)}
                                                    onMatchFound={(ids) => handleOpportunitiesFound(ids)}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                        
                        {selectedFunctionality === 'PROUNI' && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#024F86]/60 gap-4">
                                <div className="w-16 h-16 bg-[#024F86]/10 rounded-full flex items-center justify-center">
                                    <Layout size={32} />
                                </div>
                                <span className="text-xl font-medium">Painel Prouni (Em breve)</span>
                            </div>
                        )}

                        {selectedFunctionality === 'SISU' && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-[#024F86]/60 gap-4">
                                 <div className="w-16 h-16 bg-[#024F86]/10 rounded-full flex items-center justify-center">
                                    <Layout size={32} />
                                </div>
                                <span className="text-xl font-medium">Painel Sisu (Em breve)</span>
                            </div>
                        )}

                        {selectedFunctionality === 'ONBOARDING' && (
                            <div className="w-full h-full overflow-y-auto flex items-center justify-center p-4">
                                <div className="w-full max-w-3xl">
                                    <UserDataSection 
                                        profile={profile} 
                                        onProfileUpdate={setProfile}
                                        onOnboardingComplete={handleUIOnboardingComplete}
                                    />
                                </div>
                            </div>
                        )}
                     </div>
                 </div>
             </div>
          </div>
      </div>

      <AuthModal />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
       <div className="flex items-center justify-center h-[100dvh] bg-[#F0F4FA]">
          <div className="w-12 h-12 border-4 border-[#024F86] border-t-transparent rounded-full animate-spin"></div>
       </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
