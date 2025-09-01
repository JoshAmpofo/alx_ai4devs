import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PollResults from '@/components/polls/PollResults';
import PollResultChart from '@/components/polls/PollResultChart';

// Mock the PollResultChart component
jest.mock('@/components/polls/PollResultChart', () => {
  return jest.fn().mockImplementation(({ poll, chartType }) => (
    <div data-testid="mock-chart" data-poll-id={poll.id} data-chart-type={chartType}>
      Mock Chart
    </div>
  ));
});

describe('PollResults Component', () => {
  const mockPoll = {
    id: 'poll-123',
    question: 'Test Question',
    description: 'Test Description',
    createdAt: '2023-01-01T00:00:00Z',
    expiresAt: null,
    createdBy: 'user-123',
    options: [
      { id: 'option-1', label: 'Option 1', voteCount: 5 },
      { id: 'option-2', label: 'Option 2', voteCount: 3 },
      { id: 'option-3', label: 'Option 3', voteCount: 0 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders poll results with correct vote counts', () => {
    render(<PollResults poll={mockPoll} />);
    
    // Check total votes
    expect(screen.getByText('8 votes total')).toBeInTheDocument();
    
    // Check individual options
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('5 votes (62.5%)')).toBeInTheDocument();
    
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('3 votes (37.5%)')).toBeInTheDocument();
    
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    expect(screen.getByText('0 votes (0.0%)')).toBeInTheDocument();
  });

  it('highlights the winning option', () => {
    render(<PollResults poll={mockPoll} />);
    
    // Option 1 should have the 'Leading' badge
    const leadingBadge = screen.getByText('Leading');
    expect(leadingBadge).toBeInTheDocument();
    
    // The badge should be near Option 1
    const option1Text = screen.getByText('Option 1');
    expect(option1Text.parentElement).toContainElement(leadingBadge);
  });

  it('shows a message when there are no votes', () => {
    const noVotesPoll = {
      ...mockPoll,
      options: [
        { id: 'option-1', label: 'Option 1', voteCount: 0 },
        { id: 'option-2', label: 'Option 2', voteCount: 0 },
      ],
    };
    
    render(<PollResults poll={noVotesPoll} />);
    
    expect(screen.getByText('0 votes total')).toBeInTheDocument();
    expect(screen.getByText('No votes yet. Be the first to vote!')).toBeInTheDocument();
    
    // No leading badge should be present
    expect(screen.queryByText('Leading')).not.toBeInTheDocument();
  });

  it('handles singular vote text correctly', () => {
    const singleVotePoll = {
      ...mockPoll,
      options: [
        { id: 'option-1', label: 'Option 1', voteCount: 1 },
        { id: 'option-2', label: 'Option 2', voteCount: 0 },
      ],
    };
    
    render(<PollResults poll={singleVotePoll} />);
    
    expect(screen.getByText('1 vote total')).toBeInTheDocument();
  });

  it('allows changing chart type', () => {
    render(<PollResults poll={mockPoll} />);
    
    // Default chart type should be doughnut
    expect(screen.getByTestId('mock-chart')).toHaveAttribute('data-chart-type', 'doughnut');
    
    // Change to bar chart
    fireEvent.click(screen.getByRole('button', { name: /bar/i }));
    expect(screen.getByTestId('mock-chart')).toHaveAttribute('data-chart-type', 'bar');
    
    // Change to pie chart
    fireEvent.click(screen.getByRole('button', { name: /pie/i }));
    expect(screen.getByTestId('mock-chart')).toHaveAttribute('data-chart-type', 'pie');
    
    // Change back to doughnut chart
    fireEvent.click(screen.getByRole('button', { name: /doughnut/i }));
    expect(screen.getByTestId('mock-chart')).toHaveAttribute('data-chart-type', 'doughnut');
  });

  it('passes the correct poll data to the chart component', () => {
    render(<PollResults poll={mockPoll} />);
    
    expect(screen.getByTestId('mock-chart')).toHaveAttribute('data-poll-id', 'poll-123');
    expect(PollResultChart).toHaveBeenCalledWith(
      expect.objectContaining({
        poll: mockPoll,
        chartType: 'doughnut',
      }),
      expect.anything()
    );
  });
});