"use client";

import { useState } from "react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsOtp, setNeedsOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState("");

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
      const result = await response.json() as { error?: string; isAdmin?: boolean; needsOtp?: boolean; email?: string };
      if (!response.ok) {
        setError(result.error ?? "Could not log in.");
      } else if (result.isAdmin) {
        window.location.assign("/admin");
      } else if (result.needsOtp) {
        setOtpEmail(result.email ?? email);
        setNeedsOtp(true);
        setNotice("A 6-digit code has been sent to your email.");
      } else {
        const requestedPath = new URLSearchParams(window.location.search).get("next");
        window.location.assign(requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/verify-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, token: otp }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "Invalid code.");
      } else {
        const requestedPath = new URLSearchParams(window.location.search).get("next");
        window.location.assign(requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendOtp() {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      setNotice("A new code has been sent to your email.");
    } catch {
      setError("Could not resend. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (needsOtp) return (
    <main className={styles.page}>
      <section className={styles.card}>
        <a href="/" className={styles.backLink}>← Back to Shop</a>
        <div className={styles.logoWrap}>
          <span aria-hidden="true">🥐</span>
          <div><strong>Daily Crumbs</strong><small>delightfully yours</small></div>
        </div>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.sub}>Enter the 6-digit code sent to <strong>{otpEmail}</strong>.</p>
        <form onSubmit={handleVerify} className={styles.form}>
          <div className={styles.group}>
            <label htmlFor="otp">Verification code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              required
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {notice && <p className={styles.notice}>{notice}</p>}
          <button className={styles.submitBtn} type="submit" disabled={busy}>{busy ? "VERIFYING…" : "VERIFY & LOG IN"}</button>
        </form>
        <p className={styles.signupLink}>
          Didn&apos;t get a code?{" "}
          <button type="button" onClick={resendOtp} disabled={busy} style={{ background: "none", border: "none", color: "#2d6a2d", fontWeight: 700, cursor: "pointer", fontSize: "inherit", padding: 0 }}>
            Resend
          </button>
        </p>
      </section>
    </main>
  );

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
