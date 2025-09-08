// app/api/polls/route.ts

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createPoll, getUserPolls } from '@/lib/polls';

/**
 * Handles POST requests to create a new poll.
 * Needed to provide a server-side API endpoint for poll creation with authentication.
 * Assumes user is authenticated and pollData contains valid poll structure.
 * Edge cases: unauthorized user, invalid poll data, database errors.
 * Connects to poll creation UI components and Supabase database.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const pollData = await request.json();

  try {
    const pollId = await createPoll(pollData, user.id);
    return NextResponse.json({ pollId });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

/**
 * Handles GET requests to fetch all polls for the authenticated user.
 * Needed to provide a server-side API endpoint for retrieving user's polls.
 * Assumes user is authenticated and has access to their polls.
 * Edge cases: unauthorized user, database errors, empty poll list.
 * Connects to dashboard and poll listing components.
 */
export async function GET(request: Request) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  
    try {
      const polls = await getUserPolls(user.id);
      return NextResponse.json(polls);
    } catch (error: any) {
      return new NextResponse(error.message, { status: 500 });
    }
}
