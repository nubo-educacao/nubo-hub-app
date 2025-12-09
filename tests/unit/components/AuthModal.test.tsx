// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthModal from '../../../components/AuthModal';
import * as AuthContext from '../../../context/AuthContext';
import React from 'react';

// Mock the AuthContext module
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock Image component since it is used in AuthModal
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />
}));

describe('AuthModal', () => {
  const mockCloseAuthModal = vi.fn();
  const mockSignInWithWhatsapp = vi.fn();
  const mockSignInWithDemo = vi.fn();
  const mockVerifyOtp = vi.fn();
  
  const defaultAuthContext = {
    isAuthModalOpen: true,
    closeAuthModal: mockCloseAuthModal,
    signInWithWhatsapp: mockSignInWithWhatsapp,
    signInWithDemo: mockSignInWithDemo,
    verifyOtp: mockVerifyOtp,
    pendingAction: null,
    isAuthenticated: false,
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    openAuthModal: vi.fn(),
    setPendingAction: vi.fn(),
    clearPendingAction: vi.fn(),
    session: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock implementation
    (AuthContext.useAuth as any).mockReturnValue(defaultAuthContext);
  });

  it('does not render when isAuthModalOpen is false', () => {
    (AuthContext.useAuth as any).mockReturnValue({
      ...defaultAuthContext,
      isAuthModalOpen: false,
    });
    
    render(<AuthModal />);
    
    expect(screen.queryByText('Entre no Nubo')).not.toBeInTheDocument();
  });

  it('renders correctly when open', () => {
    render(<AuthModal />);
    
    expect(screen.getByText('Entre no Nubo')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(DD) 99999-9999')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Receber código no Whatsapp/i })).toBeInTheDocument();
  });

  it('formats phone number input', () => {
    render(<AuthModal />);
    
    const input = screen.getByPlaceholderText('(DD) 99999-9999');
    fireEvent.change(input, { target: { value: '11999999999' } });
    
    expect(input).toHaveValue('(11) 99999-9999');
  });

  it('disables button if terms are not accepted', () => {
    render(<AuthModal />);
    
    const input = screen.getByPlaceholderText('(DD) 99999-9999');
    fireEvent.change(input, { target: { value: '11999999999' } });
    
    const button = screen.getByRole('button', { name: /Receber código no Whatsapp/i });
    
    // Should be disabled because terms are not accepted
    expect(button).toBeDisabled();
    
    // Accept terms
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Should be enabled
    expect(button).not.toBeDisabled();
    
    // Uncheck terms
    fireEvent.click(checkbox);
    expect(button).toBeDisabled();
  });

  it('calls signInWithDemo when valid phone and terms accepted (Demo Mode)', async () => {
    mockSignInWithDemo.mockResolvedValue({ error: null });
    
    render(<AuthModal />);
    
    // Fill phone
    const input = screen.getByPlaceholderText('(DD) 99999-9999');
    fireEvent.change(input, { target: { value: '11999999999' } });
    
    // Accept terms
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    // Submit
    const button = screen.getByRole('button', { name: /Receber código no Whatsapp/i });
    fireEvent.click(button);
    
    await waitFor(() => {
        // Since IS_DEMO_MODE is true in component, we expect signInWithDemo
        expect(mockSignInWithDemo).toHaveBeenCalledWith('+5511999999999');
    });
  });
});
