import PollVoting from '@/components/polls/PollVoting';

interface PollDetailPageProps { 
  readonly params: Promise<{ readonly id: string }> 
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return {
    title: `Poll - Alx Polly`,
    description: `Vote and see results for this poll`,
  };
}

export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const resolvedParams = await params;
  
  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <nav className="text-sm text-gray-600">
          <a href="/polls" className="hover:text-blue-600 underline">← Back to Polls</a>
        </nav>
      </div>
      
      <PollVoting pollId={resolvedParams.id} />
    </main>
  );
}
