"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { createPoll } from "@/lib/polls";
import { generatePollSuggestions, type SuggestionResponse } from "@/lib/actions/poll-suggestions";

type Suggestions = SuggestionResponse;

/**
 * Generates a unique ID for poll options or other entities.
 * Needed to ensure each option has a distinct identifier for React rendering and data integrity.
 * Assumes browser environment with crypto support, falls back to timestamp/random if unavailable.
 * Edge cases: crypto not available, collisions (rare).
 * Used by NewPollClient for option management.
 */
function genId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (_) {}
  const randomPart = Math.random().toString(36).slice(2);
  const timePart = Date.now().toString(36);
  return `id_${timePart}_${randomPart}`;
}

type PollOptionDraft = { readonly id: string; label: string };

/**
 * NewPollClient component provides the interactive UI and logic for creating a new poll.
 * Handles form state, option management, validation, and submission to backend.
 * Needed for user-driven poll creation, including authentication and error handling.
 * Assumes user is authenticated, uses useAuth and router for navigation.
 * Edge cases: invalid input, minimum/maximum options, expired date, network errors.
 * Connects to createPoll, dashboard, and authentication flows.
 */
export function NewPollClient() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [options, setOptions] = useState<PollOptionDraft[]>([
    { id: genId(), label: "" },
    { id: genId(), label: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  async function fetchSuggestions() {
    if (!title.trim()) {
      setError('Please enter a question first.');
      return;
    }

    setIsFetchingSuggestions(true);
    setError(null);
    setSuggestions(null);

    try {
      const data = await generatePollSuggestions({
        question: title,
        options: options.map(o => o.label).filter(l => l.trim())
      });
      
      setSuggestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsFetchingSuggestions(false);
    }
  }

  function applyQuestionSuggestion(suggestion: string) {
    setTitle(suggestion);
    setSuggestions(null);
  }

    function applyOptionsSuggestion(suggestedOptions: string[], shouldAppend?: boolean) {
    // Default behavior: append options (true) if no explicit choice is made
    const useAppend = shouldAppend !== undefined ? shouldAppend : true;
    
    if (useAppend) {
      // Append mode: merge with existing options and deduplicate
      setOptions(prevOptions => {
        // Get existing option labels (case-insensitive for comparison)
        const existingLabels = new Set(
          prevOptions
            .map(opt => opt.label.trim().toLowerCase())
            .filter(label => label.length > 0)
        );
        
        // Filter new options to avoid duplicates
        const uniqueNewOptions = suggestedOptions
          .filter((newLabel: string) => {
            const normalizedLabel = newLabel.trim().toLowerCase();
            return normalizedLabel.length > 0 && !existingLabels.has(normalizedLabel);
          })
          .map((label: string) => ({ id: genId(), label: label.trim() }));
        
        return [...prevOptions, ...uniqueNewOptions];
      });
    } else {
      // Replace mode: replace all options with suggestions
      setOptions(suggestedOptions.map((label: string) => ({ id: genId(), label: label.trim() })));
    }
    
    setSuggestions(null);
  }


  /**
   * Adds a new empty option to the poll.
   * Needed to allow users to expand poll choices, up to a maximum.
   * Assumes not submitting and options is an array of PollOptionDraft.
   * Edge cases: disables adding if submitting.
   * Used within NewPollClient only.
   */
  function addOption() {
    if (submitting) return;
    setOptions((prev) => [...prev, { id: genId(), label: "" }]);
  }

  /**
   * Updates the label of an option by ID.
   * Needed for real-time editing of poll choices.
   * Assumes not submitting and valid option ID.
   * Edge cases: empty string, duplicate options.
   * Used within NewPollClient only.
   */
  function updateOption(id: string, label: string) {
    if (submitting) return;
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, label } : o)));
  }

  /**
   * Removes an option by ID, enforcing a minimum of 2 options.
   * Needed to let users delete unwanted choices but maintain poll validity.
   * Assumes not submitting and valid option ID.
   * Edge cases: disables removal if only 2 options remain.
   * Used within NewPollClient only.
   */
  function removeOption(id: string) {
    if (submitting) return;
    setOptions((prev) => (prev.length <= 2 ? prev : prev.filter((o) => o.id !== id)));
  }

  /**
   * Handles form submission to create a new poll in the backend.
   * Validates input, manages UI state, and redirects on success.
   * Needed to persist poll creation and provide feedback to the user.
   * Assumes user is authenticated and all fields are controlled.
   * Edge cases: missing title, too few options, invalid expiration, network errors.
   * Connects to createPoll and dashboard.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !user) return;
    
    setSubmitting(true);
    setError(null);

    try {
      // Filter out empty options
      const validOptions = options
        .filter((o) => o.label.trim().length > 0)
        .map((o) => o.label.trim());
      
      if (validOptions.length < 2) {
        throw new Error("At least 2 options are required");
      }

      // Validate expiresAt if provided
      if (expiresAt) {
        const expirationDate = new Date(expiresAt);
        const now = new Date();
        
        if (expirationDate <= now) {
          throw new Error('Expiration date must be in the future');
        }
      }

      // Create the poll using the helper function
      const pollId = await createPoll({
        question: title.trim(),
        description: description.trim() || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        options: validOptions,
      }, user.id);

      // Show success message
      setSuccess(true);
      
      // Redirect to polls dashboard after a short delay
      setTimeout(() => {
        router.push('/polls');
      }, 2000);
    } catch (err) {
      console.error('Error creating poll:', err);
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = title.trim().length > 0 && options.filter((o) => o.label.trim().length > 0).length >= 2 && user;

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You need to be logged in to create polls</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Link href="/login">
              <Button className="w-full">Login</Button>
            </Link>
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full animate-float animation-delay-2000"></div>
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full animate-float animation-delay-4000"></div>
      </div>

      {/* Interactive cursor effect */}
      <div 
        className="fixed w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full pointer-events-none z-0 transition-transform duration-300 ease-out"
        style={{
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Main content */}
      <div className={`relative z-10 container mx-auto p-6 max-w-4xl transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 group mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create New Poll
          </h1>
          <p className="text-gray-600">Design your poll and gather opinions from your audience</p>
        </div>

        {/* Main form card */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-white/20 hover:shadow-3xl transition-all duration-500">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800">Poll Details</CardTitle>
            <CardDescription className="text-gray-600">
              Fill in the information below to create your poll
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">
                    Poll created successfully! Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            )}
            <form className="space-y-8" onSubmit={onSubmit}>
              {/* Poll Title */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="title">
                    Poll Question *
                  </label>
                  <div className="relative">
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={fetchSuggestions}
                      disabled={isFetchingSuggestions || !title.trim()}
                      aria-busy={isFetchingSuggestions}
                      aria-disabled={isFetchingSuggestions || !title.trim()}
                      aria-label={
                        isFetchingSuggestions 
                          ? "Getting AI suggestions for your poll question" 
                          : !title.trim() 
                            ? "Get AI suggestions (enter a question first)" 
                            : "Get AI suggestions to improve your poll question"
                      }
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      {isFetchingSuggestions ? 'Getting suggestions...' : 'Get Suggestions'}
                    </Button>
                    {/* Visually hidden status for screen readers */}
                    {isFetchingSuggestions && (
                      <span 
                        role="status" 
                        aria-live="polite" 
                        className="sr-only"
                      >
                        Getting AI suggestions for your poll question, please wait...
                      </span>
                    )}
                  </div>
                </div>
                <Input
                  id="title"
                  placeholder="What would you like to ask?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                  maxLength={120}
                  className="h-14 text-lg bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                />
                <p className="text-xs text-gray-500">{title.length}/120 characters</p>
              </div>

              {/* Suggestions Display */}
              {suggestions && (
                <div 
                  className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                  role="region"
                  aria-labelledby="suggestions-heading"
                  aria-live="polite"
                >
                  <h3 id="suggestions-heading" className="font-semibold text-gray-800">
                    AI Suggestions for Your Poll
                  </h3>
                  {suggestions.questionSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Question Alternatives:</h4>
                      <div role="list" aria-label="Question suggestions">
                        {suggestions.questionSuggestions.map((q: string, i: number) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between p-2 bg-white rounded-md"
                            role="listitem"
                          >
                            <p className="text-sm text-gray-600">{q}</p>
                            <Button 
                              type="button" 
                              size="sm" 
                              onClick={() => applyQuestionSuggestion(q)}
                              aria-label={`Use suggestion: ${q}`}
                            >
                              Use this
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {suggestions.optionSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Option Alternatives:</h4>
                      </div>
                      <div role="list" aria-label="Option suggestions">
                        {suggestions.optionSuggestions.map((opts: string[], i: number) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between p-2 bg-white rounded-md"
                            role="listitem"
                          >
                            <p className="text-sm text-gray-600">{opts.join(', ')}</p>
                            <div className="flex space-x-1">
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="outline"
                                onClick={() => applyOptionsSuggestion(opts, true)}
                                aria-label={`Append these options: ${opts.join(', ')}`}
                                className="text-xs"
                              >
                                Add
                              </Button>
                              <Button 
                                type="button" 
                                size="sm" 
                                onClick={() => applyOptionsSuggestion(opts, false)}
                                aria-label={`Replace all options with: ${opts.join(', ')}`}
                                className="text-xs"
                              >
                                Replace
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700" htmlFor="desc">
                  Description (Optional)
                </label>
                <Textarea
                  id="desc"
                  placeholder="Provide additional context or details about your poll..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300 resize-none"
                />
              </div>

              {/* Expiration Date */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700" htmlFor="expires">
                  Expiration Date (Optional)
                </label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                />
                <p className="text-xs text-gray-600">
                  Leave empty for polls that never expire
                </p>
              </div>

              {/* Poll Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Poll Options *</label>
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={addOption} 
                    disabled={submitting} 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    + Add Option
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div key={opt.id} className="group">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {idx + 1}
                        </div>
                        <Input
                          id={`option-${opt.id}`}
                          name={`option-${opt.id}`}
                          aria-label={`Option ${idx + 1}`}
                          placeholder={`Enter option ${idx + 1}...`}
                          value={opt.label}
                          onChange={(e) => updateOption(opt.id, e.target.value)}
                          disabled={submitting}
                          className="h-12 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(opt.id)}
                          disabled={submitting || options.length <= 2}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500">Minimum 2 options required. You can add up to 10 options.</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/polls")}
                  className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={!canSubmit || submitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Poll...
                    </>
                  ) : (
                    "Create Poll"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Back to polls link */}
        <div className="text-center mt-6">
          <Link 
            href="/polls" 
            className="text-gray-600 hover:text-blue-600 text-sm font-medium transition-colors duration-300"
          >
            ← Back to Polls
          </Link>
        </div>
      </div>
    </div>
  );
}


