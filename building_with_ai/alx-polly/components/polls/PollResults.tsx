'use client';

import { useState } from 'react';
import type { Poll } from '@/types';
import PollResultChart from './PollResultChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PollResultsProps {
  poll: Poll;
}

export default function PollResults({ poll }: PollResultsProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'doughnut'>('doughnut');
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Poll Results</CardTitle>
          <CardDescription>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Chart Type Selector */}
          <div className="flex justify-center space-x-2 mb-4">
            <Button 
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
            >
              Bar
            </Button>
            <Button 
              variant={chartType === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('pie')}
            >
              Pie
            </Button>
            <Button 
              variant={chartType === 'doughnut' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('doughnut')}
            >
              Doughnut
            </Button>
          </div>

          {/* Chart */}
          <PollResultChart poll={poll} chartType={chartType} />

          {/* Detailed Results */}
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-500">Detailed Results</h3>
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 ? (option.voteCount / totalVotes) * 100 : 0;
              const isWinning = option.voteCount === Math.max(...poll.options.map(opt => opt.voteCount)) && option.voteCount > 0;
              
              return (
                <div key={option.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${isWinning ? 'text-blue-600' : 'text-gray-900'}`}>
                      {option.label}
                      {isWinning && totalVotes > 0 && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Leading
                        </span>
                      )}
                    </span>
                    <div className="text-sm text-gray-600">
                      {option.voteCount} votes ({percentage.toFixed(1)}%)
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isWinning ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {totalVotes === 0 && (
            <p className="text-center text-gray-500 py-8">
              No votes yet. Be the first to vote!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}