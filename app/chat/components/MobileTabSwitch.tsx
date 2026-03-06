import React from 'react';
import { MessageSquare, Layout, Loader2 } from 'lucide-react';

interface MobileTabSwitchProps {
    activeTab: 'CHAT' | 'CONTENT';
    onTabSwitch: (tab: 'CHAT' | 'CONTENT') => void;
    isPending: boolean;
    pendingTarget: 'CHAT' | 'CONTENT' | null;
}

export default function MobileTabSwitch({
    activeTab,
    onTabSwitch,
    isPending,
    pendingTarget
}: MobileTabSwitchProps) {
    return (
        <div className="flex w-full bg-white border-b border-gray-100">
            <button
                onClick={() => onTabSwitch('CHAT')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 relative transition-all duration-300 ${activeTab === 'CHAT'
                    ? 'text-[#024F86]'
                    : 'text-[#024F86]/40 hover:text-[#024F86]/60'
                    }`}
            >
                {isPending && pendingTarget === 'CHAT' ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <MessageSquare size={18} strokeWidth={2.5} />
                )}
                <span className="text-sm font-bold uppercase tracking-wide">Chat</span>
                {activeTab === 'CHAT' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#024F86] rounded-t-full shadow-[0_-2px_8px_rgba(2,79,134,0.3)]" />
                )}
            </button>
            <button
                onClick={() => onTabSwitch('CONTENT')}
                className={`flex-1 flex items-center justify-center gap-2 py-4 relative transition-all duration-300 ${activeTab === 'CONTENT'
                    ? 'text-[#024F86]'
                    : 'text-[#024F86]/40 hover:text-[#024F86]/60'
                    }`}
            >
                {isPending && pendingTarget === 'CONTENT' ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Layout size={18} strokeWidth={2.5} />
                )}
                <span className="text-sm font-bold uppercase tracking-wide">Painel</span>
                {activeTab === 'CONTENT' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#024F86] rounded-t-full shadow-[0_-2px_8px_rgba(2,79,134,0.3)]" />
                )}
            </button>
        </div>
    );
}
