import { describe, it, expect } from 'vitest';
import { mapToCourseDisplayData } from '../../types/opportunity';
import { CourseWithRelations } from '@/types/database.types';

describe('mapToCourseDisplayData', () => {
  it('should correctly map nested data to UI model', () => {
    const rawData: CourseWithRelations = {
      id: 'course-1',
      campus_id: 'camp-1',
      course_name: 'Engenharia de Software',
      course_code: 'ENG001',
      vacancies: [],
      campus: {
        id: 'camp-1',
        institution_id: 'inst-1',
        name: 'Campus Central',
        city: 'São Paulo',
        state: 'SP',
        external_code: 'CAMP001',
        institutions: {
          id: 'inst-1',
          name: 'Universidade Tech',
          external_code: 'TECH001'
        }
      },
      opportunities: [
        {
          id: 'opp-1',
          course_id: 'course-1',
          semester: '2024.1',
          shift: 'Integral',
          scholarship_type: 'Integral',
          opportunity_type: 'sisu',
          cutoff_score: 750.5
        },
        {
            id: 'opp-2',
            course_id: 'course-1',
            semester: '2024.1',
            shift: 'Noturno',
            scholarship_type: 'Parcial',
            opportunity_type: null,
            cutoff_score: null
        }
      ]
    };

    const result = mapToCourseDisplayData(rawData);
    // console.log('Mapper Result:', JSON.stringify(result, null, 2));

    expect(result.id).toBe('course-1');
    expect(result.title).toBe('Engenharia de Software');
    expect(result.institution).toBe('Universidade Tech');
    expect(result.location).toBe('São Paulo, SP');
    expect(result.opportunities).toHaveLength(2);
    
    // Check first opportunity (should be Publica because of Integral/Sisu)
    expect(result.opportunities[0].type).toBe('Pública');
    expect(result.opportunities[0].cutoff_score).toBe(750.5);

    // Check second opportunity (should be Privada because of Parcial)
    expect(result.opportunities[1].type).toBe('Privada');
    
    // Check aggregate
    expect(result.min_cutoff_score).toBe(750.5);
  });

  it('should handle missing relations gracefully', () => {
    const rawData: any = {
      id: 'course-2',
      course_name: 'Curso Sem Campus',
      // Missing campus and opportunities
    };

    const result = mapToCourseDisplayData(rawData);

    expect(result.title).toBe('Curso Sem Campus');
    expect(result.institution).toBe('Instituição não informada');
    expect(result.location).toBe('Cidade não informada, UF');
    expect(result.opportunities).toEqual([]);
    expect(result.min_cutoff_score).toBeNull();
  });
});
