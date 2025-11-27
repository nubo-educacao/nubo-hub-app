import { OpportunityWithInstitution } from './database.types';

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
  scholarship_type: string;
  shift: string;
  course_name: string;
  city: string;
  state: string;
}

/**
 * Mapeia dados do Supabase (OpportunityWithInstitution) para o formato esperado pela UI (Opportunity)
 */
export function mapToOpportunity(data: OpportunityWithInstitution): Opportunity {
  // Mapear scholarship_type para o campo 'type' da UI
  let type: 'Pública' | 'Privada' | 'Parceiro';
  if (data.scholarship_type?.toLowerCase().includes('integral')) {
    type = 'Pública';
  } else if (data.scholarship_type?.toLowerCase().includes('parcial')) {
    type = 'Privada';
  } else {
    type = 'Parceiro';
  }

  return {
    id: data.id,
    title: data.course_name,
    institution: data.institutions?.name || 'Instituição não informada',
    location: `${data.city}, ${data.state}`,
    type,
    modality: data.shift,
    cutoff_score: data.cutoff_score,
    scholarship_type: data.scholarship_type,
    shift: data.shift,
    course_name: data.course_name,
    city: data.city,
    state: data.state,
  };
}
