import { getPollWithOptions } from '@/lib/polls';
import { notFound } from 'next/navigation';
import PollResults from '@/components/polls/PollResults';
import type { Metadata } from 'next';
import Link from 'next/link';

interface PollResultsPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PollResultsPageProps): Promise<Metadata> {
  const poll = await getPollWithOptions(params.id);
  
  if (!poll) {
    return {
      title: 'Poll Not Found',
    };
  }
  
  return {
    title: `Results: ${poll.question}`,
    description: `View the results for the poll: ${poll.question}`,
  };
}

export default async function PollResultsPage({ params }: PollResultsPageProps) {
  const poll = await getPollWithOptions(params.id);
  
  if (!poll) {
    notFound();
  }
  
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Link href={`/polls/${poll.id}`} className="text-blue-500 hover:underline">
          &larr; Back to Poll
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-2">{poll.question}</h1>
      {poll.description && (
        <p className="text-gray-600 mb-6">{poll.description}</p>
      )}
      
      <PollResults poll={poll} />
    </div>
  );
}