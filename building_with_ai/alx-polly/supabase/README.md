# Supabase schema for Polls & Votes

This folder contains SQL to provision the database schema for the polling app.

## What it creates
- `public.polls`: Poll questions, owned by a user (`auth.users`).
- `public.poll_options`: Options that belong to a poll.
- `public.votes`: Votes for a poll option, optionally tied to a voter (`auth.users`).
- RLS policies so:
  - Everyone can read polls, options, and votes.
  - Only authenticated users can create polls and manage their options.
  - Anyone can vote:
    - Authenticated users: enforced single vote per poll.
    - Anonymous users: allowed multiple votes (no `voter_id`).
- View `public.poll_option_vote_counts` for aggregated counts per option.

## Apply the migration
You can run the migration directly in the Supabase SQL editor or via CLI.

### Option A: Supabase Studio
1. Open Supabase project → SQL Editor.
2. Paste contents of `migrations/0001_polls_and_votes.sql`.
3. Run.

### Option B: CLI (optional)
If you manage schema with `supabase` CLI:

- Copy the SQL into your migrations folder and run a deploy, or
- Execute the SQL via psql connected to your Supabase DB URL.

## Notes
- Auth: This uses `auth.users(id)` for ownership. Make sure you use Supabase Auth.
- RLS: Update and delete on `votes` are intentionally not allowed.
- Data integrity: `votes` has a FK `(option_id, poll_id)` → `poll_options(id, poll_id)` ensuring the option belongs to the same poll.
- Uniqueness: `poll_options` prevents duplicate labels per poll; voters can only vote once per poll when authenticated.

## Types
If you generate types via Supabase, update them in `types/supabase.ts` or wherever you store generated types.