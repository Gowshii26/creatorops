import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data,
  } = await supabase.auth.getClaims();

  const isLoggedIn = Boolean(data?.claims);

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth");

  // Not logged in -> protect CreatorOps pages
  if (!isLoggedIn && !isAuthPage) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";
    url.search = "";

    return NextResponse.redirect(url);
  }

  // Already logged in -> prevent returning to login/register
  if (
    isLoggedIn &&
    (pathname === "/login" || pathname === "/register")
  ) {
    const url = request.nextUrl.clone();

    url.pathname = "/";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}