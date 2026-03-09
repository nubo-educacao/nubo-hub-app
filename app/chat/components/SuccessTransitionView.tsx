import { CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PhaseImageRotation from './PhaseImageRotation';

interface SuccessTransitionViewProps {
    title: string;
    subtitle: string;
    description: string;
    buttonText?: string;
    onButtonClick?: () => void;
    images?: string[];
}

export default function SuccessTransitionView({
    title,
    subtitle,
    description,
    buttonText,
    onButtonClick,
    images
}: SuccessTransitionViewProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6 py-6 px-6">
            {/* Visual Element */}
            <div className="w-full flex justify-center">
                {images && images.length > 0 ? (
                    <PhaseImageRotation images={images} />
                ) : (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="w-20 h-20 rounded-full bg-[#024F86]/10 flex items-center justify-center shadow-inner"
                    >
                        <CheckCircle2 className="w-10 h-10 text-[#024F86]" />
                    </motion.div>
                )}
            </div>

            {/* Content Container (No Card anymore) */}
            <div className="flex flex-col items-center text-center max-w-3xl w-full space-y-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={title + subtitle}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-2"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-[#024F86] tracking-tight">
                            {title}
                        </h2>
                        <p className="text-[#024F86] font-semibold text-xl md:text-2xl">
                            {subtitle}
                        </p>
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={description}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="flex flex-col items-center"
                    >
                        <p className="text-[#636E7C] text-lg leading-relaxed max-w-2xl">
                            {description}
                        </p>

                        {buttonText && (
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                onClick={onButtonClick}
                                className="flex items-center gap-2 px-8 py-4 bg-[#024F86] text-white rounded-full font-semibold hover:bg-[#024F86]/90 transition-all active:scale-95 shadow-lg shadow-[#024F86]/20 mt-4"
                            >
                                <MessageSquare size={18} />
                                {buttonText}
                                <ArrowRight size={18} />
                            </motion.button>
                        )}

                        {/* Status Sparkle */}
                        {!images && (
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 text-green-700 text-sm font-bold mt-6">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                CONCLUÍDO
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
