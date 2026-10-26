"use client";

import { useState } from "react";
import styles from "./signup.module.css";

type SignUpForm = { fullName: string; email: string; password: string; confirm: string };
type Errors = Partial<SignUpForm>;

const EMPTY: SignUpForm = { fullName: "", email: "", password: "", confirm: "" };

function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export default function SignUp() {
  const [form, setForm]       = useState<SignUpForm>(EMPTY);
  const [errors, setErrors]   = useState<Errors>({});
  const [success, setSuccess] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [showCf, setShowCf]   = useState(false);
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [notice, setNotice] = useState("");

  function field(key: keyof SignUpForm, val: string) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e: Errors = {};
    if (!form.fullName.trim())                                e.fullName = "Full name is required";
    if (!form.email.trim())                                   e.email    = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email    = "Enter a valid email";
    if (!form.password)                                       e.password = "Password is required";
    else if (form.password.length < 8)                        e.password = "At least 8 characters";
    if (!form.confirm)                                        e.confirm  = "Please confirm your password";
    else if (form.confirm !== form.password)                  e.confirm  = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    setServerError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.fullName, email: form.email, password: form.password }),
      });
      const result = await response.json() as { error?: string; debug?: string; needsEmailConfirmation?: boolean };
      if (!response.ok) setServerError([result.error ?? "Could not create your account.", result.debug].filter(Boolean).join(" — "));
      else {
        setNeedsConfirmation(Boolean(result.needsEmailConfirmation));
        if (!result.needsEmailConfirmation) setSuccess(true);
      }
    } catch {
      setServerError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(ev: React.FormEvent) {
    ev.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) {
      setServerError("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    setServerError("");
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, token: verificationCode }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) setServerError(result.error ?? "That code is invalid or has expired.");
      else window.location.assign(nextPath());
    } catch {
      setServerError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    setBusy(true);
    setServerError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const result = await response.json() as { error?: string; debug?: string };
      if (!response.ok) {
        console.error("[auth/resend] Request failed:", { status: response.status, error: result.error, debug: result.debug });
        setServerError([result.error ?? "Could not resend the code.", result.debug].filter(Boolean).join(" — "));
      }
      else {
        console.info("[auth/resend] Supabase accepted the request:", { status: response.status });
        setNotice("Supabase accepted the request. Check your inbox and spam folder for the code.");
      }
    } catch {
      console.error("[auth/resend] Could not reach the resend endpoint.");
      setServerError("Could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (needsConfirmation) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.backLink}>← Back to Shop</a>
        <div className={styles.logoWrap}>
          <span>🥐</span>
          <div><strong>Daily Crumbs</strong><small>delightfully yours</small></div>
        </div>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.sub}>Enter the 6-digit code sent to <strong>{form.email}</strong>.</p>
        <form onSubmit={verifyCode} className={styles.form}>
          <div className={styles.group}>
            <label htmlFor="verification-code">Email verification code</label>
            <input
              id="verification-code"
              className={styles.otpInput}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={event => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              required
            />
          </div>
          {serverError && <p role="alert" className={styles.err}>{serverError}</p>}
          {notice && <p role="status" className={styles.notice}>{notice}</p>}
          <button type="submit" className={styles.submitBtn} disabled={busy}>{busy ? "VERIFYING…" : "VERIFY EMAIL"}</button>
        </form>
        <button type="button" className={styles.resendBtn} onClick={resendCode} disabled={busy}>Resend code</button>
      </div>
    </div>
  );

  if (success) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.successIcon}>🎉</span>
        <h2 className={styles.successTitle}>Account Created!</h2>
        <p className={styles.successMsg}>
          Welcome to Daily Crumbs, <strong>{form.fullName}</strong>! Your account is ready. Email confirmation is currently off, so Supabase did not send a verification code.
        </p>
        <a href="/account" className={styles.submitBtn} onClick={event => { event.preventDefault(); window.location.assign(nextPath()); }}>CONTINUE</a>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.backLink}>← Back to Shop</a>

        <div className={styles.logoWrap}>
          <span>🥐</span>
          <div>
            <strong>Daily Crumbs</strong>
            <small>delightfully yours</small>
          </div>
        </div>

        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.sub}>Join us and enjoy freshly baked goodness.</p>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>

          <div className={styles.group}>
            <label>Full Name</label>
            <input
              type="text"
              placeholder="Juan dela Cruz"
              value={form.fullName}
              onChange={e => field("fullName", e.target.value)}
              className={errors.fullName ? styles.inputErr : ""}
            />
            {errors.fullName && <span className={styles.err}>{errors.fullName}</span>}
          </div>

          <div className={styles.group}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="juan@email.com"
              value={form.email}
              onChange={e => field("email", e.target.value)}
              className={errors.email ? styles.inputErr : ""}
            />
            {errors.email && <span className={styles.err}>{errors.email}</span>}
          </div>

          <div className={styles.group}>
            <label>Password</label>
            <div className={styles.pwWrap}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => field("password", e.target.value)}
                className={errors.password ? styles.inputErr : ""}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPw(v => !v)}>
                {showPw ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <span className={styles.err}>{errors.password}</span>}
          </div>

          <div className={styles.group}>
            <label>Confirm Password</label>
            <div className={styles.pwWrap}>
              <input
                type={showCf ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirm}
                onChange={e => field("confirm", e.target.value)}
                className={errors.confirm ? styles.inputErr : ""}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowCf(v => !v)}>
                {showCf ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.confirm && <span className={styles.err}>{errors.confirm}</span>}
          </div>

          {serverError && <p role="alert" className={styles.err}>{serverError}</p>}
          <button type="submit" className={styles.submitBtn} disabled={busy}>{busy ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}</button>
        </form>

        <p className={styles.loginLink}>Already have an account? <a href="/login">Log in</a></p>
      </div>
    </div>
  );
}
