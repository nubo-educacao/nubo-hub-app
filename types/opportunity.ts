import { OpportunityWithRelations } from './database.types';

export interface Opportunity {
  id: string;
  title: string;
  institution: string;
  location: string;
  type: 'Pública' | 'Privada' | 'Parceiro';
  modality: string;
  imageUrl?: string;
  // Campos adicionais do banco
  cutoff_score: number | null;
  opportunity_type: string | null;
  scholarship_type: string;
  shift: string;
  course_name: string;
  vacancies?: {
    scholarship_type: string;
    broad_competition_offered: number;
    quotas_offered: number;
  }[];
}

/**
 * Mapeia dados do Supabase (OpportunityWithRelations) para o formato esperado pela UI (Opportunity)
 */
export function mapToOpportunity(data: OpportunityWithRelations): Opportunity {
  // Mapear scholarship_type para o campo 'type' da UI
  let type: 'Pública' | 'Privada' | 'Parceiro';
  if (data.scholarship_type?.toLowerCase().includes('integral')) {
    type = 'Pública';
  } else if (data.scholarship_type?.toLowerCase().includes('parcial')) {
    type = 'Privada';
  } else {
    type = 'Parceiro';
  }

  const course = data.courses;
  const campus = course?.campus;
  const institution = campus?.institutions;
  
  const city = campus?.city || 'Cidade não informada';
  const state = campus?.state || 'UF';

  return {
    id: data.id,
    title: course?.course_name || 'Curso não informado',
    institution: institution?.name || 'Instituição não informada',
    location: `${city}, ${state}`,
    type,
    modality: data.shift,
    cutoff_score: data.cutoff_score,
    scholarship_type: data.scholarship_type,
    shift: data.shift,
    course_name: course?.course_name || 'Curso não informado',
    vacancies: course?.vacancies,
    opportunity_type: data.opportunity_type || null,
  };
}
