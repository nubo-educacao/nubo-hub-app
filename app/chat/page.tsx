'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
import ChatHeader from './components/ChatHeader';
import AuthModal from '@/components/AuthModal'; 
import { MessageSquare, Layout } from 'lucide-react';

export default function ChatPage() {
  const { isAuthModalOpen, closeAuthModal, pendingAction, clearPendingAction, isAuthenticated, isLoading } = useAuth();
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [activeCourseIds, setActiveCourseIds] = useState<string[]>([]);
  const [selectedFunctionality, setSelectedFunctionality] = useState<'MATCH' | 'PROUNI' | 'SISU'>('MATCH');
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

  const handleInitialMessageSent = () => {
    setInitialMessage(undefined);
  };

  const handleOpportunitiesFound = (ids: string[]) => {
      setActiveCourseIds(ids);
  };

  if (!isReady) return null; // Or a loading spinner

  /* Responsive Layout */
  return (
    <div className="flex flex-col md:grid md:grid-cols-4 h-screen w-full bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white overflow-hidden">
      
      {/* Mobile Tab Navigation (Floating Top) */}
      <div className="md:hidden fixed top-28 left-1/2 -translate-x-1/2 z-40">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-white/20 p-1 rounded-full shadow-lg">
            <button 
                onClick={() => setActiveTab('CHAT')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${
                    activeTab === 'CHAT' 
                    ? 'bg-[#024F86] text-white shadow-md' 
                    : 'text-[#024F86]/60 hover:bg-[#024F86]/5'
                }`}
            >
                <MessageSquare size={18} />
                <span className="text-xs font-bold uppercase tracking-wide">Chat</span>
            </button>
            <button 
                onClick={() => setActiveTab('CONTENT')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all duration-300 ${
                    activeTab === 'CONTENT' 
                    ? 'bg-[#024F86] text-white shadow-md' 
                    : 'text-[#024F86]/60 hover:bg-[#024F86]/5'
                }`}
            >
                <Layout size={18} />
                <span className="text-xs font-bold uppercase tracking-wide">Painel</span>
            </button>
        </div>
      </div>

      {/* Left Side - Chat (Visible on Mobile if Tab=CHAT) */}
      <div className={`
        ${activeTab === 'CHAT' ? 'flex' : 'hidden'} 
        md:flex col-span-1 border-r border-white/10 bg-black/20 backdrop-blur-xl flex-col h-full overflow-hidden
      `}>
        <ChatCloudinha 
          initialMessage={initialMessage} 
          onInitialMessageSent={handleInitialMessageSent}
          onOpportunitiesFound={(ids) => {
              handleOpportunitiesFound(ids);
              // Auto switch to content on mobile when results found
              if (window.innerWidth < 768) setActiveTab('CONTENT'); 
          }}
        />
      </div>

      {/* Right Side - Content Panel (Visible on Mobile if Tab=CONTENT) */}
      <div className={`
        ${activeTab === 'CONTENT' ? 'flex' : 'hidden'}
        md:flex col-span-3 flex-col relative overflow-hidden bg-gradient-to-r from-[#024f86] to-[#3092bb] h-full md:h-full
      `}>
         {/* Header */}
         <ChatHeader 
            selectedFunctionality={selectedFunctionality} 
            onSelectFunctionality={setSelectedFunctionality}
         />

         {/* Main Content Area */}
         <div className="flex-1 relative z-10 p-4 md:p-8 flex flex-col h-full overflow-hidden">
            {selectedFunctionality === 'MATCH' && (
                <OpportunityCarousel courseIds={activeCourseIds} />
            )}
            
            {selectedFunctionality === 'PROUNI' && (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                    <span className="text-xl">this works - Prouni placeholder</span>
                </div>
            )}

            {selectedFunctionality === 'SISU' && (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                    <span className="text-xl">this works - Sisu placeholder</span>
                </div>
            )}
         </div>
      </div>

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
}
