/**
 * PollVoting component manages the voting flow for a single poll, including authentication, option selection, vote submission, and result display.
 * Needed to allow users to participate in polls, see live results, and handle edge cases like expired polls or duplicate votes.
 * Assumes pollId is valid, user is authenticated, and poll data is available from backend.
 * Edge cases: poll not found, expired poll, user already voted, network errors, invalid option selection.
 * Connects to PollResultChart, PollResults, and authentication flows.
 */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { getPollWithOptions, castVote, hasUserVoted } from '@/lib/polls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Poll } from '@/types';
import PollResultChart from './PollResultChart';

interface PollVotingProps {
  pollId: string;
}

/**
 * Handles poll voting UI and logic, including fetching poll data, checking vote status, submitting votes, and displaying results.
 * Needed for interactive poll participation and feedback.
 * Assumes pollId is valid and user context is available.
 * Edge cases: missing poll, expired poll, user not logged in, network errors.
 * Used by poll detail pages and dashboard.
 */
export default function PollVoting({ pollId }: PollVotingProps) {
  const { user, loading: authLoading } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPoll();
  }, [pollId]);

  useEffect(() => {
    if (user && poll) {
      checkIfUserVoted();
    }
  }, [user, poll]);

  /**
   * Fetches poll data with options and vote counts from backend.
   * Needed to display poll details and enable voting.
   * Assumes pollId is valid.
   * Edge cases: poll not found, network errors.
   * Used on mount and after voting.
   */
  const fetchPoll = async () => {
    try {
      setLoading(true);
      const pollData = await getPollWithOptions(pollId);
      if (!pollData) {
        setError('Poll not found');
        return;
      }
      setPoll(pollData);
    } catch (err) {
      setError('Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Checks if the current user has already voted on this poll.
   * Needed to prevent duplicate votes and update UI accordingly.
   * Assumes user and poll are available.
   * Edge cases: backend errors, user not found.
   * Used after poll/user load and after voting.
   */
  const checkIfUserVoted = async () => {
    if (!user || !poll) return;
    
    try {
      const voted = await hasUserVoted(poll.id, user.id);
      setHasVoted(voted);
    } catch (err) {
      console.error('Failed to check vote status:', err);
    }
  };

  /**
   * Handles vote submission, including validation, backend call, and UI updates.
   * Needed to record user votes and show feedback/results.
   * Assumes user is authenticated and option is selected.
   * Edge cases: no option selected, poll expired, user not logged in, network errors.
   * Connects to backend and triggers poll refresh.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    if (!user) {
      setError('Please log in to vote');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await castVote(pollId, selectedOption, user.id);
      setHasVoted(true);
      setShowThankYou(true);
      // Refresh poll data to show updated results
      await fetchPoll();
      
      // Hide thank you message after 3 seconds
      setTimeout(() => setShowThankYou(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = poll?.expiresAt ? new Date(poll.expiresAt) <= new Date() : false;
  const totalVotes = poll?.options.reduce((sum, opt) => sum + opt.voteCount, 0) || 0;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!poll) return null;

  return (
    <div className="space-y-6">
      {/* Poll Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
          {poll.description && (
            <CardDescription className="text-base">{poll.description}</CardDescription>
          )}
          <div className="flex gap-4 text-sm text-gray-600">
            <span>Created: {new Date(poll.createdAt).toLocaleDateString()}</span>
            {poll.expiresAt && (
              <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                {isExpired ? 'Expired' : 'Expires'}: {new Date(poll.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Thank You Message */}
      {showThankYou && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-800 font-medium">Thank you for voting!</p>
                <p className="text-green-700 text-sm">Your vote has been recorded successfully.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Form or Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {hasVoted || isExpired ? 'Results' : 'Cast Your Vote'}
          </CardTitle>
          <CardDescription>
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasVoted && !isExpired && user ? (
            // Voting Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                {poll.options.map((option) => (
                  <div key={option.id} className="flex items-center">
                    <input
                      type="radio"
                      id={option.id}
                      name="pollOption"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <label
                      htmlFor={option.id}
                      className="ml-3 block text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={submitting || !selectedOption} className="w-full">
                {submitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </form>
          ) : (
            // Results Display
            <div className="space-y-4">
              {!user && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    <a href="/login" className="underline font-medium">Login</a> to vote on this poll
                  </p>
                </div>
              )}

              {isExpired && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 text-sm font-medium">
                    This poll has expired and is no longer accepting votes.
                  </p>
                </div>
              )}

              {hasVoted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm font-medium">
                    You have already voted on this poll.
                  </p>
                </div>
              )}
              
              {/* Use the PollResults component to display poll results */}
              <PollResultChart poll={poll} />
              
              <div className="space-y-3 mt-6">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
