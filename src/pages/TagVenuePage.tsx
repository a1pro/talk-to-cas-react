import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { createTagInvite, getTagInvite, resendTagInvite } from "@/api/tags";
import type { TagInvite } from "@/types";
import heroBackground from "@/assets/talktocas-hero.svg";

export default function TagVenuePage() {
  const { shareCode } = useParams<{ shareCode?: string }>();
  const [searchParams] = useSearchParams();
  const initialVenue = searchParams.get("venue") || "";

  const [invite, setInvite] = useState<TagInvite | null>(null);
  const [loading, setLoading] = useState(Boolean(shareCode && shareCode !== "new"));
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState("");
  const [resendState, setResendState] = useState("");
  const [form, setForm] = useState({
    venue_name: initialVenue,
    inviter_name: "",
    inviter_phone: "",
    inviter_email: "",
    venue_contact_email: "",
    venue_contact_phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const isCreateMode = !shareCode || shareCode === "new";

  useEffect(() => {
    if (isCreateMode) return;

    let active = true;
    setLoading(true);
    setError("");

    getTagInvite(shareCode)
      .then((tag) => {
        if (!active) return;
        setInvite(tag);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.response?.data?.message || "That invite could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isCreateMode, shareCode]);

  useEffect(() => {
    if (!copyState && !resendState) return;
    const timer = window.setTimeout(() => {
      setCopyState("");
      setResendState("");
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [copyState, resendState]);

  const pageTitle = useMemo(() => {
    if (invite?.venue_name) return `Your customers tagged ${invite.venue_name}`;
    return "Invite a venue to TALK to CAS";
  }, [invite?.venue_name]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const created = await createTagInvite({
        venue_name: form.venue_name.trim(),
        inviter_name: form.inviter_name.trim() || undefined,
        inviter_phone: form.inviter_phone.trim() || undefined,
        inviter_email: form.inviter_email.trim() || undefined,
        venue_contact_email: form.venue_contact_email.trim() || undefined,
        venue_contact_phone: form.venue_contact_phone.trim() || undefined,
        source_channel: "website_tag_page",
      });
      setInvite(created);
      setResendState(created.invite_notifications?.channels?.length ? "Venue invite sent." : "Invite created. Add venue contact details to send notifications.");
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors as Record<string, string[]>)[0];
        setError(Array.isArray(firstError) ? String(firstError[0]) : String(firstError));
      } else {
        setError(err?.response?.data?.message || "Could not create the invite.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!invite?.share_code) return;
    setResending(true);
    setError("");
    try {
      const refreshed = await resendTagInvite(invite.share_code);
      setInvite(refreshed);
      setResendState("Venue invite re-sent.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not re-send the invite right now.");
    } finally {
      setResending(false);
    }
  }

  async function handleCopyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(successMessage);
    } catch {
      setCopyState("Copy failed. Please copy the text manually.");
    }
  }

  const shareEntries = Object.entries(invite?.share_actions || {});

  return (
    <div
      className="auth-page"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(4, 12, 24, 0.88), rgba(7, 17, 31, 0.84)), url(${heroBackground})`,
      }}
    >
      <div className="auth-layout register-layout merchant-join-layout">
        <section className="auth-side glass-panel">
          <Logo className="login-logo" />
          <span className="eyebrow">TAG BUTTON</span>
          <h1>{pageTitle}</h1>
          <p>
            Let customers invite a venue to TALK to CAS, notify that venue immediately, and track the £5 reward once the venue joins.
          </p>

          <div className="feature-card compact-card">
            <span className="step-number">01</span>
            <div>
              <h3>Tag the venue</h3>
              <p>Create a unique invite link for the venue your user wants on the platform.</p>
            </div>
          </div>

          <div className="feature-card compact-card">
            <span className="step-number">02</span>
            <div>
              <h3>Notify the venue</h3>
              <p>Add a venue owner email or WhatsApp number to send the invite straight away.</p>
            </div>
          </div>

          <div className="feature-card compact-card">
            <span className="step-number">03</span>
            <div>
              <h3>Share it wider</h3>
              <p>Open one-click share actions for WhatsApp, Email, X, Facebook, Telegram, LinkedIn, plus copy-ready captions for Instagram and TikTok.</p>
            </div>
          </div>
        </section>

        <section className="auth-card glass-panel auth-card-wide">
          {loading ? (
            <div className="empty-state-card">
              <h2>Loading invite…</h2>
              <p>Please wait while we load this venue tag.</p>
            </div>
          ) : invite ? (
            <div className="wallet-shell">
              <div className="stats-header">
                <div>
                  <p className="mini-label">Venue invite</p>
                  <h2 style={{ marginBottom: 8 }}>{invite.venue_name}</h2>
                  <p style={{ opacity: 0.84, marginBottom: 0 }}>
                    {invite.inviter_display_name
                      ? `${invite.inviter_display_name} wants this venue to join TALK to CAS.`
                      : "A TALK to CAS user wants this venue to join."}
                  </p>
                </div>
                <span className="wallet-balance-pill">£{invite.reward_credit} reward</span>
              </div>

              <div className="card-grid two top-gap">
                <article className="card stat-card">
                  <h3>Invite status</h3>
                  <strong>{invite.status}</strong>
                </article>
                <article className="card stat-card">
                  <h3>Reward status</h3>
                  <strong>{invite.reward_status || "pending"}</strong>
                </article>
              </div>

              <div className="feature-card compact-card" style={{ marginTop: 18, marginBottom: 18 }}>
                <div>
                  <h3>Notification delivery</h3>
                  <p>
                    {invite.invite_notifications?.channels?.length
                      ? `Sent via ${invite.invite_notifications.channels.join(" + ")} on ${invite.invite_notifications.last_sent_at ? new Date(invite.invite_notifications.last_sent_at).toLocaleString() : "this session"}.`
                      : "No delivery recorded yet. Add venue contact details and re-send the invite when available."}
                  </p>
                </div>
              </div>

              <label className="form-span-full">
                Public invite link
                <input value={invite.public_url || ""} readOnly />
              </label>

              <div className="card-grid two top-gap">
                <article className="card" style={{ padding: 16 }}>
                  <h3 style={{ marginBottom: 6 }}>Venue contact</h3>
                  <p className="muted">{invite.venue_contact_email || "No venue email saved"}</p>
                  <p className="muted">{invite.venue_contact_phone || "No venue WhatsApp saved"}</p>
                </article>
                <article className="card" style={{ padding: 16 }}>
                  <h3 style={{ marginBottom: 6 }}>Join flow</h3>
                  <p className="muted">
                    {invite.joined_merchant?.business_name
                      ? `Joined as ${invite.joined_merchant.business_name}`
                      : "Venue has not joined yet from this tag link."}
                  </p>
                  <p className="muted">
                    {invite.reward_awarded_at ? `Reward awarded ${new Date(invite.reward_awarded_at).toLocaleString()}` : "Reward will be logged once the venue completes signup."}
                  </p>
                </article>
              </div>

              <div className="feature-card compact-card" style={{ marginTop: 18 }}>
                <div>
                  <h3 style={{ marginBottom: 6 }}>Share this tag</h3>
                  <p>{invite.share_message || "Share this invite with the venue or on social channels to boost the claim flow."}</p>
                </div>
              </div>

              {shareEntries.length ? (
                <div className="hero-actions" style={{ marginTop: 16 }}>
                  {shareEntries.map(([key, url]) => (
                    <a key={key} className="secondary-button" href={url} target="_blank" rel="noreferrer">
                      {key === "x" ? "Share on X" : `Share on ${key.charAt(0).toUpperCase()}${key.slice(1)}`}
                    </a>
                  ))}
                  {invite.share_message ? (
                    <button type="button" className="secondary-button" onClick={() => void handleCopyText(invite.share_message || "", "Share message copied.") }>
                      Copy share message
                    </button>
                  ) : null}
                  {invite.share_copy_variants?.instagram ? (
                    <button type="button" className="secondary-button" onClick={() => void handleCopyText(invite.share_copy_variants?.instagram || "", "Instagram caption copied.") }>
                      Copy for Instagram
                    </button>
                  ) : null}
                  {invite.share_copy_variants?.tiktok ? (
                    <button type="button" className="secondary-button" onClick={() => void handleCopyText(invite.share_copy_variants?.tiktok || "", "TikTok caption copied.") }>
                      Copy for TikTok
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="hero-actions" style={{ marginTop: 20 }}>
                <button type="button" className="secondary-button" onClick={() => void handleCopyText(invite.public_url || "", "Invite link copied.") }>
                  Copy invite link
                </button>
                <button type="button" className="secondary-button" onClick={() => void handleResend()} disabled={resending || invite.is_expired}>
                  {resending ? "Sending..." : "Re-send venue invite"}
                </button>
                <a className="primary-button" href={invite.join_url}>
                  Claim this venue
                </a>
                <Link className="ghost-button" to="/tag/new">
                  Create another invite
                </Link>
              </div>

              <p className="wa-helper-inline" style={{ marginTop: 18 }}>
                Instagram and TikTok do not support fully prefilled web shares here, so the page provides copy-ready captions plus the main invite link.
              </p>

              {invite.expires_at ? (
                <p className="wa-helper-inline" style={{ marginTop: 8 }}>
                  Invite expires: {new Date(invite.expires_at).toLocaleString()}
                </p>
              ) : null}

              {copyState ? <p className="success-text">{copyState}</p> : null}
              {resendState ? <p className="success-text">{resendState}</p> : null}
              {error ? <p className="error-text">{error}</p> : null}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="form-grid two-column-form">
              <label className="form-span-full">
                Venue name
                <input
                  value={form.venue_name}
                  onChange={(event) => setForm((current) => ({ ...current, venue_name: event.target.value }))}
                  placeholder="Favourite takeaway, club, restaurant..."
                  required
                />
              </label>

              <label>
                Your name
                <input value={form.inviter_name} onChange={(event) => setForm((current) => ({ ...current, inviter_name: event.target.value }))} placeholder="Optional" />
              </label>

              <label>
                Your email
                <input value={form.inviter_email} onChange={(event) => setForm((current) => ({ ...current, inviter_email: event.target.value }))} type="email" placeholder="Optional" />
              </label>

              <label>
                Your WhatsApp / phone
                <input value={form.inviter_phone} onChange={(event) => setForm((current) => ({ ...current, inviter_phone: event.target.value }))} placeholder="Optional" />
              </label>

              <label>
                Venue email
                <input value={form.venue_contact_email} onChange={(event) => setForm((current) => ({ ...current, venue_contact_email: event.target.value }))} type="email" placeholder="owner@venue.com" />
              </label>

              <label>
                Venue WhatsApp / phone
                <input value={form.venue_contact_phone} onChange={(event) => setForm((current) => ({ ...current, venue_contact_phone: event.target.value }))} placeholder="Optional" />
              </label>

              <div className="form-span-full hero-actions" style={{ marginTop: 8 }}>
                <button type="submit" className="primary-button" disabled={submitting || !form.venue_name.trim()}>
                  {submitting ? "Creating invite..." : "Create tag invite"}
                </button>
                <Link className="ghost-button" to="/">
                  Back to home
                </Link>
              </div>

              <p className="wa-helper-inline form-span-full">
                After the invite is created, you will get one-click share actions for WhatsApp, Email, X, Facebook, Telegram, LinkedIn, plus copy-ready captions
                for Instagram and TikTok.
              </p>

              {error ? <p className="error-text form-span-full">{error}</p> : null}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
