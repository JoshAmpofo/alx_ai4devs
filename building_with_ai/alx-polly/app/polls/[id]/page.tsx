interface PollDetailPageProps { readonly params: Promise<{ readonly id: string }> }
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return {
    title: `Poll #${resolvedParams.id}`,
  };
}
export default async function PollDetailPage({ params }: PollDetailPageProps) {
  const resolvedParams = await params;
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-xl font-medium">Poll #{resolvedParams.id}</h1>
    </main>
  );
}
