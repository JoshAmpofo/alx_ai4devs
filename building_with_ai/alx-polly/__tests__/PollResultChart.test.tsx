import React from 'react';
import { render } from '@testing-library/react';
import PollResultChart from '@/components/polls/PollResultChart';
import { Chart } from 'chart.js';

const mockDestroy = jest.fn();
jest.mock('chart.js', () => ({
    Chart: Object.assign(
        jest.fn().mockImplementation(() => ({
            destroy: mockDestroy,
        })),
        { register: jest.fn() }
    ),
    registerables: [],
}));

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
    (Chart as jest.Mock).mockClear();
    mockDestroy.mockClear();
    (Chart.register as jest.Mock).mockClear();
    
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      // Mock canvas context methods if needed
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
    
    unmount();
    
    expect(mockDestroy).toHaveBeenCalled();
  });

  it('recreates chart when poll data changes', () => {
    const { rerender } = render(<PollResultChart poll={mockPoll} />);
    
    const updatedPoll = {
      ...mockPoll,
      options: [
        { id: 'option-1', label: 'Option 1', voteCount: 10 },
        { id: 'option-2', label: 'Option 2', voteCount: 5 },
        { id: 'option-3', label: 'Option 3', voteCount: 3 },
      ],
    };
    
    rerender(<PollResultChart poll={updatedPoll} />);
    
    expect(mockDestroy).toHaveBeenCalled();
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
        
    rerender(<PollResultChart poll={mockPoll} chartType="pie" />);
    
    expect(mockDestroy).toHaveBeenCalled();
    expect(Chart).toHaveBeenCalledTimes(2);
    expect(Chart).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'pie',
      })
    );
  });
});
