import { authRequest, responseError, sessionHeaders } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    if (!body.email || !body.password) return Response.json({ error: "Enter your email and password." }, { status: 400 });
    const response = await authRequest("token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    if (!response.ok) return Response.json({ error: await responseError(response, "Email or password is incorrect.") }, { status: response.status });
    const result = await response.json() as { user: { id: string; email?: string; user_metadata?: { full_name?: string } }; access_token: string; refresh_token: string; expires_in?: number };
    return Response.json({
      user: { id: result.user.id, name: result.user.user_metadata?.full_name ?? "Daily Crumbs customer", email: result.user.email ?? body.email },
    }, { headers: sessionHeaders(result.access_token, result.refresh_token, result.expires_in) });
  } catch {
    return Response.json({ error: "Supabase could not be reached. Check your project settings and try again." }, { status: 503 });
  }
}
