// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

expect.extend(matchers);

// Mock next/navigation
const mockPathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    nav: React.forwardRef(({ children, ...props }: any, ref: any) => <nav ref={ref} {...props}>{children}</nav>),
    span: React.forwardRef(({ children, ...props }: any, ref: any) => <span ref={ref} {...props}>{children}</span>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    openAuthModal: vi.fn(),
    closeAuthModal: vi.fn(),
    logout: vi.fn(),
    setPendingAction: vi.fn(),
    clearPendingAction: vi.fn(),
    pendingAction: null,
    session: null,
  }),
}));

import BottomNavigation from '../../../components/navigation/BottomNavigation';

describe('BottomNavigation', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders three navigation tabs', () => {
    render(<BottomNavigation />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Oportunidades')).toBeInTheDocument();
    expect(screen.getByText('Candidaturas')).toBeInTheDocument();
  });

  it('renders navigation links with correct hrefs', () => {
    render(<BottomNavigation />);

    const homeLink = screen.getByText('Home').closest('a');
    const oppsLink = screen.getByText('Oportunidades').closest('a');
    const candLink = screen.getByText('Candidaturas').closest('a');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(oppsLink).toHaveAttribute('href', '/oportunidades');
    expect(candLink).toHaveAttribute('href', '/candidaturas');
  });

  it('highlights Home tab when pathname is /', () => {
    mockPathname.mockReturnValue('/');
    render(<BottomNavigation />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink?.getAttribute('data-active')).toBe('true');
  });

  it('highlights Oportunidades tab when pathname is /oportunidades', () => {
    mockPathname.mockReturnValue('/oportunidades');
    render(<BottomNavigation />);

    const oppsLink = screen.getByText('Oportunidades').closest('a');
    expect(oppsLink?.getAttribute('data-active')).toBe('true');
  });

  it('highlights Candidaturas tab when pathname is /candidaturas', () => {
    mockPathname.mockReturnValue('/candidaturas');
    render(<BottomNavigation />);

    const candLink = screen.getByText('Candidaturas').closest('a');
    expect(candLink?.getAttribute('data-active')).toBe('true');
  });

  it('has the correct nav landmark role', () => {
    render(<BottomNavigation />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
