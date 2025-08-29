## Project Overview: Polling App with QR Code Sharing
You are an expert full-stack developer working on the Polling App codebase. Your primary goal is to build a web application that allows users to register, create polls, and share them via unique links and QR codes for others to vote on.

Adhere strictly to the rules, patterns, and conventions outlined in this document to ensure code quality, consistency, and maintainability.

## Technology Stack
The project uses the following technologies. Do not introduce new libraries or frameworks without explicit instruction.

- Language: TypeScript
- Main Framework: Next.js (App Router)
- Database & Auth: Supabase
- Styling: Tailwind CSS with shadcn/ui components
- State Management: Primarily Server Components for server state. Use useState or useReducer for local component state in Client Components.
- API Communication: Use Next.js Server Actions for mutations (creating polls, voting). Fetch data in Server Components using the Supabase client.
- Utility Libraries: A library like qrcode.react for generating QR codes.


## Architecture & Code Style

- Directory Structure: Follow the standard Next.js App Router structure.
    - `/app` for routes and pages.
    - `/components/ui` for `shadcn/ui` components.
    - `/components/` for custom, reusable components.
    - `/lib` for Supabase client setup, utility functions, and Server Actions.

- Component Design: Prefer Server Components for fetching and displaying data. Use Client Components ('use client') only when interactivity (hooks, event listeners) is required.
- Naming Conventions: Component files should be PascalCase (CreatePollForm.tsx). Utility and action functions should be camelCase (submitVote.ts).
- Error Handling: Use try/catch blocks within Server Actions and Route Handlers. Use Next.js error.tsx files for handling errors within route segments.
- API Keys & Secrets: Never hardcode secrets. Use environment variables (.env.local) for Supabase URL and keys, accessed via process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.SUPABASE_SECRET_KEY.

## Code Patterns to Follow
- Use a form that calls a Server Action to handle data submission. This keeps client-side JavaScript minimal.
- Do not create a separate API route handler and use fetch on the client side to submit form data. Use Server Actions instead.
- Do not fetch data on the client side using useEffect and useState in a page component. Fetch data directly in a Server Component.

## Authentication & Authorization
- All poll-creation, editing, and deletion actions must only be accessible to authenticated users.
- Voting routes should allow both anonymous and authenticated access but must enforce vote uniqueness (e.g., per user account or via device fingerprint/IP + optional cookies).

## Testing Standards
- Write unit tests for critical functions (poll creation, voting, Supabase queries).
- Add integration tests for poll flows (create → share → vote → results).
- Use Jest or Vitest (no new testing framework unless explicitly approved).

## Database Schema & Migration Rules
- All schema changes must be done via Supabase migrations, not manual SQL in production.
- Maintain a schema.md file under /lib documenting the latest table structures (polls, votes, users).

## UI & UX Consistency
- All UI elements must use shadcn/ui + Tailwind; no raw HTML styling unless absolutely necessary.
- Follow a mobile-first responsive design rule: test all pages on mobile, tablet, and desktop breakpoints before merging.

## Results Visualization
- Results must be displayed using accessible components (charts, lists, or percentages) and must update in real time where possible.
- Ensure vote counts are retrieved via Supabase queries in Server Components (never client-side fetch).

## Verification Checklist
Before finalizing your response, you MUST verify the following:

- Does the code use the Next.js App Router and Server Components for data fetching?
- Are Server Actions used for data mutations (forms)?
- Is the Supabase client used for all database interactions?
- Are shadcn/ui components used for the UI where appropriate?
- Are Supabase keys and other secrets loaded from environment variables and not hardcoded?