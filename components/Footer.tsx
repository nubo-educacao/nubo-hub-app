'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#024F86] text-white py-12 px-6 font-montserrat mt-auto z-20 relative">
      <div className="container mx-auto max-w-[1200px] flex flex-col gap-8">
        
        {/* Top Section: Logo and Socials */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            {/* Logo - Using the specified path. Assuming white/transparent logo is needed for dark bg. 
                If the provided logo is dark-only, it might clash, but I'll use what was requested. 
                Ideally, we'd use a white version if available. For now, using standard class to ensure visibility if transparent. */}
            <div className="relative h-10 w-40 md:h-12 md:w-48">
               <Image 
                 src="/assets/logo.png" 
                 alt="Nubo Educação" 
                 fill
                 className="object-contain brightness-0 invert" // Initial attempt to make it white if it's black text, or just leave as is if it's colorful. 
                 // Actually, usually 'logo.png' is the colored one. Nubo uses blue/dark blue. 
                 // On #024F86 bg, blue logo might be hard to see. 
                 // I will try 'brightness-0 invert' to force it white which is common for dark footers.
                 // If the user wants the original colors, they can ask to revert.
               />
            </div>
          </div>
          
          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://www.instagram.com/cursinhonubo/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={24} color="white" strokeWidth={1.5} />
            </a>
            <a 
              href="https://www.linkedin.com/company/nuboeducacao" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={24} color="white" fill="white" strokeWidth={0} /> {/* Fill for linkedin usually looks better, or stroke. Lucide uses stroke by default. I'll use standard stroke to match style. */}
            </a>
          </div>
        </div>

        <div className="h-px w-full bg-white/20" />

        {/* Middle Section: Disclaimer */}
        <div className="text-[10px] md:text-xs font-light opacity-90 leading-relaxed text-center md:text-left">
          <p>
            A Cloudinha é uma ferramenta de orientação. Não é um cursinho, não promete aprovação, não faz inscrições no lugar do estudante e não decide por ele. Ela apoia decisões, não substitui escolhas.
          </p>
        </div>

        {/* Bottom Section: Copyright and Links */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs md:text-sm font-medium opacity-75">
          <p>© 2026 Nubo Educação. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <Link href="/assets/politica-de-privacidade.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-[#38B1E4] transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/assets/termos-de-uso.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-[#38B1E4] transition-colors">
              Termos de uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
