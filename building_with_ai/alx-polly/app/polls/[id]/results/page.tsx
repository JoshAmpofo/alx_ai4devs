import { getPollWithOptions } from '@/lib/polls';
import { notFound } from 'next/navigation';
import PollResults from '@/components/polls/PollResults';
import type { Metadata } from 'next';

interface PollResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PollResultsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const poll = await getPollWithOptions(resolvedParams.id);
  
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
  const resolvedParams = await params;
  const poll = await getPollWithOptions(resolvedParams.id);
  
  if (!poll) {
    notFound();
  }
  
  return (
    <div className="container max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">{poll.question}</h1>
      {poll.description && (
        <p className="text-gray-600 mb-6">{poll.description}</p>
      )}
      
      <PollResults poll={poll} />
    </div>
  );
}