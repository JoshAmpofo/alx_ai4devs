export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  userId: string;
  createdAt: string;
};

export type Vote = {
  id: string;
  pollId: string;
  optionId: string;
  voterId?: string;
  createdAt: string;
};
