// Tipos TypeScript gerados a partir do schema do Supabase

export interface Institution {
  id: string;
  name: string;
  external_code: string;
  created_at?: string;
}

export interface OpportunityRow {
  id: string;
  institution_id: string;
  course_name: string;
  shift: string; // Turno: Integral, Noturno, etc.
  scholarship_type: string; // Tipo de Bolsa: Integral/Parcial
  city: string;
  state: string;
  cutoff_score: number | null; // Nota de Corte
  created_at?: string;
}

// Tipo que representa o resultado de um JOIN entre opportunities e institutions
export interface OpportunityWithInstitution extends OpportunityRow {
  institutions: Institution | null;
}
