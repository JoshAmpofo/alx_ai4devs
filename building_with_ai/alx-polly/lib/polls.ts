// Database helpers for polls
import { supabase } from '@/lib/supabase/client';
import type { Poll, PollOption, Vote, IsoDateString } from '@/types/poll';

// Database types
export type DatabasePoll = {
  id: string;
  question: string;
  description: string | null;
  created_by: string;
  created_at: string;
  expires_at: string | null;
};

export type DatabasePollOption = {
  id: string;
  poll_id: string;
  label: string;
  created_at: string;
  position?: number;
};

export type DatabaseVote = {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string | null;
  created_at: string;
};

export type DatabaseVoteCount = {
  option_id: string;
  poll_id: string;
  vote_count: number;
};

// Input types
export type CreatePollData = {
  question: string;
  description?: string | null;
  expiresAt?: string | null;
  options: string[];
};

export type UpdatePollData = {
  question: string;
  description?: string | null;
  expiresAt?: string | null;
  options?: string[];
};

// Error types
export class PollError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PollError';
  }
}

export class UnauthorizedError extends PollError {
  constructor(message: string = 'You are not authorized to perform this action') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ValidationError extends PollError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends PollError {
  constructor(message: string = 'Poll not found') {
    super(message, 'NOT_FOUND');
  }
}

// Centralized client access
const getSupabaseClient = () => supabase;

// Input validation utilities
const validatePollInput = {
  question: (question: string): string => {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length < 3) {
      throw new ValidationError('Question must be at least 3 characters long');
    }
    if (trimmed.length > 500) {
      throw new ValidationError('Question cannot exceed 500 characters');
    }
    return trimmed;
  },

  description: (description: string | null | undefined): string | null => {
    if (!description) return null;
    const trimmed = description.trim();
    if (trimmed.length > 2000) {
      throw new ValidationError('Description cannot exceed 2000 characters');
    }
    return trimmed || null;
  },

  options: (options: string[]): string[] => {
    const validOptions = options
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (validOptions.length < 2) {
      throw new ValidationError('At least 2 options are required');
    }

    if (validOptions.length > 20) {
      throw new ValidationError('Cannot have more than 20 options');
    }

    // Check for duplicates
    const uniqueOptions = [...new Set(validOptions)];
    if (uniqueOptions.length !== validOptions.length) {
      throw new ValidationError('Duplicate options are not allowed');
    }

    return validOptions;
  },

  expiresAt: (expiresAt: string | null | undefined): string | null => {
    if (!expiresAt) return null;
    
    const expireDate = new Date(expiresAt);
    const now = new Date();
    
    if (isNaN(expireDate.getTime())) {
      throw new ValidationError('Invalid expiration date format');
    }
    
    if (expireDate <= now) {
      throw new ValidationError('Expiration date must be in the future');
    }
    
    return expiresAt;
  }
};

// Authentication utilities
const authUtils = {
  async assertPollOwnership(pollId: string, userId: string): Promise<void> {
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('polls')
      .select('created_by')
      .eq('id', pollId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Poll not found');
      }
      throw new PollError(`Failed to verify poll ownership: ${error.message}`);
    }

    if (data.created_by !== userId) {
      throw new UnauthorizedError('You can only modify your own polls');
    }
  }
};

// Data transformation utilities
const transformers = {
  toPoll: (dbPoll: DatabasePoll, options: PollOption[]): Poll => ({
    id: dbPoll.id,
    question: dbPoll.question,
    description: dbPoll.description,
    options: options as ReadonlyArray<PollOption>,
    createdBy: dbPoll.created_by,
    createdAt: dbPoll.created_at,
    expiresAt: dbPoll.expires_at,
  }),

  toPollOption: (dbOption: Pick<DatabasePollOption, 'id' | 'label'>, voteCount: number = 0): PollOption => ({
    id: dbOption.id,
    label: dbOption.label,
    voteCount,
  }),
};

// Core poll operations
const pollOperations = {
  /**
   * Fetch poll options with vote counts
   */
  async getOptionsWithVoteCounts(pollId: string): Promise<PollOption[]> {
    const client = getSupabaseClient();
    
    // Get vote counts using the view
    const { data: voteCountsData, error: voteCountsError } = await client
      .from('poll_option_vote_counts')
      .select('option_id, vote_count')
      .eq('poll_id', pollId);

    if (voteCountsError) {
      throw new PollError(`Failed to fetch vote counts: ${voteCountsError.message}`);
    }

    // Get basic option info
    const { data: basicOptionsData, error: basicOptionsError } = await client
      .from('poll_options')
      .select('id, label, position')
      .eq('poll_id', pollId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (basicOptionsError) {
      throw new PollError(`Failed to fetch poll options: ${basicOptionsError.message}`);
    }

    // Create vote count lookup map
    const voteCountMap = new Map(
      voteCountsData?.map(vc => [vc.option_id, vc.vote_count]) || []
    );

    // Combine option data with vote counts
    return basicOptionsData?.map(opt => 
      transformers.toPollOption(opt, voteCountMap.get(opt.id) || 0)
    ) || [];
  },

  /**
   * Clear all options for a poll (used in updates)
   */
  async clearPollOptions(pollId: string): Promise<void> {
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('poll_options')
      .delete()
      .eq('poll_id', pollId);

    if (error) {
      throw new PollError(`Failed to clear poll options: ${error.message}`);
    }
  },

  /**
   * Insert new options for a poll
   */
  async insertPollOptions(pollId: string, options: string[]): Promise<void> {
    const client = getSupabaseClient();
    
    const optionsToInsert = options.map((option, index) => ({
      poll_id: pollId,
      label: option,
      position: index,
    }));

    const { error } = await client
      .from('poll_options')
      .insert(optionsToInsert);

    if (error) {
      throw new PollError(`Failed to insert poll options: ${error.message}`);
    }
  }
};

/**
 * Create a new poll with options
 */
export async function createPoll(data: CreatePollData, userId: string): Promise<string> {
  try {
    // Validate input
    const question = validatePollInput.question(data.question);
    const description = validatePollInput.description(data.description);
    const expiresAt = validatePollInput.expiresAt(data.expiresAt);
    const options = validatePollInput.options(data.options);

    const client = getSupabaseClient();

    // Create the poll first
    const { data: pollData, error: pollError } = await client
      .from('polls')
      .insert({
        question,
        description,
        expires_at: expiresAt,
        created_by: userId,
      })
      .select('id')
      .single();

    if (pollError) {
      throw new PollError(`Failed to create poll: ${pollError.message}`);
    }

    // Insert poll options
    await pollOperations.insertPollOptions(pollData.id, options);

    return pollData.id;
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error creating poll: ${error}`);
  }
}

/**
 * Get a poll with its options and vote counts
 */
export async function getPollWithOptions(pollId: string): Promise<Poll | null> {
  try {
    const client = getSupabaseClient();

    // Get poll details
    const { data: pollData, error: pollError } = await client
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) {
      if (pollError.code === 'PGRST116') {
        return null; // Poll not found
      }
      throw new PollError(`Failed to fetch poll: ${pollError.message}`);
    }

    if (!pollData) return null;

    // Get options with vote counts
    const options = await pollOperations.getOptionsWithVoteCounts(pollId);

    return transformers.toPoll(pollData, options);
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error fetching poll: ${error}`);
  }
}

/**
 * Get polls created by a user
 */
export async function getUserPolls(userId: string): Promise<Poll[]> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('polls')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new PollError(`Failed to fetch user polls: ${error.message}`);
    }

    const polls: Poll[] = [];
    
    for (const poll of data || []) {
      const options = await pollOperations.getOptionsWithVoteCounts(poll.id);
      polls.push(transformers.toPoll(poll, options));
    }

    return polls;
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error fetching user polls: ${error}`);
  }
}

/**
 * Cast a vote on a poll
 */
export async function castVote(pollId: string, optionId: string, voterId?: string): Promise<void> {
  try {
    const client = getSupabaseClient();

    // Verify the option belongs to the poll
    const { data: optionData, error: optionError } = await client
      .from('poll_options')
      .select('id')
      .eq('id', optionId)
      .eq('poll_id', pollId)
      .single();

    if (optionError || !optionData) {
      throw new ValidationError('Invalid option for this poll');
    }

    const { error } = await client
      .from('votes')
      .insert({
        poll_id: pollId,
        option_id: optionId,
        voter_id: voterId || null,
      });

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ValidationError('You have already voted on this poll');
      }
      throw new PollError(`Failed to cast vote: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error casting vote: ${error}`);
  }
}

/**
 * Check if user has already voted on a poll
 */
export async function hasUserVoted(pollId: string, voterId: string): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('voter_id', voterId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new PollError(`Failed to check vote status: ${error.message}`);
    }
    
    return !!data;
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error checking vote status: ${error}`);
  }
}

/**
 * Delete a poll (and all its options and votes via cascade)
 */
export async function deletePoll(pollId: string, userId: string): Promise<void> {
  try {
    // Verify ownership
    await authUtils.assertPollOwnership(pollId, userId);

    const client = getSupabaseClient();

    // Delete the poll (cascade will handle options and votes)
    const { error } = await client
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (error) {
      throw new PollError(`Failed to delete poll: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error deleting poll: ${error}`);
  }
}

/**
 * Update a poll's question and description
 */
export async function updatePoll(
  pollId: string, 
  userId: string, 
  data: Pick<UpdatePollData, 'question' | 'description' | 'expiresAt'>
): Promise<void> {
  try {
    // Verify ownership
    await authUtils.assertPollOwnership(pollId, userId);

    // Validate input
    const question = validatePollInput.question(data.question);
    const description = validatePollInput.description(data.description);
    const expiresAt = validatePollInput.expiresAt(data.expiresAt);

    const client = getSupabaseClient();

    // Update the poll
    const { error } = await client
      .from('polls')
      .update({
        question,
        description,
        expires_at: expiresAt,
      })
      .eq('id', pollId);

    if (error) {
      throw new PollError(`Failed to update poll: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error updating poll: ${error}`);
  }
}

/**
 * Update poll options - replaces all existing options with new ones
 */
export async function updatePollOptions(
  pollId: string,
  userId: string,
  options: string[]
): Promise<void> {
  try {
    // Verify ownership
    await authUtils.assertPollOwnership(pollId, userId);

    // Validate options
    const validOptions = validatePollInput.options(options);

    // Clear existing options and insert new ones
    await pollOperations.clearPollOptions(pollId);
    await pollOperations.insertPollOptions(pollId, validOptions);
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error updating poll options: ${error}`);
  }
}

/**
 * Update both poll details and options in a single operation
 */
export async function updatePollComplete(
  pollId: string,
  userId: string,
  data: UpdatePollData
): Promise<void> {
  try {
    // Verify ownership once at the beginning
    await authUtils.assertPollOwnership(pollId, userId);

    // Update poll details
    await updatePoll(pollId, userId, {
      question: data.question,
      description: data.description,
      expiresAt: data.expiresAt,
    });

    // Update options if provided
    if (data.options) {
      await updatePollOptions(pollId, userId, data.options);
    }
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error updating poll: ${error}`);
  }
}
