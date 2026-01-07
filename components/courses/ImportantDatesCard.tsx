"use client";

import React, { useState } from "react";
import { Calendar, Info } from "lucide-react";

export interface ImportantDate {
  id: string;
  title: string;
  start_date: string;
  end_date?: string;
  type: string;
  description?: string;
}

interface ImportantDatesCardProps {
  dates: ImportantDate[];
}

export default function ImportantDatesCard({ dates }: ImportantDatesCardProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // Sort dates by start_date
  const sortedDates = [...dates]
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .filter((date) => {
       const dateObj = new Date(date.start_date);
       const today = new Date();
       return dateObj >= new Date(today.setHours(0, 0, 0, 0));
    })
    .slice(0, 3);

  const formatMonth = (date: Date) => {
    // Capitalize first letter of short month
    const month = date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
    return month.charAt(0).toUpperCase() + month.slice(1);
  };

  const formatDateRange = (start: string, end?: string) => {
    const d1 = new Date(start);
    const d1Str = `${d1.getDate().toString().padStart(2, '0')} ${formatMonth(d1)}`;
    
    if (end) {
        const d2 = new Date(end);
        const d2Str = `${d2.getDate().toString().padStart(2, '0')} ${formatMonth(d2)}`;
        return `${d1Str} - ${d2Str}`;
    }

    return d1Str;
  };
  
  // Year is now largely unused in the requested format "06 Fev", 
  // but if we needed end date support in the future with " - " we could adapt.
  // The request says "exemplo 06 Fev, sem ano".
  
  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const getItemStyles = (index: number) => {
    if (index === 0) {
      return {
        title: "text-[#024F86] font-extrabold text-lg",
        date: "text-[#024F86] font-bold text-sm", // Not specified but keeping bold for 1st per request "data do primeiro texto deve estar em negrito"
        dot: "text-[#024F86]",
        icon: "text-[#024F86]"
      };
    } else if (index === 1) {
      return {
        title: "text-[#024F86] font-bold text-base", // Figma screenshot shows all items blue/dark text actually? 
        // Request: "o segundo e o terceiro devem ser menores e seu texto acompanhar o da bolinha, FF9900 e 9747FF, respectivamente"
        // Wait, "seu texto" probably means the title text color too? 
        // "texto acompanhar o da bolinha" -> Text color matches dot color.
        title: "text-[#FF9900] font-medium text-base",
        date: "text-slate-500 font-medium text-sm", 
        dot: "text-[#FF9900]",
        icon: "text-[#FF9900]"
      };
    } else {
       return {
        title: "text-[#9747FF] font-medium text-base",
        date: "text-slate-500 font-medium text-sm",
        dot: "text-[#9747FF]",
        icon: "text-[#9747FF]"
      };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full border border-slate-100">
      <div className="flex items-center gap-3 mb-6">
         <Calendar className="w-6 h-6 text-[#38B1E4]" />
         <h3 className="text-lg font-bold text-[#024F86]">Fique atento às datas!</h3>
      </div>
      
      <div className="relative flex flex-col gap-6">
        {/* Vertical Line - Centered relative to dots */}
        {/* Icon is w-6 (24px), center is 12px. */}
        {/* Line is 2px. Center at 12px -> left 11px. */}
        <div className="absolute top-2 bottom-2 left-[11px] w-[2px] bg-gray-100" />

        {sortedDates.length === 0 ? (
          <p className="text-slate-500 italic pl-8">Nenhuma data disponível no momento.</p>
        ) : (
          sortedDates.map((date, index) => {
            const styles = getItemStyles(index);
            const isOpen = openId === date.id;

            return (
            <div key={date.id} className="relative z-10 w-full pl-9">
              {/* Dot Wrapper */}
               <div className={`absolute left-[6px] top-1 w-[12px] h-[12px] flex items-center justify-center bg-white`}>
                 <div className={`w-3 h-3 rounded-full bg-current ${styles.dot}`} />
              </div>

              <div className="flex flex-col w-full"> 
                  <div className="flex items-start justify-between w-full cursor-pointer group" onClick={() => toggleAccordion(date.id)}>
                      <div className="flex items-center gap-2">
                        <span className={`${styles.title} leading-tight`}>
                            {date.title}
                        </span>
                         {date.description && (
                            <Info className={`w-4 h-4 ${styles.icon} opacity-60 hover:opacity-100 transition-opacity`} />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`${styles.date} whitespace-nowrap`}>
                            {formatDateRange(date.start_date, date.end_date)}
                        </span>
                      </div>
                  </div>

                  {/* Accordion Content */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
                  >
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {date.description}
                      </p>
                  </div>
              </div>
            </div>
          )
          })
        )}
      </div>
    </div>
  );
}
