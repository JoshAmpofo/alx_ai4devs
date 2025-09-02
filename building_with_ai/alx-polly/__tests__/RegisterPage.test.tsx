import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '@/app/(auth)/register/page';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

// Mock the imported modules
jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('RegisterPage Component', () => {
  const mockSignUp = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      supabase: {
        auth: {
          signUp: mockSignUp,
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

  it('renders registration form', () => {
    render(<RegisterPage />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('validates password confirmation', async () => {
    render(<RegisterPage />);
    
    // Fill in form with mismatched passwords
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
    fireEvent.click(submitButton);
    
    // Should show error message
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    render(<RegisterPage />);
    
    // Fill in form with short password
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.change(confirmPasswordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);
    
    // Should show error message
    expect(screen.getByText('Password must be at least 6 characters long.')).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('handles successful registration', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    
    render(<RegisterPage />);
    
    // Fill in form correctly
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
        await waitFor(() => {
      expect(screen.getByText(/Check Your Email!/i)).toBeInTheDocument();
    });
    
    // Advance timers to trigger redirect
    jest.advanceTimersByTime(2000);
    
    expect(mockPush).toHaveBeenCalledWith('/polls');
  });

  it('handles registration error', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'Email already registered' },
    });
    
    render(<RegisterPage />);
    
    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
    
    // Button should be enabled again
    expect(submitButton).not.toBeDisabled();
    
    // Should not redirect
    jest.advanceTimersByTime(3000);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles unexpected errors', async () => {
    mockSignUp.mockRejectedValue(new Error('Network error'));
    
    render(<RegisterPage />);
    
    // Fill in form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });
  });

  it('navigates to login page when clicking sign in link', () => {
    render(<RegisterPage />);
    
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '/login');
  });
});