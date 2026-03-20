'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserDataSection from './UserDataSection';
import { UserProfile, getUserProfileService } from '@/services/supabase/profile';
import { useAuth } from '@/context/AuthContext';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function ProfileModal({ isOpen, onClose, onUpdate }: ProfileModalProps) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            setLoading(true);
            getUserProfileService().then(({ data }) => {
                if (data) setProfile(data);
                setLoading(false);
            });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90dvh] bg-[#F0F8FF] rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-[#024F86]/10 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-bold text-[#024F86] font-montserrat">Completar Perfil</h2>
                        <p className="text-sm text-gray-500 font-medium">Preencha seus dados para encontrarmos as melhores oportunidades.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-[#024F86] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-[#38B1E4]" size={36} />
                            <p className="text-[#024F86] font-medium">Carregando seus dados...</p>
                        </div>
                    ) : (
                        <UserDataSection 
                            profile={profile} 
                            onProfileUpdate={(updated) => {
                                setProfile(updated);
                                if (onUpdate) onUpdate();
                            }}
                            onOnboardingComplete={() => {
                                // Close after a small delay to show success potentially
                                setTimeout(onClose, 500);
                            }}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
