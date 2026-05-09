import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { getMerchantJoinEligibility, type MerchantJoinEligibilityResult } from "@/api/auth";
import { getTagInvite } from "@/api/tags";
import type { TagInvite } from "@/types";
import heroBackground from "@/assets/talktocas-hero.svg";

export default function MerchantJoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerMerchant } = useAuth();
  const [form, setForm] = useState({
    owner_name: "",
    email: "",
    password: "",
    password_confirmation: "",
    business_name: "",
    business_type: "club",
    contact_phone: "",
    whatsapp_number: "",
    address: "",
    city: "",
    postcode: "",
    latitude: "",
    longitude: "",
    low_balance_threshold: "50",
    venue_description: "",
    requested_plan: "free_trial" as "free_trial" | "payg",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationLabel, setLocationLabel] = useState("Add venue coordinates for better discovery results.");
  const [submitting, setSubmitting] = useState(false);
  const [showMapPreview, setShowMapPreview] = useState(false);
  const [tagInvite, setTagInvite] = useState<TagInvite | null>(null);
  const [tagBanner, setTagBanner] = useState("");
  const [eligibility, setEligibility] = useState<MerchantJoinEligibilityResult | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.owner_name.trim() &&
          form.email.trim() &&
          form.password &&
          form.password_confirmation &&
          form.business_name.trim() &&
          form.contact_phone.trim() &&
          form.postcode.trim()
      ),
    [form]
  );

  const minimumTopUpAmount = eligibility?.minimum_top_up_amount || "30.00";

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  useEffect(() => {
    const tagCode = searchParams.get("tag");
    if (!tagCode) return;

    let active = true;
    getTagInvite(tagCode)
      .then((tag) => {
        if (!active) return;
        setTagInvite(tag);
        setForm((current) => ({
          ...current,
          business_name: current.business_name.trim() ? current.business_name : tag.venue_name,
        }));
      })
      .catch(() => {
        if (!active) return;
        setTagBanner("We could not load that tag invite, but you can still complete merchant signup manually.");
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  useEffect(() => {
    const hasEnoughData = Boolean(
      form.business_name.trim() || form.venue_description.trim() || (form.address.trim() && form.postcode.trim())
    );

    if (!hasEnoughData) {
      setEligibility(null);
      setEligibilityLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setEligibilityLoading(true);
      getMerchantJoinEligibility({
        business_name: form.business_name.trim() || undefined,
        business_type: form.business_type,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        postcode: form.postcode.trim().toUpperCase() || undefined,
        venue_description: form.venue_description.trim() || undefined,
        requested_plan: form.requested_plan,
      })
        .then((result) => setEligibility(result))
        .catch(() => setEligibility(null))
        .finally(() => setEligibilityLoading(false));
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    form.address,
    form.business_name,
    form.business_type,
    form.city,
    form.postcode,
    form.requested_plan,
    form.venue_description,
  ]);

  const mapQuery = useMemo(() => {
    if (form.latitude.trim() && form.longitude.trim()) {
      return `${form.latitude.trim()},${form.longitude.trim()}`;
    }

    const addressParts = [form.address, form.city, form.postcode]
      .map((value) => value.trim())
      .filter(Boolean);

    return addressParts.length ? addressParts.join(", ") : "";
  }, [form.address, form.city, form.latitude, form.longitude, form.postcode]);

  const mapEmbedUrl = useMemo(() => {
    if (!mapQuery) return "";
    return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;
  }, [mapQuery]);

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setLocationLabel("Geolocation is not supported in this browser.");
      return;
    }

    setLocationLabel("Reading venue location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField("latitude", String(position.coords.latitude.toFixed(6)));
        updateField("longitude", String(position.coords.longitude.toFixed(6)));
        setLocationLabel("Venue location captured successfully.");
        setShowMapPreview(true);
      },
      () => {
        setLocationLabel("Location permission denied. You can still type postcode manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await registerMerchant({
        owner_name: form.owner_name.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
        business_name: form.business_name.trim(),
        business_type: form.business_type,
        contact_phone: form.contact_phone.trim(),
        whatsapp_number: form.whatsapp_number.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        postcode: form.postcode.trim().toUpperCase(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        low_balance_threshold: Number(form.low_balance_threshold || 50),
        venue_description: form.venue_description.trim() || undefined,
        tag_code: searchParams.get("tag") || undefined,
        requested_plan: form.requested_plan,
      });

      if (response.free_trial) {
        setEligibility(response.free_trial);
      }
      setSuccess(response.free_trial?.free_trial_message || response.message || "Application submitted successfully.");
      if (response.tag_attribution?.share_code) {
        setTagBanner(`Tag recorded successfully. Reward follow-up is linked to ${response.tag_attribution.share_code}.`);
      }
      window.setTimeout(() => navigate("/login"), 1400);
    } catch (err: any) {
      const validationErrors = err?.response?.data?.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors as Record<string, string[]>)[0];
        setError(Array.isArray(firstError) ? String(firstError[0]) : String(firstError));
      } else {
        setError(err?.response?.data?.message || "Merchant signup failed.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const ruleAccent = useMemo(() => {
    if (!eligibility) return "rgba(59, 130, 246, 0.12)";
    if (form.requested_plan === "payg") return "rgba(59, 130, 246, 0.12)";
    return eligibility.free_trial_available ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)";
  }, [eligibility, form.requested_plan]);

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
          <span className="eyebrow">Sign up as merchant</span>
          <h1>Merchant signup with free-trial protection and pay-as-you-go safeguards.</h1>
          <p>
            This batch adds the business protections from the client notes: same-address free-trial blocking,
            one-off-event keyword checks, and a £{minimumTopUpAmount} minimum top-up for PAY-AS-YOU-GO.
          </p>

          <div className="feature-card compact-card">
            <span className="step-number">01</span>
            <div>
              <h3>Business profile</h3>
              <p>Owner name, business type, contact details, and venue identity.</p>
            </div>
          </div>

          <div className="feature-card compact-card">
            <span className="step-number">02</span>
            <div>
              <h3>Trial eligibility</h3>
              <p>Free trial is checked against one-off event keywords and any prior free trial used at this address.</p>
            </div>
          </div>

          <div className="feature-card compact-card">
            <span className="step-number">03</span>
            <div>
              <h3>Wallet guardrail</h3>
              <p>PAY-AS-YOU-GO and auto top-up now respect the £{minimumTopUpAmount} minimum funding rule.</p>
            </div>
          </div>
        </section>

        <section className="auth-card glass-panel auth-card-wide">
          <form onSubmit={handleSubmit} className="form-grid two-column-form">
            {tagInvite ? (
              <div className="feature-card compact-card form-span-full" style={{ marginBottom: 4 }}>
                <div>
                  <h3>Invite attribution active</h3>
                  <p>
                    This signup is linked to tag code <strong>{tagInvite.share_code}</strong> for <strong>{tagInvite.venue_name}</strong>.
                  </p>
                </div>
              </div>
            ) : null}

            {tagBanner ? <p className="wa-helper-inline form-span-full">{tagBanner}</p> : null}

            <div className="feature-card compact-card form-span-full" style={{ background: ruleAccent, border: "1px solid rgba(148, 163, 184, 0.16)" }}>
              <div style={{ width: "100%" }}>
                <h3 style={{ marginBottom: 8 }}>Onboarding plan</h3>
                <div className="form-grid" style={{ marginBottom: 8 }}>
                  <label>
                    Plan
                    <select value={form.requested_plan} onChange={(e) => updateField("requested_plan", e.target.value as "free_trial" | "payg") }>
                      <option value="free_trial">Free trial request</option>
                      <option value="payg">PAY-AS-YOU-GO</option>
                    </select>
                  </label>
                </div>
                <p className="muted" style={{ marginBottom: 8 }}>
                  Minimum PAY-AS-YOU-GO / auto top-up: <strong>£{minimumTopUpAmount}</strong>
                </p>
                <p style={{ margin: 0 }}>
                  {eligibilityLoading
                    ? "Checking address and event rules..."
                    : eligibility?.free_trial_message || "Fill business details to preview free-trial eligibility."}
                </p>
                {eligibility?.blocked_keywords?.length ? (
                  <p className="muted" style={{ marginTop: 8 }}>
                    Blocked keywords: {eligibility.blocked_keywords.join(", ")}
                  </p>
                ) : null}
                {eligibility?.same_address_match ? (
                  <p className="muted" style={{ marginTop: 8 }}>
                    Previous free-trial venue found: <strong>{eligibility.same_address_match.business_name}</strong>
                  </p>
                ) : null}
              </div>
            </div>

            <label>
              Owner name
              <input
                placeholder="Venue owner or manager"
                value={form.owner_name}
                onChange={(e) => updateField("owner_name", e.target.value)}
              />
            </label>

            <label>
              Business name
              <input
                placeholder="Halo Nights"
                value={form.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
              />
            </label>

            <label>
              Email
              <input
                placeholder="merchant@example.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </label>

            <label>
              Contact phone
              <input
                placeholder="+44 7700 900111"
                value={form.contact_phone}
                onChange={(e) => updateField("contact_phone", e.target.value)}
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                placeholder="Repeat password"
                value={form.password_confirmation}
                onChange={(e) => updateField("password_confirmation", e.target.value)}
              />
            </label>

            <label>
              Business type
              <select value={form.business_type} onChange={(e) => updateField("business_type", e.target.value)}>
                <option value="night-club">Night Club</option>
                <option value="banqueting-suite">Banqueting Suite</option>
                <option value="hall">Hall</option>
                <option value="pub">Pub</option>
                <option value="bar">Bar</option>
                <option value="lounge">Lounge</option>
                <option value="restaurant">Restaurant</option>
                <option value="takeaway">Takeaway</option>
                <option value="cafe">Cafe</option>
              </select>
            </label>

            <label>
              WhatsApp number
              <input
                placeholder="Optional if same as contact phone"
                value={form.whatsapp_number}
                onChange={(e) => updateField("whatsapp_number", e.target.value)}
              />
            </label>

            <label className="form-span-full">
              Address
              <input
                placeholder="123 Example Street"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </label>

            <label>
              City
              <input
                placeholder="Manchester"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </label>

            <label>
              Postcode
              <input
                placeholder="M1 1AE"
                value={form.postcode}
                onChange={(e) => updateField("postcode", e.target.value.toUpperCase())}
              />
            </label>

            <div className="feature-card compact-card form-span-full responsive-feature-card">
              <div>
                <h3>Venue coordinates</h3>
                <p>{locationLabel}</p>
              </div>
              <div className="feature-card-actions">
                <button type="button" className="secondary-button" onClick={() => setShowMapPreview((current) => !current)} disabled={!mapEmbedUrl}>
                  {showMapPreview ? "Hide map" : "Show map"}
                </button>
                <button type="button" className="secondary-button" onClick={handleUseLocation}>
                  Use current location
                </button>
              </div>
            </div>

            {showMapPreview && mapEmbedUrl ? (
              <div className="inline-map-card form-span-full">
                <div className="inline-map-header">
                  <div>
                    <h3>Venue map preview</h3>
                    <p>Small inline preview based on the entered address, postcode, or captured coordinates.</p>
                  </div>
                </div>
                <div className="map-preview-shell">
                  <iframe
                    title="Venue map preview"
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="map-preview-frame"
                  />
                </div>
              </div>
            ) : null}

            <label>
              Latitude
              <input
                placeholder="53.479400"
                value={form.latitude}
                onChange={(e) => updateField("latitude", e.target.value)}
              />
            </label>

            <label>
              Longitude
              <input
                placeholder="-2.245300"
                value={form.longitude}
                onChange={(e) => updateField("longitude", e.target.value)}
              />
            </label>

            <label>
              Low balance threshold
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.low_balance_threshold}
                onChange={(e) => updateField("low_balance_threshold", e.target.value)}
              />
            </label>

            <label className="form-span-full">
              Venue description
              <textarea
                placeholder="Briefly describe the venue and the type of audience you want to attract"
                rows={4}
                value={form.venue_description}
                onChange={(e) => updateField("venue_description", e.target.value)}
              />
            </label>

            {error ? <div className="error-box form-span-full">{error}</div> : null}
            {success ? <div className="success-box form-span-full">{success}</div> : null}

            <div className="form-footer-actions form-span-full">
              <button className="primary-button" type="submit" disabled={!canSubmit || submitting}>
                {submitting ? "Submitting..." : "Submit application"}
              </button>
              <div className="auth-foot-note inline-note">
                <p>Already have an account?</p>
                <Link to="/login">Login here</Link>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
