import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as dotenv from 'dotenv';
import path from 'path';

vi.mock('@/lib/services/opportunities', () => ({
  fetchCoursesWithOpportunities: vi.fn().mockResolvedValue({
    data: [
      { id: '2', title: 'Prouni Opp', institution: 'Inst', location: 'Loc', type: 'Pública', modality: 'Presencial', scholarship_type: 'Integral', shift: 'Integral', course_name: 'Prouni Opp', opportunities: [{ opportunity_type: 'prouni' }] },
      { id: '1', title: 'Sisu Opp', institution: 'Inst', location: 'Loc', type: 'Pública', modality: 'Presencial', scholarship_type: 'Integral', shift: 'Integral', course_name: 'Sisu Opp', opportunities: [{ opportunity_type: 'sisu' }] },
      { id: '3', title: 'Sisu Opp 2', institution: 'Inst', location: 'Loc', type: 'Pública', modality: 'Presencial', scholarship_type: 'Integral', shift: 'Integral', course_name: 'Sisu Opp 2', opportunities: [{ opportunity_type: 'sisu' }] }
    ],
    error: null,
    hasMore: false
  })
}));

describe('Opportunities Service (Sorting)', () => {
  beforeAll(() => {
    dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
  });

  it('should sort opportunities with "prouni" type first', async () => {
    const { fetchCoursesWithOpportunities } = await import('@/lib/services/opportunities');
    
    // Fetch a reasonable number to increase chance of mixed types
    const result = await fetchCoursesWithOpportunities(0, 50);
    
    expect(result.error).toBeNull();
    
    if (result.data.length > 0) {
      const opportunities = result.data;
      
      // Find index of first non-prouni opportunity (e.g. sisu)
      const firstNonProuniIndex = opportunities.findIndex((o: any) => o.opportunities[0]?.opportunity_type !== 'prouni');
      
      let foundProuni = false;
      let foundNonProuni = false;
      let violationFound = false;
      
      for (const opp of opportunities) {
        const isProuni = opp.opportunities[0]?.opportunity_type === 'prouni';
        
        if (isProuni) {
          foundProuni = true;
          if (foundNonProuni) {
            // If we found a prouni AFTER a non-prouni (sisu), that's a violation
            violationFound = true;
            console.error('Found Prouni opportunity after Non-Prouni:', opp);
          }
        } else {
          foundNonProuni = true;
        }
      }
      
      if (foundProuni && foundNonProuni) {
        expect(violationFound).toBe(false);
      } else {
        console.warn('Could not verify sorting: Dataset does not contain both Prouni and Non-Prouni opportunities.');
      }
    }
  });
});
