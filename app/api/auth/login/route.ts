import { authRequest, responseError, setSessionCookies, supabaseConfig } from "@/lib/supabase-auth";

function getJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8")) as Record<string, unknown>;
  } catch { return {}; }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    if (!body.email || !body.password) return Response.json({ error: "Enter your email and password." }, { status: 400 });
    const response = await authRequest("token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    if (!response.ok) return Response.json({ error: await responseError(response, "Email or password is incorrect.") }, { status: response.status });
    const result = await response.json() as { user: { id: string; email?: string; user_metadata?: { full_name?: string }; app_metadata?: { role?: string } }; access_token: string; refresh_token: string; expires_in?: number };

    // Check admin role — four layers.
    const ADMIN_EMAIL = (process.env.ADMIN_EMAIL ?? "admin.dailycrumbsph@gmail.com").toLowerCase();
    let isAdmin = false;

    // 1. Hardcoded admin email match (most reliable fallback)
    if ((result.user.email ?? body.email ?? "").toLowerCase() === ADMIN_EMAIL) {
      isAdmin = true;
    }

    // 2. JWT payload
    if (!isAdmin) {
      const jwt = getJwtPayload(result.access_token);
      if (jwt.role === "admin" || (jwt.app_metadata as Record<string, unknown>)?.role === "admin") {
        isAdmin = true;
      }
    }

    // 3. app_metadata on the user object
    if (!isAdmin && result.user.app_metadata?.role === "admin") {
      isAdmin = true;
    }

    // 4. profiles table using service role key to bypass RLS
    if (!isAdmin) {
      try {
        const { url, anonKey } = supabaseConfig();
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey;
        const profileRes = await fetch(
          `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(result.user.id)}&select=role`,
          { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
        );
        if (profileRes.ok) {
          const profiles = await profileRes.json() as { role?: string }[];
          isAdmin = profiles[0]?.role === "admin";
        }
      } catch { /* non-fatal */ }
    }

    if (isAdmin) {
      // Admins skip OTP — set session immediately.
      await setSessionCookies(result.access_token, result.refresh_token, result.expires_in);
      return Response.json({
        user: { id: result.user.id, name: result.user.user_metadata?.full_name ?? "Admin", email: result.user.email ?? body.email },
        isAdmin: true,
      });
    }

    // Regular users — send OTP to their email, don't set session yet.
    await authRequest("otp", {
      method: "POST",
      body: JSON.stringify({ email: body.email, create_user: false }),
    });

    return Response.json({ needsOtp: true, email: body.email });
  } catch {
    return Response.json({ error: "Supabase could not be reached. Check your project settings and try again." }, { status: 503 });
  }
}
