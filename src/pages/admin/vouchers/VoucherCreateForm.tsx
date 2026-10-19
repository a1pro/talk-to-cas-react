import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";
import type { ProviderVoucherLinkRecord } from "@/types";
import type { AdminMerchant, LinkFormState } from "../types";
import { VoucherRecordsList } from "./VoucherRecordsList";

interface VoucherCreateFormProps {
  merchants: AdminMerchant[];
  selectedMerchant: AdminMerchant | null;
  linkForm: LinkFormState;
  providerLinks: ProviderVoucherLinkRecord[];
  loading: boolean;
  busy: string | null;
  setLinkForm: Dispatch<SetStateAction<LinkFormState>>;
  onMerchantChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onSaveProviderLink: () => Promise<void>;
  circulationModeLabel: (mode?: string | null) => string;
}

const selectStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  background: "var(--bg-input)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-input)",
} as const;

const textareaStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  background: "var(--bg-input)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-input)",
  resize: "vertical" as const,
} as const;

export function VoucherCreateForm({
  merchants,
  selectedMerchant,
  linkForm,
  providerLinks,
  loading,
  busy,
  setLinkForm,
  onMerchantChange,
  onSaveProviderLink,
  circulationModeLabel,
}: VoucherCreateFormProps) {
  return (
   
      <section className="card">
        <span className="eyebrow">Exact voucher link entry</span>
        <h2 style={{ marginBottom: 8 }}>Save the exact Uber / Uber Eats HTML link</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Use this page only for manual link creation. Upload tools and record review stay on their own pages.
        </p>

        <div className="badge-row" style={{ marginBottom: 16 }}>
          <span className="info-badge">Start / end dates included</span>
          <span className="info-badge">Issue mode tracking included</span>
        </div>

        <div className="form-grid">
          <label>
            Business Name
            <select value={linkForm.merchant_id} onChange={onMerchantChange} style={selectStyle}>
              <option value="">Choose merchant</option>
              {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.business_name}</option>)}
            </select>
          </label>
          <label>
            Business type
            <select
              value={linkForm.business_type}
              onChange={(event) => setLinkForm((current) => ({ ...current, business_type: event.target.value }))}
              style={selectStyle}
            >
              <option value="">Select business type</option>
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
            Venue
            <select
              value={linkForm.venue_id}
              onChange={(event) => setLinkForm((current) => ({ ...current, venue_id: event.target.value }))}
              style={selectStyle}
            >
              <option value="">Merchant default</option>
              {(selectedMerchant?.venues || []).map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
            </select>
          </label>
          <label>
            Provider
            <select
              value={linkForm.provider}
              onChange={(event) => setLinkForm((current) => ({ ...current, provider: event.target.value as "uber" | "ubereats" }))}
              style={selectStyle}
            >
              <option value="uber">Uber</option>
              <option value="ubereats">Uber Eats</option>
            </select>
          </label>
          <label>
            Offer type
            <select
              value={linkForm.offer_type}
              onChange={(event) => setLinkForm((current) => ({ ...current, offer_type: event.target.value as "food" | "ride" | "dual_choice" }))}
              style={selectStyle}
            >
              <option value="ride">Ride only</option>
              <option value="food">Food only</option>
              <option value="dual_choice">Ride or food</option>
            </select>
          </label>
          <label>
            Exact link URL
            <input value={linkForm.link_url} onChange={(event) => setLinkForm((current) => ({ ...current, link_url: event.target.value }))} placeholder="https://r.uber.com/..." />
          </label>
          <label>
            Ride trip type
            <select
              value={linkForm.ride_trip_type}
              onChange={(event) => setLinkForm((current) => ({ ...current, ride_trip_type: event.target.value as "to_venue" | "to_and_from" }))}
              style={selectStyle}
            >
              <option value="to_venue">1 Trip (to venue)</option>
              <option value="to_and_from">2 Trips (to and from venue)</option>
            </select>
          </label>
          <label>
            Voucher amount (£)
            <input value={linkForm.voucher_amount} onChange={(event) => setLinkForm((current) => ({ ...current, voucher_amount: event.target.value }))} placeholder="5.00" />
          </label>
          <label>
            Minimum order
            <input value={linkForm.minimum_order} onChange={(event) => setLinkForm((current) => ({ ...current, minimum_order: event.target.value }))} placeholder="0.00" />
          </label>
          <label>
            Venue postcode
            <input value={linkForm.location_postcode} onChange={(event) => setLinkForm((current) => ({ ...current, location_postcode: event.target.value }))} placeholder="M4 2BS" />
          </label>
          <label>
            Start date
            <input type="date" value={linkForm.valid_from} onChange={(event) => setLinkForm((current) => ({ ...current, valid_from: event.target.value }))} />
          </label>
          <label>
            End date
            <input type="date" value={linkForm.valid_until} onChange={(event) => setLinkForm((current) => ({ ...current, valid_until: event.target.value }))} />
          </label>
          <label>
            Start time
            <input type="time" value={linkForm.start_time} onChange={(event) => setLinkForm((current) => ({ ...current, start_time: event.target.value }))} />
          </label>
          <label>
            End time
            <input type="time" value={linkForm.end_time} onChange={(event) => setLinkForm((current) => ({ ...current, end_time: event.target.value }))} />
          </label>
          <label>
            Issue mode
            <select
              value={linkForm.circulation_mode}
              onChange={(event) => setLinkForm((current) => ({ ...current, circulation_mode: event.target.value as "shared_sequence" | "unique_individual" }))}
              style={selectStyle}
            >
              <option value="shared_sequence">1 shared HTML link reused up to X times</option>
              <option value="unique_individual">Unique individual links for tracking</option>
            </select>
          </label>
          <label>
            Voucher issue cap
            <input
              value={linkForm.max_issue_count}
              onChange={(event) => setLinkForm((current) => ({ ...current, max_issue_count: event.target.value.replace(/[^\d]/g, "") }))}
              placeholder="e.g. 50"
            />
          </label>
          <label style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 28 }}>
            <input type="checkbox" checked={linkForm.is_active} onChange={(event) => setLinkForm((current) => ({ ...current, is_active: event.target.checked }))} />
            Issue toggle enabled
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Source / batch label
            <input value={linkForm.source_label} onChange={(event) => setLinkForm((current) => ({ ...current, source_label: event.target.value }))} placeholder="manual-admin-entry" />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Notes
            <textarea value={linkForm.notes} onChange={(event) => setLinkForm((current) => ({ ...current, notes: event.target.value }))} rows={3} style={textareaStyle} />
          </label>
        </div>

        <div className="card" style={{ marginTop: 16, padding: 16, background: "rgba(255,255,255,0.04)" }}>
          <strong style={{ display: "block", marginBottom: 6 }}>How the circulation cap works</strong>
          <p className="muted" style={{ margin: 0 }}>
            Shared sequence = one HTML link can be issued repeatedly until the cap is reached. Unique individual = upload separate links and CAS tracks each one separately for provider reporting.
          </p>
        </div>

        <div className="action-row" style={{ flexWrap: "wrap" }}>
          <button className="primary-button" onClick={() => void onSaveProviderLink()} disabled={busy === "save-provider-link" || loading}>
            {busy === "save-provider-link" ? "Saving..." : "Save exact link"}
          </button>
          <Link className="secondary-button link-button" to="/admin/vouchers">View records</Link>
          <Link className="secondary-button link-button" to="/admin/vouchers/upload">Go to upload</Link>
        </div>
      </section>

      
 
  );
}