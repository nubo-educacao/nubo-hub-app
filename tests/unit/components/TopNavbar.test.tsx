// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

expect.extend(matchers);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    openAuthModal: vi.fn(),
    logout: vi.fn(),
  }),
}));

import TopNavbar from '../../../components/navigation/TopNavbar';

describe('TopNavbar', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the top navbar links on desktop', () => {
    render(<TopNavbar />);
    expect(screen.getByText('Oportunidades')).toBeInTheDocument();
    expect(screen.getByText('Candidaturas')).toBeInTheDocument();
  });
});
