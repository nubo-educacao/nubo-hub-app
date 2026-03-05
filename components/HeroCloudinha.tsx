'use client';

import { motion, Variants } from 'framer-motion';

export default function HeroCloudinha() {
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
    <section className="relative w-full min-h-[50vh] flex flex-col items-center justify-center px-4 pt-32 pb-10 overflow-hidden">
      <motion.div
        className="container mx-auto flex flex-col items-center text-center z-10 space-y-8 mt-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Text Content */}
        <div className="space-y-4 max-w-3xl px-4">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-7xl font-bold text-sky-900 tracking-tight"
            variants={item}
          >
            Encontre <span className="text-sky-600">oportunidades educacionais</span> feitas para você
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-sky-700 font-medium font-lora"
            variants={item}
          >
            A Cloudinha conecta estudantes a bolsas, programas e apoio educacional
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}
