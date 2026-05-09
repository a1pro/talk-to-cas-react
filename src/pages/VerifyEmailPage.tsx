import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import heroBackground from "@/assets/talktocas-hero.svg";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get("email")?.trim() ?? "", [searchParams]);
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [status, setStatus] = useState("Verifying your email...");
  const [error, setError] = useState("");

  useEffect(() => {
    async function runVerification() {
      if (!email || !token) {
        setError("Verification link is incomplete. Please request a new email.");
        return;
      }

      try {
        await verifyEmail({ email, token });
        setStatus("Email verified. Redirecting to your dashboard...");
        setTimeout(() => navigate("/user", { replace: true }), 900);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Verification failed.");
      }
    }

    void runVerification();
  }, [email, navigate, token, verifyEmail]);

  return (
    <div
      className="auth-page"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(4, 12, 24, 0.86), rgba(7, 17, 31, 0.82)), url(${heroBackground})` }}
    >
      <div className="auth-layout">
        <section className="auth-side glass-panel">
          <Logo className="login-logo" />
          <span className="eyebrow">Email verification</span>
          <h1>Checking your verification link.</h1>
          <p>
            Once this link is confirmed, the temporary email-based user flow signs you in and opens
            the user dashboard.
          </p>
        </section>

        <section className="auth-card glass-panel">
          <div className="form-grid">
            <div className="notice-box">
              <strong>Status</strong>
              <p>{error || status}</p>
            </div>

            {error ? (
              <>
                <Link
                  to={`/verify-email-pending?email=${encodeURIComponent(email)}`}
                  className="primary-button link-button full-width"
                >
                  Request a new email
                </Link>
                <Link to="/login" className="secondary-button link-button full-width">
                  Back to login
                </Link>
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
