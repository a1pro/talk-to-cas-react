import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import heroBackground from "@/assets/talktocas-hero.svg";

const demoUsers = [
  { role: "Admin", login: "admin@talktocas.com", password: "password" },
  { role: "Merchant", login: "merchant@talktocas.com", password: "password" },
  { role: "User", login: "user@talktocas.com", password: "password" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState("user@talktocas.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setVerificationEmail("");

    try {
      await login({ login: loginValue, password });
      navigate("/");
    } catch (err: any) {
      const apiError = err?.response?.data;
      setError(apiError?.message || "Login failed. Check backend and seed data.");
      const unverifiedEmail = apiError?.errors?.email?.[0];
      if (unverifiedEmail) {
        setVerificationEmail(unverifiedEmail);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="auth-page"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(4, 12, 24, 0.86), rgba(7, 17, 31, 0.82)), url(${heroBackground})` }}
    >
      <div className="auth-layout">
        <section className="auth-side glass-panel">
          <Logo className="login-logo" />
          <span className="eyebrow">Sign in</span>
          <h1>Login to TALK to CAS.</h1>
          <p>
            Merchant onboarding is the main focus right now, but admin, merchant, and user demo
            logins still work here for testing dashboards and route protection.
          </p>

          <div className="demo-grid">
            {demoUsers.map((item) => (
              <button
                key={item.role}
                type="button"
                className="demo-pill"
                onClick={() => {
                  setLoginValue(item.login);
                  setPassword(item.password);
                }}
              >
                {item.role}
              </button>
            ))}
          </div>
        </section>

        <section className="auth-card glass-panel">
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Email or phone number
              <input
                placeholder="user@talktocas.com or +447700900222"
                value={loginValue}
                onChange={(e) => setLoginValue(e.target.value)}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error ? <div className="error-box">{error}</div> : null}

            {verificationEmail ? (
              <Link
                to={`/verify-email-pending?email=${encodeURIComponent(verificationEmail)}`}
                className="secondary-button link-button full-width"
              >
                Resend verification email
              </Link>
            ) : null}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="auth-foot-note">
            <p>Want to join as a venue?</p>
            <Link to="/join">Sign up now</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
