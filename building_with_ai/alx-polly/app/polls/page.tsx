import Link from "next/link";
import type { Metadata } from "next";
import { siteBaseUrl } from "@/lib/site";

export function generateMetadata(): Metadata {
  return {
    alternates: {
      canonical: new URL("/polls", siteBaseUrl).toString(),
    },
  };
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PollsListPage() {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Polls</h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your polls.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/polls/new">
            <Button size="sm">Create poll</Button>
          </Link>
          <Link href="/polls">
            <Button variant="outline" size="sm">My polls</Button>
          </Link>
        </div>
      </div>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>My Polls</CardTitle>
            <CardDescription>Your created polls. Click a card to view details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Link
                  key={i}
                  href={`/polls/${i}`}
                  className="block rounded-lg border p-4 h-full hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">Sample poll #{i}</h3>
                    <p className="text-sm text-muted-foreground">What do you prefer the most?</p>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">4 options • 0 votes</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
