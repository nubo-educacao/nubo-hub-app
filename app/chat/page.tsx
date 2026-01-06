'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
import ChatHeader from './components/ChatHeader';
import AuthModal from '@/components/AuthModal'; // Assuming there is an existing AuthModal or I will create one there. 
// Wait, the plan said app/chat/components/AuthModal.tsx but there might be a global one.
// The user context says "c:\Users\Bruno Bogochvol\Documents\GitHub\Nubo\nubo-hub-app-ag\components\AuthModal.tsx" is open.
// So I should use that one if it fits, or update it.
// Let's assume I'll use the existing one for now, or create a wrapper if needed.
// Actually, the plan said "[NEW] app/chat/components/AuthModal.tsx". 
// But if one exists in @/components/AuthModal.tsx, I should check it first.
// I'll stick to the plan but check the existing file first in the next step.
// For now, I will scaffold the page.

export default function ChatPage() {
  const { isAuthModalOpen, closeAuthModal, pendingAction, clearPendingAction, isAuthenticated, isLoading } = useAuth();
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [activeCourseIds, setActiveCourseIds] = useState<string[]>([]);
  const [selectedFunctionality, setSelectedFunctionality] = useState<'MATCH' | 'PROUNI' | 'SISU'>('MATCH');
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

  /* Grid Layout: 4 columns total */
  return (
    <div className="grid grid-cols-4 h-screen w-full bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white overflow-hidden">
      
      {/* Left Side - Chat (1/4 cols) */}
      <div className="col-span-1 border-r border-white/10 bg-black/20 backdrop-blur-xl flex flex-col h-full overflow-hidden">
        <ChatCloudinha 
          initialMessage={initialMessage} 
          onInitialMessageSent={handleInitialMessageSent}
          onOpportunitiesFound={handleOpportunitiesFound}
        />
      </div>

      {/* Right Side - Content Panel (3/4 cols) */}
      <div className="col-span-3 flex flex-col relative overflow-hidden bg-gradient-to-r from-[#024f86] to-[#3092bb]">
         {/* Header */}
         <ChatHeader 
            selectedFunctionality={selectedFunctionality} 
            onSelectFunctionality={setSelectedFunctionality}
         />

         {/* Main Content Area */}
         <div className="flex-1 relative z-10 p-8 flex flex-col h-full overflow-hidden">
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
