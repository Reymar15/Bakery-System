import { authRequest, requestCookies, responseError, supabaseConfig } from "@/lib/supabase-auth";

const categories = ["Breads", "Cakes", "Pastries", "Cookies", "Drinks"];
type ProductInput = { name: string; category: string; price: number; image: string; tag: string | null; available: boolean; stock_quantity: number };

async function adminContext(request: Request) {
  const { accessToken: encodedToken } = requestCookies(request);
  if (!encodedToken) return { error: Response.json({ error: "Please sign in to continue." }, { status: 401 }) };
  const accessToken = decodeURIComponent(encodedToken);
  const { url, anonKey } = supabaseConfig();
  const userResponse = await authRequest("user", { method: "GET" }, accessToken);
  if (!userResponse.ok) return { error: Response.json({ error: "Your session has expired. Please sign in again." }, { status: 401 }) };
  const user = await userResponse.json() as { id: string };
  const profileResponse = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store",
  });
  if (!profileResponse.ok) {
    const message = await responseError(profileResponse, "Could not check admin access.");
    if (/column .*profiles\.role.* does not exist/i.test(message)) {
      return { error: Response.json({ error: "Admin setup is incomplete. Run supabase/admin-portal.sql in your Supabase SQL Editor, then promote your account to admin." }, { status: 503 }) };
    }
    return { error: Response.json({ error: message }, { status: 500 }) };
  }
  const profiles = await profileResponse.json() as { role?: string }[];
  if (profiles[0]?.role !== "admin") return { error: Response.json({ error: "Admin access is required for this page." }, { status: 403 }) };
  return { url, anonKey, accessToken };
}

function validProduct(value: unknown): value is ProductInput {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return typeof p.name === "string" && p.name.trim().length > 0 && p.name.trim().length <= 100
    && typeof p.category === "string" && categories.includes(p.category)
    && typeof p.price === "number" && Number.isFinite(p.price) && p.price > 0
    && typeof p.image === "string" && p.image.trim().length > 0
    && (p.tag === null || typeof p.tag === "string")
    && typeof p.available === "boolean"
    && Number.isInteger(p.stock_quantity) && Number(p.stock_quantity) >= 0;
}

async function supabase(request: Request, method: string, query: string, body?: unknown) {
  const context = await adminContext(request);
  if ("error" in context) return context.error;
  const response = await fetch(`${context.url}/rest/v1/${query}`, {
    method,
    headers: {
      apikey: context.anonKey,
      Authorization: `Bearer ${context.accessToken}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(method === "GET" ? {} : { Prefer: "return=representation" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });
  if (!response.ok) return Response.json({ error: await responseError(response, "Product request failed.") }, { status: response.status });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  return Response.json(data);
}

export async function GET(request: Request) {
  return supabase(request, "GET", "products?select=*&order=id.asc");
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!validProduct(body)) return Response.json({ error: "Check the product name, category, price, image, tag, and availability." }, { status: 400 });
  const p = body;
  return supabase(request, "POST", "products", { name: p.name.trim(), category: p.category, price: p.price, image: p.image.trim(), tag: p.tag, available: p.available, stock_quantity: p.stock_quantity });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid request body." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !Number.isInteger((body as { id?: unknown }).id) || !validProduct((body as { product?: unknown }).product)) {
    return Response.json({ error: "Invalid product update." }, { status: 400 });
  }
  const { id, product } = body as { id: number; product: ProductInput };
  return supabase(request, "PATCH", `products?id=eq.${id}`, { name: product.name.trim(), category: product.category, price: product.price, image: product.image.trim(), tag: product.tag, available: product.available, stock_quantity: product.stock_quantity });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^\d+$/.test(id)) return Response.json({ error: "A valid product ID is required." }, { status: 400 });
  return supabase(request, "DELETE", `products?id=eq.${id}`);
}
