"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

type PollOptionDraft = { id: string; label: string };

export default function NewPollPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<PollOptionDraft[]>([
    { id: crypto.randomUUID(), label: "" },
    { id: crypto.randomUUID(), label: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);

  function addOption() {
    setOptions((prev) => [...prev, { id: crypto.randomUUID(), label: "" }]);
  }

  function updateOption(id: string, label: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  }

  function removeOption(id: string) {
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((o) => o.id !== id)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Placeholder: later this will call an API to create a poll in Supabase
    await new Promise((r) => setTimeout(r, 800));

    setSubmitting(false);
    router.push("/polls");
  }

  const canSubmit = title.trim().length > 0 && options.filter((o) => o.label.trim()).length >= 2;

  return (
    <main className="container mx-auto p-6 max-w-3xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Create New Poll</h1>
        <Button variant="outline" onClick={() => router.push("/polls")}>Cancel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
          <CardDescription>Enter the details for your new poll</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="title">Poll Title</label>
              <Input id="title" placeholder="Enter a question or title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="desc">Description (optional)</label>
              <Textarea id="desc" placeholder="Provide more context about your poll" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Poll Options</label>
                <Button type="button" size="sm" onClick={addOption}>Add Option</Button>
              </div>
              <div className="grid gap-2">
                {options.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Input placeholder={`Option ${idx + 1}`} value={opt.label} onChange={(e) => updateOption(opt.id, e.target.value)} />
                    <Button type="button" variant="ghost" onClick={() => removeOption(opt.id)} disabled={options.length <= 2}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="submit" disabled={!canSubmit || submitting}>{submitting ? "Creating..." : "Create Poll"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
