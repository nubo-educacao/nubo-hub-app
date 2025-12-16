import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OpportunityCatalog from '../../../components/OpportunityCatalog';
import { fetchCoursesWithOpportunities } from '../../../lib/services/opportunities';

// Mock the service
vi.mock('../../../lib/services/opportunities', () => ({
  fetchCoursesWithOpportunities: vi.fn(),
}));

vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    style: { fontFamily: 'Montserrat' },
    className: 'className',
  }),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    openAuthModal: vi.fn(),
    pendingAction: null,
  }),
}));

const mockData = [
  {
    id: '1',
    title: 'Curso Teste',
    institution: 'Inst Teste',
    location: 'Cidade, UF',
    city: 'Cidade',
    state: 'UF',
    opportunities: [
        {
            id: 'opp-1',
            shift: 'Integral',
            scholarship_type: 'Integral',
            type: 'Pública',
            cutoff_score: 700
        }
    ],
    min_cutoff_score: 700
  }
];

describe('OpportunityCatalog Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchCoursesWithOpportunities as any).mockResolvedValue({
      data: mockData,
      total: 1,
      page: 0,
      limit: 20,
      hasMore: false,
      error: null,
    });
  });

  it('renders "Parceiros" view by default', async () => {
    render(<OpportunityCatalog />);
    
    // Should show partner cards (mocked static data in component)
    expect(screen.getByText('Fundação Estudar')).toBeInTheDocument();
    
    // Should have called fetch in background
    await waitFor(() => {
      expect(fetchCoursesWithOpportunities).toHaveBeenCalledWith(0, 20);
    });
  });

  it('switches to "Públicas" and shows fetched data', async () => {
    render(<OpportunityCatalog />);
    
    // Switch to 'Públicas'
    const publicBtn = screen.getByText('Públicas');
    fireEvent.click(publicBtn);
    
    // Should now show the opportunity card from mockData
    expect(await screen.findByRole('heading', { name: /Curso Teste/i })).toBeInTheDocument();
    expect(screen.getByText('Inst Teste')).toBeInTheDocument();
  });

  it('handles fetch error', async () => {
    (fetchCoursesWithOpportunities as any).mockResolvedValue({
        data: [],
        total: 0,
        page: 0,
        limit: 20,
        hasMore: false,
        error: "Erro simulado",
      });

    render(<OpportunityCatalog />);
    
    const publicBtn = screen.getByText('Públicas');
    fireEvent.click(publicBtn);
    
    expect(await screen.findByText('Erro ao carregar oportunidades')).toBeInTheDocument();
    expect(screen.getByText('Erro simulado')).toBeInTheDocument();
  });
});
