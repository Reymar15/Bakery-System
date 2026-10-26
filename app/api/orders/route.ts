import { authRequest, requestCookies, responseError, supabaseConfig } from "@/lib/supabase-auth";

const DELIVERY_FEE = 50;
type OrderItemInput = { product_id: number; quantity: number };
type OrderBody = {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  fulfillment: "delivery" | "pickup";
  payment_method: "cod" | "gcash" | "card";
  note: string;
  items: OrderItemInput[];
};

function validOrder(value: unknown): value is OrderBody {
  if (!value || typeof value !== "object") return false;
  const order = value as Record<string, unknown>;
  if (typeof order.customer_name !== "string" || !order.customer_name.trim() || order.customer_name.trim().length > 120) return false;
  if (typeof order.customer_phone !== "string" || order.customer_phone.trim().length < 7 || order.customer_phone.trim().length > 30) return false;
  if (typeof order.customer_email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customer_email.trim())) return false;
  if (order.fulfillment !== "delivery" && order.fulfillment !== "pickup") return false;
  if (order.fulfillment === "delivery" && (typeof order.delivery_address !== "string" || !order.delivery_address.trim())) return false;
  if (order.payment_method !== "cod" && order.payment_method !== "gcash" && order.payment_method !== "card") return false;
  if (typeof order.note !== "string" || order.note.length > 1000) return false;
  if (!Array.isArray(order.items) || order.items.length < 1 || order.items.length > 30) return false;
  const items = order.items as Record<string, unknown>[];
  return items.every(item => Number.isInteger(item.product_id) && Number(item.product_id) > 0
    && Number.isInteger(item.quantity) && Number(item.quantity) > 0 && Number(item.quantity) <= 99)
    && new Set(items.map(item => item.product_id)).size === items.length;
}

export async function POST(request: Request) {
  const { accessToken: encodedToken } = requestCookies(request);
  if (!encodedToken) return Response.json({ error: "Sign in before placing an order." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid order details." }, { status: 400 }); }
  if (!validOrder(body)) return Response.json({ error: "Check the contact, delivery, payment, and cart details." }, { status: 400 });

  try {
    const accessToken = decodeURIComponent(encodedToken);
    const userResponse = await authRequest("user", { method: "GET" }, accessToken);
    if (!userResponse.ok) return Response.json({ error: "Your session expired. Sign in again before ordering." }, { status: 401 });
    const user = await userResponse.json() as { id: string };
    const { url, anonKey } = supabaseConfig();
    const ids = body.items.map(item => item.product_id);
    const productQuery = new URLSearchParams({
      select: "id,name,category,price,image,tag,available,stock_quantity",
      id: `in.(${ids.join(",")})`,
    });
    const productResponse = await fetch(`${url}/rest/v1/products?${productQuery}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` }, cache: "no-store",
    });
    if (!productResponse.ok) return Response.json({ error: await responseError(productResponse, "Could not verify cart products.") }, { status: productResponse.status });
    const products = await productResponse.json() as { id: number; name: string; category: string; price: number | string; image: string; available: boolean; stock_quantity: number }[];
    if (products.length !== ids.length) return Response.json({ error: "One or more products are no longer in the catalog. Refresh your cart." }, { status: 409 });
    const byId = new Map(products.map(product => [Number(product.id), product]));
    const orderItems = body.items.map(item => {
      const product = byId.get(item.product_id)!;
      return {
        product_id: Number(product.id),
        name: product.name,
        category: product.category,
        image: product.image,
        unit_price: Number(product.price),
        quantity: item.quantity,
        line_total: Number((Number(product.price) * item.quantity).toFixed(2)),
      };
    });
    if (products.some(product => !product.available)) return Response.json({ error: "A product in your cart is sold out. Refresh your cart and try again." }, { status: 409 });
    if (body.items.some(item => (byId.get(item.product_id)?.stock_quantity ?? 0) < item.quantity)) {
      return Response.json({ error: "There is not enough stock for one or more items. Please update your cart and try again." }, { status: 409 });
    }

    const subtotal = Number(orderItems.reduce((sum, item) => sum + item.line_total, 0).toFixed(2));
    const deliveryFee = body.fulfillment === "delivery" ? DELIVERY_FEE : 0;
    const orderToSave = {
      user_id: user.id,
      customer_name: body.customer_name.trim(),
      customer_phone: body.customer_phone.trim(),
      customer_email: body.customer_email.trim().toLowerCase(),
      delivery_address: body.fulfillment === "delivery" ? body.delivery_address.trim() : "",
      fulfillment: body.fulfillment,
      payment_method: body.payment_method,
      note: body.note.trim(),
      items: orderItems,
      subtotal,
      delivery_fee: deliveryFee,
      total: Number((subtotal + deliveryFee).toFixed(2)),
    };
    const response = await fetch(`${url}/rest/v1/orders`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(orderToSave),
      cache: "no-store",
    });
    if (!response.ok) {
      const message = await responseError(response, "Could not save your order.");
      if (/insufficient stock/i.test(message)) {
        return Response.json({ error: "Stock changed while you were checking out. Please refresh your cart and try again." }, { status: 409 });
      }
      if (/orders.*(schema cache|does not exist|not found)/i.test(message)) {
        return Response.json({ error: "Order storage is not set up yet. Run the updated supabase/admin-portal.sql in Supabase SQL Editor." }, { status: 503 });
      }
      return Response.json({ error: message }, { status: response.status });
    }
    const saved = await response.json() as { id: number }[];
    return Response.json({ order: saved[0] }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not connect to the order database. Please try again." }, { status: 503 });
  }
}
