"use client";

import { useEffect, useState } from "react";
import styles from "./account.module.css";

type AccountUser = { name: string; email: string };

export default function AccountPage() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(response => response.json())
      .then(async result => {
        setUser(result.user);
        if (result.user) {
          try {
            const access = await fetch("/api/admin/access");
            if (access.ok) setIsAdmin((await access.json()).isAdmin === true);
          } catch { setIsAdmin(false); }
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/session", { method: "DELETE" });
    setUser(null);
    setIsAdmin(false);
    setSigningOut(false);
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <a className={styles.backLink} href="/">← Back to Shop</a>
        <div className={styles.brand}><span aria-hidden="true">🥐</span><div><strong>Daily Crumbs</strong><small>delightfully yours</small></div></div>
        {loading ? <p className={styles.message}>Loading your account…</p> : user ? (
          <>
            <p className={styles.eyebrow}>YOUR ACCOUNT</p>
            <h1 className={styles.title}>Hello, {user.name}</h1>
            <p className={styles.email}>{user.email}</p>
            <p className={styles.message}>You’re signed in and ready to order your favourites.</p>
            <a href="/#products" className={styles.primary}>EXPLORE THE MENU</a>
            <button type="button" className={styles.secondary} onClick={signOut} disabled={signingOut}>{signingOut ? "SIGNING OUT…" : "LOG OUT"}</button>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>YOUR ACCOUNT</p>
            <h1 className={styles.title}>Welcome to Daily Crumbs</h1>
            <p className={styles.message}>Log in or create an account to get started.</p>
            <a href="/login" className={styles.primary}>LOG IN</a>
            <a href="/signup" className={styles.secondary}>CREATE AN ACCOUNT</a>
          </>
        )}
      </section>
    </main>
  );
}
