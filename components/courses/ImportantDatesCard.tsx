"use client";

import React from "react";
import { Calendar } from "lucide-react";

export interface ImportantDate {
  id: string;
  title: string;
  start_date: string;
  end_date?: string;
  type: string;
}

interface ImportantDatesCardProps {
  dates: ImportantDate[];
}

export default function ImportantDatesCard({ dates }: ImportantDatesCardProps) {
  // Sort dates by start_date
  const sortedDates = [...dates].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const isUpcoming = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    // Check if date is in the future or today
    return date >= new Date(today.setHours(0, 0, 0, 0));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-full border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
           <Calendar className="w-5 h-5 text-[#024F86]" />
        </div>
        <h3 className="text-xl font-bold text-[#024F86]">Fique atento às datas</h3>
      </div>
      
      <div className="flex flex-col gap-3 mt-2">
        {sortedDates.length === 0 ? (
          <p className="text-slate-500 italic">Nenhuma data disponível no momento.</p>
        ) : (
          sortedDates.map((date) => {
            const upcoming = isUpcoming(date.start_date);
            return (
              <div
                key={date.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  upcoming
                    ? "bg-blue-50/50 border-blue-100"
                    : "bg-gray-50 border-gray-100 opacity-60"
                }`}
              >
                <span className={`font-medium ${upcoming ? "text-slate-900" : "text-slate-500"}`}>
                  {date.title}
                </span>
                <span className={`font-semibold ${upcoming ? "text-[#024F86]" : "text-slate-400"}`}>
                  {formatDate(date.start_date)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
