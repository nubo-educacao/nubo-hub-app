// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

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

import CloudinhaFAB from '../../../components/chat/CloudinhaFAB';

describe('CloudinhaFAB', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the FAB button', () => {
    render(<CloudinhaFAB onToggleChat={vi.fn()} isChatOpen={false} />);
    const button = screen.getByRole('button', { name: /cloudinha/i });
    expect(button).toBeInTheDocument();
  });

  it('calls onToggleChat when clicked', () => {
    const mockToggle = vi.fn();
    render(<CloudinhaFAB onToggleChat={mockToggle} isChatOpen={false} />);
    const button = screen.getByRole('button', { name: /cloudinha/i });
    fireEvent.click(button);
    expect(mockToggle).toHaveBeenCalledTimes(1);
  });

  it('shows close icon when chat is open', () => {
    render(<CloudinhaFAB onToggleChat={vi.fn()} isChatOpen={true} />);
    const button = screen.getByRole('button', { name: /fechar/i });
    expect(button).toBeInTheDocument();
  });
});
