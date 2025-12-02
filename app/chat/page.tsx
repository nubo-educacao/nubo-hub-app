'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
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
  const { isAuthModalOpen, closeAuthModal, pendingAction, clearPendingAction } = useAuth();
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
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

  if (!isReady) return null; // Or a loading spinner

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white overflow-hidden">
      {/* Left Side - Chat */}
      <div className="w-full md:w-[400px] flex-shrink-0 border-r border-white/10 bg-black/20 backdrop-blur-xl">
        <ChatCloudinha 
          initialMessage={initialMessage} 
          onInitialMessageSent={handleInitialMessageSent}
        />
      </div>

      {/* Right Side - Content Panel */}
      <div className="hidden md:flex flex-1 flex-col relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none"></div>
         <div className="relative z-10 h-full flex flex-col justify-center p-8">
            <OpportunityCarousel />
         </div>
      </div>

      {/* Mobile Toggle (To be implemented) */}
      
      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
}
