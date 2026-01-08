import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Fix env vars before imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test-url';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

import { PartnerCard } from '../../../components/PartnerCard';

// Local interface
interface Partner {
  id: string;
  name: string;
  description: string;
  location: string | null;
  type: string | null;
  income: string | null;
  dates: Record<string, any> | null;
  link: string | null;
  coverimage: string | null;
}

// Mock next/font/google explicitly to be safe
vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    style: { fontFamily: 'Montserrat' },
    className: 'className',
  }),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt} />
}));

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useAuth
vi.mock('../../../components/context/AuthContext', () => ({ 
  useAuth: () => ({
    isAuthenticated: false,
    openAuthModal: vi.fn(),
    pendingAction: null,
    setPendingAction: vi.fn(),
    clearPendingAction: vi.fn(),
  }),
}));

describe('PartnerCard', () => {
    const mockPartner: Partner = {
        id: '123',
        name: 'Test Partner',
        description: 'Test Description',
        location: 'Test Location',
        type: 'Test Type',
        income: 'Test Income',
        dates: null,
        link: 'http://test.com',
        coverimage: '/test-image.jpg'
    };

    it('renders partner information correctly', () => {
        render(<PartnerCard partner={mockPartner} />);
        
        expect(screen.getByText('Test Partner')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('Test Location')).toBeInTheDocument();
        expect(screen.getByText('Ver link')).toBeInTheDocument();
        
        // Image check
        const img = screen.getByAltText('Capa Test Partner');
        expect(img).toHaveAttribute('src', '/test-image.jpg');
    });

    it('uses fallback values when no partner provided', () => {
        render(<PartnerCard />);
        expect(screen.getByText('Parceiro Nubo')).toBeInTheDocument();
        expect(screen.getByText('Ver link')).toBeInTheDocument();
    });
});
