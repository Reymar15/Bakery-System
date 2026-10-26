import { authRequest, sessionHeaders } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200) {
      return Response.json({ error: "Please provide a valid name, email, and password (at least 8 characters)." }, { status: 400 });
    }
    const response = await authRequest("signup", {
      method: "POST",
      body: JSON.stringify({ email, password, data: { full_name: name } }),
    });
    const result = await response.json() as { user?: { id: string; email?: string; user_metadata?: { full_name?: string } }; access_token?: string; refresh_token?: string; expires_in?: number; msg?: string; message?: string; error_description?: string; error?: string };
    if (!response.ok) return Response.json({ error: result.msg || result.message || result.error_description || result.error || "Could not create your account." }, { status: response.status });
    const headers = result.access_token && result.refresh_token
      ? sessionHeaders(result.access_token, result.refresh_token, result.expires_in)
      : undefined;
    return Response.json({
      user: result.user ? { id: result.user.id, name: result.user.user_metadata?.full_name ?? name, email: result.user.email ?? email } : null,
      needsEmailConfirmation: !headers,
    }, { status: 201, headers });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api/auth/register] Supabase request failed:", detail);
    return Response.json({
      error: "Supabase could not be reached. Check the server terminal for the registration error.",
      ...(process.env.NODE_ENV !== "production" ? { debug: detail } : {}),
    }, { status: 503 });
  }
}
