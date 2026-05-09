import { useMemo, useState } from "react";
import api from "@/api/axios";
import { resolveLocation, type ResolvedLocation } from "@/api/location";
import { AppShell } from "@/components/AppShell";
import type { ApiResponse, Venue } from "@/types";

interface DiscoveryResponse {
  flow_type: "going_out" | "order_food";
  filters?: Record<string, any>;
  summary?: {
    total_results?: number;
    gps_used?: boolean;
    postcode_used?: boolean;
  };
  weather?: {
    summary?: string;
    behavioural_message?: string;
    [key: string]: any;
  } | null;
  live_area?: {
    is_live?: boolean;
    message?: string | null;
    [key: string]: any;
  } | null;
  resolved_location?: {
    postcode?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    [key: string]: any;
  } | null;
  coupon_profile?: {
    profile_completion_message?: string;
    provider_states?: Record<string, { state?: string; label?: string; message?: string }>;
    [key: string]: any;
  } | null;
  venues: Venue[];
}

function offerSummary(venue: Venue) {
  if (venue.offer_type === "dual_choice") {
    return `£${venue.offer_value || "0.00"} flexible voucher • choose Ride or Food after selection`;
  }

  if (venue.offer_type === "food") {
    return `£${venue.offer_value || "0.00"} off food${venue.minimum_order ? ` · £${venue.minimum_order}+ order` : ""}`;
  }

  return `£${venue.offer_value || "0.00"} off ride`;
}

function routeSummary(venue: Venue) {
  const parts = [venue.route?.eta_label, venue.route?.distance_label || venue.distance_label].filter(Boolean);
  return parts.join(" • ");
}

function customerStateLabel(value: "unknown" | "existing" | "new") {
  if (value === "existing") return "Existing customer";
  if (value === "new") return "New customer";
  return "Unknown / not set";
}

export default function PublicVenueDiscoveryPage() {
  const [flowType, setFlowType] = useState<"going_out" | "order_food">("going_out");
  const [postcode, setPostcode] = useState("");
  const [basketTotal, setBasketTotal] = useState("");
  const [uberCustomerState, setUberCustomerState] = useState<"unknown" | "existing" | "new">("unknown");
  const [ubereatsCustomerState, setUbereatsCustomerState] = useState<"unknown" | "existing" | "new">("unknown");
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiscoveryResponse | null>(null);
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPreview, setLocationPreview] = useState<ResolvedLocation | null>(null);

  const subtitle = useMemo(() => {
    if (!result?.summary?.total_results) {
      return "Check postcode or live-GPS discovery, promo eligibility filtering, and tag-ready venue output.";
    }

    const source = result.summary.gps_used ? "live GPS" : result.summary.postcode_used ? "postcode" : "discovery";
    const locationLabel = result.resolved_location?.postcode ? ` near ${result.resolved_location.postcode}` : "";
    return `${result.summary.total_results} venue${result.summary.total_results === 1 ? "" : "s"} found via ${source}${locationLabel}.`;
  }, [result]);

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Live location is not supported on this device.");
      return;
    }

    setLoadingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setLiveLocation(nextLocation);

        resolveLocation(nextLocation)
          .then((resolved) => {
            setLocationPreview(resolved.location);
          })
          .catch(() => {
            setLocationPreview({
              ...nextLocation,
              source: "gps",
              coordinates_source: "input",
            });
          })
          .finally(() => {
            setLoadingLocation(false);
          });
      },
      () => {
        setLoadingLocation(false);
        setError("Location permission was denied. You can still search by postcode.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function normalisePostcode(value: string) {
    return value.trim().replace(/\s+/g, " ").toUpperCase();
  }

  async function resolvePostcode() {
    const nextPostcode = normalisePostcode(postcode);
    setPostcode(nextPostcode);

    if (!nextPostcode) {
      setLocationPreview(null);
      return;
    }

    try {
      const resolved = await resolveLocation({ postcode: nextPostcode });
      setLocationPreview(resolved.location);
      if (resolved.location?.postcode) {
        setPostcode(resolved.location.postcode);
      }
    } catch (requestError: any) {
      setLocationPreview(null);
      setError(requestError?.response?.data?.errors?.postcode?.[0] || requestError?.response?.data?.message || "Postcode could not be resolved.");
    }
  }

  function stateToBoolean(value: "unknown" | "existing" | "new") {
    if (value === "existing") return true;
    if (value === "new") return false;
    return undefined;
  }

  async function searchVenues() {
    setLoading(true);
    setError(null);

    try {
      const nextPostcode = normalisePostcode(postcode);
      setPostcode(nextPostcode);

      const response = await api.get<ApiResponse<DiscoveryResponse>>("/discovery/venues", {
        params: {
          flow_type: flowType,
          postcode: nextPostcode || undefined,
          latitude: liveLocation?.latitude,
          longitude: liveLocation?.longitude,
          basket_total: flowType === "order_food" && basketTotal ? Number(basketTotal) : undefined,
          is_uber_existing_customer: stateToBoolean(uberCustomerState),
          is_ubereats_existing_customer: stateToBoolean(ubereatsCustomerState),
        },
      });

      setResult(response.data.data);
      setLocationPreview(response.data.data?.resolved_location || null);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Discovery search could not be loaded right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Venue discovery" subtitle={subtitle}>
      <div style={{ marginBottom: 16 }}>
        <button 
          className="secondary-button" 
          onClick={() => window.history.back()}
          style={{ marginRight: 8 }}
        >
          ← Back
        </button>
      </div>
      <section className="card narrow" style={{ display: "grid", gap: 16 }}>
        <div>
          <span className="eyebrow">Search flow</span>
          <h2 style={{ marginBottom: 8 }}>Check directions, promo eligibility, and chat parity</h2>
          <p className="muted">
            Use postcode or live GPS to preview the same venue ranking logic used by TALK to CAS, including directions, dual-choice offer messaging,
            and live promo-code eligibility filtering.
          </p>
        </div>

        <div className="form-grid">
          <label>
            Flow type
            <select
              value={flowType}
              onChange={(event) => setFlowType(event.target.value as "going_out" | "order_food")}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
            >
              <option value="going_out">Going out</option>
              <option value="order_food">Ordering food</option>
            </select>
          </label>

          <label>
            Postcode
            <input value={postcode} onChange={(event) => setPostcode(event.target.value.toUpperCase())} onBlur={() => void resolvePostcode()} placeholder="M4 2BS" />
          </label>

          {flowType === "order_food" ? (
            <label>
              Basket total (optional)
              <input value={basketTotal} onChange={(event) => setBasketTotal(event.target.value)} placeholder="25" />
            </label>
          ) : null}
        </div>

        <div className="form-grid">
          <label>
            Uber customer profile
            <select
              value={uberCustomerState}
              onChange={(event) => setUberCustomerState(event.target.value as "unknown" | "existing" | "new")}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
            >
              <option value="unknown">Unknown / not set</option>
              <option value="existing">Existing customer</option>
              <option value="new">New customer</option>
            </select>
          </label>

          <label>
            Uber Eats customer profile
            <select
              value={ubereatsCustomerState}
              onChange={(event) => setUbereatsCustomerState(event.target.value as "unknown" | "existing" | "new")}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
            >
              <option value="unknown">Unknown / not set</option>
              <option value="existing">Existing customer</option>
              <option value="new">New customer</option>
            </select>
          </label>
        </div>

        <div className="action-row" style={{ flexWrap: "wrap" }}>
          <button className="primary-button" onClick={() => void searchVenues()} disabled={loading}>
            {loading ? "Searching..." : "Search venues"}
          </button>
          <button className="secondary-button" onClick={() => void useMyLocation()} disabled={loadingLocation}>
            {loadingLocation ? "Getting live location..." : liveLocation ? "Live location ready" : "Use my live location"}
          </button>
          <button className="secondary-button" onClick={() => void resolvePostcode()} disabled={!postcode.trim()}>
            Check postcode
          </button>
          {liveLocation ? (
            <span className="muted small-text">
              GPS: {liveLocation.latitude.toFixed(4)}, {liveLocation.longitude.toFixed(4)}
            </span>
          ) : null}
        </div>

        {locationPreview ? (
          <div className="feature-card compact-card">
            <strong>Resolved location</strong>
            <p className="muted" style={{ marginTop: 6 }}>
              {[locationPreview.postcode, locationPreview.formatted_address].filter(Boolean).join(" · ") || "GPS coordinates ready"}
              {locationPreview.latitude && locationPreview.longitude
                ? ` · ${Number(locationPreview.latitude).toFixed(4)}, ${Number(locationPreview.longitude).toFixed(4)}`
                : ""}
            </p>
            <p className="muted small-text" style={{ marginTop: 4 }}>
              Source: {locationPreview.source || "open"}
              {locationPreview.coordinates_source ? ` · coordinates: ${locationPreview.coordinates_source}` : ""}
            </p>
          </div>
        ) : null}

        {error ? <div className="error-box">{error}</div> : null}
      </section>

      {result?.coupon_profile ? (
        <section className="card">
          <span className="eyebrow">Promo eligibility</span>
          <h2 style={{ marginBottom: 8 }}>Live provider profile</h2>
          <p>{result.coupon_profile.profile_completion_message || "Provider profile loaded."}</p>
          <div className="card-grid two top-gap">
            {Object.entries(result.coupon_profile.provider_states || {}).map(([key, provider]) => (
              <article key={key} className="card stat-card">
                <h3 style={{ textTransform: "capitalize" }}>{key}</h3>
                <strong>{provider.label || provider.state || "Unknown"}</strong>
                {provider.message ? <p className="muted" style={{ marginTop: 8 }}>{provider.message}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {result?.weather ? (
        <section className="card">
          <span className="eyebrow">Weather layer</span>
          <h2 style={{ marginBottom: 8 }}>Weather summary</h2>
          <p>{result.weather.summary || "No summary returned."}</p>
          {result.weather.behavioural_message ? <p className="muted" style={{ marginTop: 8 }}>{result.weather.behavioural_message}</p> : null}
        </section>
      ) : null}

      {result?.live_area?.is_live === false ? (
        <section className="card">
          <span className="eyebrow">Launch protection</span>
          <h2 style={{ marginBottom: 8 }}>Area not live yet</h2>
          <p>{result.live_area.message || "COMING SOON TO YOUR AREA"}</p>
        </section>
      ) : null}

      <section className="card">
        <span className="eyebrow">Results</span>
        <h2 style={{ marginBottom: 8 }}>Nearby venues</h2>
        {!result?.venues?.length ? (
          <p className="muted">Run a search to see venues here.</p>
        ) : (
          <div className="list">
            {result.venues.map((venue) => (
              <div key={venue.id} className="voucher-row" style={{ alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <strong>{venue.name}</strong>
                    {venue.offer_label ? <span className="status live">{venue.offer_label}</span> : null}
                    {venue.is_new ? <span className="status pending">NEW</span> : null}
                    {venue.recommended_coupon?.status_badge ? <span className="status live">{venue.recommended_coupon.status_badge}</span> : null}
                  </div>
                  <span className="muted">{[venue.category, venue.city, venue.postcode].filter(Boolean).join(" · ")}</span>
                  <span>{venue.description || "No description yet."}</span>
                  <span className="muted">{offerSummary(venue)}</span>
                  {venue.offer_type === "dual_choice" ? <span className="muted">Flexible venue: the user can choose Ride or Food before the voucher is issued.</span> : null}
                  {venue.ride_trip_label ? <span className="muted">{venue.ride_trip_label}</span> : null}
                  {routeSummary(venue) ? <span className="muted">Route: {routeSummary(venue)}</span> : null}
                  {venue.weather_note ? <span className="muted">Weather note: {venue.weather_note}</span> : null}
                  {venue.recommended_coupon ? (
                    <div className="feature-card compact-card" style={{ marginTop: 8 }}>
                      <div>
                        <h3 style={{ marginBottom: 6 }}>Promo eligibility</h3>
                        <p style={{ marginBottom: 6 }}>
                          {venue.recommended_coupon.title || "Live promo"}
                          {venue.recommended_coupon.discount_amount ? ` • £${venue.recommended_coupon.discount_amount} off` : ""}
                          {venue.recommended_coupon.minimum_order ? ` • £${venue.recommended_coupon.minimum_order}+ minimum order` : ""}
                        </p>
                        {venue.recommended_coupon.eligibility_note ? <p className="muted">{venue.recommended_coupon.eligibility_note}</p> : null}
                        {venue.recommended_coupon.eligibility_reason ? <p className="muted">{venue.recommended_coupon.eligibility_reason}</p> : null}
                        <p className="muted" style={{ marginTop: 6 }}>
                          Customer state: {customerStateLabel((venue.recommended_coupon.provider_customer_state as "unknown" | "existing" | "new") || "unknown")}
                          {typeof venue.recommended_coupon.live_coupon_count === "number"
                            ? ` • ${venue.recommended_coupon.live_coupon_count} live promo${venue.recommended_coupon.live_coupon_count === 1 ? "" : "s"}`
                            : ""}
                          {typeof venue.recommended_coupon.filtered_out_new_customer_only_count === "number" && venue.recommended_coupon.filtered_out_new_customer_only_count > 0
                            ? ` • ${venue.recommended_coupon.filtered_out_new_customer_only_count} new-user promo filtered out`
                            : ""}
                          {typeof venue.recommended_coupon.filtered_out_minimum_order_count === "number" && venue.recommended_coupon.filtered_out_minimum_order_count > 0
                            ? ` • ${venue.recommended_coupon.filtered_out_minimum_order_count} basket mismatch`
                            : ""}
                        </p>
                        {venue.recommended_coupon.requires_profile_confirmation ? (
                          <p className="muted" style={{ marginTop: 6 }}>
                            Eligibility is still unknown, so this new-customer promo should be confirmed before it is shown to the final user.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div style={{ display: "grid", gap: 10, minWidth: 220 }}>
                  {venue.urgency?.label ? <span className="status live">{venue.urgency.label}</span> : null}
                  {venue.directions_url ? (
                    <a className="secondary-button link-button" href={venue.directions_url} target="_blank" rel="noreferrer">
                      Open directions
                    </a>
                  ) : (
                    <span className="muted small-text">No directions link yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
