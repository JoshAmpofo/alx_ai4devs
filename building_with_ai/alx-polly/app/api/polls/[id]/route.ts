// app/api/polls/[id]/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getPollWithOptions, updatePollComplete, deletePoll } from '@/lib/polls';

/**
 * Handles GET requests to fetch a specific poll by ID with its options and vote counts.
 * Needed to provide poll data for voting interface and results display.
 * Assumes pollId is valid and poll exists in database.
 * Edge cases: poll not found, invalid ID, database errors.
 * Connects to poll voting and results components.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const pollId = params.id;
  try {
    const poll = await getPollWithOptions(pollId);
    if (!poll) {
      return new NextResponse('Poll not found', { status: 404 });
    }
    return NextResponse.json(poll);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

/**
 * Handles PUT requests to update a specific poll.
 * Needed to provide poll editing functionality with authentication and authorization.
 * Assumes user is authenticated, owns the poll, and pollData contains valid updates.
 * Edge cases: unauthorized user, poll not found, invalid data, permission denied.
 * Connects to poll editing components and database.
 */
export async function PUT(
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
  const pollData = await request.json();

  try {
    await updatePollComplete(pollId, user.id, pollData);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

/**
 * Handles DELETE requests to remove a specific poll.
 * Needed to provide poll deletion functionality with authentication and authorization.
 * Assumes user is authenticated, owns the poll, and has permission to delete.
 * Edge cases: unauthorized user, poll not found, permission denied, cascade deletion issues.
 * Connects to poll management components and database.
 */
export async function DELETE(
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
    await deletePoll(pollId, user.id);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
