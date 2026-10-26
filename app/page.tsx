"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Product  = { id: number; name: string; category: string; price: number; image: string; tag?: string; available: boolean; };
type CartItem = Product & { qty: number };
type OrderForm = { name: string; phone: string; email: string; address: string; mode: "delivery" | "pickup"; payment: "cod" | "gcash" | "card"; note: string; };

const DELIVERY_FEE = 50;

const defaultProducts: Product[] = [
  { id: 1,  name: "Ube Cheese Pandesal",   category: "Breads",   price: 45,  tag: "New",         available: true,  image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80" },
  { id: 2,  name: "Sourdough Loaf",         category: "Breads",   price: 120,                     available: true,  image: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=600&q=80" },
  { id: 3,  name: "Pandesal",               category: "Breads",   price: 15,  tag: "Best Seller", available: true,  image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80" },
  { id: 4,  name: "Garlic Bread Loaf",      category: "Breads",   price: 85,                      available: false, image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=600&q=80" },
  { id: 5,  name: "Mango Royale Cake",      category: "Cakes",    price: 420, tag: "Best Seller", available: true,  image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80" },
  { id: 6,  name: "Tiramisu Cake",          category: "Cakes",    price: 380, tag: "New",         available: true,  image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80" },
  { id: 7,  name: "Chocolate Fudge Cake",   category: "Cakes",    price: 350,                     available: true,  image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=600&q=80" },
  { id: 8,  name: "Strawberry Shortcake",   category: "Cakes",    price: 395, tag: "Best Seller", available: false, image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80" },
  { id: 9,  name: "Blueberry Cheesecake",   category: "Cakes",    price: 360, tag: "New",         available: true,  image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80" },
  { id: 10, name: "Butter Croissant",       category: "Pastries", price: 65,  tag: "Best Seller", available: true,  image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80" },
  { id: 11, name: "Cinnamon Roll",          category: "Pastries", price: 75,                      available: true,  image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=600&q=80" },
  { id: 12, name: "Chocolate Cupcake",      category: "Pastries", price: 65,                      available: true,  image: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=600&q=80" },
  { id: 13, name: "Blueberry Muffin",       category: "Pastries", price: 55,  tag: "New",         available: true,  image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&q=80" },
  { id: 14, name: "Choco Chip Cookies",     category: "Cookies",  price: 35,  tag: "Best Seller", available: true,  image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80" },
  { id: 15, name: "Red Velvet Crinkles",    category: "Cookies",  price: 40,  tag: "New",         available: true,  image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80" },
  { id: 16, name: "Oatmeal Raisin Cookies", category: "Cookies",  price: 35,                      available: true,  image: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&q=80" },
  { id: 17, name: "Peanut Butter Cookies",  category: "Cookies",  price: 38,                      available: false, image: "https://images.unsplash.com/photo-1612201142855-7873bc1661b4?auto=format&fit=crop&w=600&q=80" },
  { id: 18, name: "Iced Café Latte",        category: "Drinks",   price: 95,  tag: "Best Seller", available: true,  image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80" },
  { id: 19, name: "Hot Chocolate",          category: "Drinks",   price: 85,                      available: true,  image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=600&q=80" },
  { id: 20, name: "Strawberry Smoothie",    category: "Drinks",   price: 110, tag: "New",         available: true,  image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80" },
  { id: 21, name: "Matcha Latte",           category: "Drinks",   price: 105,                     available: true,  image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80" },
];

const categories = ["All", "Breads", "Cakes", "Pastries", "Cookies", "Drinks"];

const heroSlides = [
  { eyebrow: "FRESHLY BAKED EVERY DAY",   title: "A little joy in every bite",      image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1800&q=85" },
  { eyebrow: "MADE WITH LOVE IN CEBU",    title: "Gather around something sweet",   image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=1800&q=85" },
  { eyebrow: "GOOD MORNINGS START HERE",  title: "Fresh from our oven to you",      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1800&q=85" },
];

const EMPTY_FORM: OrderForm = { name: "", phone: "", email: "", address: "", mode: "delivery", payment: "cod", note: "" };

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]   = useState(false);
  const [userSignedIn, setUserSignedIn] = useState<boolean | null>(null);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [checkout, setCheckout]   = useState(false);
  const [ordered, setOrdered]     = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [wishlist, setWishlist]   = useState<number[]>([]);
  const [mobileNav, setMobileNav] = useState(false);
  const [chatOpen, setChatOpen]   = useState(false);
  const [slide, setSlide]         = useState(0);
  const [toast, setToast]         = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [form, setForm]           = useState<OrderForm>(EMPTY_FORM);
  const [errors, setErrors]       = useState<Partial<OrderForm>>({});

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % heroSlides.length), 5500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/products", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (Array.isArray(data)) setProducts(data as Product[]); })
      .catch(() => { /* Keep the starter catalog visible if Supabase is unavailable. */ })
      .finally(() => setCatalogLoaded(true));
  }, []);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then(response => response.json())
      .then(data => setUserSignedIn(Boolean(data.user)))
      .catch(() => setUserSignedIn(false));
  }, []);

  useEffect(() => {
    if (!catalogLoaded || userSignedIn !== true || typeof window === "undefined") return;
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("restoreCart") !== "1") return;
    const pendingId = Number(window.sessionStorage.getItem("dc_pending_cart_product"));
    const pendingProduct = products.find(product => product.id === pendingId);
    if (pendingProduct) {
      setCart(current => {
        const existing = current.find(item => item.id === pendingProduct.id);
        return existing
          ? current.map(item => item.id === pendingProduct.id ? { ...item, qty: item.qty + 1 } : item)
          : [...current, { ...pendingProduct, qty: 1 }];
      });
      setCartOpen(true);
    }
    window.sessionStorage.removeItem("dc_pending_cart_product");
    currentUrl.searchParams.delete("restoreCart");
    window.history.replaceState({}, "", currentUrl.toString());
  }, [catalogLoaded, userSignedIn, products]);

  const filtered = searchQuery.trim()
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : activeCategory === "All" ? products : products.filter(p => p.category === activeCategory);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = form.mode === "delivery" ? DELIVERY_FEE : 0;
  const total     = subtotal + deliveryFee;

  async function addToCart(p: Product) {
    let signedIn = userSignedIn;
    if (signedIn === null) {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await response.json();
        signedIn = Boolean(data.user);
        setUserSignedIn(signedIn);
      } catch {
        signedIn = false;
        setUserSignedIn(false);
      }
    }
    if (!signedIn) {
      window.sessionStorage.setItem("dc_pending_cart_product", String(p.id));
      setAuthPrompt(true);
      return;
    }
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
    setToast(`${p.name} added to cart!`);
    setTimeout(() => setToast(""), 2500);
  }
  function changeQty(id: number, delta: number) {
    setCart(prev => prev.flatMap(i => i.id === id ? (i.qty + delta < 1 ? [] : [{ ...i, qty: i.qty + delta }]) : [i]));
  }
  function removeItem(id: number) {
    setCart(prev => prev.filter(i => i.id !== id));
  }
  function toggleWishlist(id: number) {
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function validate() {
    const e: Partial<OrderForm> = {};
    if (!form.name.trim())  e.name  = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.email.trim()) e.email = "Email is required";
    if (form.mode === "delivery" && !form.address.trim()) e.address = "Address is required for delivery";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function placeOrder() {
    if (!validate()) return;
    setPlacingOrder(true);
    setOrderError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email,
          delivery_address: form.address,
          fulfillment: form.mode,
          payment_method: form.payment,
          note: form.note,
          items: cart.map(item => ({ product_id: item.id, quantity: item.qty })),
        }),
      });
      const result = await response.json() as { order?: { id: number }; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save your order.");
      setOrderNumber(result.order?.id ?? null);
      setCart([]);
      setCheckout(false);
      setCartOpen(false);
      setOrdered(true);
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : "Could not save your order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  function openCheckout() { setCheckout(true); }
  function backToCart()   { setCheckout(false); setErrors({}); }

  function field(key: keyof OrderForm, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  return (
    <div className={styles.page}>

      {/* TOP BAR */}
      <div className={styles.topBar}>
        <a href="#" className={styles.topBarLink}>DOWNLOAD BROCHURE</a>
        <button className={styles.topBarPayBtn}>DIRECT ONLINE PAYMENT</button>
      </div>

      {/* NAVBAR */}
      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <a href="#home" className={styles.logo}>
            <div className={styles.logoCircle}>
              <span>🥐</span>
              <div><strong>Daily Crumbs</strong><small>delightfully yours</small></div>
            </div>
          </a>
          <nav className={`${styles.nav} ${mobileNav ? styles.navOpen : ""}`}>
            <a href="#home"    className={styles.navLink} onClick={() => setMobileNav(false)}>HOME</a>
            <a href="#about"   className={styles.navLink} onClick={() => setMobileNav(false)}>OUR STORY</a>
            <div className={styles.navDropdown}>
              <span className={styles.navLink}>MENU ▾</span>
              <div className={styles.dropdown}>
                {categories.filter(c => c !== "All").map(c => (
                  <a key={c} href="#products" className={styles.dropItem}
                    onClick={() => { setActiveCategory(c); setMobileNav(false); }}>{c}</a>
                ))}
                <a href="#products" className={styles.dropItem}
                  onClick={() => { setActiveCategory("All"); setMobileNav(false); }}>All Items</a>
              </div>
            </div>
            <a href="#contact" className={styles.navLink} onClick={() => setMobileNav(false)}>STORES</a>
          </nav>
          <div className={styles.navIcons}>
            <button className={styles.iconBtn} title="Search" onClick={() => { setSearchOpen(o => !o); setSearchQuery(""); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <a href="/account" className={styles.iconBtn} title="My account" aria-label="My account">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </a>
            <button className={styles.iconBtn} title="Cart" onClick={() => { setCartOpen(true); setCheckout(false); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {cartCount > 0 && <span className={styles.iconBadgeRed}>{cartCount}</span>}
            </button>
            <button className={styles.hamburger} onClick={() => setMobileNav(o => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* SEARCH BAR */}
      {searchOpen && (
        <div className={styles.searchBar}>
          <div className={styles.searchInner}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              autoFocus
              type="text"
              placeholder="Search breads, cakes, drinks…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && <button className={styles.searchClear} onClick={() => setSearchQuery("")}>✕</button>}
            <button className={styles.searchClose} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>Close</button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section id="home" className={styles.hero}>
        {heroSlides.map((s, i) => (
          <img key={i} src={s.image} alt={s.eyebrow}
            className={`${styles.heroImg} ${i === slide ? styles.heroImgActive : ""}`} />
        ))}
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <p className={styles.heroSub}>{heroSlides[slide].eyebrow}</p>
          <h1 className={styles.heroTitle}>{heroSlides[slide].title}</h1>
          <a href="#products" className={styles.heroBtn}>SHOP NOW</a>
        </div>
        <button className={`${styles.heroArrow} ${styles.heroPrev}`} onClick={() => setSlide(s => (s - 1 + heroSlides.length) % heroSlides.length)}>
          <svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button className={`${styles.heroArrow} ${styles.heroNext}`} onClick={() => setSlide(s => (s + 1) % heroSlides.length)}>
          <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
        </button>
        <div className={styles.heroDots}>
          {heroSlides.map((_, i) => (
            <button key={i} className={`${styles.heroDot} ${i === slide ? styles.heroDotActive : ""}`} onClick={() => setSlide(i)} />
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className={styles.products}>
        <div className={styles.productsInner}>
          <div className={styles.productsHeader}>
            <h2 className={styles.productsTitle}>Our Menu</h2>
            <p className={styles.productsSub}>Freshly baked every morning — no preservatives, ever.</p>
          </div>
          <div className={styles.catTabs}>
            {[{key:"All",icon:"🍽️"},{key:"Breads",icon:"🍞"},{key:"Cakes",icon:"🎂"},{key:"Pastries",icon:"🥐"},{key:"Cookies",icon:"🍪"},{key:"Drinks",icon:"☕"}]
              .map(({ key, icon }) => (
              <button key={key} onClick={() => setActiveCategory(key)}
                className={activeCategory === key ? styles.catTabActive : styles.catTab}>
                <span>{icon}</span>{key}
              </button>
            ))}
            <span className={styles.filterCount}>{filtered.length} items</span>
          </div>
          <div className={styles.grid}>
            {filtered.map(product => (
              <div key={product.id} className={`${styles.card} ${!product.available ? styles.cardUnavailable : ""}`}>
                <div className={styles.cardImgWrap}>
                  <img src={product.image} alt={product.name} className={styles.cardImg} />
                  {product.tag && (
                    <span className={`${styles.cardTag} ${product.tag === "New" ? styles.tagNew : styles.tagBest}`}>{product.tag}</span>
                  )}
                  {!product.available && <div className={styles.soldOutBanner}>SOLD OUT</div>}
                  {product.available && (
                    <div className={styles.cardHover}>
                      <button className={styles.hoverBtn} onClick={() => addToCart(product)}>ADD TO CART</button>
                    </div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.cardCat}>{product.category}</span>
                  <h3 className={styles.cardName}>{product.name}</h3>
                  <div className={styles.availRow}>
                    <span className={product.available ? styles.availBadge : styles.unavailBadge}>
                      {product.available ? "✓ Available" : "✗ Sold Out"}
                    </span>
                  </div>
                  <div className={styles.cardFoot}>
                    <span className={styles.cardPrice}>₱{product.price.toFixed(2)}</span>
                    <button className={product.available ? styles.addBtn : styles.addBtnDisabled}
                      onClick={() => product.available && addToCart(product)} disabled={!product.available}>
                      {product.available ? "+ Add" : "Sold Out"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className={styles.about}>
        <div className={styles.aboutImg}>
          <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85" alt="Our Story" />
        </div>
        <div className={styles.aboutContent}>
          <p className={styles.eyebrow}>OUR STORY</p>
          <h2>Baked with Heart<br />Since 2019</h2>
          <p>Daily Crumbs started as a small home kitchen with one simple goal — to bring the warmth of freshly baked goods to every Filipino table.</p>
          <div className={styles.aboutChips}>
            {["No Preservatives","Locally Sourced","Baked Fresh Daily","Made to Order"].map(f => (
              <span key={f} className={styles.chip}>✓ {f}</span>
            ))}
          </div>
          <a href="#products" className={styles.greenBtn}>EXPLORE MENU</a>
        </div>
      </section>

      {/* STRIP */}
      <div className={styles.strip}>
        {[{icon:"🌿",title:"No Preservatives",sub:"100% natural"},{icon:"🔥",title:"Baked Fresh Daily",sub:"Every morning"},{icon:"🚴",title:"Fast Delivery",sub:"30–45 mins"},{icon:"🎂",title:"Custom Orders",sub:"Made-to-order"}]
          .map(f => (
          <div key={f.title} className={styles.stripItem}>
            <span>{f.icon}</span>
            <div><strong>{f.title}</strong><small>{f.sub}</small></div>
          </div>
        ))}
      </div>

      {/* CONTACT */}
      <section id="contact" className={styles.contact}>
        <div className={styles.contactInner}>
          <p className={styles.eyebrow}>FIND US</p>
          <h2 className={styles.contactTitle}>Visit Our Stores</h2>
          <div className={styles.contactGrid}>
            {[{icon:"📍",label:"Address",val:"123 Pandesal St., Cebu City"},{icon:"🕐",label:"Hours",val:"Mon–Sat 6AM–8PM · Sun 7AM–6PM"},{icon:"📞",label:"Phone",val:"+63 912 345 6789"},{icon:"📧",label:"Email",val:"hello@dailycrumbs.ph"}]
              .map(c => (
              <div key={c.label} className={styles.contactCard}>
                <span>{c.icon}</span><strong>{c.label}</strong><p>{c.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>🥐 Daily Crumbs</span>
            <p>Freshly baked goods made with love and the finest ingredients.</p>
          </div>
          <div className={styles.footerCol}><strong>Quick Links</strong><a href="#home">Home</a><a href="#products">Menu</a><a href="#about">Our Story</a><a href="#contact">Stores</a></div>
          <div className={styles.footerCol}><strong>Categories</strong><a href="#products">Cakes</a><a href="#products">Breads</a><a href="#products">Pastries</a><a href="#products">Cookies</a><a href="#products">Drinks</a></div>
          <div className={styles.footerCol}><strong>Follow Us</strong><a href="#">Facebook</a><a href="#">Instagram</a><a href="#">TikTok</a></div>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Daily Crumbs Bakery. All rights reserved.</span>
          <span>Made with ❤️ in Cebu</span>
        </div>
      </footer>

      {/* CHAT */}
      <div className={styles.chatWrap}>
        {chatOpen && (
          <div className={styles.chatBox}>
            <div className={styles.chatHead}><span>💬 Got questions? Chat us!</span><button onClick={() => setChatOpen(false)}>✕</button></div>
            <div className={styles.chatBody}><p>Hi! 👋 Welcome to Daily Crumbs. How can we help you today?</p></div>
            <div className={styles.chatFoot}><input placeholder="Type a message..." className={styles.chatInput} /><button className={styles.chatSend}>Send</button></div>
          </div>
        )}
        <button className={styles.chatBtn} onClick={() => setChatOpen(o => !o)}>
          <span>💬</span> Got questions? Chat us!
        </button>
      </div>

      {/* CART DRAWER */}
      {cartOpen && !checkout && (
        <>
          <div className={styles.overlay} onClick={() => setCartOpen(false)} />
          <aside className={styles.drawer}>
            <div className={styles.drawerHead}>
              <div><h2>Shopping Cart</h2><small>{cartCount} item{cartCount !== 1 ? "s" : ""}</small></div>
              <button className={styles.closeBtn} onClick={() => setCartOpen(false)}>✕</button>
            </div>

            <div className={styles.drawerItems}>
              {cart.length === 0 ? (
                <div className={styles.emptyCart}>
                  <span>🛒</span><p>Your cart is empty</p><small>Add some delicious items!</small>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className={styles.drawerItem}>
                  <img src={item.image} alt={item.name} />
                  <div className={styles.drawerInfo}>
                    <h4>{item.name}</h4>
                    <span className={styles.drawerItemCat}>{item.category}</span>
                    <span className={styles.drawerItemPrice}>₱{item.price.toFixed(2)} each</span>
                  </div>
                  <div className={styles.drawerRight}>
                    <div className={styles.qty}>
                      <button onClick={() => changeQty(item.id, -1)}>−</button>
                      <span>{item.qty}</span>
                      <button onClick={() => changeQty(item.id, 1)}>+</button>
                    </div>
                    <span className={styles.drawerLineTotal}>₱{(item.price * item.qty).toFixed(2)}</span>
                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)} title="Remove">🗑</button>
                  </div>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div className={styles.drawerFoot}>
                <div className={styles.drawerRow}><span>Subtotal ({cartCount} items)</span><span>₱{subtotal.toFixed(2)}</span></div>
                <div className={styles.drawerRow}><span>Delivery fee</span><span className={styles.drawerNote}>Calculated at checkout</span></div>
                <div className={styles.drawerTotal}><span>Estimated Total</span><span>₱{subtotal.toFixed(2)}</span></div>
                <button className={styles.checkoutBtn} onClick={openCheckout}>PROCEED TO CHECKOUT →</button>
                <button className={styles.continueBtn} onClick={() => setCartOpen(false)}>← Continue Shopping</button>
              </div>
            )}
          </aside>
        </>
      )}

      {/* CHECKOUT MODAL */}
      {cartOpen && checkout && (
        <>
          <div className={styles.overlay} onClick={() => { setCartOpen(false); setCheckout(false); }} />
          <aside className={styles.drawer}>
            <div className={styles.drawerHead}>
              <div><h2>Checkout</h2><small>Fill in your details</small></div>
              <button className={styles.closeBtn} onClick={() => { setCartOpen(false); setCheckout(false); }}>✕</button>
            </div>

            <div className={styles.checkoutBody}>

              {/* Order Summary */}
              <div className={styles.coSection}>
                <h3 className={styles.coSectionTitle}>📋 Order Summary</h3>
                {cart.map(item => (
                  <div key={item.id} className={styles.coItem}>
                    <img src={item.image} alt={item.name} />
                    <span className={styles.coItemName}>{item.name} × {item.qty}</span>
                    <span className={styles.coItemPrice}>₱{(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery / Pickup */}
              <div className={styles.coSection}>
                <h3 className={styles.coSectionTitle}>🚴 Fulfillment Method</h3>
                <div className={styles.modeRow}>
                  <label className={`${styles.modeCard} ${form.mode === "delivery" ? styles.modeCardActive : ""}`}>
                    <input type="radio" name="mode" value="delivery" checked={form.mode === "delivery"} onChange={() => field("mode", "delivery")} />
                    <span>🚴</span>
                    <div><strong>Delivery</strong><small>+₱{DELIVERY_FEE} fee · 30–45 mins</small></div>
                  </label>
                  <label className={`${styles.modeCard} ${form.mode === "pickup" ? styles.modeCardActive : ""}`}>
                    <input type="radio" name="mode" value="pickup" checked={form.mode === "pickup"} onChange={() => field("mode", "pickup")} />
                    <span>🏪</span>
                    <div><strong>Pick Up</strong><small>Free · Ready in 20 mins</small></div>
                  </label>
                </div>
              </div>

              {/* Customer Details */}
              <div className={styles.coSection}>
                <h3 className={styles.coSectionTitle}>👤 Customer Details</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input value={form.name} onChange={e => field("name", e.target.value)} placeholder="Juan dela Cruz" className={errors.name ? styles.inputError : ""} />
                    {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input value={form.phone} onChange={e => field("phone", e.target.value)} placeholder="+63 912 345 6789" className={errors.phone ? styles.inputError : ""} />
                    {errors.phone && <span className={styles.errMsg}>{errors.phone}</span>}
                  </div>
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label>Email Address *</label>
                    <input value={form.email} onChange={e => field("email", e.target.value)} placeholder="juan@email.com" className={errors.email ? styles.inputError : ""} />
                    {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
                  </div>
                  {form.mode === "delivery" && (
                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                      <label>Delivery Address *</label>
                      <input value={form.address} onChange={e => field("address", e.target.value)} placeholder="House No., Street, Barangay, City" className={errors.address ? styles.inputError : ""} />
                      {errors.address && <span className={styles.errMsg}>{errors.address}</span>}
                    </div>
                  )}
                  <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                    <label>Order Notes (optional)</label>
                    <textarea value={form.note} onChange={e => field("note", e.target.value)} placeholder="Special instructions, allergies, etc." rows={2} />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className={styles.coSection}>
                <h3 className={styles.coSectionTitle}>💳 Payment Method</h3>
                <div className={styles.payRow}>
                  {[{val:"cod",label:"Cash on Delivery",icon:"💵"},{val:"gcash",label:"GCash",icon:"📱"},{val:"card",label:"Credit / Debit Card",icon:"💳"}]
                    .map(p => (
                    <label key={p.val} className={`${styles.payCard} ${form.payment === p.val ? styles.payCardActive : ""}`}>
                      <input type="radio" name="payment" value={p.val} checked={form.payment === p.val} onChange={() => field("payment", p.val)} />
                      <span>{p.icon}</span>
                      <small>{p.label}</small>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Checkout Footer */}
            <div className={styles.drawerFoot}>
              <div className={styles.drawerRow}><span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span></div>
              <div className={styles.drawerRow}><span>Delivery fee</span><span>{form.mode === "delivery" ? `₱${DELIVERY_FEE}.00` : "FREE (Pick Up)"}</span></div>
              <div className={styles.drawerTotal}><span>Total</span><span>₱{total.toFixed(2)}</span></div>
              {orderError && <p className={styles.orderError} role="alert">{orderError}</p>}
              <button className={styles.checkoutBtn} onClick={placeOrder} disabled={placingOrder}>{placingOrder ? "SAVING ORDER…" : `PLACE ORDER ₱${total.toFixed(2)}`}</button>
              <button className={styles.continueBtn} onClick={backToCart}>← Back to Cart</button>
            </div>
          </aside>
        </>
      )}

      {/* SUCCESS MODAL */}
      {ordered && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <span className={styles.modalIcon}>🎉</span>
            <h2>Order Confirmed!</h2>
            {orderNumber !== null && <p className={styles.orderReference}>Order #{orderNumber}</p>}
            <p>Thank you, <strong>{form.name || "valued customer"}</strong>! Your order has been received and will be {form.mode === "pickup" ? "ready for pick up in 20 minutes" : "delivered in 30–45 minutes"}.</p>
            <div className={styles.modalDetails}>
              <div><span>📦</span> Order received</div>
              <div><span>{form.mode === "pickup" ? "🏪" : "🚴"}</span> {form.mode === "pickup" ? "Ready for pick up in 20 mins" : "Out for delivery in 30–45 mins"}</div>
              <div><span>💳</span> Payment: {form.payment === "cod" ? "Cash on Delivery" : form.payment === "gcash" ? "GCash" : "Card"}</div>
            </div>
            <button className={styles.greenBtn} onClick={() => { setOrdered(false); setForm(EMPTY_FORM); setOrderNumber(null); }}>CONTINUE SHOPPING</button>
          </div>
        </div>
      )}

      {authPrompt && (
        <div className={styles.modalOverlay} onMouseDown={event => { if (event.target === event.currentTarget) setAuthPrompt(false); }}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="cart-account-title">
            <span className={styles.modalIcon}>ðŸ¥</span>
            <h2 id="cart-account-title">Create an account to shop</h2>
            <p>Please sign in or register before adding products to your cart.</p>
            <div className={styles.authModalActions}>
              <a className={styles.greenBtn} href="/login?next=%2F%3FrestoreCart%3D1">LOG IN</a>
              <a className={styles.authSecondary} href="/signup?next=%2F%3FrestoreCart%3D1">CREATE AN ACCOUNT</a>
              <button className={styles.authCancel} onClick={() => setAuthPrompt(false)}>Continue browsing</button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && <div className={styles.toast} role="status">🛒 {toast}</div>}

    </div>
  );
}
