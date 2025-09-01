import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewPollClient } from '@/app/polls/new/NewPollClient';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { createPoll } from '@/lib/polls';

// Mock the imported modules
jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/polls', () => ({
  createPoll: jest.fn(),
}));

describe('NewPollClient Component', () => {
  const mockPush = jest.fn();
  const mockUser = { id: 'user-123' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
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

  it('renders the poll creation form when user is authenticated', () => {
    render(<NewPollClient />);
    
    expect(screen.getByText(/Create New Poll/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Poll Question/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Option/i).length).toBe(2); // Initial 2 options
    expect(screen.getByRole('button', { name: /Create Poll/i })).toBeInTheDocument();
  });

  it('shows loading state while checking authentication', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });
    
    render(<NewPollClient />);
    
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('shows login prompt when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
    });
    
    render(<NewPollClient />);
    
    expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument();
    expect(screen.getByText(/You need to be logged in to create polls/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sign up/i })).toBeInTheDocument();
  });

  it('allows adding and removing options', () => {
    render(<NewPollClient />);
    
    // Initially has 2 options
    expect(screen.getAllByLabelText(/Option/i).length).toBe(2);
    
    // Add an option
    fireEvent.click(screen.getByRole('button', { name: /Add Option/i }));
    expect(screen.getAllByLabelText(/Option/i).length).toBe(3);
    
    // Fill in all options so we can test removal
    const options = screen.getAllByLabelText(/Option/i);
    fireEvent.change(options[0], { target: { value: 'Option 1' } });
    fireEvent.change(options[1], { target: { value: 'Option 2' } });
    fireEvent.change(options[2], { target: { value: 'Option 3' } });
    
    // Remove the third option
    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[2]);
    
    // Should be back to 2 options
    expect(screen.getAllByLabelText(/Option/i).length).toBe(2);
  });

  it('prevents removing options when only 2 remain', () => {
    render(<NewPollClient />);
    
    // Fill in the two options
    const options = screen.getAllByLabelText(/Option/i);
    fireEvent.change(options[0], { target: { value: 'Option 1' } });
    fireEvent.change(options[1], { target: { value: 'Option 2' } });
    
    // Try to remove an option
    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(removeButtons[0]);
    
    // Should still have 2 options
    expect(screen.getAllByLabelText(/Option/i).length).toBe(2);
  });

  it('validates form before submission', async () => {
    render(<NewPollClient />);
    
    // Submit without filling in required fields
    const submitButton = screen.getByRole('button', { name: /Create Poll/i });
    fireEvent.click(submitButton);
    
    // createPoll should not be called
    expect(createPoll).not.toHaveBeenCalled();
  });

  it('successfully creates a poll', async () => {
    (createPoll as jest.Mock).mockResolvedValue('poll-123');
    
    render(<NewPollClient />);
    
    // Fill in the form
    const titleInput = screen.getByLabelText(/Poll Question/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const expirationInput = screen.getByLabelText(/Expiration Date/i);
    const options = screen.getAllByLabelText(/Option/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Poll Question' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    
    // Set expiration date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    fireEvent.change(expirationInput, { target: { value: tomorrowString } });
    
    fireEvent.change(options[0], { target: { value: 'Option 1' } });
    fireEvent.change(options[1], { target: { value: 'Option 2' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Poll/i });
    fireEvent.click(submitButton);
    
    // Check loading state
    expect(submitButton).toBeDisabled();
    
    await waitFor(() => {
      expect(createPoll).toHaveBeenCalledWith(
        {
          question: 'Test Poll Question',
          description: 'Test Description',
          expiresAt: expect.any(String),
          options: ['Option 1', 'Option 2'],
        },
        mockUser.id
      );
    });
    
    // Success message should be shown
    expect(screen.getByText(/success/i)).toBeInTheDocument();
    
    // Advance timers to trigger redirect
    jest.advanceTimersByTime(2000);
    
    expect(mockPush).toHaveBeenCalledWith('/polls');
  });

  it('handles poll creation error', async () => {
    const errorMessage = 'Failed to create poll';
    (createPoll as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<NewPollClient />);
    
    // Fill in the form
    const titleInput = screen.getByLabelText(/Poll Question/i);
    const options = screen.getAllByLabelText(/Option/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Poll Question' } });
    fireEvent.change(options[0], { target: { value: 'Option 1' } });
    fireEvent.change(options[1], { target: { value: 'Option 2' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Poll/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Button should be enabled again
    expect(submitButton).not.toBeDisabled();
    
    // Should not redirect
    jest.advanceTimersByTime(3000);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('validates that expiration date is in the future', async () => {
    render(<NewPollClient />);
    
    // Fill in the form with past expiration date
    const titleInput = screen.getByLabelText(/Poll Question/i);
    const expirationInput = screen.getByLabelText(/Expiration Date/i);
    const options = screen.getAllByLabelText(/Option/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Poll Question' } });
    
    // Set expiration date to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    fireEvent.change(expirationInput, { target: { value: yesterdayString } });
    
    fireEvent.change(options[0], { target: { value: 'Option 1' } });
    fireEvent.change(options[1], { target: { value: 'Option 2' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Poll/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Expiration date must be in the future/i)).toBeInTheDocument();
    });
    
    expect(createPoll).not.toHaveBeenCalled();
  });

  it('validates that at least 2 options are provided', async () => {
    render(<NewPollClient />);
    
    // Fill in the form with only one valid option
    const titleInput = screen.getByLabelText(/Poll Question/i);
    const options = screen.getAllByLabelText(/Option/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Poll Question' } });
    fireEvent.change(options[0], { target: { value: 'Option 1' } });
    fireEvent.change(options[1], { target: { value: '' } }); // Empty option
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Poll/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/At least 2 options are required/i)).toBeInTheDocument();
    });
    
    expect(createPoll).not.toHaveBeenCalled();
  });
});