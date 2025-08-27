import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.delete(name);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const protectedRoutes = ['/polls', '/polls/new'];
  const authRoutes = ['/login', '/register'];

  if (session && authRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/polls', req.url));
  }

  if (!session && protectedRoutes.includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}
