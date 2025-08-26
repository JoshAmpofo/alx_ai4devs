// New poll creation page
import { Card } from "@/components/ui/card";
import { NewPollForm } from "@/components/polls/NewPollForm";

export default function NewPollPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create New Poll</h1>
          <p className="text-gray-600">
            Create a new poll to gather opinions from your audience
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <NewPollForm />
        </Card>
      </div>
    </div>
  );
}
