import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import api from "@/api/axios";
import {
  approveInformation,
  createAdminInformation,
  deleteInformation,
  exportInformation,
  getAdminInformation,
  rejectInformation,
  updateAdminInformation,
  type AdminVenueInformationPayload,
} from "@/api/adminInformation";
import type { ApiResponse, Venue } from "@/types";
import type { AdminMerchant } from "./types";

const emptyForm: AdminVenueInformationPayload = {
  merchant_id: null,
  name: "",
  category: "restaurant",
  address: "",
  city: "",
  postcode: "",
  latitude: null,
  longitude: null,
  description: "",
  promo_message: "",
  approval_status: "approved",
  venue_code: "",
  offer_type: "food",
  ride_trip_type: "to_venue",
  offer_value: 5,
  minimum_order: 25,
};

const categoryOptions = ["club", "bar", "restaurant", "takeaway", "cafe"];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function statusClass(status?: string | null) {
  if (status === "approved") return "status live";
  if (status === "rejected") return "status expired";
  return "status issued";
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseVenueCode(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
}

function isValidVenueCode(value: string) {
  return /^[A-Z0-9]{6}$/.test(value);
}

export default function AdminInformationPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [form, setForm] = useState<AdminVenueInformationPayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [approvalCodes, setApprovalCodes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [infoPayload, merchantRes] = await Promise.all([
        getAdminInformation({ status: statusFilter, search: search.trim() || undefined, limit: 150 }),
        api.get<ApiResponse<AdminMerchant[]>>("/admin/merchants"),
      ]);
      setVenues(infoPayload.items || []);
      setSummary(infoPayload.summary || {});
      setMerchants(merchantRes.data.data || []);
      if (!form.merchant_id && merchantRes.data.data?.[0]) {
        setForm((current) => ({ ...current, merchant_id: merchantRes.data.data[0].id }));
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Venue information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const activeMerchants = useMemo(
    () => merchants.filter((merchant) => merchant.status === "active" || merchant.status === "approved" || !merchant.status),
    [merchants]
  );

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => Number(merchant.id) === Number(form.merchant_id)) || null,
    [merchants, form.merchant_id]
  );

  function resetForm() {
    setEditingId(null);
    setForm((current) => ({ ...emptyForm, merchant_id: current.merchant_id || activeMerchants[0]?.id || merchants[0]?.id || null }));
  }

  function editVenue(venue: Venue) {
    setEditingId(venue.id);
    setForm({
      merchant_id: Number(venue.merchant_id || venue.merchant?.id || activeMerchants[0]?.id || merchants[0]?.id || 0) || null,
      name: venue.name || "",
      category: venue.category || "restaurant",
      address: venue.address || "",
      city: venue.city || "",
      postcode: venue.postcode || "",
      latitude: venue.latitude ?? null,
      longitude: venue.longitude ?? null,
      description: venue.description || "",
      promo_message: venue.promo_message || "",
      approval_status: (venue.approval_status as any) || "pending",
      venue_code: venue.venue_code || "",
      offer_type: venue.offer_type || "food",
      ride_trip_type: venue.ride_trip_type || "to_venue",
      offer_value: venue.offer_value !== null && venue.offer_value !== undefined ? Number(venue.offer_value) : 5,
      minimum_order: venue.minimum_order !== null && venue.minimum_order !== undefined ? Number(venue.minimum_order) : null,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveVenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.merchant_id) {
      setError("Please choose a merchant before saving venue information.");
      return;
    }

    if (form.approval_status === "approved" && !isValidVenueCode(normaliseVenueCode(form.venue_code || ""))) {
      setError("Enter a manual 6 character alphanumeric venue code before approving this venue.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        ...form,
        venue_code: normaliseVenueCode(form.venue_code || ""),
      };

      if (editingId) {
        await updateAdminInformation(editingId, payload);
        setSuccess("Venue information updated successfully.");
      } else {
        await createAdminInformation(payload);
        setSuccess(form.approval_status === "approved" ? "Venue created with manual 6 character code." : "Venue information created.");
      }
      resetForm();
      await loadData();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not save venue information.");
    } finally {
      setSaving(false);
    }
  }

  async function approveVenue(venue: Venue) {
    const code = normaliseVenueCode(approvalCodes[venue.id] ?? venue.venue_code ?? "");
    if (!isValidVenueCode(code)) {
      setError("Enter a manual 6 character alphanumeric venue code before approving this venue.");
      return;
    }

    setBusy(`approve-${venue.id}`);
    setError(null);
    try {
      await approveInformation(venue.id, code);
      setSuccess("Venue approved with manual 6 character alphanumeric code.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not approve this venue.");
    } finally {
      setBusy(null);
    }
  }

  async function rejectVenue(id: number) {
    setBusy(`reject-${id}`);
    setError(null);
    try {
      await rejectInformation(id, "Rejected from admin venue information page.");
      setSuccess("Venue rejected successfully.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not reject this venue.");
    } finally {
      setBusy(null);
    }
  }

  async function removeVenue(id: number) {
    if (!window.confirm("Delete this venue information record? Approved venues with voucher history cannot be deleted.")) return;
    setBusy(`delete-${id}`);
    setError(null);
    try {
      await deleteInformation(id);
      setSuccess("Venue information deleted successfully.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not delete this venue information.");
    } finally {
      setBusy(null);
    }
  }

  async function download(format: "csv" | "excel") {
    setBusy(`export-${format}`);
    setError(null);
    try {
      const blob = await exportInformation(format, { status: statusFilter });
      downloadBlob(blob, `venue-information.${format === "excel" ? "xls" : "csv"}`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not export venue information.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title="Venue information" subtitle="Create venue information, approve merchant submissions with manual 6 character alphanumeric codes, and export CSV or Excel.">
      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="card" style={{ border: "1px solid rgba(34, 197, 94, 0.28)", background: "rgba(34, 197, 94, 0.08)" }}>{success}</div> : null}

      <section className="card-grid four">
        <article className="card stat-card"><h3>Total venues</h3><strong>{summary.total ?? venues.length}</strong></article>
        <article className="card stat-card"><h3>Pending approval</h3><strong>{summary.pending ?? 0}</strong></article>
        <article className="card stat-card"><h3>Approved</h3><strong>{summary.approved ?? 0}</strong></article>
        <article className="card stat-card"><h3>Rejected</h3><strong>{summary.rejected ?? 0}</strong></article>
      </section>

      <section className="card">
        <span className="eyebrow">{editingId ? "Edit venue information" : "Admin-created venue information"}</span>
        <h2 style={{ marginBottom: 8 }}>{editingId ? "Update venue information" : "Create a venue with information"}</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          This is the same information merchants submit: venue, location, description, promo message, offer type, and approval status.
        </p>
        <form className="form-grid two" onSubmit={saveVenue}>
          <label>
            Merchant
            <select value={form.merchant_id || ""} onChange={(event) => setForm((current) => ({ ...current, merchant_id: Number(event.target.value) || null }))} required>
              <option value="">Choose merchant</option>
              {(activeMerchants.length ? activeMerchants : merchants).map((merchant) => (
                <option key={merchant.id} value={merchant.id}>{merchant.business_name} · {merchant.status || "active"}</option>
              ))}
            </select>
          </label>
          <label>
            Approval status
            <select value={form.approval_status || "approved"} onChange={(event) => setForm((current) => ({ ...current, approval_status: event.target.value as any }))}>
              <option value="approved">Approved + manual 6 character code</option>
              <option value="pending">Pending approval</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label>
            Manual venue code
            <input
              value={form.venue_code || ""}
              maxLength={6}
              onChange={(event) => setForm((current) => ({ ...current, venue_code: normaliseVenueCode(event.target.value) }))}
              placeholder="A1B2C3"
              required={form.approval_status === "approved"}
            />
            <small className="muted">Required only when approval status is approved.</small>
          </label>
          <label>
            Venue name
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Example: CAS Lounge" required />
          </label>
          <label>
            Category
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} required>
              {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>
            Address
            <input value={form.address || ""} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Street address" />
          </label>
          <label>
            City
            <input value={form.city || ""} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} placeholder="Manchester" />
          </label>
          <label>
            Postcode
            <input value={form.postcode} onChange={(event) => setForm((current) => ({ ...current, postcode: event.target.value.toUpperCase() }))} placeholder="M4 2BS" required />
          </label>
          <label>
            Offer type
            <select value={form.offer_type || "food"} onChange={(event) => setForm((current) => ({ ...current, offer_type: event.target.value }))}>
              <option value="ride">Ride</option>
              <option value="food">Food</option>
              <option value="dual_choice">Ride or Food</option>
            </select>
          </label>
          <label>
            Latitude
            <input value={form.latitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, latitude: parseNumber(event.target.value) }))} placeholder="53.4808" />
          </label>
          <label>
            Longitude
            <input value={form.longitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, longitude: parseNumber(event.target.value) }))} placeholder="-2.2426" />
          </label>
          <label>
            Offer value £
            <input type="number" min="0" step="0.01" value={form.offer_value ?? ""} onChange={(event) => setForm((current) => ({ ...current, offer_value: parseNumber(event.target.value) }))} />
          </label>
          <label>
            Minimum order £
            <input type="number" min="0" step="0.01" value={form.minimum_order ?? ""} onChange={(event) => setForm((current) => ({ ...current, minimum_order: parseNumber(event.target.value) }))} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Venue information / description
            <textarea rows={5} value={form.description || ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the venue, opening context, collection/delivery notes, or admin information." />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Promo message
            <textarea rows={3} value={form.promo_message || ""} onChange={(event) => setForm((current) => ({ ...current, promo_message: event.target.value }))} placeholder="Message shown to users when this venue appears." />
          </label>
          {selectedMerchant ? <p className="muted" style={{ gridColumn: "1 / -1" }}>Selected merchant: {selectedMerchant.business_name} · {selectedMerchant.venues?.length ?? 0} existing venue(s)</p> : null}
          <div className="action-row" style={{ gridColumn: "1 / -1" }}>
            <button className="primary-button" type="submit" disabled={saving || !form.merchant_id || !form.name.trim() || !form.postcode.trim()}>
              {saving ? "Saving..." : editingId ? "Update venue information" : "Create venue information"}
            </button>
            {editingId ? <button className="secondary-button" type="button" onClick={resetForm}>Cancel edit</button> : null}
          </div>
        </form>
      </section>

      <section className="card">
        <div className="split-card-header">
          <div>
            <span className="eyebrow">Venue information export</span>
            <h2 style={{ marginBottom: 8 }}>Merchant-submitted and admin-created venues</h2>
            <p className="muted">Filter the list, approve pending venues, and download the same venue information as CSV or Excel.</p>
          </div>
          <div className="action-row">
            <button className="secondary-button small" type="button" onClick={() => void download("csv")} disabled={busy === "export-csv"}>CSV</button>
            <button className="secondary-button small" type="button" onClick={() => void download("excel")} disabled={busy === "export-excel"}>Excel</button>
          </div>
        </div>
        <div className="filter-row" style={{ marginBottom: 16 }}>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search venue, merchant, postcode or code" />
          <button className="secondary-button small" type="button" onClick={() => void loadData()}>Search</button>
        </div>
        <div className="list">
          {loading ? <p className="muted">Loading venue information...</p> : null}
          {!loading && venues.length === 0 ? <p className="muted">No venue information found.</p> : null}
          {venues.map((venue) => (
            <div key={venue.id} className="voucher-row" style={{ alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <strong>{venue.name}</strong>
                <span className="muted">{venue.merchant?.business_name || "Merchant"} · {venue.category || "venue"} · {venue.postcode || "no postcode"}</span>
                <span>{[venue.address, venue.city].filter(Boolean).join(", ") || "No address saved"}</span>
                {venue.description ? <p style={{ margin: 0 }}>{venue.description}</p> : null}
                {venue.promo_message ? <span className="muted">Promo: {venue.promo_message}</span> : null}
                <span className="muted">Submitted: {formatDateTime(venue.submitted_for_approval_at || venue.created_at)}</span>
                {venue.rejection_reason ? <span className="muted">Reason: {venue.rejection_reason}</span> : null}
              </div>
              <div style={{ display: "grid", gap: 10, minWidth: 190 }}>
                <span className={statusClass(venue.approval_status)}>{venue.approval_status || "pending"}</span>
                <label className="manual-code-field">
                  Manual venue code
                  <input
                    value={normaliseVenueCode(approvalCodes[venue.id] ?? venue.venue_code ?? "")}
                    maxLength={6}
                    placeholder="A1B2C3"
                    onChange={(event) => setApprovalCodes((current) => ({ ...current, [venue.id]: normaliseVenueCode(event.target.value) }))}
                  />
                  <small>{venue.venue_code ? `Current: ${venue.venue_code}` : "6 letters/numbers. Admin chooses this code."}</small>
                </label>
                {venue.approval_status !== "approved" ? (
                  <button
                    className="primary-button small"
                    type="button"
                    onClick={() => void approveVenue(venue)}
                    disabled={busy === `approve-${venue.id}` || !isValidVenueCode(normaliseVenueCode(approvalCodes[venue.id] ?? venue.venue_code ?? ""))}
                  >
                    Approve with code
                  </button>
                ) : null}
                {venue.approval_status !== "rejected" ? (
                  <button className="secondary-button small" type="button" onClick={() => void rejectVenue(venue.id)} disabled={busy === `reject-${venue.id}`}>Reject</button>
                ) : null}
                <button className="secondary-button small" type="button" onClick={() => editVenue(venue)}>Edit</button>
                <button className="secondary-button small" type="button" onClick={() => void removeVenue(venue.id)} disabled={busy === `delete-${venue.id}`}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
