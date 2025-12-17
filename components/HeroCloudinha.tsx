'use client';

import { motion } from 'framer-motion';
import ChatBox from './ChatBox';

export default function HeroCloudinha() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 1
      }
    }
  };

  const item = {
    hidden: { y: 100, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center px-4 pt-20 pb-10 overflow-hidden">


      <motion.div
        className="container mx-auto flex flex-col items-center text-center z-10 space-y-12 mt-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Text Content */}
        <div className="space-y-4 max-w-3xl">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-sky-900 tracking-tight"
            variants={item}
          >
            Transforme seu potencial em <span className="text-sky-600">oportunidades reais</span>
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-sky-700 font-medium"
            variants={item}
          >
            A Cloudinha conecta você às melhores instituições de ensino e vagas 
          </motion.p>
        </div>

        {/* Chat Component */}
        <motion.div variants={item} className="w-full flex justify-center">
            <ChatBox />
        </motion.div>
      </motion.div>
    </section>
  );
}
