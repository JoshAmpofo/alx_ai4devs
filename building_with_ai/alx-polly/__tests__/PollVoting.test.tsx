import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PollVoting from '@/components/polls/PollVoting';
import { useAuth } from '@/lib/AuthContext';
import { getPollWithOptions, castVote, hasUserVoted } from '@/lib/polls';

// Mock the imported modules
jest.mock('@/lib/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/polls', () => ({
  getPollWithOptions: jest.fn(),
  castVote: jest.fn(),
  hasUserVoted: jest.fn(),
}));

// Mock PollResultChart component
jest.mock('@/components/polls/PollResultChart', () => {
  return function MockPollResultChart({ poll }: { poll: any }) {
    return <div data-testid="poll-result-chart">Chart for {poll.question}</div>;
  };
});

const mockPoll = {
  id: 'poll-123',
  question: 'Test Poll Question',
  description: 'Test Poll Description',
  options: [
    { id: 'option-1', label: 'Option 1', voteCount: 5 },
    { id: 'option-2', label: 'Option 2', voteCount: 3 },
    { id: 'option-3', label: 'Option 3', voteCount: 0 },
  ],
  createdBy: 'user-123',
  createdAt: '2023-01-01T00:00:00Z',
  expiresAt: null,
};

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('PollVoting Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
    (getPollWithOptions as jest.Mock).mockResolvedValue(mockPoll);
    (hasUserVoted as jest.Mock).mockResolvedValue(false);
    (castVote as jest.Mock).mockResolvedValue({});
  });

  it('renders loading state initially', async () => {
    render(<PollVoting pollId="poll-123" />);
    expect(screen.getByText('Loading poll...')).toBeInTheDocument();
    await waitFor(() => expect(getPollWithOptions).toHaveBeenCalledWith('poll-123'));
  });

  it('renders poll details after loading', async () => {
    render(<PollVoting pollId="poll-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll Question')).toBeInTheDocument();
      expect(screen.getByText('Test Poll Description')).toBeInTheDocument();
    });
    
    mockPoll.options.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('allows user to select and submit a vote', async () => {
    render(<PollVoting pollId="poll-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll Question')).toBeInTheDocument();
    });
    
    // Select an option
    const optionRadio = screen.getByLabelText('Option 1');
    fireEvent.click(optionRadio);
    
    // Submit the vote
    const submitButton = screen.getByRole('button', { name: /submit vote/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(castVote).toHaveBeenCalledWith('poll-123', 'option-1', 'user-123');
    });
  });

  it('shows error when submitting without selecting an option', async () => {
    render(<PollVoting pollId="poll-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll Question')).toBeInTheDocument();
    });
    
    // Submit without selecting an option
    const submitButton = screen.getByRole('button', { name: /submit vote/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });
    expect(castVote).not.toHaveBeenCalled();
  });

  it('shows results when user has already voted', async () => {
    (hasUserVoted as jest.Mock).mockResolvedValue(true);
    
    render(<PollVoting pollId="poll-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll Question')).toBeInTheDocument();
      expect(screen.getByTestId('poll-result-chart')).toBeInTheDocument();
    });
    
    // Should show results instead of voting form
    expect(screen.queryByRole('button', { name: /submit vote/i })).not.toBeInTheDocument();
  });

  it('handles error when loading poll fails', async () => {
    (getPollWithOptions as jest.Mock).mockRejectedValue(new Error('Failed to load poll'));
    
    render(<PollVoting pollId="poll-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load poll')).toBeInTheDocument();
    });
  });

  it('handles error when voting fails', async () => {
    (castVote as jest.Mock).mockRejectedValue(new Error('Failed to submit vote'));
    
    render(<PollVoting pollId="poll-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Poll Question')).toBeInTheDocument();
    });
    
    // Select an option
    const optionRadio = screen.getByLabelText('Option 1');
    fireEvent.click(optionRadio);
    
    // Submit the vote
    const submitButton = screen.getByRole('button', { name: /submit vote/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit vote')).toBeInTheDocument();
    });
  });
});