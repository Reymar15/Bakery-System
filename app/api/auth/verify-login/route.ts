import { authRequest, responseError, setSessionCookies } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; token?: string };
    const email = body.email?.trim() ?? "";
    const token = body.token?.trim() ?? "";
    if (!email || !/^\d{6}$/.test(token)) {
      return Response.json({ error: "Enter the 6-digit code sent to your email." }, { status: 400 });
    }
    const response = await authRequest("verify", {
      method: "POST",
      body: JSON.stringify({ email, token, type: "magiclink" }),
    });
    if (!response.ok) return Response.json({ error: await responseError(response, "That code is invalid or has expired.") }, { status: response.status });
    const result = await response.json() as { access_token: string; refresh_token: string; expires_in?: number };
    await setSessionCookies(result.access_token, result.refresh_token, result.expires_in);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Could not verify the code. Please try again." }, { status: 503 });
  }
}
