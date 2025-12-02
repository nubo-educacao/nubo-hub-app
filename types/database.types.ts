// Tipos TypeScript gerados a partir do schema do Supabase

export interface Institution {
  id: string;
  name: string;
  external_code: string;
}

export interface Campus {
  id: string;
  institution_id: string;
  name: string;
  external_code: string;
  city: string;
  state: string;
  institutions?: Institution;
}

export interface Course {
  id: string;
  campus_id: string;
  course_name: string;
  course_code: string;
  vacancies: {
    scholarship_type: string;
    broad_competition_offered: number;
    quotas_offered: number;
  }[];
  campus?: Campus;
}

export interface OpportunityRow {
  id: string;
  course_id: string;
  semester: string;
  shift: string;
  scholarship_type: string;
  cutoff_score: number | null;
  opportunity_type: string | null;
}

export interface OpportunityWithRelations extends OpportunityRow {
  courses: Course;
}
