import { describe, it, expect } from 'vitest';
import { mapToOpportunity } from '@/types/opportunity';
import { OpportunityWithInstitution } from '@/types/database.types';

describe('mapToOpportunity', () => {
  it('should correctly map nested data to flat UI model', () => {
    const rawData: OpportunityWithInstitution = {
      id: '1',
      institution_id: 'inst-1',
      campus_id: 'camp-1',
      course_id: 'course-1',
      semester: '2024.1',
      shift: 'Integral',
      scholarship_type: 'Integral',
      city: 'São Paulo',
      state: 'SP',
      cutoff_score: 750.5,
      institutions: {
        id: 'inst-1',
        name: 'Universidade Tech',
        external_code: 'TECH001'
      },
      courses: {
        id: 'course-1',
        course_name: 'Engenharia de Software',
        course_code: 'ENG001',
        vacancies: []
      },
      campus: {
        id: 'camp-1',
        name: 'Campus Central',
        code: 'CAMP001'
      }
    };

    const result = mapToOpportunity(rawData);

    expect(result.title).toBe('Engenharia de Software');
    expect(result.institution).toBe('Universidade Tech');
    expect(result.course_name).toBe('Engenharia de Software');
    expect(result.type).toBe('Pública'); // Integral -> Pública
  });

  it('should handle missing relations gracefully', () => {
    const rawData: any = {
      id: '1',
      scholarship_type: 'Integral',
      shift: 'Integral',
      city: 'São Paulo',
      state: 'SP',
      // Missing relations
    };

    const result = mapToOpportunity(rawData);

    expect(result.title).toBe('Curso não informado');
    expect(result.institution).toBe('Instituição não informada');
  });
});
