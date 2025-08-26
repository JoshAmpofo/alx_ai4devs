// Authentication page
import { Card } from "@/components/ui/card";

export default function AuthPage() {
  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center">Authentication</h1>
          <p className="text-gray-600 text-center">
            Sign in or create an account to manage your polls
          </p>
          {/* Add login/register forms here */}
        </div>
      </Card>
    </div>
  );
}
