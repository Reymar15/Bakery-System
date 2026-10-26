import { authRequest, requestCookies, responseError, supabaseConfig } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const { accessToken: encodedToken } = requestCookies(request);
  if (!encodedToken) return Response.json({ isAdmin: false }, { status: 401 });
  try {
    const accessToken = decodeURIComponent(encodedToken);
    const userResponse = await authRequest("user", { method: "GET" }, accessToken);
    if (!userResponse.ok) return Response.json({ isAdmin: false }, { status: 401 });
    const user = await userResponse.json() as { id: string; email?: string };
    const { url, anonKey } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    if (!response.ok) {
      const message = await responseError(response, "Could not check admin access.");
      if (/column .*profiles\.role.* does not exist/i.test(message)) {
        return Response.json({ error: "Admin setup is incomplete. Run supabase/admin-portal.sql in your Supabase SQL Editor, then promote your account to admin." }, { status: 503 });
      }
      return Response.json({ error: message }, { status: 500 });
    }
    const profiles = await response.json() as { role?: string }[];
    return Response.json({ isAdmin: profiles[0]?.role === "admin", email: user.email ?? "" });
  } catch {
    return Response.json({ error: "Could not check admin access." }, { status: 500 });
  }
}
