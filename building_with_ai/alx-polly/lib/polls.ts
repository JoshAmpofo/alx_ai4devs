// Database helpers for polls
import { supabase } from '@/lib/supabase/client';
import type { Poll, PollOption, Vote, IsoDateString } from '@/types/poll';

// ========================================
// CONFIGURATION CONSTANTS
// ========================================

const VALIDATION_LIMITS = {
  QUESTION_MIN_LENGTH: 3,
  QUESTION_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 2000,
  OPTIONS_MIN_COUNT: 2,
  OPTIONS_MAX_COUNT: 20,
} as const;

const ERROR_CODES = {
  POLL_NOT_FOUND: 'PGRST116',
  UNIQUE_CONSTRAINT_VIOLATION: '23505',
} as const;

// ========================================
// TYPE DEFINITIONS
// ========================================

// Database types
export type DatabasePoll = {
  readonly id: string;
  readonly question: string;
  readonly description: string | null;
  readonly created_by: string;
  readonly created_at: string;
  readonly expires_at: string | null;
};

export type DatabasePollOption = {
  readonly id: string;
  readonly poll_id: string;
  readonly label: string;
  readonly created_at: string;
  readonly position?: number;
};

export type DatabaseVote = {
  readonly id: string;
  readonly poll_id: string;
  readonly option_id: string;
  readonly voter_id: string | null;
  readonly created_at: string;
};

export type DatabaseVoteCount = {
  readonly option_id: string;
  readonly poll_id: string;
  readonly vote_count: number;
};

// Input types
export type CreatePollData = {
  readonly question: string;
  readonly description?: string | null;
  readonly expiresAt?: string | null;
  readonly options: readonly string[];
};

export type UpdatePollData = {
  readonly question: string;
  readonly description?: string | null;
  readonly expiresAt?: string | null;
  readonly options?: readonly string[];
};

// ========================================
// ERROR CLASSES
// ========================================

export class PollError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'PollError';
  }
}

export class UnauthorizedError extends PollError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ValidationError extends PollError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends PollError {
  constructor(message = 'Poll not found') {
    super(message, 'NOT_FOUND');
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get the Supabase client instance
 */
const getClient = () => supabase;

/**
 * Centralized error handling for database operations
 */
const handleDatabaseError = (error: any, operation: string): never => {
  if (error.code === ERROR_CODES.POLL_NOT_FOUND) {
    throw new NotFoundError('Poll not found');
  }
  throw new PollError(`Failed to ${operation}: ${error.message}`);
};

/**
 * Create options data for database insertion
 */
const createOptionsData = (pollId: string, options: readonly string[]) => 
  options.map((option, index) => ({
    poll_id: pollId,
    label: option,
    position: index,
  }));

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Input validation utilities with improved error messages
 */
const validators = {
  question: (question: string): string => {
    const trimmed = question.trim();
    if (!trimmed || trimmed.length < VALIDATION_LIMITS.QUESTION_MIN_LENGTH) {
      throw new ValidationError(`Question must be at least ${VALIDATION_LIMITS.QUESTION_MIN_LENGTH} characters long`);
    }
    if (trimmed.length > VALIDATION_LIMITS.QUESTION_MAX_LENGTH) {
      throw new ValidationError(`Question cannot exceed ${VALIDATION_LIMITS.QUESTION_MAX_LENGTH} characters`);
    }
    return trimmed;
  },

  description: (description: string | null | undefined): string | null => {
    if (!description) return null;
    const trimmed = description.trim();
    if (trimmed.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError(`Description cannot exceed ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters`);
    }
    return trimmed || null;
  },

  options: (options: readonly string[]): string[] => {
    const validOptions = options
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (validOptions.length < VALIDATION_LIMITS.OPTIONS_MIN_COUNT) {
      throw new ValidationError(`At least ${VALIDATION_LIMITS.OPTIONS_MIN_COUNT} options are required`);
    }

    if (validOptions.length > VALIDATION_LIMITS.OPTIONS_MAX_COUNT) {
      throw new ValidationError(`Cannot have more than ${VALIDATION_LIMITS.OPTIONS_MAX_COUNT} options`);
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

// ========================================
// AUTHENTICATION UTILITIES
// ========================================

/**
 * Verify that a user owns a specific poll
 */
const assertPollOwnership = async (pollId: string, userId: string): Promise<void> => {
  const client = getClient();
  
  const { data, error } = await client
    .from('polls')
    .select('created_by')
    .eq('id', pollId)
    .single();

  if (error) {
    handleDatabaseError(error, 'verify poll ownership');
  }

  if (!data || data.created_by !== userId) {
    throw new UnauthorizedError('You can only modify your own polls');
  }
};

// ========================================
// DATA TRANSFORMATION UTILITIES  
// ========================================

/**
 * Transform database poll data to application Poll type
 */
const transformToPoll = (dbPoll: DatabasePoll, options: PollOption[]): Poll => ({
  id: dbPoll.id,
  question: dbPoll.question,
  description: dbPoll.description,
  options: options as ReadonlyArray<PollOption>,
  createdBy: dbPoll.created_by,
  createdAt: dbPoll.created_at,
  expiresAt: dbPoll.expires_at,
});

/**
 * Transform database poll option to application PollOption type
 */
const transformToPollOption = (
  dbOption: Pick<DatabasePollOption, 'id' | 'label'>, 
  voteCount = 0
): PollOption => ({
  id: dbOption.id,
  label: dbOption.label,
  voteCount,
});

// ========================================
// DATABASE OPERATIONS
// ========================================

/**
 * Fetch poll options with their vote counts efficiently
 */
const fetchOptionsWithVoteCounts = async (pollId: string): Promise<PollOption[]> => {
  const client = getClient();
  
  // Run both queries concurrently for better performance
  const [voteCountsResult, optionsResult] = await Promise.all([
    client
      .from('poll_option_vote_counts')
      .select('option_id, vote_count')
      .eq('poll_id', pollId),
    
    client
      .from('poll_options')
      .select('id, label, position')
      .eq('poll_id', pollId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
  ]);

  if (voteCountsResult.error) {
    throw new PollError(`Failed to fetch vote counts: ${voteCountsResult.error.message}`);
  }

  if (optionsResult.error) {
    throw new PollError(`Failed to fetch poll options: ${optionsResult.error.message}`);
  }

  // Create vote count lookup map with proper typing
  const voteCountMap = new Map(
    voteCountsResult.data?.map(vc => [vc.option_id, vc.vote_count]) || []
  );

  // Combine option data with vote counts
  return optionsResult.data?.map(opt => 
    transformToPollOption(opt, voteCountMap.get(opt.id) || 0)
  ) || [];
};

/**
 * Clear all options for a poll (used in updates)
 */
const clearPollOptions = async (pollId: string): Promise<void> => {
  const client = getClient();
  
  const { error } = await client
    .from('poll_options')
    .delete()
    .eq('poll_id', pollId);

  if (error) {
    throw new PollError(`Failed to clear poll options: ${error.message}`);
  }
};

/**
 * Insert new options for a poll
 */
const insertPollOptions = async (pollId: string, options: readonly string[]): Promise<void> => {
  const client = getClient();
  
  const optionsToInsert = createOptionsData(pollId, options);

  const { error } = await client
    .from('poll_options')
    .insert(optionsToInsert);

  if (error) {
    throw new PollError(`Failed to insert poll options: ${error.message}`);
  }
};

// ========================================
// EXPORTED FUNCTIONS
// ========================================

/**
 * Create a new poll with options
 */
export async function createPoll(data: CreatePollData, userId: string): Promise<string> {
  try {
    // Validate input
    const question = validators.question(data.question);
    const description = validators.description(data.description);
    const expiresAt = validators.expiresAt(data.expiresAt);
    const options = validators.options(data.options);

    const client = getClient();

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
    await insertPollOptions(pollData.id, options);

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
    const client = getClient();

    // Get poll details
    const { data: pollData, error: pollError } = await client
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (pollError) {
      if (pollError.code === ERROR_CODES.POLL_NOT_FOUND) {
        return null; // Poll not found
      }
      throw new PollError(`Failed to fetch poll: ${pollError.message}`);
    }

    if (!pollData) return null;

    // Get options with vote counts
    const options = await fetchOptionsWithVoteCounts(pollId);

    return transformToPoll(pollData, options);
  } catch (error) {
    if (error instanceof PollError) {
      throw error;
    }
    throw new PollError(`Unexpected error fetching poll: ${error}`);
  }
}

/**
 * Get polls created by a user (optimized for performance)
 */
export async function getUserPolls(userId: string): Promise<Poll[]> {
  try {
    const client = getClient();

    // First, get all polls for the user
    const { data: pollsData, error } = await client
      .from('polls')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new PollError(`Failed to fetch user polls: ${error.message}`);
    }

    if (!pollsData || pollsData.length === 0) {
      return [];
    }

    // Get all poll IDs for batch operations
    const pollIds = pollsData.map(poll => poll.id);

    // Batch fetch all vote counts for these polls
    const { data: allVoteCounts, error: voteCountsError } = await client
      .from('poll_option_vote_counts')
      .select('poll_id, option_id, vote_count')
      .in('poll_id', pollIds);

    if (voteCountsError) {
      throw new PollError(`Failed to fetch vote counts: ${voteCountsError.message}`);
    }

    // Batch fetch all options for these polls
    const { data: allOptions, error: optionsError } = await client
      .from('poll_options')
      .select('poll_id, id, label, position, created_at')
      .in('poll_id', pollIds)
      .order('poll_id')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (optionsError) {
      throw new PollError(`Failed to fetch poll options: ${optionsError.message}`);
    }

    // Create lookup maps for efficient data access
    const voteCountsByPoll = new Map<string, Map<string, number>>();
    const optionsByPoll = new Map<string, DatabasePollOption[]>();

    // Group vote counts by poll
    (allVoteCounts || []).forEach(vc => {
      if (!voteCountsByPoll.has(vc.poll_id)) {
        voteCountsByPoll.set(vc.poll_id, new Map());
      }
      voteCountsByPoll.get(vc.poll_id)!.set(vc.option_id, vc.vote_count);
    });

    // Group options by poll
    (allOptions || []).forEach(option => {
      if (!optionsByPoll.has(option.poll_id)) {
        optionsByPoll.set(option.poll_id, []);
      }
      optionsByPoll.get(option.poll_id)!.push(option as DatabasePollOption);
    });

    // Transform polls with their options and vote counts
    return pollsData.map(poll => {
      const pollVoteCounts = voteCountsByPoll.get(poll.id) || new Map();
      const pollOptions = optionsByPoll.get(poll.id) || [];
      
      const options = pollOptions.map(option => 
        transformToPollOption(option, pollVoteCounts.get(option.id) || 0)
      );

      return transformToPoll(poll, options);
    });

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
    const client = getClient();

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
      if (error.code === ERROR_CODES.UNIQUE_CONSTRAINT_VIOLATION) {
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
    const client = getClient();

    const { data, error } = await client
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('voter_id', voterId)
      .single();

    if (error && error.code !== ERROR_CODES.POLL_NOT_FOUND) {
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
    await assertPollOwnership(pollId, userId);

    const client = getClient();

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
    await assertPollOwnership(pollId, userId);

    // Validate input
    const question = validators.question(data.question);
    const description = validators.description(data.description);
    const expiresAt = validators.expiresAt(data.expiresAt);

    const client = getClient();

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
  options: readonly string[]
): Promise<void> {
  try {
    // Verify ownership
    await assertPollOwnership(pollId, userId);

    // Validate options
    const validOptions = validators.options(options);

    // Clear existing options and insert new ones
    await clearPollOptions(pollId);
    await insertPollOptions(pollId, validOptions);
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
    await assertPollOwnership(pollId, userId);

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
