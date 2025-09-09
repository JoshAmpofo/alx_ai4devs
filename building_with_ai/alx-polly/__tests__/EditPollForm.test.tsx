import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditPollForm from '@/components/polls/EditPollForm';
import { updatePollComplete } from '@/lib/polls';

// Mock the imported modules
jest.mock('@/lib/polls', () => ({
  updatePollComplete: jest.fn(),
}));

// Mock window.confirm
window.confirm = jest.fn();

const mockPoll = {
  id: 'poll-123',
  question: 'Test Poll Question',
  description: 'Test Poll Description',
  options: [
    { id: 'option-1', label: 'Option 1', voteCount: 0 },
    { id: 'option-2', label: 'Option 2', voteCount: 0 },
  ],
  createdBy: 'user-123',
  createdAt: '2023-01-01T00:00:00Z',
  expiresAt: null,
};

const mockPollWithVotes = {
  ...mockPoll,
  options: [
    { id: 'option-1', label: 'Option 1', voteCount: 5 },
    { id: 'option-2', label: 'Option 2', voteCount: 3 },
  ],
};

describe('EditPollForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (window.confirm as jest.Mock).mockReturnValue(true);
    (updatePollComplete as jest.Mock).mockResolvedValue({});
  });

  it('renders with poll data', () => {
    render(
      <EditPollForm 
        poll={mockPoll} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    expect(screen.getByLabelText(/poll question/i)).toHaveValue('Test Poll Question');
    expect(screen.getByLabelText(/description/i)).toHaveValue('Test Poll Description');
    expect(screen.getAllByRole('textbox')[2]).toHaveValue('Option 1');
    expect(screen.getAllByRole('textbox')[3]).toHaveValue('Option 2');
  });

  it('allows editing poll details', async () => {
    render(
      <EditPollForm 
        poll={mockPoll} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Edit question
    const questionInput = screen.getByLabelText(/poll question/i);
    fireEvent.change(questionInput, { target: { value: 'Updated Question' } });
    
    // Edit description
    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Updated Description' } });
    
    // Edit options
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    fireEvent.change(optionInputs[0], { target: { value: 'Updated Option 1' } });
    fireEvent.change(optionInputs[1], { target: { value: 'Updated Option 2' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /update poll/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(updatePollComplete).toHaveBeenCalledWith(
        'poll-123',
        'user-123',
        {
          question: 'Updated Question',
          description: 'Updated Description',
          options: ['Updated Option 1', 'Updated Option 2'],
          expiresAt: null,
        }
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('allows adding and removing options', async () => {
    render(
      <EditPollForm 
        poll={mockPoll} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Add a new option
    const addButton = screen.getByRole('button', { name: /add option/i });
    fireEvent.click(addButton);
    
    // Should now have 3 options
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(optionInputs.length).toBe(3);
    
    // Fill in the new option
    fireEvent.change(optionInputs[2], { target: { value: 'New Option' } });
    
    // Remove the second option
    const removeButtons = screen.getAllByRole('button', { name: /✕/i });
    fireEvent.click(removeButtons[1]);
    
    // Should now have 2 options again
    const updatedOptionInputs = screen.getAllByPlaceholderText(/option/i);
    expect(updatedOptionInputs.length).toBe(2);
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /update poll/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(updatePollComplete).toHaveBeenCalledWith(
        'poll-123',
        'user-123',
        expect.objectContaining({
          options: ['Option 1', 'New Option'],
        })
      );
    });
  });

  it('shows warning when editing a poll with votes', () => {
    render(
      <EditPollForm 
        poll={mockPollWithVotes} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Should show warning message
    expect(screen.getByText(/this poll has 8 votes/i)).toBeInTheDocument();
    expect(screen.getByText(/changing the options will delete all existing votes/i)).toBeInTheDocument();
  });

  it('confirms before updating a poll with votes', async () => {
    render(
      <EditPollForm 
        poll={mockPollWithVotes} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Edit an option
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    fireEvent.change(optionInputs[0], { target: { value: 'Changed Option' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /update poll/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(updatePollComplete).toHaveBeenCalled();
    });
    
    // Test cancellation
    (window.confirm as jest.Mock).mockReturnValue(false);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      // Called twice now
      expect(window.confirm).toHaveBeenCalledTimes(2);
      // But updatePollComplete still only called once
      expect(updatePollComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('validates form before submission', async () => {
    render(
      <EditPollForm 
        poll={mockPoll} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Clear question
    const questionInput = screen.getByLabelText(/poll question/i);
    fireEvent.change(questionInput, { target: { value: '' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /update poll/i });
    fireEvent.click(submitButton);
    
    // Should show error
    await waitFor(() => {
      expect(updatePollComplete).not.toHaveBeenCalled();
    });
    
    // Fix question but clear options
    fireEvent.change(questionInput, { target: { value: 'Valid Question' } });
    
    const optionInputs = screen.getAllByPlaceholderText(/option/i);
    fireEvent.change(optionInputs[0], { target: { value: '' } });
    fireEvent.change(optionInputs[1], { target: { value: '' } });
    
    // Submit again
    fireEvent.click(submitButton);
    
    // Should show different error
    await waitFor(() => {
      expect(updatePollComplete).not.toHaveBeenCalled();
    });
  });

  it('handles cancel button', () => {
    render(
      <EditPollForm 
        poll={mockPoll} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    (updatePollComplete as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(
      <EditPollForm 
        poll={mockPoll} 
        userId="user-123" 
        onSuccess={mockOnSuccess} 
        onCancel={mockOnCancel} 
      />
    );
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /update poll/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });
});