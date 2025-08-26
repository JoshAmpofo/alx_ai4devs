// Polls listing page
import { Card } from "@/components/ui/card";

export default function PollsPage() {
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
        <Card>
          <p className="text-gray-600">No polls created yet. Create your first poll!</p>
          {/* Poll list will go here */}
        </Card>
      </div>
    </div>
  );
}
