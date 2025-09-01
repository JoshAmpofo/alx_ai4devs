'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import type { Poll } from '@/types';

// Register all Chart.js components
Chart.register(...registerables);

interface PollResultChartProps {
  poll: Poll;
  chartType?: 'bar' | 'pie' | 'doughnut';
}

export default function PollResultChart({ poll, chartType = 'doughnut' }: PollResultChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !poll) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data for the chart
    const labels = poll.options.map(option => option.label);
    const data = poll.options.map(option => option.voteCount);
    
    // Generate colors based on the number of options
    const generateColors = (count: number) => {
      const baseColors = [
        'rgba(54, 162, 235, 0.8)',   // Blue
        'rgba(255, 99, 132, 0.8)',    // Red
        'rgba(75, 192, 192, 0.8)',    // Green
        'rgba(255, 206, 86, 0.8)',    // Yellow
        'rgba(153, 102, 255, 0.8)',   // Purple
        'rgba(255, 159, 64, 0.8)',    // Orange
      ];
      
      // If we have more options than base colors, generate additional colors
      if (count <= baseColors.length) {
        return baseColors.slice(0, count);
      } else {
        const colors = [...baseColors];
        for (let i = baseColors.length; i < count; i++) {
          const r = Math.floor(Math.random() * 255);
          const g = Math.floor(Math.random() * 255);
          const b = Math.floor(Math.random() * 255);
          colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
        }
        return colors;
      }
    };

    const colors = generateColors(poll.options.length);

    // Create the chart
    chartInstance.current = new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          label: 'Votes',
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                size: 12,
              },
              padding: 20,
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw as number;
                const total = data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${label}: ${value} votes (${percentage}%)`;
              }
            }
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [poll, chartType]);

  return (
    <div className="w-full h-64 md:h-80 mt-4">
      <canvas ref={chartRef} />
    </div>
  );
}