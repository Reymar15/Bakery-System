import { cookies } from "next/headers";
import { authRequest, responseError, supabaseConfig } from "@/lib/supabase-auth";

export async function GET() {
  try {
    const store = await cookies();
    const encodedToken = store.get("dc_sb_access")?.value;

    if (!encodedToken) {
      return Response.json({ error: "Please sign in to continue." }, { status: 401 });
    }

    const accessToken = decodeURIComponent(encodedToken);

    // Verify session with Supabase
    const userResponse = await authRequest("user", { method: "GET" }, accessToken);
    if (!userResponse.ok) {
      return Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }
    const user = await userResponse.json() as { id: string; email?: string };

    const { url, anonKey } = supabaseConfig();

    const profileResponse = await fetch(
      `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );

    if (!profileResponse.ok) {
      const message = await responseError(profileResponse, "Could not check admin access.");
      if (/column .*role.* does not exist/i.test(message)) {
        return Response.json({ error: "Admin setup incomplete. Run supabase/admin-portal.sql in your Supabase SQL Editor first." }, { status: 503 });
      }
      return Response.json({ error: message }, { status: 500 });
    }

    const profiles = await profileResponse.json() as { role?: string }[];

    if (profiles.length === 0) {
      return Response.json({ isAdmin: false, email: user.email ?? "", debug: "no_profile_row" });
    }

    const role = profiles[0]?.role;
    return Response.json({ isAdmin: role === "admin", email: user.email ?? "", role });

  } catch (err) {
    return Response.json({ error: `Could not check admin access: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
