export type PollOption = {
  readonly id: string;
  readonly label: string;
  readonly voteCount: number;
};

export type IsoDateString = string;

export type Poll = {
  id: string;
  question: string;
  options: ReadonlyArray<PollOption>;
  createdBy: string;
  createdAt: IsoDateString;
};

export type Vote = {
  readonly id: string;
  readonly pollId: string;
  readonly optionId: string;
  readonly voterId: string | null;
  readonly createdAt: IsoDateString;
};

/**
 * Checks that the provided vote references an option that belongs to the given poll.
 * Throws an Error if the relationship is invalid.
 */
export function assertVoteRelationalIntegrity(
  vote: Pick<Vote, "pollId" | "optionId">,
  poll: Pick<Poll, "id" | "options">
): void {
  if (vote.pollId !== poll.id) {
    throw new Error("Vote references a different pollId than provided poll");
  }
  const optionBelongsToPoll = poll.options.some((option) => option.id === vote.optionId);
  if (!optionBelongsToPoll) {
    throw new Error("Vote references an option that does not belong to the poll");
  }
}

/**
 * Safe boolean variant to check vote <-> poll relationship without throwing.
 */
export function isVoteRelationallyValid(
  vote: Pick<Vote, "pollId" | "optionId">,
  poll: Pick<Poll, "id" | "options">
): boolean {
  return (
    vote.pollId === poll.id && poll.options.some((option) => option.id === vote.optionId)
  );
}
