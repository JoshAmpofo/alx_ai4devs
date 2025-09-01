'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PollNotFound() {
  return (
    <main className="container mx-auto p-6 max-w-4xl">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-xl text-red-700">Poll Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-gray-700">
            The poll you're looking for doesn't exist or may have been deleted.
          </p>
          <div className="flex gap-4">
            <Link href="/polls">
              <Button variant="outline">View All Polls</Button>
            </Link>
            <Link href="/polls/new">
              <Button>Create New Poll</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}