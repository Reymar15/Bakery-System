const ACCESS_COOKIE = "dc_sb_access";
const REFRESH_COOKIE = "dc_sb_refresh";
const COOKIE_AGE = 60 * 60 * 24 * 30;

export function supabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.");
  }
  return { url: url.replace(/\/$/, ""), anonKey };
}

export async function authRequest(path: string, options: RequestInit = {}, accessToken?: string) {
  const { url, anonKey } = supabaseConfig();
  const headers = new Headers(options.headers);
  headers.set("apikey", anonKey);
  headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return fetch(`${url}/auth/v1/${path}`, { ...options, headers, cache: "no-store" });
}

export function requestCookies(request: Request) {
  const parts = request.headers.get("cookie")?.split(";").map(item => item.trim()) ?? [];
  const read = (name: string) => parts.find(item => item.startsWith(`${name}=`))?.slice(name.length + 1);
  return { accessToken: read(ACCESS_COOKIE), refreshToken: read(REFRESH_COOKIE) };
}

function cookie(name: string, value: string, age: number) {
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${age}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

export function sessionHeaders(accessToken: string, refreshToken: string, expiresIn?: number) {
  const headers = new Headers();
  headers.append("Set-Cookie", cookie(ACCESS_COOKIE, accessToken, Math.max(expiresIn ?? 3600, 60)));
  headers.append("Set-Cookie", cookie(REFRESH_COOKIE, refreshToken, COOKIE_AGE));
  return headers;
}

export function clearSessionHeaders() {
  const headers = new Headers();
  headers.append("Set-Cookie", cookie(ACCESS_COOKIE, "", 0));
  headers.append("Set-Cookie", cookie(REFRESH_COOKIE, "", 0));
  return headers;
}

export async function responseError(response: Response, fallback: string) {
  try {
    const data = await response.json() as { msg?: string; message?: string; error_description?: string; error?: string };
    return data.msg || data.message || data.error_description || data.error || fallback;
  } catch {
    return fallback;
  }
}
