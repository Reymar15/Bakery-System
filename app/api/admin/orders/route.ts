import { authRequest, requestCookies, responseError, supabaseConfig } from "@/lib/supabase-auth";

const statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

async function getAdminToken(request: Request) {
  const { accessToken: encodedToken } = requestCookies(request);
  if (!encodedToken) return { error: Response.json({ error: "Please sign in to continue." }, { status: 401 }) };
  const accessToken = decodeURIComponent(encodedToken);
  const userResponse = await authRequest("user", { method: "GET" }, accessToken);
  if (!userResponse.ok) return { error: Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 }) };
  const user = await userResponse.json() as { id: string };
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store",
  });
  if (!response.ok) return { error: Response.json({ error: await responseError(response, "Could not check admin access.") }, { status: 500 }) };
  const profiles = await response.json() as { role?: string }[];
  if (profiles[0]?.role !== "admin") return { error: Response.json({ error: "Admin access is required." }, { status: 403 }) };
  return { url, anonKey, accessToken };
}

export async function GET(request: Request) {
  try {
    const context = await getAdminToken(request);
    if ("error" in context) return context.error;
    const response = await fetch(`${context.url}/rest/v1/orders?select=*&order=created_at.desc`, {
      headers: { apikey: context.anonKey, Authorization: `Bearer ${context.accessToken}` }, cache: "no-store",
    });
    if (!response.ok) {
      const message = await responseError(response, "Could not load orders.");
      if (/orders.*(schema cache|does not exist|not found)/i.test(message)) {
        return Response.json({ error: "Order storage is not set up yet. Run the updated supabase/admin-portal.sql in Supabase SQL Editor." }, { status: 503 });
      }
      return Response.json({ error: message }, { status: response.status });
    }
    return Response.json(await response.json(), { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return Response.json({ error: "Could not connect to the order database." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid order update." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Invalid order update." }, { status: 400 });
  const { id, status } = body as { id?: unknown; status?: unknown };
  if (!Number.isInteger(id) || Number(id) < 1 || typeof status !== "string" || !statuses.includes(status)) {
    return Response.json({ error: "Choose a valid order and status." }, { status: 400 });
  }
  try {
    const context = await getAdminToken(request);
    if ("error" in context) return context.error;
    const response = await fetch(`${context.url}/rest/v1/orders?id=eq.${Number(id)}`, {
      method: "PATCH",
      headers: {
        apikey: context.anonKey,
        Authorization: `Bearer ${context.accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status }),
      cache: "no-store",
    });
    if (!response.ok) return Response.json({ error: await responseError(response, "Could not update the order.") }, { status: response.status });
    return Response.json(await response.json().catch(() => []));
  } catch {
    return Response.json({ error: "Could not connect to the order database." }, { status: 503 });
  }
}
