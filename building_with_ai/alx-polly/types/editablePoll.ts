import type { PollOption } from './index';

/**
 * Represents a poll in edit mode with only the necessary fields for the EditPollForm component.
 */
export type EditablePoll = {
  id: string;
  question: string;
  description: string | null;
  expiresAt: string | null;
  options: ReadonlyArray<PollOption>;
};