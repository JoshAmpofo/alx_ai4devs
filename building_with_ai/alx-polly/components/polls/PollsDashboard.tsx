"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getUserPolls, deletePoll } from "@/lib/polls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EditPollForm from "./EditPollForm";
import type { Poll } from "@/types/poll";

// Simple Badge component
const Badge = ({ children, variant = "default" }: { 
  children: React.ReactNode; 
  variant?: "default" | "secondary" 
}) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === "default" 
      ? "bg-blue-100 text-blue-800" 
      : "bg-gray-100 text-gray-800"
  }`}>
    {children}
  </span>
);

export function PollsDashboard() {
  const { user, loading } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollsLoading, setPollsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPoll, setEditingPoll] = useState<string | null>(null);
  const [deletingPoll, setDeletingPoll] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserPolls();
    }
  }, [user]);

  const fetchUserPolls = async () => {
    if (!user) return;
    
    try {
      setPollsLoading(true);
      const userPolls = await getUserPolls(user.id);
      setPolls(userPolls);
    } catch (err) {
      console.error('Failed to fetch polls:', err);
      setError('Failed to load your polls');
    } finally {
      setPollsLoading(false);
    }
  };

  const handleDelete = async (pollId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingPoll(pollId);
      await deletePoll(pollId, user.id);
      // Refresh the polls list
      await fetchUserPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete poll');
    } finally {
      setDeletingPoll(null);
    }
  };

  const handleEditSuccess = async () => {
    setEditingPoll(null);
    await fetchUserPolls(); // Refresh the polls list
  };

  // Calculate dashboard metrics
  const totalPolls = polls.length;
  const totalVotes = polls.reduce((sum, poll) => 
    sum + poll.options.reduce((optSum, opt) => optSum + opt.voteCount, 0), 0
  );
  const avgVotesPerPoll = totalPolls > 0 ? Math.round(totalVotes / totalPolls * 10) / 10 : 0;
  const mostPopularPoll = polls.reduce((prev, current) => {
    const prevVotes = prev.options.reduce((sum, opt) => sum + opt.voteCount, 0);
    const currentVotes = current.options.reduce((sum, opt) => sum + opt.voteCount, 0);
    return currentVotes > prevVotes ? current : prev;
  }, polls[0]);

  if (loading || pollsLoading) {
    return (
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Please Login</CardTitle>
            <CardDescription>You need to be logged in to view your polls</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Polls Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's how your polls are performing.
          </p>
        </div>
        <Link href="/polls/new">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Poll
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Polls</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPolls}</div>
            <p className="text-xs text-muted-foreground">
              {totalPolls === 1 ? "poll created" : "polls created"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVotes}</div>
            <p className="text-xs text-muted-foreground">
              votes across all polls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Votes/Poll</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgVotesPerPoll}</div>
            <p className="text-xs text-muted-foreground">
              average engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostPopularPoll ? mostPopularPoll.options.reduce((sum, opt) => sum + opt.voteCount, 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              votes on top poll
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
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
      )}

      {/* Polls Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Your Polls</h2>
            <p className="text-muted-foreground">Click on any poll to view detailed results</p>
          </div>
        </div>

        {polls.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No polls yet</h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first poll and start gathering opinions!
                </p>
                <Link href="/polls/new">
                  <Button>Create Your First Poll</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {polls.map((poll) => {
              const totalPollVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
              const mostVotedOption = poll.options.reduce((prev, current) => 
                current.voteCount > prev.voteCount ? current : prev
              );
              const createdDate = new Date(poll.createdAt).toLocaleDateString();
              
              return (
                <Card key={poll.id} className="h-full transition-all duration-300 hover:shadow-lg">
                  {editingPoll === poll.id ? (
                    <CardContent className="pt-6">
                      <EditPollForm
                        poll={{
                          id: poll.id,
                          question: poll.question,
                          description: poll.description || null,
                          expiresAt: poll.expiresAt,
                          options: poll.options,
                        }}
                        userId={user.id}
                        onSuccess={handleEditSuccess}
                        onCancel={() => setEditingPoll(null)}
                      />
                    </CardContent>
                  ) : (
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2">
                              {poll.question}
                            </CardTitle>
                            {poll.description && (
                              <CardDescription className="mt-1">
                                {poll.description}
                              </CardDescription>
                            )}
                          </div>
                          <Badge variant={totalPollVotes > 0 ? "default" : "secondary"}>
                            {totalPollVotes > 0 ? "Active" : "New"}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">
                          Created on {createdDate}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Vote Statistics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{totalPollVotes}</div>
                            <div className="text-xs text-blue-600">Total Votes</div>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{poll.options.length}</div>
                            <div className="text-xs text-green-600">Options</div>
                          </div>
                        </div>

                        {/* Most Popular Option */}
                        {totalPollVotes > 0 && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-700 mb-1">Leading option:</div>
                            <div className="text-sm text-gray-600 truncate">"{mostVotedOption.label}"</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {mostVotedOption.voteCount} votes ({Math.round(mostVotedOption.voteCount / totalPollVotes * 100)}%)
                            </div>
                          </div>
                        )}

                        {/* Progress indicator for options */}
                        <div className="space-y-2">
                          {poll.options.slice(0, 3).map((option) => {
                            const percentage = totalPollVotes > 0 ? (option.voteCount / totalPollVotes) * 100 : 0;
                            return (
                              <div key={option.id} className="flex items-center text-xs">
                                <span className="w-20 truncate text-gray-600">{option.label}</span>
                                <div className="flex-1 mx-2 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300" 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-gray-500 min-w-[3rem] text-right">
                                  {option.voteCount}
                                </span>
                              </div>
                            );
                          })}
                          {poll.options.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{poll.options.length - 3} more options
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPoll(poll.id)}
                            disabled={deletingPoll === poll.id}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(poll.id)}
                            disabled={deletingPoll === poll.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                          >
                            {deletingPoll === poll.id ? 'Deleting...' : 'Delete'}
                          </Button>
                          <Link href={`/polls/${poll.id}`} className="flex-1">
                            <Button
                              size="sm"
                              className="w-full"
                              disabled={deletingPoll === poll.id}
                            >
                              View Poll
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
