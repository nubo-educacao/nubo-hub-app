'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { X, FileText, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface ApplicationItem {
    id: string;
    partner_id: string;
    partner_name: string;
    status: string;
    created_at: string;
    updated_at: string;
    applications_open: boolean;
}

interface ApplicationsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectApplication: (applicationId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT: { label: 'Rascunho', bg: 'bg-amber-100', text: 'text-amber-700' },
    SUBMITTED: { label: 'Enviado', bg: 'bg-green-100', text: 'text-green-700' },
};

export default function ApplicationsDrawer({ isOpen, onClose, onSelectApplication }: ApplicationsDrawerProps) {
    const { user } = useAuth();
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchApplications = async () => {
            setLoading(true);

            const { data, error } = await supabase
                .from('student_applications')
                .select('id, partner_id, status, created_at, updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error || !data) {
                console.error('[ApplicationsDrawer] Error fetching applications:', error);
                setApplications([]);
                setLoading(false);
                return;
            }

            // Fetch partner names
            const partnerIds = [...new Set(data.map(a => a.partner_id))];
            const { data: partners } = await supabase
                .from('partners')
                .select('id, name, applications_open')
                .in('id', partnerIds);

            const partnerMap: Record<string, { name: string, open: boolean }> = {};
            partners?.forEach(p => { partnerMap[p.id] = { name: p.name, open: p.applications_open ?? true }; });

            const items: ApplicationItem[] = data.map(app => {
                const partnerInfo = partnerMap[app.partner_id] || { name: 'Parceiro desconhecido', open: true };
                return {
                    id: app.id,
                    partner_id: app.partner_id,
                    partner_name: partnerInfo.name,
                    status: app.status,
                    created_at: app.created_at,
                    updated_at: app.updated_at,
                    applications_open: partnerInfo.open,
                };
            });

            setApplications(items);
            setLoading(false);
        };

        fetchApplications();
    }, [isOpen, user]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col ${montserrat.className}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-[#024F86]/10 rounded-full flex items-center justify-center">
                                    <FileText className="text-[#024F86]" size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-[#024F86]">Meus Formulários</h2>
                                    <p className="text-xs text-[#3A424E]/60">Candidaturas criadas</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} className="text-[#3A424E]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="animate-spin text-[#024F86]" size={32} />
                                    <p className="text-sm text-[#3A424E]/60">Carregando formulários...</p>
                                </div>
                            ) : applications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                        <FileText className="text-gray-400" size={28} />
                                    </div>
                                    <p className="text-sm text-[#3A424E]/60">Nenhum formulário encontrado.</p>
                                    <p className="text-xs text-[#3A424E]/40">Escolha um programa no Match para começar.</p>
                                </div>
                            ) : (
                                applications.map((app, idx) => {
                                    const statusConfig = STATUS_CONFIG[app.status] || { label: app.status, bg: 'bg-gray-100', text: 'text-gray-600' };
                                    const isDisabled = !app.applications_open && app.status === 'DRAFT';

                                    return (
                                        <motion.button
                                            key={app.id}
                                            disabled={isDisabled}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => {
                                                if (!isDisabled) onSelectApplication(app.id);
                                            }}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${
                                                isDisabled 
                                                    ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                                                    : 'border-gray-100 hover:border-[#38B1E4]/40 hover:bg-[#38B1E4]/5'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isDisabled ? 'bg-gray-200' : 'bg-[#024F86]/5 group-hover:bg-[#024F86]/10'}`}>
                                                <FileText className={isDisabled ? 'text-gray-400' : 'text-[#024F86]'} size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isDisabled ? 'text-gray-500' : 'text-[#024F86]'}`}>
                                                    {app.partner_name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDisabled ? 'bg-gray-200 text-gray-500' : `${statusConfig.bg} ${statusConfig.text}`}`}>
                                                        {isDisabled ? 'Inscrições Encerradas' : statusConfig.label}
                                                    </span>
                                                    <span className="text-[10px] text-[#3A424E]/40">
                                                        {formatDate(app.updated_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className={`shrink-0 transition-colors ${isDisabled ? 'text-gray-300' : 'text-[#3A424E]/30 group-hover:text-[#38B1E4]'}`} />
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
