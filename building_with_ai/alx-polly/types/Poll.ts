export interface Poll {
  id: number;
  question: string;
  options: { text: string; votes: number }[];
  created_at: string;
}
