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
        <div className="relative w-full aspect-square max-w-[280px] md:max-w-[400px] sm:max-h-[40vh] mx-auto mb-2 md:mb-6">
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
            

        </div>
    );
}
