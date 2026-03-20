'use client';

import React, { useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useChatCloudinha } from '@/hooks/useChatCloudinha';

import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import ThinkingGroupsRenderer from './ThinkingGroupsRenderer';

export default function ChatCloudinha({
    initialMessage,
    onInitialMessageSent,
    onOpportunitiesFound,
    onFunctionalitySwitch,
    onProfileUpdated,
    onClearOpportunities,
    initialMatchStatus,
    activeTab,
    onTabSwitch,
    isPending,
    pendingTarget,
    onWizardRequest,
    inputDisabled,
    triggerMessage,
    onTriggerMessageSent,
    uiFormState,
    passportPhase,
    selectedFunctionality
}: {
    initialMessage?: string;
    onInitialMessageSent?: () => void;
    onOpportunitiesFound?: (ids: string[]) => void;
    onFunctionalitySwitch?: (func: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING') => void;
    onProfileUpdated?: () => void;
    onClearOpportunities?: () => void;
    initialMatchStatus?: 'reviewing' | 'finished' | null;
    activeTab?: 'CHAT' | 'CONTENT';
    onTabSwitch?: (tab: 'CHAT' | 'CONTENT') => void;
    isPending?: boolean;
    pendingTarget?: 'CHAT' | 'CONTENT' | null;
    onWizardRequest?: () => void;
    inputDisabled?: boolean;
    triggerMessage?: string | null;
    onTriggerMessageSent?: () => void;
    uiFormState?: any;
    passportPhase?: string | null;
    selectedFunctionality?: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING';
}) {
    const { user } = useAuth();
    const pathname = usePathname();

    const {
        messages,
        isTyping,
        isLoadingHistory,
        currentStreamId,
        handleSendMessage
    } = useChatCloudinha({
        uiFormState,
        onOpportunitiesFound,
        onFunctionalitySwitch,
        onProfileUpdated,
        onWizardRequest,
        onTabSwitch,
        currentPath: pathname
    });

    const triggerSentRef = useRef<string | null>(null);

    useEffect(() => {
        if (triggerMessage && triggerMessage !== triggerSentRef.current && !isTyping) {
            triggerSentRef.current = triggerMessage;
            onSend(triggerMessage);
            if (onTriggerMessageSent) onTriggerMessageSent();
        }
        if (!triggerMessage) {
            triggerSentRef.current = null;
        }
    }, [triggerMessage, isTyping, onTriggerMessageSent]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastProcessedMessage = useRef<string | undefined>(undefined);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isLoadingHistory]);

    useEffect(() => {
        if (initialMessage && initialMessage !== lastProcessedMessage.current && !isLoadingHistory) {
            lastProcessedMessage.current = initialMessage;
            setTimeout(() => {
                onSend(initialMessage);
                if (onInitialMessageSent) onInitialMessageSent();
            }, 100);
        }
        if (!initialMessage && lastProcessedMessage.current) {
            lastProcessedMessage.current = undefined;
        }
    }, [initialMessage, isLoadingHistory, onInitialMessageSent]);

    const onSend = async (text: string) => {
        const hasUserMessages = messages.some(m => m.sender === 'user');
        if (!hasUserMessages && typeof window !== 'undefined' && (window as any).fbq) {
            (window as any).fbq('track', 'Contact');
        }
        await handleSendMessage(text);
    };

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#024F86]/20 scrollbar-track-transparent">
                {isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full w-full gap-2 min-h-[200px]">
                        <Loader2 className="w-8 h-8 text-[#024F86] animate-spin" />
                        <p className="text-sm font-medium text-[#024F86]">Carregando mensagens...</p>
                    </div>
                ) : messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col gap-6">
                        {/* Thinking groups componentized */}
                        <ThinkingGroupsRenderer groups={msg.thinking_groups || []} />

                        {msg.is_onboarding_success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full flex justify-start"
                            >
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 shadow-sm backdrop-blur-sm max-w-[80%]">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-green-700">Perfil Atualizado! 🚀</span>
                                        <span className="text-xs text-green-600/80">Tudo pronto para buscar suas oportunidades.</span>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            (msg.text || msg.sender === 'user') && (
                                <MessageBubble
                                    message={msg}
                                    userAvatar={user?.avatar}
                                    onFeedback={(score: number, type: string) => {
                                        if (!user) return;
                                        let currentSessionId = sessionStorage.getItem('nubo_chat_session_id');
                                        if (!currentSessionId) {
                                            currentSessionId = crypto.randomUUID();
                                            sessionStorage.setItem('nubo_chat_session_id', currentSessionId);
                                        }
                                        supabase.from('agent_feedback').insert({
                                            user_id: user.id,
                                            session_id: currentSessionId,
                                            feedback_type: type,
                                            score: score,
                                            content: score === 1 ? 'Thumbs Up' : 'Thumbs Down',
                                            metadata: { message_id: msg.id }
                                        }).then(({ error }) => {
                                            if (error) console.error("Feedback error:", error);
                                        });
                                    }}
                                />
                            )
                        )}
                    </div>
                ))}

                {isTyping && !currentStreamId && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-[#024F86]/60 text-sm p-3 bg-white/50 border border-[#024F86]/10 rounded-2xl w-fit shadow-sm"
                    >
                        <span className="w-2 h-2 bg-[#024F86] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-[#024F86] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-[#024F86] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="w-full max-w-4xl mx-auto px-4 pb-4">
                    <ChatInput
                        onSendMessage={onSend}
                        isLoading={isTyping}
                        disabled={isTyping || inputDisabled}
                        passportPhase={passportPhase}
                        onViewPanel={() => onTabSwitch?.('CONTENT')}
                        showViewPanel={
                            activeTab === 'CHAT' &&
                            selectedFunctionality === 'ONBOARDING' &&
                            !!passportPhase &&
                            ['ONBOARDING', 'DEPENDENT_ONBOARDING', 'EVALUATE', 'PROGRAM_MATCH'].includes(passportPhase)
                        }
                    />
                </div>
            </div>
        </div>
    );
}
