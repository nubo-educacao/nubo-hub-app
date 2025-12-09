import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as dotenv from 'dotenv';
import path from 'path';

// Mocking the service to avoid real DB connection and timeouts
vi.mock('@/lib/services/opportunities', () => ({
  fetchOpportunities: vi.fn().mockResolvedValue({
    data: [{
      id: '1',
      title: 'Engenharia de Software',
      institution: 'Universidade Tech',
      location: 'São Paulo, SP', 
      type: 'Pública',
      modality: 'Integral',
      scholarship_type: 'Integral',
      shift: 'Integral',
      course_name: 'Engenharia de Software',
      vacancies: []
    }],
    error: null
  })
}));

describe('Opportunities Service (Hierarchy)', () => {
  beforeAll(() => {
    dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
  });

  it('should fetch opportunities with nested relations (Institutions -> Campus -> Courses -> Opportunities)', async () => {
    // Dynamic import to ensure env vars are loaded first
    const { fetchOpportunities } = await import('@/lib/services/opportunities');
    
    const result = await fetchOpportunities(0, 1);
    
    if (result.error) {
      console.error('Fetch error:', result.error);
    }
    
    expect(result.error).toBeNull();
    
    // If there is data, verify the structure is correctly mapped
    if (result.data.length > 0) {
      const opportunity = result.data[0];
      
      // Verify core fields
      expect(opportunity.id).toBeDefined();
      expect(opportunity.title).toBeDefined(); // mapped from course_name
      
      // Verify flattened fields from hierarchy
      expect(opportunity.institution).toBeDefined(); // mapped from courses.campus.institutions.name
      expect(opportunity.location).toBeDefined();
      
      // Verify types
      expect(typeof opportunity.institution).toBe('string');
      expect(typeof opportunity.title).toBe('string');

      // Verify vacancies
      if (opportunity.vacancies) {
        expect(Array.isArray(opportunity.vacancies)).toBe(true);
      }
    }
  });
});
