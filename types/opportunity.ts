import { CourseWithRelations } from './database.types';

export interface OpportunityDisplay {
  id: string;
  shift: string;
  opportunity_type: string | null; // e.g., 'sisu', 'prouni'
  scholarship_type: string; // e.g., 'Integral', 'Parcial'
  concurrency_tags?: string[]; // New field
  cutoff_score: number | null;
  type: 'Pública' | 'Privada' | 'Parceiro'; // Derived from scholarship_type/opportunity_type
}

export interface CourseDisplayData {
  id: string;
  title: string;
  institution: string;
  location: string;
  city: string,
  state: string,
  opportunities: OpportunityDisplay[];
  // Aggregate fields for filtering/sorting if needed
  min_cutoff_score?: number | null;
}

/**
 * Mapeia dados do Supabase (CourseWithRelations) para o formato esperado pela UI (CourseDisplayData)
 */
export function mapToCourseDisplayData(data: CourseWithRelations): CourseDisplayData {
  const campus = data.campus;
  const institution = campus?.institutions;
  
  const city = campus?.city || 'Cidade não informada';
  const state = campus?.state || 'UF';

  const opportunities = (data.opportunities || []).map(opp => {
    let type: 'Pública' | 'Privada' | 'Parceiro';
    if (opp.scholarship_type?.toLowerCase().includes('integral') || opp.opportunity_type === 'sisu') { // Simple heuristic, can be refined
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
      concurrency_tags: opp.concurrency_tags, // Add this
      cutoff_score: opp.cutoff_score,
      type
    };
  });

  const scores = opportunities.map(o => o.cutoff_score).filter((s): s is number => s !== null);
  const min_cutoff_score = scores.length > 0 ? Math.min(...scores) : null;

  return {
    id: data.id,
    title: data.course_name || 'Curso não informado',
    institution: institution?.name || 'Instituição não informada',
    location: `${city}, ${state}`,
    city,
    state,
    opportunities,
    min_cutoff_score
  };
}
