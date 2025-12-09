import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OpportunityCatalog from '../../../components/OpportunityCatalog';
import { fetchOpportunities } from '../../../lib/services/opportunities';

// Mock the service
vi.mock('../../../lib/services/opportunities', () => ({
  fetchOpportunities: vi.fn(),
}));

// Mock child components to simplify test (optional, but good for integration level to check props passing or just simple rendering)
// Actually, for integration is better to render them, but OpportunityCard uses fonts or images, so maybe simple mock if needed.
// However, since we already fixed OpportunityCard test, we can trust it renders. But to isolate failure points, let's let them render.
// Just mock next/font if needed. But it is already mocked in setup usually or in individual test.
// Let's add the font mock here just in case.
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
    type: 'Pública',
    modality: 'Presencial',
    cutoff_score: 700,
    scholarship_type: 'Integral',
    shift: 'Noturno',
    course_name: 'Curso Teste',
    city: 'Cidade',
    state: 'UF'
  }
];

describe('OpportunityCatalog Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchOpportunities as any).mockResolvedValue({
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
    expect(screen.getByText('Gerando Falcões')).toBeInTheDocument();
    
    // Should have called fetch in background
    await waitFor(() => {
      expect(fetchOpportunities).toHaveBeenCalledWith(0, 20);
    });
  });

  it('switches to "Públicas" and shows fetched data', async () => {
    render(<OpportunityCatalog />);
    
    // Switch to 'Públicas'
    const publicBtn = screen.getByText('Públicas');
    fireEvent.click(publicBtn);
    
    // Should now show the opportunity card from mockData
    // Should now show the opportunity card from mockData
    expect(await screen.findByRole('heading', { name: /Curso Teste/i })).toBeInTheDocument();
    expect(screen.getByText('Inst Teste')).toBeInTheDocument();
  });

  it('handles fetch error', async () => {
    (fetchOpportunities as any).mockResolvedValue({
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
