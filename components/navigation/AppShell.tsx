'use client';

import { usePathname } from 'next/navigation';
import { useChat } from '@/context/ChatContext';
import BottomNavigation from './BottomNavigation';
import TopNavbar from './TopNavbar';
import CloudinhaFAB from '../chat/CloudinhaFAB';
import ChatDrawer from '../chat/ChatDrawer';
import ChatCloudinha from '../../app/chat/components/ChatCloudinha';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isDrawerOpen, openDrawer, closeDrawer, triggerMessage, clearTriggerMessage } = useChat();
  const pathname = usePathname();

  const isLegacyChatRoute = pathname === '/chat';

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#F0F4FA]">
      {/* Top Navigation for Desktop */}
      {!isLegacyChatRoute && <TopNavbar />}

      {/* Main Content Area */}
      <main className={`
        flex-1 flex flex-col relative w-full
        ${!isLegacyChatRoute && 'md:pt-20'} /* Add padding for TopNavbar on desktop */
        ${!isLegacyChatRoute && 'pb-16 md:pb-0'} /* Add padding for BottomNavigation on mobile */
      `}>
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      {!isLegacyChatRoute && <BottomNavigation />}

      {/* Cloudinha AI Guide (FAB + Drawer) */}
      {!isLegacyChatRoute && (
        <>
          <CloudinhaFAB 
            isChatOpen={isDrawerOpen} 
            onToggleChat={() => isDrawerOpen ? closeDrawer() : openDrawer()} 
          />
          <ChatDrawer isOpen={isDrawerOpen} onClose={closeDrawer}>
            <ChatCloudinha 
                triggerMessage={triggerMessage}
                onTriggerMessageSent={clearTriggerMessage}
                selectedFunctionality="ONBOARDING"
                activeTab="CHAT"
                passportPhase="ONBOARDING"
            />
          </ChatDrawer>
        </>
      )}
    </div>
  );
}
