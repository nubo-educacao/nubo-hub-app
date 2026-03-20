'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Sparkles, User, Calendar, Shield, Search } from 'lucide-react';
import { ThinkingGroup } from '@/hooks/useChatCloudinha';

interface ThinkingGroupsRendererProps {
    groups: ThinkingGroup[];
}

// Helper for Icons
const getToolIcon = (label: string) => {
    if (label.includes('Perfil')) return <User className="w-3 h-3" />;
    if (label.includes('Datas')) return <Calendar className="w-3 h-3" />;
    if (label.includes('Moderação')) return <Shield className="w-3 h-3" />;
    if (label.includes('Buscando') || label.includes('Consultando')) return <Search className="w-3 h-3" />;
    return <Sparkles className="w-3 h-3" />;
}

export default function ThinkingGroupsRenderer({ groups }: ThinkingGroupsRendererProps) {
    if (!groups || groups.length === 0) return null;

    return (
        <div className="ml-[60px] flex flex-col gap-2">
            {groups.map((group, grpIdx) => (
                <div key={grpIdx} className="bg-white/40 rounded-xl overflow-hidden border border-[#024F86]/10 shadow-sm backdrop-blur-sm">
                    {/* Group Header */}
                    <div className="flex items-center gap-3 p-3 bg-white/40 border-b border-[#024F86]/5">
                        <div className="flex-shrink-0">
                            {group.status === 'loading' ? (
                                <Loader2 className="w-4 h-4 text-[#024F86] animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                        </div>
                        <span className="text-sm text-[#024F86] font-semibold">
                            {group.label}
                        </span>
                    </div>

                    {/* Group Items */}
                    {group.items.length > 0 && (
                        <div className="flex flex-col gap-1 p-2 pl-4">
                            {group.items.map((item, itmIdx) => (
                                <motion.div
                                    key={itmIdx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#024F86]/5 transition-colors"
                                >
                                    <div className="flex-shrink-0 w-4 flex justify-center">
                                        {/* Sub-item status icon */}
                                        {item.status === 'loading' ? (
                                            <div className="w-1.5 h-1.5 bg-[#024F86]/40 rounded-full animate-pulse" />
                                        ) : (
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-[#636E7C] font-medium">
                                        {getToolIcon(item.label)}
                                        <span>{item.label}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
