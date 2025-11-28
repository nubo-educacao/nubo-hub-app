import { supabase } from '../supabaseClient';
import { OpportunityWithRelations } from '../../types/database.types';
import { Opportunity, mapToOpportunity } from '../../types/opportunity';

export interface FetchOpportunitiesResult {
  data: Opportunity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  error: string | null;
}

/**
 * Busca oportunidades do Supabase com paginação
 * @param page Página atual (0-indexed)
 * @param limit Número de itens por página
 * @returns Objeto com dados, metadados de paginação e possível erro
 */
export async function fetchOpportunities(
  page: number = 0,
  limit: number = 20
): Promise<FetchOpportunitiesResult> {
  try {
    const from = page * limit;
    const to = from + limit - 1;

    // Buscar contagem total
    const { count, error: countError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Erro ao buscar contagem:', countError);
      return {
        data: [],
        total: 0,
        page,
        limit,
        hasMore: false,
        error: countError.message,
      };
    }

    // Buscar dados com join
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        courses (
          id,
          course_name,
          course_code,
          vacancies,
          campus (
            id,
            name,
            external_code,
            city,
            state,
            institutions (
              id,
              name,
              external_code
            )
          )
        )
      `)
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar oportunidades:', error);
      return {
        data: [],
        total: count || 0,
        page,
        limit,
        hasMore: false,
        error: error.message,
      };
    }

    // Mapear dados do banco para formato da UI
    // Cast para unknown primeiro pois o tipo retornado pelo Supabase pode não inferir a profundidade corretamente sem os Generics completos
    const mappedData = (data as unknown as OpportunityWithRelations[]).map(mapToOpportunity);

    const total = count || 0;
    const hasMore = to < total - 1;

    return {
      data: mappedData,
      total,
      page,
      limit,
      hasMore,
      error: null,
    };
  } catch (err) {
    console.error('Erro inesperado ao buscar oportunidades:', err);
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
