import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PollsDashboard } from '@/components/polls/PollsDashboard';
import { useAuth } from '@/lib/AuthContext';
import { getUserPolls, deletePoll } from '@/lib/polls';

// Mock the imported modules
jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/polls', () => ({
  getUserPolls: jest.fn(),
  deletePoll: jest.fn(),
}));

// Mock EditPollForm component
jest.mock('@/components/polls/EditPollForm', () => {
  return function MockEditPollForm({ poll, onSuccess, onCancel }: { 
    poll: any; 
    onSuccess: () => void; 
    onCancel: () => void; 
  }) {
    return (
      <div data-testid="edit-poll-form">
        <button onClick={onSuccess}>Save</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

const mockPolls = [
  {
    id: 'poll-1',
    question: 'Test Poll 1',
    description: 'Description 1',
    options: [
      { id: 'option-1-1', label: 'Option 1', voteCount: 5 },
      { id: 'option-1-2', label: 'Option 2', voteCount: 3 },
    ],
    createdBy: 'user-123',
    createdAt: '2023-01-01T00:00:00Z',
    expiresAt: null,
  },
  {
    id: 'poll-2',
    question: 'Test Poll 2',
    description: 'Description 2',
    options: [
      { id: 'option-2-1', label: 'Option A', voteCount: 2 },
      { id: 'option-2-2', label: 'Option B', voteCount: 4 },
    ],
    createdBy: 'user-123',
    createdAt: '2023-01-02T00:00:00Z',
    expiresAt: '2023-12-31T00:00:00Z',
  },
];

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('PollsDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    (getUserPolls as jest.Mock).mockResolvedValue(mockPolls);
    (deletePoll as jest.Mock).mockResolvedValue({});
    // Mock window.confirm
    window.confirm = jest.fn().mockImplementation(() => true);
  });

  it('renders loading state initially', async () => {
    render(<PollsDashboard />);
    expect(screen.getByText('Loading your polls...')).toBeInTheDocument();
    await waitFor(() => expect(getUserPolls).toHaveBeenCalledWith('user-123'));
  });

  it('renders polls after loading', async () => {
    render(<PollsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll 1')).toBeInTheDocument();
      expect(screen.getByText('Test Poll 2')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  it('shows message when user has no polls', async () => {
    (getUserPolls as jest.Mock).mockResolvedValue([]);
    
    render(<PollsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/you haven't created any polls yet/i)).toBeInTheDocument();
    });
  });

  it('allows user to delete a poll', async () => {
    render(<PollsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll 1')).toBeInTheDocument();
    });
    
    // Find and click delete button for the first poll
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(deletePoll).toHaveBeenCalledWith('poll-1', 'user-123');
    });
  });

  it('allows user to edit a poll', async () => {
    render(<PollsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll 1')).toBeInTheDocument();
    });
    
    // Find and click edit button for the first poll
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    
    // Should show edit form
    await waitFor(() => {
      expect(screen.getByTestId('edit-poll-form')).toBeInTheDocument();
    });
    
    // Test cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Edit form should be hidden
    await waitFor(() => {
      expect(screen.queryByTestId('edit-poll-form')).not.toBeInTheDocument();
    });
  });

  it('handles error when loading polls fails', async () => {
    (getUserPolls as jest.Mock).mockRejectedValue(new Error('Failed to load polls'));
    
    render(<PollsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load your polls')).toBeInTheDocument();
    });
  });

  it('handles error when deleting poll fails', async () => {
    (deletePoll as jest.Mock).mockRejectedValue(new Error('Failed to delete poll'));
    
    render(<PollsDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll 1')).toBeInTheDocument();
    });
    
    // Find and click delete button for the first poll
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to delete poll')).toBeInTheDocument();
    });
  });
});