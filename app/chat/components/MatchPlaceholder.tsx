import React from 'react';
import { Sparkles } from 'lucide-react';

export default function MatchPlaceholder() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-6 shadow-sm border border-[#DBEAFE]">
                <Sparkles size={40} className="text-[#38B1E4]" strokeWidth={1.5} />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-bold text-[#024F86] mb-3">
                Vamos encontrar sua vaga?
            </h3>
            
            <p className="text-[#636E7C] text-lg max-w-md leading-relaxed">
                Informe suas preferências no chat ou edite seu perfil para que possamos mostrar as melhores oportunidades para você.
            </p>
        </div>
    );
}
