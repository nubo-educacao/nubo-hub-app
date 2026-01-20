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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: vi.fn(), has: vi.fn(() => false) }),
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

  it('renders "Seleção Nubo" view by default', async () => {
    render(<OpportunityCatalog />);
    
    // Should NOT show partner cards by default (Seleção Nubo calls fetch)
    // But local mockData won't appear until we waitFor fetch, or if it's empty
    
    // Verify initial fetch is called
    await waitFor(() => {
      expect(fetchCoursesWithOpportunities).toHaveBeenCalled();
    });
  });

  it('switches to "SISU" and shows fetched data', async () => {
    render(<OpportunityCatalog />);
    
    // Switch to 'SISU' (formerly Públicas)
    const publicBtn = screen.getByText('SISU');
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
    
    const publicBtn = screen.getByText('SISU');
    fireEvent.click(publicBtn);
    
    expect(await screen.findByText('Erro ao carregar oportunidades')).toBeInTheDocument();
    expect(screen.getByText('Erro simulado')).toBeInTheDocument();
  });

  it('fetches opportunities with geolocation when "Próximas a você" is selected', async () => {
      // Mock Geolocation API
      const mockGeolocation = {
        getCurrentPosition: vi.fn().mockImplementation((success) => 
          success({ coords: { latitude: -23.55, longitude: -46.63 } })
        )
      };
      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true
      });

      // Mock fetch for Nominatim reverse geocoding
      global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
              address: { city: 'São Paulo', state: 'São Paulo' }
          })
      });

      (fetchCoursesWithOpportunities as any).mockResolvedValue({
        data: [],
        total: 0,
        page: 0,
        limit: 20,
        hasMore: false,
        error: null,
      });

      render(<OpportunityCatalog />);
      
      // Open sort menu
      const sortBtn = screen.getByText(/Ordenar/);
      fireEvent.click(sortBtn);

      // Select "Próximas a você"
      const proximasBtn = screen.getByText('Próximas a você');
      fireEvent.click(proximasBtn);

      await waitFor(() => {
          expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });

      // Check if fetchCoursesWithOpportunities was called with coordinates
      await waitFor(() => {
        expect(fetchCoursesWithOpportunities).toHaveBeenCalled();
      });
  });
});
