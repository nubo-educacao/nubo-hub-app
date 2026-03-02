'use client';

import { motion, Variants } from 'framer-motion';
import ChatBox from './ChatBox';
import ConversationStarters from './ConversationStarters';

export default function SearchSection() {
    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item: Variants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <section className="relative w-full py-20 overflow-hidden">
            <motion.div
                className="container mx-auto flex flex-col items-center text-center z-10 space-y-6"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* New Subheader */}
                <motion.p
                    className="text-xl md:text-2xl text-sky-700 font-medium font-lora mb-2"
                    variants={item}
                >
                    Fale com a Cloudinha
                </motion.p>

                {/* Chat Component */}
                <motion.div variants={item} className="w-full flex justify-center">
                    <ChatBox />
                </motion.div>

                {/* Starters */}
                <motion.div variants={item} className="w-full flex justify-center">
                    <ConversationStarters />
                </motion.div>
            </motion.div>
        </section>
    );
}
