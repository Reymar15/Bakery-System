import { responseError, supabaseConfig } from "@/lib/supabase-auth";

export async function GET() {
  try {
    const { url, anonKey } = supabaseConfig();
    const response = await fetch(`${url}/rest/v1/products?select=id,name,category,price,image,tag,available&order=id.asc`, {
      headers: { apikey: anonKey },
      cache: "no-store",
    });
    if (!response.ok) {
      return Response.json({ error: await responseError(response, "Could not load the product catalog.") }, { status: response.status });
    }
    const products = await response.json() as { available: boolean }[];
    return Response.json(products, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return Response.json({ error: "Product catalog is not configured." }, { status: 503 });
  }
}
