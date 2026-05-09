import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import heroBackground from "@/assets/talktocas-hero.svg";

const flowSteps = [
  {
    title: "Traffic comes in",
    text: "Users discover TALK to CAS from influencers, social ads, direct visits, or WhatsApp entry points.",
  },
  {
    title: "AI drives demand",
    text: "The WhatsApp AI asks whether they are going out tonight or ordering food, then matches nearby venues.",
  },
  {
    title: "Verified conversion only",
    text: "A merchant only pays when the ride or order is actually completed. No wasted spend.",
  },
];

const merchantBenefits = [
  "Digital wallet with automatic voucher deductions only after conversion",
  "Voucher controls for amount, days, time windows, and delivery or collection",
  "Low-balance alerts by WhatsApp and email",
  "New merchants highlighted higher in ranking for the first week",
];

const rankingItems = [
  { label: "Voucher value", weight: "35%" },
  { label: "Proximity to user", weight: "25%" },
  { label: "Wallet balance", weight: "20%" },
  { label: "Redemption history", weight: "15%" },
  { label: "Rating", weight: "5%" },
];

export default function LandingPage() {
  return (
    <div className="landing-page merchant-landing-page">
      <section
        className="hero-section merchant-hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(4, 12, 24, 0.9), rgba(7, 17, 31, 0.82)), url(${heroBackground})`,
        }}
      >
        <div className="hero-nav">
          <Logo className="hero-logo" />
          <div className="hero-actions">
            <Link to="/login" className="ghost-button">
              Login
            </Link>
            <Link to="/join" className="primary-button link-button">
              Sign up as merchant
            </Link>
          </div>
        </div>

        <div className="hero-grid merchant-hero-grid">
          <div className="hero-copy glass-panel">
            <span className="eyebrow">Merchant onboarding phase</span>
            <h1>Bring clubs, bars, and restaurants onto TALK to CAS first.</h1>
            <p>
              This phase is merchant-first. The document puts heavy detail around wallet setup,
              voucher controls, merchant dashboard toggles, ranking impact, and claim-your-venue
              onboarding. So the best next build is a strong public homepage plus a join flow for merchants.
            </p>

            <div className="badge-row">
              <span className="info-badge">Going-Out Tonight</span>
              <span className="info-badge">Order Food</span>
              <span className="info-badge">GPS or postcode</span>
              <span className="info-badge">Claim your venue</span>
              <span className="info-badge">Wallet-based billing</span>
              <span className="info-badge">Only pay for results</span>
              <span className="info-badge">Uber-style voucher control</span>
            </div>
          </div>

          <div className="hero-side glass-panel">
            <p className="mini-label">How the platform works</p>
            <div className="step-stack">
              {flowSteps.map((step, index) => (
                <article key={step.title} className="feature-card">
                  <span className="step-number">0{index + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-section section-shell">
        <div className="section-heading">
          <span className="eyebrow">Merchant wallet system</span>
          <h2>Only charge after real completed conversion.</h2>
          <p>
            Merchants keep a wallet on the platform, voucher charges deduct automatically after a
            verified conversion, and low-balance alerts help avoid missed campaigns.
          </p>
        </div>

        <div className="card-grid two marketing-grid">
          <article className="card marketing-card">
            <h3>What merchants get</h3>
            <div className="marketing-list">
              {merchantBenefits.map((item) => (
                <div key={item} className="marketing-list-item">
                  <span className="marketing-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card marketing-card wallet-highlight-card">
            <h3>Starter structure</h3>
            <div className="wallet-points">
              <div>
                <strong>Tier 1 wallet</strong>
                <p>Starter balance model for campaign spending.</p>
              </div>
              <div>
                <strong>£2.50 service fee</strong>
                <p>Added on top of voucher value after verified redemption.</p>
              </div>
              <div>
                <strong>Transaction history</strong>
                <p>Visible in merchant dashboard for finance checks and support.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="scroll-section section-shell alternate-section">
        <div className="section-heading">
          <span className="eyebrow">Voucher controls and ranking</span>
          <h2>Merchant dashboard should mirror the Uber for Business toggle logic.</h2>
          <p>
            Merchants need to manage amount, days, time windows, and delivery options, while the
            ranking engine uses voucher value, distance, wallet strength, redemption history, and rating.
          </p>
        </div>

        <div className="card-grid two marketing-grid">
          <article className="card marketing-card">
            <h3>Offer setup</h3>
            <div className="settings-chip-grid">
              <span className="settings-chip">Clubs: £5–£10</span>
              <span className="settings-chip">Restaurants: £2–£10</span>
              <span className="settings-chip">Minimum order</span>
              <span className="settings-chip">Delivery or collection</span>
              <span className="settings-chip">Days of week</span>
              <span className="settings-chip">Time ranges</span>
            </div>
          </article>

          <article className="card marketing-card">
            <h3>Ranking weights</h3>
            <div className="ranking-stack">
              {rankingItems.map((item) => (
                <div key={item.label} className="ranking-row">
                  <span>{item.label}</span>
                  <strong>{item.weight}</strong>
                </div>
              ))}
            </div>
            <p className="muted small-text">
              New merchants should also be tagged as NEW and boosted at the top for the first week.
            </p>
          </article>
        </div>
      </section>

      <section className="scroll-section section-shell">
        <div className="card callout-card">
          <div>
            <span className="eyebrow">Growth layer</span>
            <h2>Affiliate tracking, tag button, and merchant claim links come after onboarding.</h2>
            <p>
              Once merchant signup is stable, the next public growth features are affiliate referral tracking
              and the tag-your-favourite-venue flow that pushes new venues into the claim journey.
            </p>
          </div>
          <div className="callout-actions">
            <Link to="/join" className="primary-button link-button">
              Start merchant signup
            </Link>
            <Link to="/login" className="secondary-button link-button">
              Existing merchant login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
