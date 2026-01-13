'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
import ChatHeader from './components/ChatHeader';
import AuthModal from '@/components/AuthModal'; 
import { MessageSquare, Layout, User } from 'lucide-react';
import CloudBackground from '@/components/CloudBackground';
import UserDataSection from '@/components/profile/UserDataSection';
import { getUserProfileService, UserProfile } from '@/services/supabase/profile';

export default function ChatPage() {
  const { isAuthModalOpen, closeAuthModal, pendingAction, clearPendingAction, isAuthenticated, isLoading, user } = useAuth();
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [activeCourseIds, setActiveCourseIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedFunctionality, setSelectedFunctionality] = useState<'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING'>('MATCH');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'CONTENT'>('CHAT');
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

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
    }
    setIsReady(true);
  }, [closeAuthModal, pendingAction, clearPendingAction]);

  useEffect(() => {
    if (user) {
        getUserProfileService().then(({ data }) => {
            if (data) setProfile(data);
        });
    }
  }, [user]);

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
  };

  if (!isReady) return null; // Or a loading spinner

  /* Responsive Layout */
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#F0F4FA]">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
          <CloudBackground />
      </div>

      {/* Main Content Grid - z-10 */}
      <div className="relative z-10 flex flex-col md:grid md:grid-cols-4 h-full w-full">
          
          {/* Mobile Tab Navigation (Floating Top) */}
          <div className="md:hidden fixed top-28 left-1/2 -translate-x-1/2 z-50 w-max">
            <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xl border border-white/40 p-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
                <button 
                    onClick={() => setActiveTab('CHAT')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
                        activeTab === 'CHAT' 
                        ? 'bg-[#024F86] text-white shadow-md' 
                        : 'text-[#024F86]/70 hover:bg-[#024F86]/5'
                    }`}
                >
                    <MessageSquare size={18} strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-wide">Chat</span>
                </button>
                <button 
                    onClick={() => setActiveTab('CONTENT')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
                        activeTab === 'CONTENT' 
                        ? 'bg-[#024F86] text-white shadow-md' 
                        : 'text-[#024F86]/70 hover:bg-[#024F86]/5'
                    }`}
                >
                    <Layout size={18} strokeWidth={2.5} />
                    <span className="text-xs font-bold uppercase tracking-wide">Painel</span>
                </button>
            </div>
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
              onOpportunitiesFound={(ids) => {
                  handleOpportunitiesFound(ids);
                  if (window.innerWidth < 768) setActiveTab('CONTENT'); 
              }}
              onFunctionalitySwitch={setSelectedFunctionality}
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
                     <div className="relative z-20 bg-white/30 backdrop-blur-xl border-b border-white/20">
                        <ChatHeader 
                            selectedFunctionality={selectedFunctionality} 
                            onSelectFunctionality={setSelectedFunctionality}
                        />
                     </div>

                     {/* Main Content Area */}
                     <div className="flex-1 relative z-10 p-4 md:p-8 flex flex-col overflow-hidden">
                        {selectedFunctionality === 'MATCH' && (
                            <OpportunityCarousel courseIds={activeCourseIds} />
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
