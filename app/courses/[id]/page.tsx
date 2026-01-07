import React from 'react';
import { Montserrat } from 'next/font/google';
import CloudBackground from '@/components/CloudBackground';
import Header from '@/components/Header';
import { getCourseDetails, getImportantDates } from '@/lib/services/opportunities';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SisuProuniCard from '@/components/courses/SisuProuniCard';
import ImportantDatesCard from '@/components/courses/ImportantDatesCard';
import InstitutionDetailsCard from '@/components/courses/InstitutionDetailsCard';
import OpportunitiesListCard from '@/components/courses/OpportunitiesListCard';
import BackButton from '@/components/BackButton';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetails({ params }: PageProps) {
  const { id } = await params;
  const course = await getCourseDetails(id);

  if (!course) {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center overflow-x-hidden bg-[#F0F8FF]">
            <CloudBackground />
            <Header />
            <div className="z-10 flex-1 flex items-center justify-center w-full px-4">
                <div className="bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-xl">
                     <h1 className={`${montserrat.className} text-2xl font-bold text-[#024F86]`}>Curso não encontrado</h1>
                     <p className="text-[#3A424E]">Não foi possível localizar os detalhes deste curso.</p>
                     <Link href="/" className="px-6 py-2 bg-[#38B1E4] text-white rounded-full font-semibold hover:bg-[#2da0d1] transition-colors">
                        Voltar para o início
                     </Link>
                </div>
            </div>
        </div>
    )
  }

  // Determine primary opportunity type (sisu or prouni)
  // Default to sisu if not specified or mixed, can be refined.
  const primaryType = course.opportunities.length > 0 && course.opportunities[0].opportunity_type 
    ? course.opportunities[0].opportunity_type 
    : 'sisu';

  // Fetch important dates based on type
  const importantDates = await getImportantDates(primaryType);

  // Prepare institution data for card
  const institutionData = {
    name: course.campus.institution.name,
    acronym: course.campus.institution.sisu?.acronym || undefined,
    igc: course.campus.institution.emec?.igc || undefined,
    ci: course.campus.institution.emec?.ci || undefined,
    ci_ead: course.campus.institution.emec?.ci_ead || undefined,
    site: course.campus.institution.emec?.site || undefined,
    phone: course.campus.institution.emec?.phone || undefined,
    email: course.campus.institution.emec?.email || undefined
  };

  const courseData = {
    name: course.course_name
  };

  const campusData = {
    name: course.campus.name,
    city: course.campus.city,
    state: course.campus.state
  };

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center overflow-x-hidden bg-[#F0F8FF] ${montserrat.className}`}>
      {/* Background Layer */}
      <CloudBackground />

      {/* Header */}
      <Header />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1200px] px-4 py-8 md:py-12 flex flex-col gap-6 mt-16 md:mt-20">
        
        {/* Glass Container */}
        <div className="w-full bg-white/30 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.07)] rounded-3xl p-6 md:p-10 flex flex-col gap-8">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[#024F86]/10 pb-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#024F86] leading-tight">
                        {course.course_name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-[#3A424E]/80 text-lg font-medium">
                        <span>{course.campus.institution.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38B1E4]"></span>
                        <span>{course.campus.name}</span>
                    </div>
                </div>
                
                {/* Back Button */}
<BackButton />
            </div>

            {/* Content Cards Grid */}
            {/* Content Cards Grid */}
            {/* Content Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <SisuProuniCard opportunity_type={primaryType} />
                 <ImportantDatesCard dates={importantDates} />
                 <div className="md:col-span-2">
                    <InstitutionDetailsCard institution={institutionData} course={courseData} campus={campusData} />
                 </div>
                 <div className="md:col-span-2">
                      <OpportunitiesListCard opportunities={course.opportunities} />
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
}
