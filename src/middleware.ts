import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminEmail, getSupabasePublicEnv } from "@/lib/supabase/env";
import { USER_SCOPED_HEADER } from "@/lib/sw-rules";

export async function middleware(request: NextRequest) {
  const env = getSupabasePublicEnv();
  let response = NextResponse.next({ request });
  if (!env) return response;

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const adminEmail = getAdminEmail();
  if (request.nextUrl.pathname.startsWith("/day/") && adminEmail && data.user?.email?.toLowerCase() === adminEmail) {
    response.headers.set(USER_SCOPED_HEADER, "1");
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/journal/:path*", "/packing", "/login", "/signup", "/day/:path*"],
};
