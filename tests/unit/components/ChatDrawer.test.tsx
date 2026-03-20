// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

expect.extend(matchers);

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/oportunidades',
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'test-user' },
    openAuthModal: vi.fn(),
    closeAuthModal: vi.fn(),
    logout: vi.fn(),
    setPendingAction: vi.fn(),
    clearPendingAction: vi.fn(),
    pendingAction: null,
    session: null,
  }),
}));



import ChatDrawer from '@/components/chat/ChatDrawer';

describe('ChatDrawer', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not render content when closed', () => {
    render(<ChatDrawer isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('chat-drawer')).not.toBeInTheDocument();
  });

  it('renders the drawer when open', () => {
    render(<ChatDrawer isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('chat-drawer')).toBeInTheDocument();
  });

  it('renders close button when open', () => {
    render(<ChatDrawer isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /fechar/i })).toBeInTheDocument();
  });
});
