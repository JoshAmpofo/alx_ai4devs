import React from 'react';
import { render, screen } from '@testing-library/react';
import PollResultChart from '@/components/polls/PollResultChart';
import { Chart } from 'chart.js';

// Mock Chart.js
jest.mock('chart.js', () => {
  const mockChartInstance = {
    destroy: jest.fn(),
  };
  
  return {
    Chart: jest.fn(() => mockChartInstance),
    register: jest.fn(),
    registerables: [],
  };
});

const mockPoll = {
  id: 'poll-123',
  question: 'Test Poll Question',
  description: 'Test Poll Description',
  options: [
    { id: 'option-1', label: 'Option 1', voteCount: 5 },
    { id: 'option-2', label: 'Option 2', voteCount: 3 },
    { id: 'option-3', label: 'Option 3', voteCount: 2 },
  ],
  createdBy: 'user-123',
  createdAt: '2023-01-01T00:00:00Z',
  expiresAt: null,
};

describe('PollResultChart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      // Add any canvas context methods that might be used
    })) as any;
  });

  it('renders a canvas element', () => {
    render(<PollResultChart poll={mockPoll} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('initializes Chart.js with poll data', () => {
    render(<PollResultChart poll={mockPoll} />);
    
    expect(Chart).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'doughnut',
        data: expect.objectContaining({
          labels: ['Option 1', 'Option 2', 'Option 3'],
          datasets: expect.arrayContaining([
            expect.objectContaining({
              data: [5, 3, 2],
            }),
          ]),
        }),
      })
    );
  });

  it('uses the specified chart type', () => {
    render(<PollResultChart poll={mockPoll} chartType="bar" />);
    
    expect(Chart).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'bar',
      })
    );
  });

  it('destroys previous chart instance when unmounted', () => {
    const { unmount } = render(<PollResultChart poll={mockPoll} />);
    
    // Get the mock chart instance
    const mockChartInstance = (Chart as unknown as jest.Mock).mock.results[0].value;
    
    unmount();
    
    expect(mockChartInstance.destroy).toHaveBeenCalled();
  });

  it('recreates chart when poll data changes', () => {
    const { rerender } = render(<PollResultChart poll={mockPoll} />);
    
    // Get the mock chart instance
    const firstChartInstance = (Chart as unknown as jest.Mock).mock.results[0].value;
    
    // Update poll data
    const updatedPoll = {
      ...mockPoll,
      options: [
        { id: 'option-1', label: 'Option 1', voteCount: 10 },
        { id: 'option-2', label: 'Option 2', voteCount: 5 },
        { id: 'option-3', label: 'Option 3', voteCount: 3 },
      ],
    };
    
    rerender(<PollResultChart poll={updatedPoll} />);
    
    // Should destroy the previous chart
    expect(firstChartInstance.destroy).toHaveBeenCalled();
    
    // Should create a new chart with updated data
    expect(Chart).toHaveBeenCalledTimes(2);
    expect(Chart).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({
          datasets: expect.arrayContaining([
            expect.objectContaining({
              data: [10, 5, 3],
            }),
          ]),
        }),
      })
    );
  });

  it('recreates chart when chart type changes', () => {
    const { rerender } = render(<PollResultChart poll={mockPoll} chartType="doughnut" />);
    
    // Get the mock chart instance
    const firstChartInstance = (Chart as unknown as jest.Mock).mock.results[0].value;
    
    rerender(<PollResultChart poll={mockPoll} chartType="pie" />);
    
    // Should destroy the previous chart
    expect(firstChartInstance.destroy).toHaveBeenCalled();
    
    // Should create a new chart with updated type
    expect(Chart).toHaveBeenCalledTimes(2);
    expect(Chart).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'pie',
      })
    );
  });
});