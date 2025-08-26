'use client'

import { Card } from "@/components/ui/card";
import { Poll } from "@/types/Poll";
import Link from "next/link";

interface PollCardProps {
  poll: Poll;
}

export function PollCard({ poll }: PollCardProps) {
  return (
    <Link href={`/polls/${poll.id}`} key={poll.id}>
      <Card className="p-4 hover:bg-gray-100 cursor-pointer">
        <h2 className="text-xl font-semibold">{poll.question}</h2>
        <p className="text-sm text-gray-500">
          Created at {new Date(poll.created_at).toLocaleString()}
        </p>
      </Card>
    </Link>
  );
}
