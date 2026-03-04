'use client';

import React from 'react';
import { CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SuccessTransitionViewProps {
    title: string;
    subtitle: string;
    description: string;
    buttonText?: string;
    onButtonClick?: () => void;
}

export default function SuccessTransitionView({
    title,
    subtitle,
    description,
    buttonText,
    onButtonClick
}: SuccessTransitionViewProps) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-full max-w-lg mx-auto">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
            >
                <CheckCircle2 className="w-12 h-12 text-green-600" />
            </motion.div>

            <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-[#024F86] mb-2"
            >
                {title}
            </motion.h2>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm font-medium text-[#024F86]/60 mb-4"
            >
                {subtitle}
            </motion.p>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-[#024F86]/5 rounded-[24px] border border-[#024F86]/10 mb-8 w-full"
            >
                <p className="text-[#024F86]/80 text-sm leading-relaxed">
                    {description}
                </p>
            </motion.div>

            {buttonText && (
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={onButtonClick}
                    className="flex items-center gap-2 px-6 py-3 bg-[#024F86] text-white rounded-full font-semibold hover:bg-[#024F86]/90 transition-all active:scale-95 shadow-lg shadow-[#024F86]/20"
                >
                    <MessageSquare size={18} />
                    {buttonText}
                    <ArrowRight size={18} />
                </motion.button>
            )}
        </div>
    );
}
