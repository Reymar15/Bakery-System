import { authRequest, requestCookies, responseError, supabaseConfig } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const { accessToken: encodedToken } = requestCookies(request);
  if (!encodedToken) return Response.json({ error: "Please sign in to continue." }, { status: 401 });

  try {
    const accessToken = decodeURIComponent(encodedToken);
    const userResponse = await authRequest("user", { method: "GET" }, accessToken);
    if (!userResponse.ok) return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    const user = await userResponse.json() as { id: string };
    const { url, anonKey } = supabaseConfig();
    const roleResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    if (!roleResponse.ok) {
      const message = await responseError(roleResponse, "Could not check admin access.");
      if (/column .*profiles\.role.* does not exist/i.test(message)) {
        return Response.json({ error: "Run the updated supabase/admin-portal.sql in your Supabase SQL Editor first." }, { status: 503 });
      }
      return Response.json({ error: message }, { status: 500 });
    }
    const profiles = await roleResponse.json() as { role?: string }[];
    if (profiles[0]?.role !== "admin") return Response.json({ error: "Admin access is required." }, { status: 403 });

    const response = await fetch(`${url}/rest/v1/profiles?select=id,full_name,email,role,created_at,last_sign_in_at&order=created_at.desc`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    if (!response.ok) return Response.json({ error: await responseError(response, "Could not load customer accounts.") }, { status: response.status });
    return Response.json(await response.json(), { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return Response.json({ error: "Could not connect to the customer database." }, { status: 503 });
  }
}
