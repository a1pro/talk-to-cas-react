import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { merchantApi, type OfferSettingsPayload } from "@/api/merchant";
import { clampVoucherAmount, getVoucherRangeForBusiness, isFoodBusiness } from "@/lib/offerRules";
import type { MerchantOfferSettings } from "@/types";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function MerchantOfferSettingsPage() {
  const [settings, setSettings] = useState<MerchantOfferSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<OfferSettingsPayload>({
    offer_enabled: true,
    business_type: "club",
    offer_type: "ride",
    voucher_amount: 5,
    offer_days: ["friday", "saturday"],
    start_time: "18:00",
    end_time: "23:59",
    minimum_order: null,
    fulfilment_type: "venue",
    ride_trip_type: "to_venue",
    low_balance_threshold: 50,
    auto_top_up_enabled: false,
    auto_top_up_amount: 30,
  });

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const response = await merchantApi.getOfferSettings();
      const nextSettings = response.data.data;
      setSettings(nextSettings);
      setForm({
        offer_enabled: !!nextSettings.offer.offer_enabled,
        business_type: nextSettings.merchant?.business_type || nextSettings.venue?.category || "club",
        offer_type: nextSettings.offer.offer_type,
        voucher_amount: Number(nextSettings.offer.voucher_amount || nextSettings.offer_rules?.voucher_amount?.default_value || 5),
        offer_days: nextSettings.offer.offer_days || ["friday", "saturday"],
        start_time: nextSettings.offer.start_time || null,
        end_time: nextSettings.offer.end_time || null,
        minimum_order: nextSettings.offer.minimum_order != null ? Number(nextSettings.offer.minimum_order) : null,
        fulfilment_type: nextSettings.offer.fulfilment_type || null,
        ride_trip_type: (nextSettings.offer.ride_trip_type as "to_venue" | "to_and_from" | null) || null,
        low_balance_threshold: Number(nextSettings.wallet?.low_balance_threshold || 50),
        auto_top_up_enabled: !!nextSettings.wallet?.auto_top_up_enabled,
        auto_top_up_amount: Number(nextSettings.wallet?.auto_top_up_amount || 30),
      });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Offer settings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const range = useMemo(() => getVoucherRangeForBusiness(form.business_type), [form.business_type]);
  const supportsFood = useMemo(() => form.offer_type === "food" || form.offer_type === "dual_choice", [form.offer_type]);
  const supportsRide = useMemo(() => form.offer_type === "ride" || form.offer_type === "dual_choice", [form.offer_type]);
  const tripBalanceNote = settings?.offer_rules?.minimum_balance_for_two_trips || "15.00";
  const minimumTopUpAmount = settings?.offer_rules?.minimum_top_up_amount || "30.00";

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      offer_days: current.offer_days.includes(day)
        ? current.offer_days.filter((item) => item !== day)
        : [...current.offer_days, day],
    }));
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: OfferSettingsPayload = {
        ...form,
        voucher_amount: clampVoucherAmount(form.voucher_amount, form.business_type),
        minimum_order: supportsFood ? form.minimum_order ?? 25 : null,
        fulfilment_type: supportsFood ? form.fulfilment_type || (isFoodBusiness(form.business_type) ? "collection" : "venue") : "venue",
        ride_trip_type: supportsRide ? form.ride_trip_type || "to_venue" : null,
      };

      const response = await merchantApi.updateOfferSettings(payload);
      setSettings(response.data.data);
      setSuccess(response.data.message || "Offer settings updated.");
      await loadData();
    } catch (requestError: any) {
      const validationErrors = requestError?.response?.data?.errors;
      const firstValidationError = validationErrors ? Object.values(validationErrors)[0]?.[0] : null;
      setError(firstValidationError || requestError?.response?.data?.message || "Offer settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      title="Offer settings"
      subtitle="Finish the merchant rule layer: food-only, ride-only, dual choice, clear trip mode, plus the £30 minimum top-up protection." 
    >
      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="card" style={{ border: "1px solid rgba(34, 197, 94, 0.28)", background: "rgba(34, 197, 94, 0.08)" }}>{success}</div> : null}

      <div className="split-grid">
        <section className="card">
          <span className="eyebrow">Offer model</span>
          <h2 style={{ marginBottom: 8 }}>Merchant offer controls</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            This page wires the PDF clarifications: food-only, ride-only, dual choice, plus clear 1 trip vs 2 trips wording.
          </p>

          <div className="form-grid">
            <label>
              Business type
              <select
                value={form.business_type}
                onChange={(event) => {
                  const nextBusinessType = event.target.value;
                  const nextRange = getVoucherRangeForBusiness(nextBusinessType);
                  setForm((current) => ({
                    ...current,
                    business_type: nextBusinessType,
                    voucher_amount: clampVoucherAmount(current.voucher_amount, nextBusinessType) || nextRange.defaultValue,
                    offer_type: isFoodBusiness(nextBusinessType) ? (current.offer_type === "ride" ? "food" : current.offer_type) : current.offer_type,
                    fulfilment_type: isFoodBusiness(nextBusinessType) ? (current.fulfilment_type || "collection") : "venue",
                  }));
                }}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
              >
                <option value="club">Club</option>
                <option value="bar">Bar</option>
                <option value="restaurant">Restaurant</option>
                <option value="takeaway">Takeaway</option>
                <option value="cafe">Cafe</option>
              </select>
            </label>

            <label>
              Offer type
              <select
                value={form.offer_type}
                onChange={(event) => setForm((current) => ({ ...current, offer_type: event.target.value as OfferSettingsPayload["offer_type"] }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
              >
                <option value="food">Food only</option>
                <option value="ride">Ride only</option>
                <option value="dual_choice">Dual choice</option>
              </select>
            </label>

            <label>
              Voucher amount (£)
              <input
                value={form.voucher_amount}
                onChange={(event) => setForm((current) => ({ ...current, voucher_amount: toNumber(event.target.value, range.defaultValue) }))}
                type="number"
                min={range.min}
                max={range.max}
                step="0.01"
              />
              <span className="muted small-text">{settings?.offer_rules?.voucher_amount?.label || range.label}</span>
            </label>

            <label>
              Offer enabled
              <select
                value={form.offer_enabled ? "yes" : "no"}
                onChange={(event) => setForm((current) => ({ ...current, offer_enabled: event.target.value === "yes" }))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
              >
                <option value="yes">Enabled</option>
                <option value="no">Disabled</option>
              </select>
            </label>

            {supportsRide ? (
              <label>
                Ride wording
                <select
                  value={form.ride_trip_type || "to_venue"}
                  onChange={(event) => setForm((current) => ({ ...current, ride_trip_type: event.target.value as "to_venue" | "to_and_from" }))}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                >
                  <option value="to_venue">1 Trip (to the venue)</option>
                  <option value="to_and_from">2 Trips (to-and-from)</option>
                </select>
              </label>
            ) : null}

            {supportsFood ? (
              <>
                <label>
                  Minimum order (£)
                  <input
                    value={form.minimum_order ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, minimum_order: event.target.value ? toNumber(event.target.value, 25) : null }))}
                    type="number"
                    min={0}
                    step="0.01"
                  />
                </label>
                <label>
                  Fulfilment type
                  <select
                    value={form.fulfilment_type || "collection"}
                    onChange={(event) => setForm((current) => ({ ...current, fulfilment_type: event.target.value }))}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                  >
                    <option value="venue">Venue</option>
                    <option value="collection">Collection</option>
                    <option value="delivery">Delivery</option>
                    <option value="both">Collection + delivery</option>
                  </select>
                </label>
              </>
            ) : null}

            <label>
              Start time
              <input type="time" value={form.start_time || ""} onChange={(event) => setForm((current) => ({ ...current, start_time: event.target.value || null }))} />
            </label>

            <label>
              End time
              <input type="time" value={form.end_time || ""} onChange={(event) => setForm((current) => ({ ...current, end_time: event.target.value || null }))} />
            </label>
          </div>

          <div style={{ marginTop: 18 }}>
            <span className="muted small-text">Offer days</span>
            <div className="badge-row">
              {days.map((day) => {
                const active = form.offer_days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={active ? "primary-button small" : "secondary-button small"}
                    onClick={() => toggleDay(day)}
                  >
                    {day.slice(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="action-row">
            <button className="primary-button" onClick={() => void saveSettings()} disabled={saving || loading || form.offer_days.length === 0}>
              {saving ? "Saving..." : "Save offer settings"}
            </button>
          </div>
        </section>

        <section className="card-grid" style={{ alignContent: "start" }}>
          <section className="card">
            <span className="eyebrow">Balance rules</span>
            <h2 style={{ marginBottom: 8 }}>Low-balance protection</h2>
            <div className="form-grid">
              <label>
                Low-balance threshold (£)
                <input
                  value={form.low_balance_threshold}
                  onChange={(event) => setForm((current) => ({ ...current, low_balance_threshold: toNumber(event.target.value, 50) }))}
                  type="number"
                  min={1}
                  step="0.01"
                />
              </label>
              <label>
                Auto top-up amount (£)
                <input
                  value={form.auto_top_up_amount}
                  onChange={(event) => setForm((current) => ({ ...current, auto_top_up_amount: toNumber(event.target.value, 30) }))}
                  type="number"
                  min={Number(minimumTopUpAmount)}
                  step="0.01"
                />
              </label>
              <label>
                Auto top-up enabled
                <select
                  value={form.auto_top_up_enabled ? "yes" : "no"}
                  onChange={(event) => setForm((current) => ({ ...current, auto_top_up_enabled: event.target.value === "yes" }))}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)" }}
                >
                  <option value="yes">Enabled</option>
                  <option value="no">Disabled</option>
                </select>
              </label>
            </div>
            <div className="badge-row">
              <span className="info-badge">Wallet balance: £{settings?.wallet?.balance || "0.00"}</span>
              {supportsRide && form.ride_trip_type === "to_and_from" ? (
                <span className="info-badge">Minimum balance for 2 trips: £{tripBalanceNote}</span>
              ) : null}
              <span className="info-badge">Minimum top-up: £{minimumTopUpAmount}</span>
              <span className="info-badge">Review status: {settings?.offer?.review_status || "live"}</span>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              2-trip ride validation stays active, and this batch also prevents PAY-AS-YOU-GO / auto top-up values below the minimum £{minimumTopUpAmount} funding rule.
            </p>
          </section>

          <section className="card">
            <span className="eyebrow">Exact Uber links</span>
            <h2 style={{ marginBottom: 8 }}>Provider link readiness</h2>
            <div className="list">
              <div className="list-row"><span>Total imported links</span><strong>{settings?.exact_voucher_links?.summary?.total ?? 0}</strong></div>
              <div className="list-row"><span>Active links</span><strong>{settings?.exact_voucher_links?.summary?.active ?? 0}</strong></div>
              <div className="list-row"><span>Latest provider</span><strong>{settings?.exact_voucher_links?.latest?.provider || "-"}</strong></div>
            </div>
            {settings?.exact_voucher_links?.latest?.link_url ? (
              <p className="muted" style={{ marginTop: 10, wordBreak: "break-all" }}>
                Latest exact link: {settings.exact_voucher_links.latest.link_url}
              </p>
            ) : (
              <p className="muted" style={{ marginTop: 10 }}>
                No exact provider link has been uploaded yet.
              </p>
            )}
          </section>

          <section className="card">
            <span className="eyebrow">PDF alignment</span>
            <h2 style={{ marginBottom: 8 }}>What this batch covers</h2>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
              <li>Food-only, ride-only, or dual choice</li>
              <li>1 Trip vs 2 Trips wording for ride offers</li>
              <li>Low-balance threshold and auto top-up controls</li>
              <li>Visibility into exact Uber / Uber Eats link readiness</li>
            </ul>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
