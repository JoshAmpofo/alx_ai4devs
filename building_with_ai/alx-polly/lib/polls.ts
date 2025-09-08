// Database helpers for polls
import { supabase } from '@/lib/supabase/client';
import type { Poll, PollOption, Vote } from '@/types';

export type DatabasePoll = {
  id: string;
  question: string;
  description: string | null;
  created_by: string;
  created_at: string;
};

export type DatabasePollOption = {
  id: string;
  poll_id: string;
  label: string;
  created_at: string;
};

export type DatabaseVote = {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string | null;
  created_at: string;
};

export type CreatePollData = {
  question: string;
  description?: string | null;
  expiresAt?: string | null;
  options: string[];
};

/**
 * Create a new poll with options
 */
/**
 * Provides poll-related data operations for the app.
 * Needed to abstract poll CRUD logic and connect UI components to Supabase.
 * Assumes Supabase client is configured and poll schema matches usage.
 * Edge cases: missing poll, query errors, permission issues.
 * Used by PollsDashboard, EditPollForm, NewPollForm, PollVoting, etc.
 */
  export async function createPoll(data: CreatePollData, userId: string) {
    /**
     * Creates a new poll in Supabase.
     * Needed for poll creation workflow. Assumes valid pollData structure.
     * Edge cases: validation errors, network issues, permission denied.
     * Used by NewPollForm and NewPollClient.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  const { question, description, expiresAt, options } = data;
  
  if (options.length < 2) {
    throw new Error('At least 2 options are required');
  }

  // Create the poll first
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .insert({
      question: question.trim(),
      description: description?.trim() || null,
      expires_at: expiresAt,
      created_by: userId,
    })
    .select('id')
    .single();

  if (pollError) throw pollError;

  // Create the poll options
  const optionsToInsert = options
    .filter(opt => opt.trim().length > 0)
    .map((option) => ({
      poll_id: pollData.id,
      label: option.trim(),
    }));

  const { error: optionsError } = await supabase
    .from('poll_options')
    .insert(optionsToInsert);

  if (optionsError) throw optionsError;

  return pollData.id;
}

/**
 * Get a poll with its options and vote counts
 */
  export async function getPollWithOptions(pollId: string): Promise<Poll | null> {
    /**
     * Fetches a poll with its options and vote counts.
     * Needed for poll detail views. Assumes valid poll ID.
     * Edge cases: poll not found, query errors.
     * Used by PollDetail and PollVoting.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  // Get poll details
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .select('*')
    .eq('id', pollId)
    .single();

  if (pollError || !pollData) return null;

  // Get options with vote counts using the view
  const { data: optionsData, error: optionsError } = await supabase
    .from('poll_option_vote_counts')
    .select('option_id, vote_count')
    .eq('poll_id', pollId);

  if (optionsError) throw optionsError;

  // Get basic option info
  const { data: basicOptionsData, error: basicOptionsError } = await supabase
    .from('poll_options')
    .select('id, label')
    .eq('poll_id', pollId)
    .order('created_at', { ascending: true });

  if (basicOptionsError) throw basicOptionsError;

  // Combine option data with vote counts
  interface BasicOptionData {
    id: string;
    label: string;
  }

  interface VoteCountData {
    option_id: string;
    vote_count: number;
  }

  const options: PollOption[] = basicOptionsData?.map((opt: BasicOptionData) => {
    const voteData: VoteCountData | undefined = optionsData?.find((v: VoteCountData) => v.option_id === opt.id);
    return {
      id: opt.id,
      label: opt.label,
      voteCount: voteData?.vote_count || 0,
    };
  }) || [];

  return {
    id: pollData.id,
    question: pollData.question,
    description: pollData.description,
    options,
    createdBy: pollData.created_by,
    createdAt: pollData.created_at,
    expiresAt: pollData.expires_at,
  };
}

/**
 * Get polls created by a user
 */
  export async function getUserPolls(userId: string): Promise<Poll[]> {
    /**
     * Gets polls created by a user.
     * Needed for user dashboards and management. Assumes valid user ID.
     * Edge cases: no polls found, query errors.
     * Used by UserPollsDashboard.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  const { data, error } = await supabase
    .from('polls')
    .select(`
      id,
      question,
      description,
      expires_at,
      created_by,
      created_at
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const polls: Poll[] = [];
  
  for (const poll of data || []) {
    // Get options for each poll
    const { data: optionsData, error: optionsError } = await supabase
      .from('poll_options')
      .select('id, label')
      .eq('poll_id', poll.id)
      .order('created_at', { ascending: true });

    if (optionsError) throw optionsError;

    // Get vote counts using the view
    const { data: voteCountsData, error: voteCountsError } = await supabase
      .from('poll_option_vote_counts')
      .select('option_id, vote_count')
      .eq('poll_id', poll.id);

    if (voteCountsError) throw voteCountsError;

    // Create a map for quick vote count lookup
    interface VoteCountData {
      option_id: string;
      vote_count: number;
    }

    const voteCountMap = new Map<string, number>(
      voteCountsData?.map((vc: VoteCountData) => [vc.option_id, vc.vote_count]) || []
    );

    const options: PollOption[] = optionsData?.map((opt: any) => ({
      id: opt.id,
      label: opt.label,
      voteCount: voteCountMap.get(opt.id) || 0,
    })) || [];

    polls.push({
      id: poll.id,
      question: poll.question,
      description: poll.description,
      options,
      createdBy: poll.created_by,
      createdAt: poll.created_at,
      expiresAt: poll.expires_at,
    });
  }

  return polls;
}

/**
 * Cast a vote on a poll
 */
  export async function castVote(pollId: string, optionId: string, voterId?: string) {
    /**
     * Casts a vote on a poll.
     * Needed for user interaction with polls. Assumes valid poll and option IDs.
     * Edge cases: poll not found, option not found, permission issues.
     * Used by PollVoting.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  const { error } = await supabase
    .from('votes')
    .insert({
      poll_id: pollId,
      option_id: optionId,
      voter_id: voterId || null,
    });

  if (error) throw error;
}

/**
 * Check if user has already voted on a poll
 */
  export async function hasUserVoted(pollId: string, voterId: string): Promise<boolean> {
    /**
     * Checks if a user has already voted on a poll.
     * Needed to prevent multiple votes. Assumes valid poll ID and voter ID.
     * Edge cases: poll not found, query errors.
     * Used by PollVoting.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('voter_id', voterId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  
  return !!data;
}

/**
 * Delete a poll (and all its options and votes via cascade)
 */
  export async function deletePoll(pollId: string, userId: string): Promise<void> {
    /**
     * Deletes a poll and all its options and votes via cascade.
     * Needed for poll management. Assumes valid poll ID and user ownership.
     * Edge cases: poll not found, permission issues.
     * Used by PollManagement.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  // First verify the user owns this poll
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .select('created_by')
    .eq('id', pollId)
    .single();

  if (pollError) throw pollError;
  
  if (pollData.created_by !== userId) {
    throw new Error('You can only delete your own polls');
  }

  // Delete the poll (cascade will handle options and votes)
  const { error } = await supabase
    .from('polls')
    .delete()
    .eq('id', pollId);

  if (error) throw error;
}

/**
 * Update a poll's question and description
 */
  export async function updatePoll(
    pollId: string, 
    userId: string, 
    data: { question: string; description?: string | null; expiresAt?: string | null }
  ): Promise<void> {
    /**
     * Updates a poll's question and description.
     * Needed for poll editing workflow. Assumes valid poll ID and data.
     * Edge cases: update failure, invalid ID, permission issues.
     * Used by EditPollForm.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  // First verify the user owns this poll
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .select('created_by')
    .eq('id', pollId)
    .single();

  if (pollError) throw pollError;
  
  if (pollData.created_by !== userId) {
    throw new Error('You can only edit your own polls');
  }

  // Update the poll
  const { error } = await supabase
    .from('polls')
    .update({
      question: data.question.trim(),
      description: data.description?.trim() || null,
      expires_at: data.expiresAt,
    })
    .eq('id', pollId);

  if (error) throw error;
}

/**
 * Update poll options - replaces all existing options with new ones
 */
  export async function updatePollOptions(
    pollId: string,
    userId: string,
    options: string[]
  ): Promise<void> {
    /**
     * Updates poll options - replaces all existing options with new ones.
     * Needed for poll management. Assumes valid poll ID and user ownership.
     * Edge cases: validation errors, permission issues.
     * Used by EditPollForm.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  // First verify the user owns this poll
  const { data: pollData, error: pollError } = await supabase
    .from('polls')
    .select('created_by')
    .eq('id', pollId)
    .single();

  if (pollError) throw pollError;
  
  if (pollData.created_by !== userId) {
    throw new Error('You can only edit your own polls');
  }

  // Validate options
  const validOptions = options
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0);

  if (validOptions.length < 2) {
    throw new Error('At least 2 options are required');
  }

  // Start a transaction - delete old options and add new ones
  // First, delete all existing options (votes will be cascade deleted)
  const { error: deleteError } = await supabase
    .from('poll_options')
    .delete()
    .eq('poll_id', pollId);

  if (deleteError) throw deleteError;

  // Insert new options
  const optionsToInsert = validOptions.map((option, index) => ({
    poll_id: pollId,
    label: option,
    position: index,
  }));

  const { error: insertError } = await supabase
    .from('poll_options')
    .insert(optionsToInsert);

  if (insertError) throw insertError;
}

/**
 * Update both poll details and options in a single operation
 */
  export async function updatePollComplete(
    pollId: string,
    userId: string,
    data: {
      question: string;
      description?: string | null;
      expiresAt?: string | null;
      options: string[];
    }
  ): Promise<void> {
    /**
     * Updates both poll details and options in a single operation.
     * Needed for efficient poll management. Assumes valid poll ID and user ownership.
     * Edge cases: update failure, permission issues.
     * Used by EditPollForm.
     */
  if (!supabase) throw new Error('Supabase client not available');
  
  // Update poll details
  await updatePoll(pollId, userId, {
    question: data.question,
    description: data.description,
    expiresAt: data.expiresAt,
  });

  // Update options
  await updatePollOptions(pollId, userId, data.options);
}
