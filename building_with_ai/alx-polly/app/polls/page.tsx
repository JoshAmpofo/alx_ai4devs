import { PollList } from "@/components/polls/PollList";
import { supabase } from "@/lib/supabase";
import { Poll } from "@/types/Poll";

async function getPolls(): Promise<Poll[]> {
  const { data, error } = await supabase.from("polls").select("*");

  if (error) {
    console.error("Error fetching polls:", error);
    return [];
  }

  return data as Poll[];
}

export default async function PollsPage() {
  const polls = await getPolls();

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">All Polls</h1>
          <a 
            href="/polls/new" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Poll
          </a>
        </div>
        {polls.length > 0 ? (
          <PollList polls={polls} />
        ) : (
          <p className="text-gray-600">No polls created yet. Create your first poll!</p>
        )}
      </div>
    </div>
  );
}
