import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { getAffiliateInvite } from "@/api/affiliate";
import type { AffiliateInvitePayload } from "@/types";
import heroBackground from "@/assets/talktocas-hero.svg";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerUser } = useAuth();
  const referralCode = searchParams.get("ref")?.trim().toUpperCase() || "";

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
    postcode: "",
    latitude: "",
    longitude: "",
  });
  const [locationLabel, setLocationLabel] = useState("Use my current location");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [referralInvite, setReferralInvite] = useState<AffiliateInvitePayload | null>(null);
  const [referralMessage, setReferralMessage] = useState("");

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.name.trim() &&
          form.phone.trim() &&
          form.email.trim() &&
          form.password &&
          form.password_confirmation
      ),
    [form]
  );

  useEffect(() => {
    if (!referralCode) return;

    let active = true;
    getAffiliateInvite(referralCode, false)
      .then((invite) => {
        if (!active) return;
        setReferralInvite(invite);
      })
      .catch(() => {
        if (!active) return;
        setReferralMessage("Referral link could not be verified. You can still register normally.");
      });

    return () => {
      active = false;
    };
  }, [referralCode]);

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationLabel("Location not supported on this browser");
      return;
    }

    setLocationLabel("Reading location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: String(position.coords.latitude.toFixed(6)),
          longitude: String(position.coords.longitude.toFixed(6)),
        }));
        setLocationLabel("Location added successfully");
      },
      () => {
        setLocationLabel("Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await registerUser({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        postcode: form.postcode.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        referral_code: referralInvite?.share_code || (referralCode || undefined),
      });
      navigate("/user", { replace: true });
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors as Record<string, string[]>)[0];
        setError(Array.isArray(firstError) ? String(firstError[0]) : String(firstError));
      } else {
        setError(err?.response?.data?.message || "Registration failed. Check backend setup.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="auth-page"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(4, 12, 24, 0.86), rgba(7, 17, 31, 0.82)), url(${heroBackground})`,
      }}
    >
      <div className="auth-layout register-layout">
        <section className="auth-side glass-panel">
          <Logo className="login-logo" />
          <span className="eyebrow">User registration</span>
          <h1>Create a demo user account.</h1>
          <p>
            This build signs the user in straight away so you can show the dashboard, live venue
            discovery flow, and the new affiliate referral tracking foundation.
          </p>
        </section>

        <section className="auth-card glass-panel">
          <form onSubmit={handleSubmit} className="form-grid">
            {referralInvite ? (
              <div className="feature-card compact-card">
                <div>
                  <h3>Referral active</h3>
                  <p>
                    You are joining through <strong>{referralInvite.affiliate_name || "a TALK to CAS affiliate"}</strong>.
                    Your voucher activity can count toward their {referralInvite.attribution_days}-day attribution window.
                  </p>
                </div>
              </div>
            ) : null}

            {referralMessage ? <div className="error-box">{referralMessage}</div> : null}

            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Demo User"
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                placeholder="+44 7700 900222"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </label>

            <label>
              Postcode
              <input
                value={form.postcode}
                onChange={(e) =>
                  setForm((current) => ({ ...current, postcode: e.target.value.toUpperCase() }))
                }
                placeholder="M1 1AE"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
                placeholder="Minimum 6 characters"
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(e) =>
                  setForm((current) => ({ ...current, password_confirmation: e.target.value }))
                }
                placeholder="Repeat password"
              />
            </label>

            <div className="feature-card compact-card">
              <div>
                <h3>User location</h3>
                <p>{locationLabel}</p>
              </div>
              <button type="button" className="secondary-button" onClick={handleUseLocation}>
                Use current location
              </button>
            </div>

            <div className="badge-row compact-badges">
              {referralInvite ? <span className="info-badge">Code: {referralInvite.share_code}</span> : null}
              {form.latitude ? <span className="info-badge">Lat: {form.latitude}</span> : null}
              {form.longitude ? <span className="info-badge">Lng: {form.longitude}</span> : null}
            </div>

            {error ? <div className="error-box">{error}</div> : null}

            <button className="primary-button" type="submit" disabled={!canSubmit || submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-foot-note">
            <p>Already have an account?</p>
            <Link to="/login">Login here</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
