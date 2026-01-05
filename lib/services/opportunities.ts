import { supabase } from '@/lib/supabaseClient'; 
import { CourseDisplayData } from '@/types/opportunity';

export interface CourseDetail {
  course_code: string;
  course_name: string;
  vacancies: number;
  opportunities: {
    id: string;
    semester: string;
    shift: string;
    scholarship_type: string; // 'Integral', etc.
    cutoff_score: number | null;
    opportunity_type: string;
  }[];
  campus: {
    name: string;
    city: string; // 'São Paulo'
    state: string; // 'SP'
    region: string;
    institution: {
      id: string;
      name: string;
      external_code: string;
      emec: {
        phone: string;
        site: string;
        email: string;
        academic_organization: string;
        credentialing: string; // mapped from credentialing_type
        administrative_category: string;
        creation_date: string;
        ci: number;
        ci_ead: number;
        igc: number;
      } | null;
      sisu: {
        acronym: string;
        academic_organization?: string;
        administrative_category?: string;
      } | null;
    };
  };
}

export async function getImportantDates(type: string = 'general') {
  const { data, error } = await supabase
    .from('important_dates')
    .select('*')
    .or(`type.eq.${type},type.eq.general`)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching important dates:', error);
    return [];
  }

  return data || [];
}

export async function getCourseDetails(courseId: string): Promise<CourseDetail | null> {
  const { data, error } = await supabase
    .from('courses')
    .select(`
      course_code,
      course_name,
      vacancies,
      opportunities (
        id,
        semester,
        shift,
        scholarship_type,
        cutoff_score,
        opportunity_type
      ),
      campus:campus_id (
        name,
        city,
        state,
        region,
        institutions:institution_id (
          id,
          name,
          external_code,
          institutionsinfoemec (
            phone,
            site,
            email,
            academic_organization,
            credentialing_type,
            administrative_category,
            creation_date,
            ci,
            ci_ead,
            igc
          ),
          institutionsinfosisu (
            acronym,
            academic_organization,
            administrative_category
          )
        )
      )
    `)
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course details:', error);
    return null;
  }

  if (!data) return null;
  
  const campusData = data.campus as any;
  const institutionData = campusData?.institutions;
  const emecData = institutionData?.institutionsinfoemec?.[0] || null;
  const sisuData = institutionData?.institutionsinfosisu?.[0] || null;

  return {
    course_code: data.course_code,
    course_name: data.course_name,
    vacancies: data.vacancies,
    opportunities: data.opportunities as any[],
    campus: {
      name: campusData.name,
      city: campusData.city,
      state: campusData.state,
      region: campusData.region,
      institution: {
        id: institutionData.id,
        name: institutionData.name,
        external_code: institutionData.external_code,
        emec: emecData ? {
            phone: emecData.phone,
            site: emecData.site,
            email: emecData.email,
            academic_organization: emecData.academic_organization,
            credentialing: emecData.credentialing_type,
            administrative_category: emecData.administrative_category,
            creation_date: emecData.creation_date,
            ci: emecData.ci,
            ci_ead: emecData.ci_ead,
            igc: emecData.igc,
        } : null,
        sisu: sisuData ? {
            acronym: sisuData.acronym,
            academic_organization: sisuData.academic_organization,
            administrative_category: sisuData.administrative_category,
        } : null
      }
    }
  };
}

export async function fetchCoursesWithOpportunities(page: number, limit: number) {
  const { data, error } = await supabase.rpc('get_courses_with_opportunities', {
    page_number: page,
    page_size: limit,
  });

  if (error) {
    console.error('Error fetching courses:', error);
    return { data: [], error: error.message, hasMore: false };
  }

  // Check if we have more pages (if we received full page size)
  const hasMore = (data?.length || 0) === limit;

  return { 
    data: (data as CourseDisplayData[]) || [], 
    error: null, 
    hasMore 
  };
}
