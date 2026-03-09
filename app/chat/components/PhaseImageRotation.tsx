'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PhaseImageRotationProps {
    images: string[];
    interval?: number; // In milliseconds
}

export default function PhaseImageRotation({ 
    images, 
    interval = 10000 // Default to 10 seconds as requested (10000ms)
}: PhaseImageRotationProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images, interval]);

    if (!images || images.length === 0) return null;

    return (
        <div className="relative w-full aspect-square max-w-[400px] mx-auto mb-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={images[currentIndex]}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center p-4"
                >
                    <div className="relative w-full h-full">
                        <Image
                            src={images[currentIndex]}
                            alt={`Slide ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </motion.div>
            </AnimatePresence>
            
            {images.length > 1 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {images.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                idx === currentIndex ? 'w-6 bg-[#024F86]' : 'w-1.5 bg-[#024F86]/20'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
