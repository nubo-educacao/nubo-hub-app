import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OpportunityCard from '@/components/OpportunityCard';
import { CourseDisplayData } from '@/types/opportunity';

vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    style: { fontFamily: 'Montserrat' },
    className: 'className',
  }),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    openAuthModal: vi.fn(),
    pendingAction: null,
  }),
}));

const mockCourse: CourseDisplayData = {
  id: '1',
  title: 'Engenharia de Software',
  institution: 'Universidade Tech',
  location: 'São Paulo, SP',
  city: 'São Paulo',
  state: 'SP',
  opportunities: [
    {
      id: 'opp-1',
      shift: 'Integral',
      opportunity_type: 'sisu',
      scholarship_type: 'Integral',
      cutoff_score: 750,
      type: 'Pública'
    },
    {
       id: 'opp-2',
       shift: 'Noturno',
       opportunity_type: null,
       scholarship_type: 'Parcial',
       cutoff_score: null,
       type: 'Privada'
    }
  ],
  min_cutoff_score: 750
};

describe('OpportunityCard', () => {
  it('renders course details correctly', () => {
    render(<OpportunityCard course={mockCourse} />);
    
    expect(screen.getByText('Engenharia de Software')).toBeInTheDocument();
    expect(screen.getByText('Universidade Tech')).toBeInTheDocument();
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
  });

  it('renders list of opportunities', () => {
    render(<OpportunityCard course={mockCourse} />);

    // Should find badges/text for both opportunities
    // Integral from first opp
    const integralElements = screen.getAllByText('Integral');
    expect(integralElements.length).toBeGreaterThan(0);

    // Noturno from second opp
    expect(screen.getByText('Noturno')).toBeInTheDocument();

    // Cutoff score
    expect(screen.getByText(/Nota de corte:/)).toBeInTheDocument();
    expect(screen.getByText(/750/)).toBeInTheDocument();
  });

  it('handles opportunities without cutoff score', () => {
     // Tests that the second opportunity (Privada) is rendered without crashing e.g.
     render(<OpportunityCard course={mockCourse} />);
     // We can look for specific text associated with the second opp if needed, 
     // but the main point is that it renders.
     expect(screen.getByText('Privada')).toBeInTheDocument(); // Type badge
  });
});
