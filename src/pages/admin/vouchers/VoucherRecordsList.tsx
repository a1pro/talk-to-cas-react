import { useMemo, useState } from "react";
import type { ProviderVoucherLinkRecord } from "@/types";
import type { ProviderVoucherLinkPayload } from "@/api/adminBusinessRules";

interface VoucherRecordsListProps {
  records: ProviderVoucherLinkRecord[];
  circulationModeLabel: (mode?: string | null) => string;
  busy?: string | null;
  compact?: boolean;
  limit?: number;
  emptyMessage?: string;
  onUpdateProviderLink?: (id: number, payload: ProviderVoucherLinkPayload) => Promise<void>;
  onDeleteProviderLink?: (id: number) => Promise<void>;
}

type EditForm = {
  provider: "uber" | "ubereats";
  link_url: string;
  offer_type: "food" | "ride" | "dual_choice";
  ride_trip_type: "to_venue" | "to_and_from";
  voucher_amount: string;
  minimum_order: string;
  location_postcode: string;
  start_time: string;
  end_time: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  circulation_mode: "shared_sequence" | "unique_individual";
  max_issue_count: string;
  source_label: string;
  notes: string;
};

const PAGE_SIZE = 10;

function dateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formFromRecord(record: ProviderVoucherLinkRecord): EditForm {
  return {
    provider: record.provider || "uber",
    link_url: record.link_url || "",
    offer_type: (record.offer_type as EditForm["offer_type"]) || "ride",
    ride_trip_type: (record.ride_trip_type as EditForm["ride_trip_type"]) || "to_venue",
    voucher_amount: record.voucher_amount !== null && record.voucher_amount !== undefined ? String(record.voucher_amount) : "",
    minimum_order: record.minimum_order !== null && record.minimum_order !== undefined ? String(record.minimum_order) : "",
    location_postcode: record.location_postcode || "",
    start_time: record.start_time || "",
    end_time: record.end_time || "",
    valid_from: dateInput(record.valid_from),
    valid_until: dateInput(record.valid_until),
    is_active: Boolean(record.is_active),
    circulation_mode: (record.circulation_mode as EditForm["circulation_mode"]) || "shared_sequence",
    max_issue_count: record.max_issue_count !== null && record.max_issue_count !== undefined ? String(record.max_issue_count) : "",
    source_label: record.source_label || "",
    notes: record.notes || "",
  };
}

export function VoucherRecordsList({
  records,
  circulationModeLabel,
  busy = null,
  compact = false,
  limit,
  emptyMessage = "No exact provider links uploaded yet.",
  onUpdateProviderLink,
  onDeleteProviderLink,
}: VoucherRecordsListProps) {
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState<"all" | "uber" | "ubereats">("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const venueCodeFor = (item: ProviderVoucherLinkRecord) => item.venue_code_reference || item.venue?.venue_code || null;

  const filtered = useMemo(() => {
    const base = typeof limit === "number" ? records.slice(0, limit) : records;
    const query = search.trim().toLowerCase();
    return base
      .filter((item) => providerFilter === "all" || item.provider === providerFilter)
      .filter((item) => activeFilter === "all" || (activeFilter === "active" ? item.is_active : !item.is_active))
      .filter((item) => {
        if (!query) return true;
        return [item.merchant?.business_name, item.venue?.name, item.venue?.postcode, item.venue_code_reference, item.link_url, item.source_label, item.import_batch_code]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      });
  }, [records, limit, search, providerFilter, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const items = compact ? filtered : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!records.length) {
    return <p className="muted">{emptyMessage}</p>;
  }

  if (compact) {
    return (
      <div className="list compact-list">
        {items.map((item) => (
          <div key={item.id} className="list-row align-start">
            <div>
              <strong>{item.merchant?.business_name || `Merchant ${item.merchant_id}`}</strong>
              <p>{item.provider} · {item.offer_type || "offer"} · {venueCodeFor(item) || item.location_postcode || item.venue?.postcode || "No postcode"}</p>
            </div>
            <span className="muted">{item.is_active ? "active" : "inactive"}</span>
          </div>
        ))}
      </div>
    );
  }

  async function saveEdit() {
    if (!editingId || !editForm || !onUpdateProviderLink) return;
    await onUpdateProviderLink(editingId, {
      provider: editForm.provider,
      link_url: editForm.link_url.trim(),
      offer_type: editForm.offer_type,
      ride_trip_type: editForm.offer_type === "food" ? null : editForm.ride_trip_type,
      voucher_amount: parseOptionalNumber(editForm.voucher_amount),
      minimum_order: parseOptionalNumber(editForm.minimum_order),
      location_postcode: editForm.location_postcode.trim() || null,
      start_time: editForm.start_time || null,
      end_time: editForm.end_time || null,
      valid_from: editForm.valid_from || null,
      valid_until: editForm.valid_until || null,
      is_active: editForm.is_active,
      circulation_mode: editForm.circulation_mode,
      max_issue_count: parseOptionalNumber(editForm.max_issue_count),
      source_label: editForm.source_label.trim() || null,
      notes: editForm.notes.trim() || null,
    });
    setEditingId(null);
    setEditForm(null);
  }

  async function confirmDelete(record: ProviderVoucherLinkRecord) {
    if (!onDeleteProviderLink) return;
    if (!window.confirm(`Delete ${record.provider} voucher link for ${record.merchant?.business_name || `merchant ${record.merchant_id}`}?`)) return;
    await onDeleteProviderLink(record.id);
  }

  return (
    <div className="admin-records-space">
      <div className="filter-row">
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search merchant, venue, code, link, batch" />
        <select value={providerFilter} onChange={(event) => { setProviderFilter(event.target.value as any); setPage(1); }}>
          <option value="all">All providers</option>
          <option value="uber">Uber</option>
          <option value="ubereats">Uber Eats</option>
        </select>
        <select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value as any); setPage(1); }}>
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {editingId && editForm ? (
        <section className="card admin-edit-panel">
          <div className="split-card-header">
            <div><span className="eyebrow">Edit voucher link</span><h2>Update provider voucher record</h2></div>
            <button className="secondary-button small" onClick={() => { setEditingId(null); setEditForm(null); }}>Cancel</button>
          </div>
          <div className="form-grid two">
            <label>Provider<select value={editForm.provider} onChange={(event) => setEditForm({ ...editForm, provider: event.target.value as EditForm["provider"] })}><option value="uber">Uber</option><option value="ubereats">Uber Eats</option></select></label>
            <label>Offer type<select value={editForm.offer_type} onChange={(event) => setEditForm({ ...editForm, offer_type: event.target.value as EditForm["offer_type"] })}><option value="ride">Ride</option><option value="food">Food</option><option value="dual_choice">Ride or Food</option></select></label>
            <label>Trip type<select value={editForm.ride_trip_type} onChange={(event) => setEditForm({ ...editForm, ride_trip_type: event.target.value as EditForm["ride_trip_type"] })}><option value="to_venue">To venue</option><option value="to_and_from">To and from</option></select></label>
            <label>Voucher amount £<input type="number" min="0" step="0.01" value={editForm.voucher_amount} onChange={(event) => setEditForm({ ...editForm, voucher_amount: event.target.value })} /></label>
            <label>Minimum order £<input type="number" min="0" step="0.01" value={editForm.minimum_order} onChange={(event) => setEditForm({ ...editForm, minimum_order: event.target.value })} /></label>
            <label>Postcode<input value={editForm.location_postcode} onChange={(event) => setEditForm({ ...editForm, location_postcode: event.target.value.toUpperCase() })} /></label>
            <label>Start time<input type="time" value={editForm.start_time} onChange={(event) => setEditForm({ ...editForm, start_time: event.target.value })} /></label>
            <label>End time<input type="time" value={editForm.end_time} onChange={(event) => setEditForm({ ...editForm, end_time: event.target.value })} /></label>
            <label>Valid from<input type="date" value={editForm.valid_from} onChange={(event) => setEditForm({ ...editForm, valid_from: event.target.value })} /></label>
            <label>Valid until<input type="date" value={editForm.valid_until} onChange={(event) => setEditForm({ ...editForm, valid_until: event.target.value })} /></label>
            <label>Max issue count<input type="number" min="1" value={editForm.max_issue_count} onChange={(event) => setEditForm({ ...editForm, max_issue_count: event.target.value })} /></label>
            <label>Circulation<select value={editForm.circulation_mode} onChange={(event) => setEditForm({ ...editForm, circulation_mode: event.target.value as EditForm["circulation_mode"] })}><option value="shared_sequence">Shared sequence</option><option value="unique_individual">Unique individual</option></select></label>
            <label className="inline-checkbox"><input type="checkbox" checked={editForm.is_active} onChange={(event) => setEditForm({ ...editForm, is_active: event.target.checked })} /> Active</label>
            <label style={{ gridColumn: "1 / -1" }}>Provider URL<input value={editForm.link_url} onChange={(event) => setEditForm({ ...editForm, link_url: event.target.value })} /></label>
            <label>Source label<input value={editForm.source_label} onChange={(event) => setEditForm({ ...editForm, source_label: event.target.value })} /></label>
            <label>Notes<input value={editForm.notes} onChange={(event) => setEditForm({ ...editForm, notes: event.target.value })} /></label>
          </div>
          <div className="action-row"><button className="primary-button" onClick={() => void saveEdit()} disabled={busy === `provider-link-update-${editingId}` || !editForm.link_url.trim()}>Save voucher link</button></div>
        </section>
      ) : null}

      <div className="table-wrap">
        <table>
          <thead><tr><th>Merchant / venue</th><th>Provider</th><th>Code</th><th>Value</th><th>Usage</th><th>URL</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.merchant?.business_name || `Merchant ${item.merchant_id}`}</strong><br /><span className="muted">{item.venue?.name || "No specific venue"} · {item.location_postcode || item.venue?.postcode || "No postcode"}</span></td>
                <td>{item.provider}<br /><span className="muted">{item.offer_type || "offer"}</span></td>
                <td>{venueCodeFor(item) || "-"}</td>
                <td>£{item.voucher_amount ?? "0.00"}<br /><span className="muted">Min £{item.minimum_order ?? "0.00"}</span></td>
                <td>{item.issued_count ?? 0}{item.max_issue_count ? ` / ${item.max_issue_count}` : ""}<br /><span className="muted">{circulationModeLabel(item.circulation_mode)}</span></td>
                <td style={{ maxWidth: 260, wordBreak: "break-all" }}>{item.link_url}</td>
                <td><div className="table-actions"><span className={`status ${item.is_active ? "live" : "expired"}`}>{item.is_active ? "active" : "inactive"}</span><button className="secondary-button small" onClick={() => { setEditingId(item.id); setEditForm(formFromRecord(item)); }}>Edit</button><button className="secondary-button small danger-button" onClick={() => void confirmDelete(item)} disabled={busy === `provider-link-delete-${item.id}`}>Delete</button></div></td>
              </tr>
            ))}
            {!items.length ? <tr><td colSpan={7} className="muted">No provider voucher links match the current filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <div className="pagination-row"><span className="muted">Showing {items.length} of {filtered.length}</span><div className="action-row"><button className="secondary-button small" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span className="info-badge">Page {page} / {totalPages}</span><button className="secondary-button small" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></div></div>
    </div>
  );
}
