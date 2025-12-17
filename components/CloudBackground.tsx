'use client';

import { motion } from 'framer-motion';

export default function CloudBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#EAF9FF] to-[#D6F0FF]">
      
      {/* Cloud 1 - Soft Blue Drifting Right - Base Layer */}
      <motion.div
        className="absolute top-[5%] -left-[25%] w-[1200px] h-[600px] bg-[#38B1E4] rounded-full blur-[240px] opacity-70"
        animate={{
          x: ['-20%', '120vw'],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop"
        }}
      />

       {/* Cloud 2 - White brightness moving slower */}
       <motion.div
        className="absolute top-[20%] -left-[10%] w-[600px] h-[500px] bg-white rounded-full blur-[40px] opacity-80"
        style={{ mixBlendMode: 'overlay' }}
        animate={{
          x: ['-10%', '110vw'],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
          delay: 5
        }}
      />

      {/* Cloud 3 - Deep blue at bottom - MUCH LARGER */}
      <motion.div
        className="absolute bottom-[-20%] -left-[20%] w-[1400px] h-[700px] bg-[#024F86] rounded-full blur-[160px] opacity-[0.16]"
        animate={{
           x: ['-10%', '110vw'],
        }}
        transition={{
          duration: 80,
          repeat: Infinity,
          ease: "linear",
        }}
      />

       {/* Cloud 4 - Medium Blue accent, faster - LARGER */}
       <motion.div
        className="absolute top-[35%] -left-[30%] w-[800px] h-[500px] bg-[#38B1E4] rounded-full blur-[140px] opacity-25"
        animate={{
          x: ['-20%', '120vw'],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "linear",
          delay: 2
        }}
      />

      {/* Cloud 5 - NEW - Dark Blue drifting mid-high to add contrast */}
      <motion.div
        className="absolute top-[15%] -left-[40%] w-[900px] h-[500px] bg-[#024F86] rounded-full blur-[180px] opacity-[0.12]"
        animate={{
          x: ['-20%', '120vw'],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "linear",
          delay: 8
        }}
      />

      {/* Cloud 6 - NEW - Sky Blue drifting low */}
      <motion.div
        className="absolute bottom-[10%] -left-[35%] w-[1000px] h-[600px] bg-[#38B1E4] rounded-full blur-[160px] opacity-20"
        animate={{
          x: ['-20%', '120vw'],
        }}
        transition={{
          duration: 70,
          repeat: Infinity,
          ease: "linear",
          delay: 12
        }}
      />
      
       {/* Cloud 7 - Another white highlight */}
      <motion.div
        className="absolute top-[60%] -left-[15%] w-[700px] h-[400px] bg-white rounded-full blur-[100px] opacity-90"
        animate={{
          x: ['-20%', '120vw'],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
          delay: 15
        }}
      />
      
      {/* Static/Ambient light to ensure it's not too flat */}
       <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white blur-[150px] opacity-40 rounded-full pointer-events-none" />
    </div>
  );
}
