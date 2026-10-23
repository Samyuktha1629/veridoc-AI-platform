import React, { useState } from "react";
import Logo from "./Logo";
import { API_BASE, setAccessToken } from "./api";

function Login({ onAuthenticated, setupRequired, statusMessage }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(setupRequired);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (creatingAccount && password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/auth/${creatingAccount ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || `Request failed (${response.status}).`);
      setAccessToken(result.access_token);
      onAuthenticated();
    } catch (loginError) {
      setError(loginError.message || "Could not connect to the sign-in service.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="login-wrap">
      <div className="panel login-panel">
        <div className="login-brand"><Logo /><span>Veridoc AI</span></div>
        <p className="eyebrow login-tagline">VERIFY. VALIDATE. TRUST.</p>
        <h1>{creatingAccount ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">{creatingAccount ? "Create an account to access the secure review workspace." : "Sign in to continue to your secure review workspace."}</p>
        {statusMessage && <div className="notice error" role="alert">{statusMessage}</div>}
        <form onSubmit={submit}>
          <label htmlFor="account-username">Username</label>
          <input id="account-username" autoComplete="username" minLength="3" maxLength="64" pattern="[A-Za-z0-9_.]+" title="Use 3–64 letters, numbers, periods, or underscores." required value={username} onChange={(event) => setUsername(event.target.value)} />
          <label htmlFor="account-password">Password</label>
          <input id="account-password" type="password" autoComplete={creatingAccount ? "new-password" : "current-password"} minLength="12" maxLength="256" required value={password} onChange={(event) => setPassword(event.target.value)} />
          {creatingAccount && (
            <>
              <label htmlFor="account-confirm-password">Confirm password</label>
              <input id="account-confirm-password" type="password" autoComplete="new-password" minLength="12" maxLength="256" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              <p className="password-help">Use at least 12 characters. Your password is stored as a salted hash.</p>
              <p className="password-help">All accounts share the same review workspace and records.</p>
            </>
          )}
          {error && <div className="notice error" role="alert">{error}</div>}
          <button className="primary-button full-width" type="submit" disabled={busy}>{busy ? (creatingAccount ? "Creating account…" : "Signing in…") : (creatingAccount ? "Create account" : "Sign in")} <span>→</span></button>
        </form>
        <p className="account-switch">
          {creatingAccount ? "Already have an account?" : "New to Veridoc AI?"}{" "}
          <button type="button" onClick={() => { setCreatingAccount(!creatingAccount); setError(""); }}>
            {creatingAccount ? "Sign in" : "Create account"}
          </button>
        </p>
        <p className="login-security">Your session is protected and expires after 8 hours.</p>
      </div>
    </section>
  );
}

export default Login;
