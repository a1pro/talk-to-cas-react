import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import heroBackground from "@/assets/talktocas-hero.svg";

export default function EmailVerificationPendingPage() {
  const { resendVerificationEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const [status, setStatus] = useState(email ? "Check your inbox for the verification link." : "Add an email to resend a new link.");
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email) {
      setError("Email is missing from the link. Go back to registration and try again.");
      return;
    }

    setResending(true);
    setError("");
    try {
      await resendVerificationEmail(email);
      setStatus("A fresh verification email was sent.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not resend the verification email.");
    } finally {
      setResending(false);
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
          <span className="eyebrow">Verify your email</span>
          <h1>One more step before the user dashboard.</h1>
          <p>
            This temporary build uses email verification. Open your mailbox, click the link, and
            you will be signed in automatically.
          </p>

          <div className="feature-card compact-card">
            <span className="step-number">01</span>
            <div>
              <h3>Open the email</h3>
              <p>Look for the TALK to CAS verification email sent to your inbox.</p>
            </div>
          </div>

          <div className="feature-card compact-card">
            <span className="step-number">02</span>
            <div>
              <h3>Click the verify link</h3>
              <p>The verification page signs you in and sends you straight to the dashboard.</p>
            </div>
          </div>
        </section>

        <section className="auth-card glass-panel">
          <div className="form-grid">
            <div className="feature-card">
              <div>
                <h3>Email used for signup</h3>
                <p>{email || "No email found in the page link."}</p>
              </div>
            </div>

            <div className="notice-box">
              <strong>Current status</strong>
              <p>{status}</p>
            </div>

            {error ? <div className="error-box">{error}</div> : null}

            <button className="primary-button" type="button" onClick={handleResend} disabled={resending}>
              {resending ? "Sending..." : "Resend verification email"}
            </button>

            <Link to="/login" className="secondary-button link-button full-width">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
