import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { merchantApi, type MerchantVenuePayload } from "@/api/merchant";
import type { Venue } from "@/types";

const emptyForm: MerchantVenuePayload = {
  name: "",
  category: "restaurant",
  address: "",
  city: "",
  postcode: "",
  latitude: null,
  longitude: null,
  description: "",
  promo_message: "",
};

const categoryOptions = ["club", "bar", "restaurant", "takeaway", "cafe"];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

export default function MerchantInformationPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [form, setForm] = useState<MerchantVenuePayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadVenues() {
    setLoading(true);
    setError(null);
    try {
      const response = await merchantApi.getVenues();
      setVenues(response.data.data || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Venue information could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVenues();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function editVenue(venue: Venue) {
    setEditingId(venue.id);
    setForm({
      name: venue.name || "",
      category: venue.category || "restaurant",
      address: venue.address || "",
      city: venue.city || "",
      postcode: venue.postcode || "",
      latitude: venue.latitude ?? null,
      longitude: venue.longitude ?? null,
      description: venue.description || "",
      promo_message: venue.promo_message || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveVenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await merchantApi.updateVenue(editingId, form);
        setSuccess("Venue information updated and sent for admin approval.");
        toast.success(`Venue "${form.name}" updated and sent for admin approval!`);
      } else {
        await merchantApi.createVenue(form);
        setSuccess("Venue information submitted for admin approval.");
        toast.success(`Venue "${form.name}" submitted for admin approval!`);
      }
      resetForm();
      await loadVenues();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not save venue information.");
      toast.error(requestError?.response?.data?.message || "Could not save venue information.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteVenue(id: number) {
    if (!window.confirm("Delete this pending/rejected venue information? Approved venues cannot be deleted here.")) return;
    setBusy(`delete-${id}`);
    setError(null);
    try {
      await merchantApi.deleteVenue(id);
      setSuccess("Venue information removed successfully.");
      toast.success("Venue information removed successfully!");
      await loadVenues();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not delete this venue information.");
      toast.error(requestError?.response?.data?.message || "Could not delete this venue information.");
    } finally {
      setBusy(null);
    }
  }

  const pendingCount = venues.filter((venue) => venue.approval_status === "pending").length;
  const approvedCount = venues.filter((venue) => venue.approval_status === "approved").length;
  const rejectedCount = venues.filter((venue) => venue.approval_status === "rejected").length;

  return (
    <AppShell title="Venue information" subtitle="Create venues with location and information, then send them to admin for approval.">
      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="card" style={{ border: "1px solid rgba(34, 197, 94, 0.28)", background: "rgba(34, 197, 94, 0.08)" }}>{success}</div> : null}

      <section className="card-grid three">
        <article className="card stat-card"><h3>Pending</h3><strong>{pendingCount}</strong></article>
        <article className="card stat-card"><h3>Approved</h3><strong>{approvedCount}</strong></article>
        <article className="card stat-card"><h3>Rejected</h3><strong>{rejectedCount}</strong></article>
      </section>

      <section className="card">
        <span className="eyebrow">{editingId ? "Edit and re-submit" : "Create venue information"}</span>
        <h2 style={{ marginBottom: 8 }}>{editingId ? "Update venue information" : "Add a venue with information"}</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Add each venue separately with its own address, postcode, location coordinates, description, and promo message. Admin approval saves the manual 6 character venue code.
        </p>
        <form className="form-grid two" onSubmit={saveVenue}>
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
            Latitude
            <input value={form.latitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, latitude: parseNumber(event.target.value) }))} placeholder="53.4808" />
          </label>
          <label>
            Longitude
            <input value={form.longitude ?? ""} onChange={(event) => setForm((current) => ({ ...current, longitude: parseNumber(event.target.value) }))} placeholder="-2.2426" />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Venue information / description
            <textarea rows={5} value={form.description || ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe this venue, opening details, collection/delivery notes, or any information admin should review." />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Promo message
            <textarea rows={3} value={form.promo_message || ""} onChange={(event) => setForm((current) => ({ ...current, promo_message: event.target.value }))} placeholder="Message shown to users when this venue appears." />
          </label>
          <div className="action-row" style={{ gridColumn: "1 / -1" }}>
            <button className="primary-button" type="submit" disabled={saving || !form.name.trim() || !form.postcode.trim()}>
              {saving ? "Submitting..." : editingId ? "Update and send for approval" : "Submit for approval"}
            </button>
            {editingId ? <button className="secondary-button" type="button" onClick={resetForm}>Cancel edit</button> : null}
          </div>
        </form>
      </section>

      <section className="card">
        <span className="eyebrow">Approval history</span>
        <h2 style={{ marginBottom: 8 }}>Your venue information</h2>
        <div className="list">
          {loading ? <p className="muted">Loading venue information...</p> : null}
          {!loading && venues.length === 0 ? <p className="muted">No venues have been submitted yet.</p> : null}
          {venues.map((venue) => {
            const locked = venue.approval_status === "approved";
            return (
              <div key={venue.id} className="voucher-row" style={{ alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <strong>{venue.name}</strong>
                  <span className="muted">{venue.category || "venue"} · {venue.postcode || "no postcode"}</span>
                  <span>{[venue.address, venue.city].filter(Boolean).join(", ") || "No address saved"}</span>
                  {venue.description ? <p style={{ margin: 0 }}>{venue.description}</p> : null}
                  {venue.promo_message ? <span className="muted">Promo: {venue.promo_message}</span> : null}
                  <span className="muted">Submitted: {formatDateTime(venue.submitted_for_approval_at || venue.created_at)}</span>
                  {venue.rejection_reason ? <span className="muted">Reason: {venue.rejection_reason}</span> : null}
                </div>
                <div style={{ display: "grid", gap: 10, minWidth: 170 }}>
                  <span className={statusClass(venue.approval_status)}>{venue.approval_status || "pending"}</span>
                  <span className="info-badge">Code: {venue.venue_code || "pending"}</span>
                  <button className="secondary-button small" type="button" onClick={() => editVenue(venue)} disabled={locked}>Edit / re-submit</button>
                  <button className="secondary-button small" type="button" onClick={() => void deleteVenue(venue.id)} disabled={locked || busy === `delete-${venue.id}`}>
                    {busy === `delete-${venue.id}` ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
