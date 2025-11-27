import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpportunityCard from '@/components/OpportunityCard';
import { Opportunity } from '@/types/opportunity';

const mockOpportunity: Opportunity = {
  id: '1',
  title: 'Engenharia de Software',
  institution: 'Universidade Tech',
  location: 'São Paulo, SP',
  type: 'Pública',
  modality: 'Presencial',
  cutoff_score: 750,
  scholarship_type: 'Integral',
  shift: 'Integral',
  course_name: 'Engenharia de Software',
  city: 'São Paulo',
  state: 'SP'
};

describe('OpportunityCard', () => {
  it('renders opportunity details correctly', () => {
    render(<OpportunityCard opportunity={mockOpportunity} />);
    
    expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    expect(screen.getByText('Universidade Tech')).toBeInTheDocument();
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
    // The component renders scholarship_type in a badge
    expect(screen.getByText('Integral')).toBeInTheDocument(); 
    // The component renders cutoff score with "Nota: " prefix
    expect(screen.getByText('Nota: 750.00')).toBeInTheDocument();
  });

  it('does not render cutoff score if null', () => {
    const opportunityWithoutScore = { ...mockOpportunity, cutoff_score: null };
    render(<OpportunityCard opportunity={opportunityWithoutScore} />);
    
    expect(screen.queryByText(/Nota:/)).not.toBeInTheDocument();
  });
});
