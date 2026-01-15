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
        <div className="flex items-center gap-1 bg-white/70 backdrop-blur-xl border border-white/40 p-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            <button 
                onClick={() => onTabSwitch('CHAT')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
                    activeTab === 'CHAT' 
                    ? 'bg-[#024F86] text-white shadow-md' 
                    : 'text-[#024F86]/70 hover:bg-[#024F86]/5'
                }`}
            >
                {isPending && pendingTarget === 'CHAT' ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <MessageSquare size={18} strokeWidth={2.5} />
                )}
                <span className="text-xs font-bold uppercase tracking-wide">Chat</span>
            </button>
            <button 
                onClick={() => onTabSwitch('CONTENT')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 ${
                    activeTab === 'CONTENT' 
                    ? 'bg-[#024F86] text-white shadow-md' 
                    : 'text-[#024F86]/70 hover:bg-[#024F86]/5'
                }`}
            >
                {isPending && pendingTarget === 'CONTENT' ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Layout size={18} strokeWidth={2.5} />
                )}
                <span className="text-xs font-bold uppercase tracking-wide">Painel</span>
            </button>
        </div>
    );
}
