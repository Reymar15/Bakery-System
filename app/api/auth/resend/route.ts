import { authRequest, responseError } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string };
    const email = body.email?.trim() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    const response = await authRequest("resend", {
      method: "POST",
      body: JSON.stringify({ email, type: "signup" }),
    });
    if (!response.ok) return Response.json({ error: await responseError(response, "Could not resend the code.") }, { status: response.status });
    return Response.json({ success: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[api/auth/resend] Supabase request failed:", detail);
    return Response.json({
      error: "Could not resend the code. Check the server terminal for details.",
      ...(process.env.NODE_ENV !== "production" ? { debug: detail } : {}),
    }, { status: 503 });
  }
}
