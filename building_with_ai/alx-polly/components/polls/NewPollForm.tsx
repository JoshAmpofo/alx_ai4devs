'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

interface PollOption {
  id: string;
  text: string;
}

export function NewPollForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "" },
    { id: "2", text: "" }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    const newId = Date.now().toString();
    setOptions([...options, { id: newId, text: "" }]);
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(option => option.id !== id));
    }
  };

  const updateOptionText = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to create a poll.");
      return;
    }

    setIsSubmitting(true);

    const validOptions = options
      .map(opt => ({ text: opt.text.trim(), votes: 0 }))
      .filter(opt => opt.text);

    if (question.trim() && validOptions.length >= 2) {
      const { data, error } = await supabase
        .from('polls')
        .insert({
          question: question.trim(),
          options: validOptions,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating poll:', error);
        alert("Error creating poll. Please try again.");
      } else if (data) {
        router.push(`/polls/${data.id}`);
      }
    } else {
      alert("Please fill out the question and at least two options.");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white rounded-lg shadow-md">
      <div className="space-y-2">
        <Label htmlFor="question" className="text-lg font-semibold">Your Question</Label>
        <Input
          id="question"
          placeholder="e.g., What is your favorite programming language?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
          className="text-base"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-lg font-semibold">Options</Label>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex gap-3 items-center">
              <Input
                placeholder={`Option ${index + 1}`}
                value={option.text}
                onChange={(e) => updateOptionText(option.id, e.target.value)}
                required={index < 2}
                className="flex-1"
              />
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={addOption}
          className="w-full mt-2"
        >
          + Add Option
        </Button>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Poll"}
        </Button>
      </div>
    </form>
  );
}
