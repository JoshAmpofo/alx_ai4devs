import PollVoting from '@/components/polls/PollVoting';
import { getPollWithOptions } from '@/lib/polls';
import { notFound } from 'next/navigation';

interface PollDetailPageProps { 
  readonly params: Promise<{ readonly id: string }> 
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const poll = await getPollWithOptions(resolvedParams.id);
  
  return {
    title: poll ? `${poll.question} - Alx Polly` : 'Poll - Alx Polly',
    description: poll ? poll.description || 'Vote and see results for this poll' : 'Vote and see results for this poll',
  };
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const resolvedParams = await params;
  const poll = await getPollWithOptions(resolvedParams.id);
  
  if (!poll) {
    notFound();
  }
  
  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <nav className="text-sm text-gray-600 flex justify-between items-center">
          <a href="/polls" className="hover:text-blue-600 underline">← Back to Polls</a>
          <a href={`/polls/${resolvedParams.id}/results`} className="hover:text-blue-600 underline">View Detailed Results →</a>
        </nav>
      </div>
      
      <PollVoting pollId={resolvedParams.id} />
    </main>
  );
}
