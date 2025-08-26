import { Poll } from "@/types/Poll";
import { PollCard } from "./PollCard";

interface PollListProps {
  polls: Poll[];
}

export function PollList({ polls }: PollListProps) {
  return (
    <div className="space-y-4">
      {polls.map((poll) => (
        <PollCard poll={poll} key={poll.id} />
      ))}
    </div>
  );
}
