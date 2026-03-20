'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChatContextType {
    isDrawerOpen: boolean;
    openDrawer: (msg?: string) => void;
    closeDrawer: () => void;
    triggerMessage: string | null;
    clearTriggerMessage: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

    const openDrawer = useCallback((msg?: string) => {
        if (msg) setTriggerMessage(msg);
        setIsDrawerOpen(true);
    }, []);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
    }, []);

    const clearTriggerMessage = useCallback(() => {
        setTriggerMessage(null);
    }, []);

    return (
        <ChatContext.Provider value={{ 
            isDrawerOpen, 
            openDrawer, 
            closeDrawer, 
            triggerMessage, 
            clearTriggerMessage 
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
