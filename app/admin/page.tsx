"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./admin.module.css";

type AdminView = "overview" | "products" | "orders" | "customers" | "reports" | "inventory";
type Product = { id: number; name: string; category: string; price: number; image: string; tag: string | null; available: boolean; stock_quantity: number };
type Customer = { id: string; full_name: string; email: string | null; role: string; created_at: string; last_sign_in_at: string | null };
type OrderItem = { product_id: number; name: string; quantity: number; unit_price: number; line_total: number };
type Order = { id: number; customer_name: string; customer_phone: string; customer_email: string; fulfillment: "delivery" | "pickup"; delivery_address: string; payment_method: string; note: string; items: OrderItem[]; subtotal: number | string; delivery_fee: number | string; total: number | string; status: string; created_at: string };
type Draft = Omit<Product, "id">;
const categories = ["Breads", "Cakes", "Pastries", "Cookies", "Drinks"];
const orderStatuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
const emptyDraft: Draft = { name: "", category: "Cakes", price: 0, image: "", tag: null, available: true, stock_quantity: 0 };
const peso = (amount: number) => `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [error, setError] = useState("");
  const [customersError, setCustomersError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [customerQuery, setCustomerQuery] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeView, setActiveView] = useState<AdminView>("overview");
  const [reportDays, setReportDays] = useState<7 | 30>(7);
  const [reportToday, setReportToday] = useState<string | null>(null);

  useEffect(() => {
    setReportToday(dateKey(new Date()));
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/products", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load products.");
      setProducts(data as Product[]);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load products."); }
    finally { setLoading(false); }
  }, []);

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load customer accounts.");
      setCustomers(data as Customer[]);
    } catch (e) { setCustomersError(e instanceof Error ? e.message : "Could not load customer accounts."); }
    finally { setCustomersLoading(false); }
  }, []);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load orders.");
      setOrders(data as Order[]);
    } catch (e) { setOrdersError(e instanceof Error ? e.message : "Could not load orders."); }
    finally { setOrdersLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch("/api/admin/access", { cache: "no-store" });
        const data = await response.json();
        if (!active) return;
        if (!response.ok) setAccessError(data.error || (response.status === 401 ? "Please sign in to open the admin dashboard." : "Could not verify admin access."));
        else if (!data.isAdmin) setAccessError("This account is not an admin yet. Promote its profile role in Supabase, then try again.");
        else { setIsAdmin(true); setAdminEmail(data.email || ""); }
      } catch { if (active) setAccessError("Could not connect to Supabase. Check your project settings and try again."); }
      finally { if (active) setAccessLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { if (isAdmin) { void loadProducts(); void loadCustomers(); void loadOrders(); } }, [loadProducts, loadCustomers, loadOrders, isAdmin]);

  const visibleProducts = useMemo(() => products.filter(product =>
    (category === "All categories" || product.category === category)
    && product.name.toLowerCase().includes(query.trim().toLowerCase())), [products, category, query]);
  const visibleCustomers = useMemo(() => customers.filter(customer =>
    `${customer.full_name} ${customer.email ?? ""}`.toLowerCase().includes(customerQuery.trim().toLowerCase())), [customers, customerQuery]);
  const availableCount = products.filter(product => product.available && product.stock_quantity > 0).length;
  const hiddenCount = products.length - availableCount;
  const completedOrders = useMemo(() => orders.filter(order => order.status === "completed"), [orders]);
  const totalSales = completedOrders.reduce((sum, order) => sum + Number(order.subtotal), 0);
  const lowStockProducts = products.filter(product => product.stock_quantity <= 5);
  const salesReport = useMemo(() => {
    if (!reportToday) return [];
    const [year, month, dayOfMonth] = reportToday.split("-").map(Number);
    const today = new Date(year, month - 1, dayOfMonth);
    const days = Array.from({ length: reportDays }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (reportDays - index - 1));
      return { key: dateKey(date), label: date.toLocaleDateString("en", { weekday: "short" }), amount: 0 };
    });
    const daily = new Map(days.map(day => [day.key, day]));
    for (const order of completedOrders) {
      const dayKey = dateKey(new Date(order.created_at));
      const day = daily.get(dayKey);
      if (day) day.amount += Number(order.subtotal);
    }
    return days;
  }, [completedOrders, reportDays, reportToday]);
  const bestSellers = useMemo(() => {
    const sales = new Map<number, { name: string; quantity: number; revenue: number }>();
    for (const order of completedOrders) {
      for (const item of order.items || []) {
        const current = sales.get(item.product_id) ?? { name: item.name, quantity: 0, revenue: 0 };
        current.quantity += Number(item.quantity);
        current.revenue += Number(item.line_total);
        sales.set(item.product_id, current);
      }
    }
    return [...sales.entries()].map(([id, sale]) => ({ id, ...sale })).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [completedOrders]);
  const maxDailySales = Math.max(1, ...salesReport.map(day => day.amount));

  function startNew() { setDraft(emptyDraft); setEditingId(null); setFormOpen(true); setError(""); }
  function startEdit(product: Product) {
    const { id, ...rest } = product;
    setDraft(rest); setEditingId(id); setFormOpen(true); setError("");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/admin/products", {
        method: editingId === null ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId === null ? draft : { id: editingId, product: draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save product.");
      setFormOpen(false); await loadProducts();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save product."); }
    finally { setSaving(false); }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not delete product.");
      setProducts(current => current.filter(item => item.id !== product.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Could not delete product."); }
  }

  async function updateOrderStatus(order: Order, status: string) {
    setUpdatingOrderId(order.id);
    setOrdersError("");
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update order status.");
      setOrders(current => current.map(item => item.id === order.id ? { ...item, status } : item));
      await loadProducts();
    } catch (e) { setOrdersError(e instanceof Error ? e.message : "Could not update order status."); }
    finally { setUpdatingOrderId(null); }
  }

  function navigateTo(view: AdminView) {
    setActiveView(view);
    window.scrollTo(0, 0);
  }

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    window.location.href = "/";
  }

  if (accessLoading) return <main className={styles.accessScreen}><section className={styles.accessCard}><span className={styles.brandMark}>🥐</span><p className={styles.eyebrow}>DAILY CRUMBS</p><h1>Checking admin access…</h1><p>Connecting your signed-in account to its profile.</p></section></main>;

  if (accessError) return <main className={styles.accessScreen}><section className={styles.accessCard}><span className={styles.brandMark}>🥐</span><p className={styles.eyebrow}>DAILY CRUMBS · ADMIN</p><h1>Dashboard access needed</h1><p>{accessError}</p><div className={styles.accessActions}><Link className={styles.addButton} href="/login?next=%2Fadmin">Sign in as admin</Link><button className={styles.cancelButton} onClick={() => window.location.reload()}>Try again</button><Link className={styles.storeLink} href="/">Back to store</Link></div></section></main>;

  return <main className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/" aria-label="Daily Crumbs home"><span className={styles.brandMark}>🥐</span><span>Daily Crumbs<small>ADMIN PORTAL</small></span></Link>
      <p className={styles.navCaption}>WORKSPACE</p>
      <button type="button" className={styles.navItem + " " + styles.navButton + (activeView === "overview" ? " " + styles.navActive : "")} onClick={() => navigateTo("overview")}><span>▦</span> Overview</button>
      <button type="button" className={styles.navItem + " " + styles.navButton + (activeView === "products" ? " " + styles.navActive : "")} onClick={() => navigateTo("products")}><span>▤</span> Products</button>
      <button type="button" className={styles.navItem + " " + styles.navButton + (activeView === "orders" ? " " + styles.navActive : "")} onClick={() => navigateTo("orders")}><span>▧</span> Orders</button>
      <button type="button" className={styles.navItem + " " + styles.navButton + (activeView === "customers" ? " " + styles.navActive : "")} onClick={() => navigateTo("customers")}><span>♙</span> Customers</button>
      <button type="button" className={styles.navItem + " " + styles.navButton + (activeView === "reports" ? " " + styles.navActive : "")} onClick={() => navigateTo("reports")}><span>▥</span> Sales reports</button>
      <button type="button" className={styles.navItem + " " + styles.navButton + (activeView === "inventory" ? " " + styles.navActive : "")} onClick={() => navigateTo("inventory")}><span>▦</span> Inventory</button>
      <p className={styles.navCaption}>STORE</p>
      <Link className={styles.navItem} href="/"><span>↗</span> View storefront</Link>
      <div className={styles.sideFoot}><span className={styles.onlineDot} /> Your bakery workspace</div>
    </aside>

    <section className={styles.main}>
      <header className={styles.topbar}><div><span className={styles.topKicker}>DAILY CRUMBS · CEBU</span><h1>{({ overview: "Admin dashboard", products: "Products", orders: "Orders", customers: "Customers", reports: "Sales reports", inventory: "Inventory" })[activeView]}</h1></div><div className={styles.topActions}>{adminEmail && <span className={styles.adminIdentity}>Admin · {adminEmail}</span>}<Link href="/" className={styles.storeLink}>View store ↗</Link><button className={styles.signOut} onClick={signOut}>Sign out</button></div></header>
      <div className={styles.content}>
        {error && <div className={styles.alert} role="alert"><span>{error}{error.includes("sign in") || error.includes("session") ? <Link href="/login"> Sign in</Link> : error.includes("Admin access") ? <Link href="/"> Return to the store</Link> : null}</span><button onClick={() => void loadProducts()}>Try again</button></div>}
        <section hidden={activeView !== "overview"} id="overview" className={styles.welcome}><div><p className={styles.eyebrow}>YOUR STORE AT A GLANCE</p><h2>Good things are baking.</h2><p>Keep your menu fresh and ready for your customers.</p></div><span className={styles.welcomeIcon}>✳</span></section>
        <div hidden={activeView !== "overview"} className={styles.stats}>
          <article className={styles.statCard}><span className={styles.statIcon}>▤</span><div><p>Total products</p><strong>{loading || error ? "—" : products.length}</strong></div></article>
          <article className={styles.statCard}><span className={`${styles.statIcon} ${styles.greenIcon}`}>✓</span><div><p>Available now</p><strong>{loading || error ? "—" : availableCount}</strong></div></article>
          <article className={styles.statCard}><span className={`${styles.statIcon} ${styles.creamIcon}`}>◌</span><div><p>Unavailable</p><strong>{loading || error ? "—" : hiddenCount}</strong></div></article>
          <article className={styles.statCard}><span className={`${styles.statIcon} ${styles.creamIcon}`}>◷</span><div><p>Categories</p><strong>{categories.length}</strong></div></article>
        </div>

        <section hidden={activeView !== "overview"} className={styles.stats}>
          <article className={styles.statCard}><span className={styles.statIcon}>₱</span><div><p>Completed sales</p><strong>{ordersLoading || ordersError ? "—" : peso(totalSales)}</strong></div></article>
          <article className={styles.statCard}><span className={`${styles.statIcon} ${styles.greenIcon}`}>▤</span><div><p>Total orders</p><strong>{ordersLoading || ordersError ? "—" : orders.length}</strong></div></article>
          <article className={styles.statCard}><span className={`${styles.statIcon} ${styles.creamIcon}`}>!</span><div><p>Low stock · 5 or less</p><strong>{loading || error ? "—" : lowStockProducts.length}</strong></div></article>
          <article className={styles.statCard}><span className={`${styles.statIcon} ${styles.greenIcon}`}>★</span><div><p>Best seller</p><strong>{ordersLoading || ordersError ? "—" : bestSellers[0]?.name ?? "No sales yet"}</strong></div></article>
        </section>

        <section hidden={activeView !== "reports"} id="reports" className={`${styles.productsPanel} ${styles.reportPanel}`}>
          <div className={styles.panelHead}><div><p className={styles.eyebrow}>SALES PERFORMANCE</p><h2>Sales report</h2><p className={styles.panelSub}>Completed orders only. Sales exclude delivery fees.</p></div><div className={styles.reportTotal}><span>All-time product sales</span><strong>{ordersLoading || ordersError ? "—" : peso(totalSales)}</strong></div></div>
          {ordersError ? <div className={styles.emptyState}>{ordersError}<p><button className={styles.refreshButton} onClick={() => void loadOrders()}>Try again</button></p></div> : <div className={styles.reportGrid}>
            <div className={styles.chartCard}><div className={styles.chartHead}><div><h3>Daily sales</h3><p>Completed order totals by day</p></div><select aria-label="Sales report period" value={reportDays} onChange={event => setReportDays(Number(event.target.value) as 7 | 30)}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></div>
              {ordersLoading ? <div className={styles.emptyState}>Loading sales report…</div> : <div className={styles.chart} aria-label={`Sales in the last ${reportDays} days`}>{salesReport.map(day => <div className={styles.chartColumn} key={day.key} title={`${day.key}: ${peso(day.amount)}`}><strong>{day.amount > 0 ? peso(day.amount) : ""}</strong><div className={styles.barTrack}><span style={{ height: `${day.amount ? Math.max(5, day.amount / maxDailySales * 100) : 2}%` }} /></div><small>{reportDays === 7 ? day.label : new Date(`${day.key}T12:00:00`).getDate()}</small></div>)}</div>}
            </div>
            <div className={styles.bestSellerCard}><h3>Best-selling products</h3><p>Ranked by units in completed orders.</p>{ordersLoading ? <div className={styles.emptyState}>Loading product sales…</div> : bestSellers.length === 0 ? <div className={styles.emptyState}>Completed orders will show best sellers here.</div> : <ol>{bestSellers.map((item, index) => <li key={item.id}><span className={styles.rank}>{index + 1}</span><span className={styles.bestName}>{item.name}<small>{peso(item.revenue)} in sales</small></span><strong>{item.quantity} sold</strong></li>)}</ol>}</div>
          </div>}
        </section>

        <section hidden={activeView !== "products"} id="products" className={styles.productsPanel}>
          <div className={styles.panelHead}><div><p className={styles.eyebrow}>CATALOG</p><h2>Products <span>{error ? "—" : products.length}</span></h2><p className={styles.panelSub}>Manage the treats shown in your store.</p></div><button className={styles.addButton} onClick={startNew}><span>＋</span> Add product</button></div>
          <div className={styles.filters}><label className={styles.searchBox}><span>⌕</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products" /></label><select aria-label="Filter category" value={category} onChange={e => setCategory(e.target.value)}><option>All categories</option>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
          {loading ? <div className={styles.emptyState}>Loading your catalog…</div> : error ? <div className={styles.emptyState}>Catalog unavailable. Fix the admin setup shown above, then try again.</div> : products.length === 0 ? <div className={styles.emptyState}><span>🥐</span><h3>No products yet</h3><p>Add your first product to get started.</p><button className={styles.addButton} onClick={startNew}>Add product</button></div> : visibleProducts.length === 0 ? <div className={styles.emptyState}>No products match those filters.</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STATUS</th><th aria-label="Actions" /></tr></thead><tbody>{visibleProducts.map(product => <tr key={product.id}><td><div className={styles.productCell}><img src={product.image} alt="" /><div><strong>{product.name}</strong><small>{product.tag || "Daily favorite"}</small></div></div></td><td><span className={styles.categoryPill}>{product.category}</span></td><td className={styles.price}>₱{Number(product.price).toFixed(2)}</td><td><span className={`${styles.status} ${product.available ? styles.statusOn : styles.statusOff}`}><i />{product.available ? "Available" : "Sold out"}</span></td><td><div className={styles.rowActions}><button onClick={() => startEdit(product)}>Edit</button><button className={styles.deleteButton} onClick={() => void deleteProduct(product)}>Delete</button></div></td></tr>)}</tbody></table></div>}
          <div className={styles.tableFoot}>{error ? "Product data unavailable" : `Showing ${loading ? 0 : visibleProducts.length} of ${products.length} products`}</div>
        </section>
        <section hidden={activeView !== "inventory"} id="inventory" className={`${styles.productsPanel} ${styles.customersPanel}`}>
          <div className={styles.panelHead}><div><p className={styles.eyebrow}>STOCK CONTROL</p><h2>Inventory <span>{products.length}</span></h2><p className={styles.panelSub}>Track on-hand stock. Orders reduce inventory; cancelling restores it.</p></div><button className={styles.refreshButton} onClick={() => void loadProducts()}>↻ Refresh stock</button></div>
          {loading ? <div className={styles.emptyState}>Loading inventory…</div> : error ? <div className={styles.emptyState}>{error}</div> : products.length === 0 ? <div className={styles.emptyState}>Add products to start tracking inventory.</div> : <div className={styles.inventoryList}>{[...products].sort((a, b) => a.stock_quantity - b.stock_quantity).map(product => <div className={styles.inventoryRow} key={product.id}><div className={styles.inventoryProduct}><strong>{product.name}</strong><small>{product.category} · {peso(Number(product.price))} each</small></div><span className={`${styles.stockCount} ${product.stock_quantity <= 5 ? styles.stockLow : ""}`}>{product.stock_quantity} {product.stock_quantity === 1 ? "unit" : "units"}</span><button className={styles.refreshButton} onClick={() => startEdit(product)}>Adjust stock</button></div>)}</div>}
        </section>
        <section hidden={activeView !== "customers"} id="customers" className={`${styles.productsPanel} ${styles.customersPanel}`}>
          <div className={styles.panelHead}><div><p className={styles.eyebrow}>CUSTOMER ACCOUNTS</p><h2>Users <span>{customersLoading ? "—" : customers.length}</span></h2><p className={styles.panelSub}>Registered accounts and their latest sign-in activity.</p></div><button className={styles.refreshButton} onClick={() => void loadCustomers()}>↻ Refresh list</button></div>
          <div className={styles.filters}><label className={styles.searchBox}><span>⌕</span><input value={customerQuery} onChange={event => setCustomerQuery(event.target.value)} placeholder="Search by name or email" /></label></div>
          {customersLoading ? <div className={styles.emptyState}>Loading customer accounts…</div> : customersError ? <div className={styles.emptyState}>{customersError}<p><button className={styles.refreshButton} onClick={() => void loadCustomers()}>Try again</button></p></div> : visibleCustomers.length === 0 ? <div className={styles.emptyState}>{customers.length ? "No accounts match your search." : "No registered accounts found."}</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>REGISTERED</th><th>LAST SIGN IN</th></tr></thead><tbody>{visibleCustomers.map(customer => <tr key={customer.id}><td><div className={styles.customerName}><span>{(customer.full_name || customer.email || "U").slice(0, 1).toUpperCase()}</span><strong>{customer.full_name || "Unnamed customer"}</strong></div></td><td>{customer.email || "—"}</td><td><span className={`${styles.categoryPill} ${customer.role === "admin" ? styles.adminRole : ""}`}>{customer.role || "customer"}</span></td><td>{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"}</td><td>{customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleString() : "Never signed in"}</td></tr>)}</tbody></table></div>}
          <div className={styles.tableFoot}>Showing {customersLoading ? 0 : visibleCustomers.length} of {customers.length} accounts</div>
        </section>
        <section hidden={activeView !== "orders"} id="orders" className={`${styles.productsPanel} ${styles.customersPanel}`}>
          <div className={styles.panelHead}><div><p className={styles.eyebrow}>FULFILLMENT</p><h2>Customer orders <span>{ordersLoading ? "—" : orders.length}</span></h2><p className={styles.panelSub}>Orders placed by signed-in customers. Update status as you prepare them.</p></div><button className={styles.refreshButton} onClick={() => void loadOrders()}>↻ Refresh orders</button></div>
          {ordersLoading ? <div className={styles.emptyState}>Loading orders…</div> : ordersError && orders.length === 0 ? <div className={styles.emptyState}>{ordersError}<p><button className={styles.refreshButton} onClick={() => void loadOrders()}>Try again</button></p></div> : orders.length === 0 ? <div className={styles.emptyState}>No orders yet. Orders placed at checkout will appear here.</div> : <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>ORDER / DATE</th><th>CUSTOMER</th><th>ITEMS</th><th>FULFILLMENT</th><th>TOTAL</th><th>STATUS</th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><strong>#{order.id}</strong><small className={styles.orderMeta}>{new Date(order.created_at).toLocaleString()}</small></td><td><div className={styles.orderCustomer}><strong>{order.customer_name}</strong><small>{order.customer_email}</small><small>{order.customer_phone}</small></div></td><td><div className={styles.orderItems}>{(order.items || []).map((item, index) => <span key={`${item.product_id}-${index}`}>{item.quantity} × {item.name}</span>)}{order.note && <small>Note: {order.note}</small>}</div></td><td><strong>{order.fulfillment === "delivery" ? "Delivery" : "Pickup"}</strong>{order.fulfillment === "delivery" && <small className={styles.orderMeta}>{order.delivery_address}</small>}<small className={styles.orderMeta}>Payment: {order.payment_method.toUpperCase()}</small></td><td className={styles.price}>₱{Number(order.total).toFixed(2)}</td><td><select aria-label={`Status for order ${order.id}`} className={styles.statusSelect} value={order.status} disabled={updatingOrderId === order.id} onChange={event => void updateOrderStatus(order, event.target.value)}>{orderStatuses.map(status => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></td></tr>)}</tbody></table></div>}
          {ordersError && orders.length > 0 && <div className={styles.alert} role="alert">{ordersError}</div>}
          <div className={styles.tableFoot}>Showing {orders.length} orders</div>
        </section>
        <footer className={styles.footer}>Made with care, just like your bakes <span>♥</span></footer>
      </div>
    </section>

    {formOpen && <div className={styles.modalBackdrop} onMouseDown={e => { if (e.target === e.currentTarget) setFormOpen(false); }}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="form-title"><div className={styles.modalHead}><div><p className={styles.eyebrow}>{editingId === null ? "NEW CATALOG ITEM" : "UPDATE CATALOG ITEM"}</p><h2 id="form-title">{editingId === null ? "Add a product" : "Edit product"}</h2></div><button className={styles.closeButton} onClick={() => setFormOpen(false)} aria-label="Close">×</button></div><form onSubmit={saveProduct} className={styles.productForm}>
      <label>Product name<input required maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Ube cheese pandesal" /></label>
      <div className={styles.formRow}><label>Category<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{categories.map(item => <option key={item}>{item}</option>)}</select></label><label>Price (₱)<input required type="number" min="0.01" step="0.01" value={draft.price || ""} onChange={e => setDraft({ ...draft, price: Number(e.target.value) })} placeholder="0.00" /></label></div>
      <label>Image URL<input required type="url" value={draft.image} onChange={e => setDraft({ ...draft, image: e.target.value })} placeholder="https://…" /></label>
      <div className={styles.formRow}><label>Stock on hand<input required type="number" min="0" step="1" value={draft.stock_quantity} onChange={e => setDraft({ ...draft, stock_quantity: Number(e.target.value) })} placeholder="0" /></label><label className={styles.checkLabel}><input type="checkbox" checked={draft.available} onChange={e => setDraft({ ...draft, available: e.target.checked })} /> Available for sale</label></div>
      <div className={styles.formRow}><label>Product label<select value={draft.tag ?? ""} onChange={e => setDraft({ ...draft, tag: e.target.value || null })}><option value="">No label</option><option>New</option><option>Best Seller</option></select></label><span /></div>
      <div className={styles.modalActions}><button type="button" className={styles.cancelButton} onClick={() => setFormOpen(false)}>Cancel</button><button className={styles.addButton} disabled={saving}>{saving ? "Saving…" : editingId === null ? "Add product" : "Save changes"}</button></div>
    </form></section></div>}
  </main>;
}
