'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updatePollComplete } from '@/lib/polls';

interface EditPollFormProps {
  poll: {
    id: string;
    question: string;
    description: string | null;
    expiresAt: string | null;
    options: ReadonlyArray<{
      id: string;
      label: string;
      voteCount: number;
    }>;
  };
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditPollForm({ poll, userId, onSuccess, onCancel }: EditPollFormProps) {
  const [question, setQuestion] = useState(poll.question);
  const [description, setDescription] = useState(poll.description || '');
  const [expiresAt, setExpiresAt] = useState(
    poll.expiresAt ? new Date(poll.expiresAt).toISOString().slice(0, 16) : ''
  );
  const [options, setOptions] = useState(poll.options.map(opt => opt.label));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    const validOptions = options
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0);

    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    // Validate expiresAt if provided
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      const now = new Date();
      
      if (expirationDate <= now) {
        setError('Expiration date must be in the future');
        return;
      }
    }

    // Check if any option has votes and warn user
    const hasVotedOptions = poll.options.some(opt => opt.voteCount > 0);
    if (hasVotedOptions) {
      const confirmEdit = confirm(
        'Warning: This poll already has votes. Editing options will delete all existing votes. Do you want to continue?'
      );
      if (!confirmEdit) {
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updatePollComplete(poll.id, userId, {
        question: question.trim(),
        description: description.trim() || null,
        options: validOptions,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {totalVotes > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.764 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                This poll has {totalVotes} votes
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Changing the options will delete all existing votes. Only edit if absolutely necessary.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="question">Poll Question *</Label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What's your question?"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide more context about your poll..."
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          disabled={isSubmitting}
          min={new Date().toISOString().slice(0, 16)}
        />
        <p className="text-xs text-gray-500">
          Leave empty for polls that never expire
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>Poll Options *</Label>
          <span className="text-sm text-gray-500">{options.length}/10 options</span>
        </div>
        
        {options.map((option, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              required
              disabled={isSubmitting}
              className="flex-1"
            />
            {poll.options[index] && (
              <span className="text-xs text-gray-500 min-w-[4rem] text-right">
                {poll.options[index].voteCount} votes
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeOption(index)}
              disabled={options.length <= 2 || isSubmitting}
              className="text-red-600 hover:text-red-700"
            >
              ✕
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addOption}
          disabled={options.length >= 10 || isSubmitting}
          className="w-full"
        >
          + Add Option
        </Button>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update Poll'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
