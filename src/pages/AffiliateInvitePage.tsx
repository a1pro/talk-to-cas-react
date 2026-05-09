import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAffiliateInvite } from "@/api/affiliate";
import { Logo } from "@/components/Logo";
import type { AffiliateInvitePayload } from "@/types";
import heroBackground from "@/assets/talktocas-hero.svg";

export default function AffiliateInvitePage() {
  const { shareCode = "" } = useParams();
  const [invite, setInvite] = useState<AffiliateInvitePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareCode) {
      setError("Referral code missing.");
      return;
    }

    let active = true;
    getAffiliateInvite(shareCode)
      .then((payload) => {
        if (!active) return;
        setInvite(payload);
      })
      .catch(() => {
        if (!active) return;
        setError("That referral invite could not be found.");
      });

    return () => {
      active = false;
    };
  }, [shareCode]);

  const registerLink = useMemo(() => {
    return invite?.register_url || `/register?ref=${encodeURIComponent(shareCode)}`;
  }, [invite?.register_url, shareCode]);

  return (
    <div
      className="landing-page merchant-landing-page"
      style={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(135deg, rgba(4, 12, 24, 0.9), rgba(7, 17, 31, 0.82)), url(${heroBackground})`,
      }}
    >
      <section className="hero-section merchant-hero">
        <div className="hero-nav">
          <Logo className="hero-logo" />
          <div className="hero-actions">
            <Link to="/login" className="ghost-button">
              Login
            </Link>
            <Link to={registerLink} className="primary-button link-button">
              Create account
            </Link>
          </div>
        </div>

        <div className="hero-grid merchant-hero-grid">
          <div className="hero-copy glass-panel">
            <span className="eyebrow">Affiliate invite</span>
            <h1>
              {invite ? `${invite.affiliate_name || "A TALK to CAS member"} invited you to join.` : "Join TALK to CAS through a referral link."}
            </h1>
            <p>
              Create your account, use the assistant, and any voucher activity within the next
              {" "}<strong>{invite?.attribution_days ?? 30} days</strong> can count toward the referrer&apos;s tracked conversions.
            </p>

            <div className="hero-cta-row">
              <Link to={registerLink} className="primary-button link-button">
                Continue to registration
              </Link>
              <Link to="/welcome" className="secondary-button link-button">
                Browse TALK to CAS
              </Link>
            </div>

            <div className="badge-row">
              <span className="info-badge">Referral code: {invite?.share_code || shareCode.toUpperCase()}</span>
              <span className="info-badge">Going-Out Tonight</span>
              <span className="info-badge">Order Food</span>
              <span className="info-badge">GPS or postcode</span>
            </div>
          </div>

          <div className="hero-side glass-panel">
            <p className="mini-label">What happens next</p>
            <div className="step-stack">
              <article className="feature-card">
                <span className="step-number">01</span>
                <div>
                  <h3>Create your account</h3>
                  <p>Register with your mobile and postcode so the platform can personalise venue matching.</p>
                </div>
              </article>
              <article className="feature-card">
                <span className="step-number">02</span>
                <div>
                  <h3>Use the AI assistant</h3>
                  <p>Choose Going Out or Food, then follow the WhatsApp-style discovery and voucher flow.</p>
                </div>
              </article>
              <article className="feature-card">
                <span className="step-number">03</span>
                <div>
                  <h3>Tracked attribution</h3>
                  <p>Voucher activity inside the referral window is counted in the affiliate dashboard foundation.</p>
                </div>
              </article>
            </div>

            {error ? <div className="error-box top-gap">{error}</div> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
