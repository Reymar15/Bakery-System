"use client";

import { useState } from "react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) setError(result.error ?? "Could not log in.");
      else {
        const requestedPath = new URLSearchParams(window.location.search).get("next");
        const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/";
        window.location.assign(destination);
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <a href="/" className={styles.backLink}>← Back to Shop</a>
        <div className={styles.logoWrap}>
          <span aria-hidden="true">🥐</span>
          <div><strong>Daily Crumbs</strong><small>delightfully yours</small></div>
        </div>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Log in to your Daily Crumbs account.</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.group}>
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@email.com" />
          </div>
          <div className={styles.group}>
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Your password" />
          </div>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <button className={styles.submitBtn} type="submit" disabled={busy}>{busy ? "LOGGING IN…" : "LOG IN"}</button>
        </form>
        <p className={styles.signupLink}>New to Daily Crumbs? <a href="/signup">Create an account</a></p>
      </section>
    </main>
  );
}
