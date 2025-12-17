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

/**
 * Busca oportunidades agrupadas por cursos específicos via course_id
 */
export async function fetchOpportunitiesByCourseIds(courseIds: string[]): Promise<CourseDisplayData[]> {
  if (!courseIds || courseIds.length === 0) return [];

  const { data, error } = await supabase
    .from('opportunities_view')
    .select('*')
    .in('course_id', courseIds);

  if (error) {
    console.error('[fetchOpportunitiesByCourseIds] Error:', error);
    return [];
  }

  // Agrupar por chave única de curso (Instituição + Cidade + Curso + ID do curso)
  const grouped = new Map<string, CourseDisplayData>();

  data.forEach((row: any) => {
    // Chave para agrupar - usando course_id que é o mais seguro agora
    const key = row.course_id;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: row.course_id,
        title: row.course,
        institution: row.institution,
        location: `${row.city}, ${row.state || 'UF'}`,
        city: row.city,
        state: row.state,
        opportunities: [],
        min_cutoff_score: null
      });
    }

    const courseGroup = grouped.get(key)!;

    // Mapear oportunidade
    let type: 'Pública' | 'Privada' | 'Parceiro';
    if (row.scholarship_type?.toLowerCase().includes('integral') || row.opportunity_type === 'sisu' || row.type === 'Sisu' || row.type === 'Prouni') {
        type = 'Pública';
    } else if (row.scholarship_type?.toLowerCase().includes('parcial')) {
        type = 'Privada';
    } else {
        type = 'Parceiro';
    }

    courseGroup.opportunities.push({
        id: row.opportunity_id || row.id, // Fallback if alias not present (but should be per view)
        shift: row.shift,
        opportunity_type: row.opportunity_type || row.type, // Fallback
        scholarship_type: row.scholarship_type,
        cutoff_score: row.cutoff_score,
        type
    });
  });

  // Calcular min_score e converter para array
  return Array.from(grouped.values()).map(course => {
      const scores = course.opportunities
          .map(o => o.cutoff_score)
          .filter((s): s is number => typeof s === 'number' && s > 0);
      
      course.min_cutoff_score = scores.length > 0 ? Math.min(...scores) : null;
      return course;
  });
}
