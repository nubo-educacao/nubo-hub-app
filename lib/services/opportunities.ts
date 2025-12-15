import { supabase } from '../supabaseClient';
import { CourseWithRelations } from '../../types/database.types';
import { CourseDisplayData, mapToCourseDisplayData } from '../../types/opportunity';

export interface FetchCoursesResult {
  data: CourseDisplayData[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error: string | null;
}

/**
 * Busca cursos do Supabase com suas oportunidades, com paginação
 * @param page Página atual (0-indexed)
 * @param limit Número de itens por página
 * @returns Objeto com dados mapeados, metadados de paginação e possível erro
 */
export async function fetchCoursesWithOpportunities(
  page: number = 0,
  limit: number = 15
): Promise<FetchCoursesResult> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    console.log(`[FetchCourses] Starting fetch (RPC) for page ${page} limit ${limit}`);
    console.time('fetchCourses');

    // Call the RPC function
    const { data, error } = await supabase.rpc('get_courses_with_opportunities', {
      page_number: page, 
      page_size: limit
    });

    if (error) {
      console.timeEnd('fetchCourses');
      console.error('[FetchCourses] Supabase RPC Error:', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        error: error.message,
      };
    }

    console.log(`[FetchCourses] Success. Got ${data?.length} rows.`);
    console.timeEnd('fetchCourses');

    // Map RPC result to UI format
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mappedData: CourseDisplayData[] = (data as any[]).map(item => {
        // Map opportunities from JSON
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opportunities = (item.opportunities || []).map((opp: any) => {
            let type: 'Pública' | 'Privada' | 'Parceiro';
            if (opp.scholarship_type?.toLowerCase().includes('integral') || opp.opportunity_type === 'sisu') {
                type = 'Pública';
            } else if (opp.scholarship_type?.toLowerCase().includes('parcial')) {
                type = 'Privada';
            } else {
                type = 'Parceiro';
            }

            return {
                id: opp.id,
                shift: opp.shift,
                opportunity_type: opp.opportunity_type,
                scholarship_type: opp.scholarship_type,
                cutoff_score: opp.cutoff_score,
                type
            };
        });

        const scores = opportunities.map((o: any) => o.cutoff_score).filter((s: any): s is number => typeof s === 'number');
        const min_cutoff_score = scores.length > 0 ? Math.min(...scores) : null;

        return {
            id: item.id,
            title: item.course_name || 'Curso não informado',
            institution: item.institution_name || 'Instituição não informada',
            location: `${item.city || 'Cidade não informada'}, ${item.state || 'UF'}`,
            city: item.city,
            state: item.state,
            opportunities,
            min_cutoff_score
        };
    });

    // Simple hasMore check
    const hasMore = mappedData.length === limit;
    
    // Total is hard to get exactly without a consolidated query, using a placeholder or separate count if critical
    // For infinite scroll, hasMore is usually enough
    const total = hasMore ? (page + 1) * limit + 1 : (page * limit) + mappedData.length;

    return {
      data: mappedData,
      total,
      page,
      limit,
      hasMore,
      error: null,
    };
  } catch (err) {
    console.timeEnd('fetchCourses');
    console.error('[FetchCourses] Unexpected Error:', err);
    return {
      data: [],
      total: 0,
      page,
      limit,
      hasMore: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}
