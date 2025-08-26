"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PollOption {
  id: string;
  text: string;
}

export function NewPollForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    if (!title.trim()) {
      alert("Please enter a poll title");
      setIsSubmitting(false);
      return;
    }

    const validOptions = options.filter(option => option.text.trim());
    if (validOptions.length < 2) {
      alert("Please provide at least 2 options");
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    try {
      console.log("Creating poll:", {
        title: title.trim(),
        description: description.trim(),
        options: validOptions.map(opt => opt.text.trim())
      });
      
      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Poll created successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setOptions([{ id: "1", text: "" }, { id: "2", text: "" }]);
      
    } catch (error) {
      alert("Error creating poll. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Poll Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Poll Title *</Label>
        <Input
          id="title"
          placeholder="What's your question?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Poll Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <textarea
          id="description"
          placeholder="Add more details about your poll..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={3}
        />
      </div>

      {/* Poll Options */}
      <div className="space-y-4">
        <Label>Poll Options *</Label>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div key={option.id} className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  required={index < 2}
                />
              </div>
              {options.length > 2 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <Button
          type="button"
          variant="secondary"
          onClick={addOption}
          className="w-full"
        >
          + Add Another Option
        </Button>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Creating Poll..." : "Create Poll"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
