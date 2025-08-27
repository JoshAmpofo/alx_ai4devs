import Link from "next/link";
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
                <Link key={i} href={`/polls/${i}`} className="block">
                  <div className="rounded-lg border p-4 h-full hover:bg-accent transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">Sample poll #{i}</p>
                      <p className="text-sm text-muted-foreground">What do you prefer the most?</p>
                    </div>
                    <div className="mt-3 text-xs text-muted-foreground">4 options • 0 votes</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
