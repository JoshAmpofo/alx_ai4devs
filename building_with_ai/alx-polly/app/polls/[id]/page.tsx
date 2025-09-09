import PollVoting from '@/components/polls/PollVoting';
import { getPollWithOptions } from '@/lib/polls';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PollDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PollDetailPageProps) {
  const poll = await getPollWithOptions(params.id);

  return {
    title: poll ? `${poll.question} - Alx Polly` : 'Poll - Alx Polly',
    description: poll
      ? poll.description || 'Vote and see results for this poll'
      : 'Vote and see results for this poll',
  };
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  // Fetching poll data once to ensure it exists before rendering
  const poll = await getPollWithOptions(params.id);

  if (!poll) {
    notFound();
  }

  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <nav className="text-sm text-gray-600 flex justify-between items-center">
          <Link href="/polls" className="hover:text-blue-600 underline">
            ← Back to Polls
          </Link>
          <Link
            href={`/polls/${params.id}/results`}
            className="hover:text-blue-600 underline"
          >
            View Detailed Results →
          </Link>
        </nav>
      </div>

      <PollVoting pollId={params.id} />
    </main>
  );
}
