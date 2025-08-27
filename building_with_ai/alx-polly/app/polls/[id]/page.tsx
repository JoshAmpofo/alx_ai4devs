interface PollDetailPageProps { readonly params: { readonly id: string } }
export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Poll #${params.id}`,
  };
}
export default function PollDetailPage({ params }: PollDetailPageProps) {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-xl font-medium">Poll #{params.id}</h1>
    </main>
  );
}
