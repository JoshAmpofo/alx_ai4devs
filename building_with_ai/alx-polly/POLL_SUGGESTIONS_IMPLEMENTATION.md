# Poll Suggestions Implementation

This project now supports two approaches for generating AI-powered poll suggestions:

## 1. Server Action (Recommended) ✅

**File:** `lib/actions/poll-suggestions.ts`

### Benefits:
- **Type Safety**: Full TypeScript integration with typed parameters and return values
- **Direct Function Calls**: No HTTP overhead, direct function invocation
- **Better Error Handling**: Errors are automatically handled by Next.js
- **Cleaner Code**: No need for manual request/response parsing
- **Better Performance**: No HTTP round-trip, executes server-side

### Usage:
```typescript
import { generatePollSuggestions } from '@/lib/actions/poll-suggestions';

// In a client component or another server action
const suggestions = await generatePollSuggestions({
  question: "What's your favorite programming language?",
  options: ["JavaScript", "Python", "TypeScript"]
});
```

### Implementation Details:
- Uses `'use server'` directive for Next.js Server Actions
- Proper TypeScript interfaces for request/response
- Comprehensive error handling with fallback responses
- Supports free-tier Gemini API with multiple model fallbacks

## 2. API Route (Deprecated) ⚠️

**File:** `app/api/polls/suggestions/route.ts`

### Why Deprecated:
- Requires HTTP requests from client components
- Less type safety
- More complex error handling
- Additional network overhead

### Migration Path:
The `NewPollClient.tsx` has been updated to use the Server Action. If you have other components using the API route, update them to import and call `generatePollSuggestions` directly.

## AI Prompt Engineering

Both implementations use a comprehensive prompt that ensures high-quality suggestions:

### Prompt Features:
- **Specific Instructions**: Clear guidance on rewriting for clarity, neutrality, and engagement
- **Quality Criteria**: Detailed requirements for bias reduction and language improvement
- **Format Constraints**: Exact JSON structure with validation rules
- **Examples**: Concrete input/output examples to guide the model
- **Length Limits**: Maximum 100 characters per question for conciseness
- **Option Preservation**: Maintains the exact number and meaning of original options

### Sample Prompt Structure:
```
INSTRUCTIONS:
1. REWRITE the question for maximum clarity and neutrality
2. REDUCE bias, leading language, and loaded terms
3. IMPROVE engagement while maintaining conciseness (max 100 characters)
4. PRESERVE original intent and ensure all options remain answerable
5. MAINTAIN exact same number of options as provided
6. PROVIDE exactly 3 question alternatives and 2 sets of improved options

QUALITY CRITERIA:
- Use simple, direct language
- Avoid emotional or charged words
- Ensure options are mutually exclusive and comprehensive
- Make questions specific enough to be actionable
```

## Configuration

Both implementations require the same environment variable:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

## Error Handling

The Server Action provides better error handling:

```typescript
try {
  const suggestions = await generatePollSuggestions(data);
  // Handle success
} catch (error) {
  // Handle specific errors:
  // - "AI service is not configured" (missing API key)
  // - "AI service quota exceeded" (billing/quota issues)
  // - "Network error connecting to AI service" (network issues)
  // - "AI service request timed out" (timeout)
  console.error('Suggestion error:', error.message);
}
```

## Next Steps

1. **Remove API Route**: After confirming all clients use the Server Action, delete `app/api/polls/suggestions/route.ts`
2. **Add More Actions**: Consider creating additional Server Actions for other AI features
3. **Optimize Performance**: Server Actions can be cached and optimized by Next.js
