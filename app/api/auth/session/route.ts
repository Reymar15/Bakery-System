import { authRequest, clearSessionCookies, requestCookies, setSessionCookies } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const { accessToken, refreshToken } = requestCookies(request);
  if (!accessToken) return Response.json({ user: null });
  try {
    let token = decodeURIComponent(accessToken);
    let response = await authRequest("user", { method: "GET" }, token);
    if (!response.ok && refreshToken) {
      const refreshed = await authRequest("token?grant_type=refresh_token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: decodeURIComponent(refreshToken) }),
      });
      if (refreshed.ok) {
        const tokens = await refreshed.json() as { access_token: string; refresh_token: string; expires_in?: number };
        await setSessionCookies(tokens.access_token, tokens.refresh_token, tokens.expires_in);
        token = tokens.access_token;
        response = await authRequest("user", { method: "GET" }, token);
      }
    }
    if (!response.ok) {
      await clearSessionCookies();
      return Response.json({ user: null });
    }
    const user = await response.json() as { id: string; email?: string; user_metadata?: { full_name?: string } };
    return Response.json({ user: { id: user.id, name: user.user_metadata?.full_name ?? "Daily Crumbs customer", email: user.email ?? "" } });
  } catch {
    return Response.json({ user: null });
  }
}

export async function DELETE(request: Request) {
  const { accessToken } = requestCookies(request);
  if (accessToken) {
    try { await authRequest("logout?scope=local", { method: "POST" }, decodeURIComponent(accessToken)); } catch { /* ignore */ }
  }
  await clearSessionCookies();
  return Response.json({ success: true });
}
