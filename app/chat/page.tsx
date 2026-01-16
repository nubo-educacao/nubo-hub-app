'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
import MatchPlaceholder from './components/MatchPlaceholder';
import ChatHeader from './components/ChatHeader';
import AuthModal from '@/components/AuthModal'; 
import { MessageSquare, Layout, User, Loader2, Sparkles, Settings } from 'lucide-react';
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
  const [preferences, setPreferences] = useState<any>(null); // Load prefs for edit section
  const [savedMatchStatus, setSavedMatchStatus] = useState<'reviewing' | 'finished' | null>(null); // Persistence for Match Actions
  
  const [selectedFunctionality, setSelectedFunctionality] = useState<'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING'>('MATCH');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'CONTENT'>('CHAT');
  
  // Desktop Match View Mode
  const [desktopMatchView, setDesktopMatchView] = useState<'OPPORTUNITIES' | 'PREFERENCES'>('OPPORTUNITIES');
  
  const [isPending, startTransition] = useTransition();
  const [pendingTarget, setPendingTarget] = useState<'CHAT' | 'CONTENT' | null>(null);

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

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
      return;
    }

    // Ensure modal is closed when arriving at chat page
    closeAuthModal();

    // Check for pending chat action
    if (pendingAction?.type === 'chat') {
      setInitialMessage(pendingAction.payload.message);
      clearPendingAction();
    } else {
        // Check for URL message param
        const msgParam = searchParams.get('message');
        if (msgParam) {
            setInitialMessage(msgParam);
            // Optional: clean up URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('message');
            router.replace(`/chat?${params.toString()}`, { scroll: false });
        }
    }
    setIsReady(true);
  }, [closeAuthModal, pendingAction, clearPendingAction, searchParams, router]);

  useEffect(() => {
    if (user) {
        // Fetch Profile + Preferences (Parallel or Sequential)
        // 1. Profile (Existing)
        getUserProfileService().then(({ data }) => {
            console.log("[ChatPage] Profile fetched:", data?.onboarding_completed);
            if (data) setProfile(data);
        });

        // 2. Preferences (New - for Workflow Data & Edit Section)
        const fetchPreferences = async () => {
             const { data } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
             if (data) {
                 setPreferences(data);
                 // Check persistence
                 if (data.workflow_data) {
                     const wf = data.workflow_data as any;
                     
                     // Restore Carousel
                     if (Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
                         console.log("[ChatPage] Restoring persisted opportunities:", wf.last_course_ids.length);
                         setActiveCourseIds(wf.last_course_ids);
                     }
                     
                     // Restore Match Actions Buttons
                     if (wf.match_status) {
                         console.log("[ChatPage] Restoring match status:", wf.match_status);
                         setSavedMatchStatus(wf.match_status);
                     }
                 }
             }
        };
        fetchPreferences();
    }
  }, [user]);
  
  // Auto-Trigger logic when Onboarding finishes (via Chat or UI)
  useEffect(() => {
    // Wait for profile to be loaded
    if (!profile) return;

    console.log("[ChatPage] Checking Onboarding Trigger. Completed:", profile.onboarding_completed);
    
    if (profile.onboarding_completed) {
        const triggerMsg = localStorage.getItem('nubo_onboarding_trigger');
        if (triggerMsg) {
            console.log("[ChatPage] Onboarding complete. Triggering saved intent:", triggerMsg);
            
            // Wait a bit to ensure the "Profile Updated" component renders first
            setTimeout(() => {
                setInitialMessage(triggerMsg);
            }, 100);

            localStorage.removeItem('nubo_onboarding_trigger');
        }
    }
  }, [profile]); // Dependency on profile object updates

  const handleUIOnboardingComplete = () => {
       // On successful save from UI, we want to Trigger the Agent to proceed.
       // We'll read the trigger message from local storage (or default) and send it.
       const triggerMsg = localStorage.getItem('nubo_onboarding_trigger') || "Me ajude a encontrar a oportunidade ideal";
       setInitialMessage(triggerMsg);
       
       // Clean up
       localStorage.removeItem('nubo_onboarding_trigger');
  };

  const handleInitialMessageSent = () => {
    setInitialMessage(undefined);
  };

  const handleOpportunitiesFound = (ids: string[]) => {
      setActiveCourseIds(ids);
      // Auto-switch to view opportunities if user was on preferences
      setDesktopMatchView('OPPORTUNITIES');
      
      // Mobile: Switch to Panel (CONTENT) when opportunities are found
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setActiveTab('CONTENT');
      }
  };

  if (!isReady) return null; // Or a loading spinner

  /* Responsive Layout */
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#F0F4FA]">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
          <CloudBackground />
      </div>

      {/* Main Content Grid - z-10 */}
      <div className="relative z-10 flex flex-col md:grid md:grid-cols-4 h-full w-full">
          
          {/* Mobile Tab Navigation (Floating Top) */}
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
              onProfileUpdated={() => {
                  if (user) {
                      console.log("Refreshing profile...");
                      getUserProfileService().then(({ data }) => {
                          if (data) setProfile(data);
                      });
                       supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
                         .then(({data}) => {
                             setPreferences(data);
                             if (data?.workflow_data) {
                                  const wf = data.workflow_data as any;
                                  if (Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
                                      console.log("[ChatPage] Restoring refreshed opportunities:", wf.last_course_ids.length);
                                      handleOpportunitiesFound(wf.last_course_ids);
                                  }
                             }
                         });
                  }
              }}
              // Pass clearing capability for reset
              onClearOpportunities={() => setActiveCourseIds([])}
              
              // Mobile Navigation Props
              activeTab={activeTab}
              onTabSwitch={handleTabSwitch}
              isPending={isPending}
              pendingTarget={pendingTarget}
            />
          </div>

          {/* Right Side - Content Panel */}
          <div className={`
            ${activeTab === 'CONTENT' ? 'flex' : 'hidden'}
            md:flex col-span-3 flex-col relative overflow-hidden h-full
          `}>
             <div className="flex flex-col h-full p-4 md:p-6 pb-4 md:pb-6 gap-4">
                 {/* Glass Card Container for Content */}
                 <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/40 shadow-xl overflow-hidden flex flex-col relative">
                     
                     {/* Header */}
                     <div className="relative z-20 bg-white/30 backdrop-blur-xl border-b border-white/20 flex flex-col">
                        <ChatHeader 
                            selectedFunctionality={selectedFunctionality} 
                            onSelectFunctionality={setSelectedFunctionality}
                            desktopMatchView={desktopMatchView}
                            onDesktopMatchViewChange={setDesktopMatchView}
                        />
                     </div>

                     {/* Main Content Area */}
                     <div className="flex-1 relative z-10 p-4 md:p-8 flex flex-col overflow-hidden">
                        
                        {/* MATCH Workflow */}
                        {selectedFunctionality === 'MATCH' && (
                            <div className="w-full h-full flex flex-col">
                                {desktopMatchView === 'OPPORTUNITIES' ? (
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
                                                onUpdate={(updated) => {
                                                    setPreferences(updated);
                                                    // Could trigger search or visual feedback
                                                }}
                                                onMatchFound={(ids) => handleOpportunitiesFound(ids)}
                                            />
                                        </div>
                                    </div>
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

      {/* Auth Modal */}
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

