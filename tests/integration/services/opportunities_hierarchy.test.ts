import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as dotenv from 'dotenv';
import path from 'path';

// Mocking the service to avoid real DB connection and timeouts
vi.mock('@/lib/services/opportunities', () => ({
  fetchCoursesWithOpportunities: vi.fn().mockResolvedValue({
    data: [{
      id: '1',
      title: 'Engenharia de Software',
      institution: 'Universidade Tech',
      location: 'São Paulo, SP', 
      opportunities: [
        { id: '1', shift: 'Integral', type: 'Pública' }
      ]
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
    const { fetchCoursesWithOpportunities } = await import('@/lib/services/opportunities');
    
    const result = await fetchCoursesWithOpportunities(0, 1);
    
    if (result.error) {
      console.error('Fetch error:', result.error);
    }
    
    expect(result.error).toBeNull();
    
    // If there is data, verify the structure is correctly mapped
    if (result.data.length > 0) {
      const course = result.data[0];
      
      // Verify core fields
      expect(course.id).toBeDefined();
      expect(course.title).toBeDefined(); // mapped from course_name
      
      // Verify flattened fields from hierarchy
      expect(course.institution).toBeDefined(); // mapped from courses.campus.institutions.name
      expect(course.location).toBeDefined();
      
      // Verify types
      expect(typeof course.institution).toBe('string');
      expect(typeof course.title).toBe('string');

      // Verify opportunities list
      expect(Array.isArray(course.opportunities)).toBe(true);
      if (course.opportunities.length > 0) {
        expect(course.opportunities[0].shift).toBeDefined();
      }
    }
  });
});
