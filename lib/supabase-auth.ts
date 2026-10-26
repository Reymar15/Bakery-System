import { cookies } from "next/headers";

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

export async function setSessionCookies(accessToken: string, refreshToken: string, expiresIn?: number) {
  const store = await cookies();
  const options = {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  store.set(ACCESS_COOKIE, accessToken, { ...options, maxAge: Math.max(expiresIn ?? 3600, 60) });
  store.set(REFRESH_COOKIE, refreshToken, { ...options, maxAge: COOKIE_AGE });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  store.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
}

export async function responseError(response: Response, fallback: string) {
  try {
    const data = await response.json() as { msg?: string; message?: string; error_description?: string; error?: string };
    return data.msg || data.message || data.error_description || data.error || fallback;
  } catch {
    return fallback;
  }
}
