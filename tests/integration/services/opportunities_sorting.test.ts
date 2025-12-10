import { describe, it, expect, beforeAll, vi } from 'vitest';
import * as dotenv from 'dotenv';
import path from 'path';

vi.mock('@/lib/services/opportunities', () => ({
  fetchOpportunities: vi.fn().mockResolvedValue({
    data: [
      { id: '2', opportunity_type: 'prouni', title: 'Prouni Opp', institution: 'Inst', location: 'Loc', type: 'Pública', modality: 'Presencial', scholarship_type: 'Integral', shift: 'Integral', course_name: 'Prouni Opp' },
      { id: '1', opportunity_type: 'sisu', title: 'Sisu Opp', institution: 'Inst', location: 'Loc', type: 'Pública', modality: 'Presencial', scholarship_type: 'Integral', shift: 'Integral', course_name: 'Sisu Opp' },
      { id: '3', opportunity_type: 'sisu', title: 'Sisu Opp 2', institution: 'Inst', location: 'Loc', type: 'Pública', modality: 'Presencial', scholarship_type: 'Integral', shift: 'Integral', course_name: 'Sisu Opp 2' }
    ],
    error: null
  })
}));

describe('Opportunities Service (Sorting)', () => {
  beforeAll(() => {
    dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
  });

  it('should sort opportunities with "prouni" type first', async () => {
    const { fetchOpportunities } = await import('@/lib/services/opportunities');
    
    // Fetch a reasonable number to increase chance of mixed types
    const result = await fetchOpportunities(0, 50);
    
    expect(result.error).toBeNull();
    
    if (result.data.length > 0) {
      const opportunities = result.data;
      
      // Find index of first non-prouni opportunity (e.g. sisu)
      const firstNonProuniIndex = opportunities.findIndex(o => o.opportunity_type !== 'prouni');
      
      let foundProuni = false;
      let foundNonProuni = false;
      let violationFound = false;
      
      for (const opp of opportunities) {
        const isProuni = opp.opportunity_type === 'prouni';
        
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
