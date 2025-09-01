import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/(auth)/login/page';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

// Mock the imported modules
jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('LoginPage Component', () => {
  const mockSignInWithPassword = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      supabase: {
        auth: {
          signInWithPassword: mockSignInWithPassword,
        },
      },
    });
    
    // Mock useRouter hook
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    // Mock window.addEventListener
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    
    render(<LoginPage />);
    
    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    // Success message should be shown
    expect(screen.getByText(/success/i)).toBeInTheDocument();
    
    // Advance timers to trigger redirect
    jest.advanceTimersByTime(1500);
    
    expect(mockPush).toHaveBeenCalledWith('/polls');
  });

  it('handles login error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    
    render(<LoginPage />);
    
    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
    });
    
    // Button should be enabled again
    expect(submitButton).not.toBeDisabled();
    
    // Should not redirect
    jest.advanceTimersByTime(2000);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles unexpected errors', async () => {
    mockSignInWithPassword.mockRejectedValue(new Error('Network error'));
    
    render(<LoginPage />);
    
    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });
  });

  it('navigates to register page when clicking sign up link', () => {
    render(<LoginPage />);
    
    const signUpLink = screen.getByRole('link', { name: /sign up/i });
    expect(signUpLink).toHaveAttribute('href', '/register');
  });
});