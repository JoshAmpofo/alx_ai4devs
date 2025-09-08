// app/api/polls/[id]/vote/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { castVote, hasUserVoted } from '@/lib/polls';

/**
 * Handles POST requests to cast a vote on a poll option.
 * Needed to allow users to participate in polls with optional authentication.
 * Assumes pollId and optionId are valid, supports both authenticated and anonymous voting.
 * Edge cases: invalid poll/option, duplicate votes, network errors.
 * Connects to voting UI components and database.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await context.params;
  const pollId = params.id;
  const { optionId } = await request.json();

  try {
    // Use user.id if available, otherwise it's an anonymous vote
    await castVote(pollId, optionId, user?.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

/**
 * Handles GET requests to check if a user has voted on a specific poll.
 * Needed to prevent duplicate votes and update UI state accordingly.
 * Assumes user is authenticated and pollId is valid.
 * Edge cases: unauthorized user, poll not found, database errors.
 * Connects to voting UI components for vote status display.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const params = await context.params;
  const pollId = params.id;

  try {
    const hasVoted = await hasUserVoted(pollId, user.id);
    return NextResponse.json({ hasVoted });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
