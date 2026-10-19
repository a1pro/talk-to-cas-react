import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Building2, Check, CheckCircle2, Clock3, Edit, MapPin, PlusCircle, Trash, XCircle } from "lucide-react";
import type { Venue, VenueAddressChangeRecord } from "@/types";
import type { AdminVenueUpdatePayload } from "@/api/adminBusinessRules";
import type { AdminMerchant, AdminPayload, AdminSection } from "./types";

interface AdminVenuesPageProps {
  activeSection: AdminSection;
  dashboard: AdminPayload | null;
  merchants: AdminMerchant[];
  venues: Venue[];
  addressChanges: VenueAddressChangeRecord[];
  busy: string | null;
  loading: boolean;
  formatDateTime: (value?: string | null) => string;
  onApproveMerchant: (id: number) => Promise<void>;
  onApproveVenue: (id: number, venueCode: string) => Promise<void>;
  onRejectVenue: (id: number) => Promise<void>;
  onUpdateVenue: (id: number, payload: AdminVenueUpdatePayload) => Promise<void>;
  onDeleteVenue: (id: number) => Promise<void>;
  onApproveAddress: (id: number) => Promise<void>;
  onRejectAddress: (id: number) => Promise<void>;
  refreshVenues?: () => Promise<void>;
}

type VenueForm = {
  merchant_id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  postcode: string;
  description: string;
  approval_status: "pending" | "approved" | "rejected";
  is_active: boolean;
  venue_code: string;
  offer_enabled: boolean;
  offer_value: string;
  minimum_order: string;
  fulfilment_type: string;
  urgency_enabled: boolean;
  daily_voucher_cap: string;
  offer_type: "food" | "ride" | "dual_choice";
  ride_trip_type: "to_venue" | "to_and_from";
  promo_message: string;
};

const PAGE_SIZE = 10;

function parseOptionalNumber(value: string): number | null {
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

function statusClass(status?: string | null) {
  if (status === "approved") return "live";
  if (status === "rejected") return "expired";
  return "issued";
}

function venueToForm(venue: Venue): VenueForm {
  return {
    merchant_id: venue.merchant_id ? String(venue.merchant_id) : "",
    name: venue.name || "",
    category: venue.category || "restaurant",
    address: venue.address || "",
    city: venue.city || "",
    postcode: venue.postcode || "",
    description: venue.description || "",
    approval_status: (venue.approval_status as VenueForm["approval_status"]) || "pending",
    is_active: Boolean(venue.is_active),
    venue_code: normaliseVenueCode(venue.venue_code || ""),
    offer_enabled: Boolean(venue.offer_enabled ?? true),
    offer_value: venue.offer_value !== null && venue.offer_value !== undefined ? String(venue.offer_value) : "",
    minimum_order: venue.minimum_order !== null && venue.minimum_order !== undefined ? String(venue.minimum_order) : "",
    fulfilment_type: venue.fulfilment_type || "",
    urgency_enabled: Boolean(venue.urgency_enabled),
    daily_voucher_cap: venue.daily_voucher_cap !== null && venue.daily_voucher_cap !== undefined ? String(venue.daily_voucher_cap) : "",
    offer_type: (venue.offer_type as VenueForm["offer_type"]) || "ride",
    ride_trip_type: (venue.ride_trip_type as VenueForm["ride_trip_type"]) || "to_venue",
    promo_message: venue.promo_message || "",
  };
}

function sectionStatus(activeSection: AdminSection): "all" | "pending" | "approved" | "rejected" {
  if (activeSection === "venue-approvals" || activeSection === "venue-pending") return "pending";
  if (activeSection === "venue-approved") return "approved";
  if (activeSection === "venue-rejected") return "rejected";
  return "all";
}

function MetricTile({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <article className="card stat-card admin-stat-with-icon">
      <span><Icon size={20} /></span>
      <div>
        <h3>{label}</h3>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export function AdminVenuesPage({
  activeSection,
  dashboard,
  merchants,
  venues,
  addressChanges,
  busy,
  loading,
  formatDateTime,
  onApproveMerchant,
  onApproveVenue,
  onRejectVenue,
  onUpdateVenue,
  onDeleteVenue,
  onApproveAddress,
  onRejectAddress,
  refreshVenues,
}: AdminVenuesPageProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [venueCodes, setVenueCodes] = useState<Record<number, string>>({});
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null);
  const [venueForm, setVenueForm] = useState<VenueForm | null>(null);

  const selectedStatus = sectionStatus(activeSection);
  const isAddressSection = activeSection === "venue-address";

  const summary = useMemo(() => ({
    total: venues.length || dashboard?.stats.total_venues || 0,
    pending: venues.filter((venue) => venue.approval_status === "pending").length || dashboard?.stats.pending_venues || 0,
    approved: venues.filter((venue) => venue.approval_status === "approved").length || dashboard?.stats.approved_venues || 0,
    rejected: venues.filter((venue) => venue.approval_status === "rejected").length,
  }), [venues, dashboard]);

  const categoryOptions = useMemo(() => {
    const values = new Set<string>();
    venues.forEach((venue) => {
      if (venue.category) values.add(venue.category);
    });
    return Array.from(values).sort();
  }, [venues]);

  const filteredVenues = useMemo(() => {
    const query = search.trim().toLowerCase();
    return venues
      .filter((venue) => selectedStatus === "all" || venue.approval_status === selectedStatus)
      .filter((venue) => !categoryFilter || venue.category === categoryFilter)
      .filter((venue) => {
        if (!query) return true;
        return [
          venue.name,
          venue.category,
          venue.city,
          venue.postcode,
          venue.address,
          venue.venue_code,
          venue.merchant?.business_name,
          venue.merchant?.contact_email,
        ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query));
      });
  }, [venues, selectedStatus, categoryFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredVenues.length / PAGE_SIZE));
  const rows = filteredVenues.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function getVenueCode(venue: Venue) {
    return normaliseVenueCode(venueCodes[venue.id] ?? venue.venue_code ?? "");
  }

  function startVenueEdit(venue: Venue) {
    setEditingVenueId(venue.id);
    setVenueForm(venueToForm(venue));
  }

  async function saveVenueEdit() {
    if (!editingVenueId || !venueForm) return;

    const code = normaliseVenueCode(venueForm.venue_code);
    await onUpdateVenue(editingVenueId, {
      merchant_id: venueForm.merchant_id ? Number(venueForm.merchant_id) : null,
      name: venueForm.name.trim(),
      category: venueForm.category.trim() || null,
      address: venueForm.address.trim() || null,
      city: venueForm.city.trim() || null,
      postcode: venueForm.postcode.trim().toUpperCase() || null,
      description: venueForm.description.trim() || null,
      approval_status: venueForm.approval_status,
      is_active: venueForm.is_active,
      venue_code: code || null,
      offer_enabled: venueForm.offer_enabled,
      offer_value: parseOptionalNumber(venueForm.offer_value),
      minimum_order: parseOptionalNumber(venueForm.minimum_order),
      fulfilment_type: venueForm.fulfilment_type.trim() || null,
      urgency_enabled: venueForm.urgency_enabled,
      daily_voucher_cap: parseOptionalNumber(venueForm.daily_voucher_cap),
      offer_type: venueForm.offer_type,
      ride_trip_type: venueForm.ride_trip_type,
      promo_message: venueForm.promo_message.trim() || null,
    });

    toast.success(`Venue "${venueForm.name}" updated successfully!`);
    setEditingVenueId(null);
    setVenueForm(null);
    
    // Refresh venues after update
    if (refreshVenues) {
      await refreshVenues();
    }
  }

  async function confirmDeleteVenue(venue: Venue) {
    if (!window.confirm(`Delete venue ${venue.name}? This will remove related venue records.`)) return;
    await onDeleteVenue(venue.id);
    toast.success(`Venue "${venue.name}" deleted successfully!`);
    
    // Refresh venues after delete
    if (refreshVenues) {
      await refreshVenues();
    }
  }

  const handleApproveVenue = async (event: React.MouseEvent, venue: Venue, code: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!code || code.trim() === "") {
      toast.error("Please enter a venue code before approving!");
      return;
    }
    
    try {
      await onApproveVenue(venue.id, code);
      toast.success(`Venue "${venue.name}" approved with code ${code}!`);
      
      // Clear the venue code from local state
      setVenueCodes((prev) => {
        const newState = { ...prev };
        delete newState[venue.id];
        return newState;
      });
      
      // Refresh venues list without page reload
      if (refreshVenues) {
        await refreshVenues();
      }
    } catch (error: any) {
      console.error("Failed to approve venue:", error);
      toast.error(error?.message || "Failed to approve venue");
    }
  };

  const handleRejectVenue = async (venue: Venue) => {
    try {
      await onRejectVenue(venue.id);
      toast.success(`Venue "${venue.name}" rejected!`);
      
      // Refresh venues list without page reload
      if (refreshVenues) {
        await refreshVenues();
      }
    } catch (error) {
      toast.error(`Failed to reject venue "${venue.name}". Please try again.`);
      console.error("Rejection error:", error);
    }
  };

  const handleApproveMerchant = async (merchantId: number, merchantName?: string) => {
    try {
      await onApproveMerchant(merchantId);
      toast.success(`Merchant "${merchantName}" approved!`);
      
      // Refresh venues list without page reload
      if (refreshVenues) {
        await refreshVenues();
      }
    } catch (error) {
      toast.error(`Failed to approve merchant. Please try again.`);
      console.error("Merchant approval error:", error);
    }
  };

  if (isAddressSection) {
    return (
      <section className="card">
        <div className="split-card-header">
          <div>
            <span className="eyebrow">Venue address approvals</span>
            <h2>Pending protected address changes</h2>
            <p className="muted">Approve or reject address requests before they change public venue information.</p>
          </div>
          <Link className="secondary-button small link-button" to="/admin/venues">Back to venues</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Venue</th>
                <th>Current address</th>
                <th>Requested address</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {addressChanges.length ? addressChanges.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.business_name || item.venue_name || `Request #${item.id}`}</strong><br /><span className="muted">{item.status}</span></td>
                  <td>{item.previous_address || "-"}<br /><span className="muted">{item.previous_city || "-"} · {item.previous_postcode || "-"}</span></td>
                  <td>{item.requested_address || "-"}<br /><span className="muted">{item.requested_city || "-"} · {item.requested_postcode || "-"}</span></td>
                  <td>{formatDateTime(item.created_at)}</td>
                  <td><div className="table-actions"><button className="primary-button small" onClick={() => void onApproveAddress(item.id)} disabled={busy === `address-approve-${item.id}` || loading}>Approve</button><button className="secondary-button small danger-button" onClick={() => void onRejectAddress(item.id)} disabled={busy === `address-reject-${item.id}` || loading}>Reject</button></div></td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="muted">No pending address-change requests.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="card-grid four">
        <MetricTile label="All venues" value={summary.total} icon={Building2} />
        <MetricTile label="Pending" value={summary.pending} icon={Clock3} />
        <MetricTile label="Approved" value={summary.approved} icon={CheckCircle2} />
        <MetricTile label="Rejected" value={summary.rejected} icon={XCircle} />
      </section>

      <section className="admin-hero-card compact">
        <div>
          <span className="eyebrow">Venue management</span>
          <h2>Approve, reject, edit, update, and delete venues</h2>
          <p className="muted">Use a 6-character venue code as Uber Business reference. Approve merchant first if venue belongs to a pending merchant.</p>
        </div>
        <div className="admin-hero-actions">
          <Link className="primary-button link-button" to="/admin/information"><PlusCircle size={18} /> Create venue information</Link>
          <Link className="secondary-button link-button" to="/admin/vouchers/download">Download voucher rows</Link>
        </div>
      </section>

      {editingVenueId && venueForm ? (
        <section className="card admin-edit-panel">
          <div className="split-card-header">
            <div>
              <span className="eyebrow">Edit venue</span>
              <h2>Update venue profile, approval status, code, and offer</h2>
            </div>
            <button className="secondary-button small" type="button" onClick={() => { setEditingVenueId(null); setVenueForm(null); }}>Cancel</button>
          </div>
          <div className="form-grid two">
            <label>Merchant<select value={venueForm.merchant_id} onChange={(event) => setVenueForm({ ...venueForm, merchant_id: event.target.value })}><option value="">No merchant</option>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.business_name}</option>)}</select></label>
            <label>Venue name<input value={venueForm.name} onChange={(event) => setVenueForm({ ...venueForm, name: event.target.value })} /></label>
            <label>Category<input value={venueForm.category} onChange={(event) => setVenueForm({ ...venueForm, category: event.target.value })} /></label>
            <label>City<input value={venueForm.city} onChange={(event) => setVenueForm({ ...venueForm, city: event.target.value })} /></label>
            <label>Postcode<input value={venueForm.postcode} onChange={(event) => setVenueForm({ ...venueForm, postcode: event.target.value.toUpperCase() })} /></label>
            <label>6-character venue code<input value={venueForm.venue_code} maxLength={6} onChange={(event) => setVenueForm({ ...venueForm, venue_code: normaliseVenueCode(event.target.value) })} /></label>
            <label>Status<select value={venueForm.approval_status} onChange={(event) => setVenueForm({ ...venueForm, approval_status: event.target.value as VenueForm["approval_status"] })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
            <label>Offer type<select value={venueForm.offer_type} onChange={(event) => setVenueForm({ ...venueForm, offer_type: event.target.value as VenueForm["offer_type"] })}><option value="ride">Ride</option><option value="food">Food</option><option value="dual_choice">Ride or food</option></select></label>
            <label>Trip type<select value={venueForm.ride_trip_type} onChange={(event) => setVenueForm({ ...venueForm, ride_trip_type: event.target.value as VenueForm["ride_trip_type"] })}><option value="to_venue">To venue</option><option value="to_and_from">To and from</option></select></label>
            <label>Voucher value £<input type="number" min="0" step="0.01" value={venueForm.offer_value} onChange={(event) => setVenueForm({ ...venueForm, offer_value: event.target.value })} /></label>
            <label>Minimum order £<input type="number" min="0" step="0.01" value={venueForm.minimum_order} onChange={(event) => setVenueForm({ ...venueForm, minimum_order: event.target.value })} /></label>
            <label>Daily cap<input type="number" min="0" value={venueForm.daily_voucher_cap} onChange={(event) => setVenueForm({ ...venueForm, daily_voucher_cap: event.target.value })} /></label>
            <label className="inline-checkbox"><input type="checkbox" checked={venueForm.is_active} onChange={(event) => setVenueForm({ ...venueForm, is_active: event.target.checked })} /> Venue active</label>
            <label className="inline-checkbox"><input type="checkbox" checked={venueForm.offer_enabled} onChange={(event) => setVenueForm({ ...venueForm, offer_enabled: event.target.checked })} /> Offer enabled</label>
            <label className="inline-checkbox"><input type="checkbox" checked={venueForm.urgency_enabled} onChange={(event) => setVenueForm({ ...venueForm, urgency_enabled: event.target.checked })} /> Urgency enabled</label>
            <label style={{ gridColumn: "1 / -1" }}>Address<input value={venueForm.address} onChange={(event) => setVenueForm({ ...venueForm, address: event.target.value })} /></label>
            <label style={{ gridColumn: "1 / -1" }}>Description<textarea rows={3} value={venueForm.description} onChange={(event) => setVenueForm({ ...venueForm, description: event.target.value })} /></label>
            <label style={{ gridColumn: "1 / -1" }}>Promo message<textarea rows={3} value={venueForm.promo_message} onChange={(event) => setVenueForm({ ...venueForm, promo_message: event.target.value })} /></label>
          </div>
          <div className="action-row"><button className="primary-button" onClick={() => void saveVenueEdit()} disabled={busy === `venue-update-${editingVenueId}` || !venueForm.name.trim() || (venueForm.approval_status === "approved" && !isValidVenueCode(venueForm.venue_code))}>Save venue</button></div>
        </section>
      ) : null}

      <section className="card">
        <div className="split-card-header">
          <div>
            <span className="eyebrow">Venue data table</span>
            <h2>{selectedStatus === "all" ? "All venues" : `${selectedStatus} venues`}</h2>
            <p className="muted">Search, filter, approve, reject, edit, update, and delete every venue record from here.</p>
          </div>
          <div className="badge-row compact-badges">
            <span className="info-badge"><MapPin size={16} /> {filteredVenues.length} shown</span>
          </div>
        </div>

        <div className="filter-row">
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search venue, merchant, postcode, code" />
          <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Venue</th>
                <th>Merchant</th>
                <th>Status</th>
                <th>Code</th>
                <th>Offer</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((venue) => {
                const code = getVenueCode(venue);
                const merchantApproved = venue.merchant?.status === "active" && venue.merchant?.user_is_active !== false;
                return (
                  <tr key={venue.id}>
                    <td><strong>{venue.name}</strong><br /><span className="muted">{venue.category || "venue"} · {venue.city || "no city"} · {venue.postcode || "no postcode"}</span></td>
                    <td>{venue.merchant?.business_name || `Merchant ${venue.merchant_id || "-"}`}<br /><span className="muted">{merchantApproved ? "merchant approved" : "merchant pending"}</span></td>
                    <td><span className={`status ${statusClass(venue.approval_status)}`}>{venue.approval_status || "pending"}</span></td>
                    <td><input className="compact-input venue-code-cell" value={code} placeholder="Enter code" maxLength={6} onChange={(event) => setVenueCodes((current) => ({ ...current, [venue.id]: normaliseVenueCode(event.target.value) }))} /></td>
                    <td>£{venue.offer_value ?? "0.00"}<br /><span className="muted">{venue.offer_type || "ride"}</span></td>
                    <td>{formatDateTime(venue.updated_at || venue.created_at)}</td>
                    <td><div className="table-actions">
                      {!merchantApproved && venue.merchant_id ? (
                        <button 
                          className="primary-button small" 
                          onClick={() => handleApproveMerchant(Number(venue.merchant_id), venue.merchant?.business_name)}
                          disabled={busy === `merchant-approve-${venue.merchant_id}`}
                        >
                          Approve merchant
                        </button>
                      ) : null}
                      
                      {venue.approval_status !== "approved" ? (
                        <button 
                          className="primary-button small" 
                          onClick={(event) => handleApproveVenue(event, venue, code)}
                          disabled={busy === `venue-approve-${venue.id}`}
                        >
                          <Check style={{ width: 16, height: 16, marginRight: 4 }} />
                          Accept
                        </button>
                      ) : (
                        <button 
                          className="primary-button small approved-venue" 
                          onClick={() => toast.info(`Venue "${venue.name}" is already approved!`)}
                        >
                          <Check style={{ width: 16, height: 16, marginRight: 4 }} />
                          Approved
                        </button>
                      )}
                      
                      {venue.approval_status !== "rejected" ? (
                        <button 
                          className="secondary-button small" 
                          onClick={() => handleRejectVenue(venue)}
                          disabled={busy === `venue-reject-${venue.id}`}
                        >
                          Reject
                        </button>
                      ) : null}
                      
                      <button 
                        className="secondary-button small" 
                        onClick={() => {
                          startVenueEdit(venue);
                          toast.info(`Editing venue "${venue.name}"`);
                        }}
                      >
                        <Edit style={{ width: 16, height: 16, marginRight: 4 }} />
                        Edit
                      </button>
                      
                      <button 
                        className="secondary-button small danger-button" 
                        onClick={() => void confirmDeleteVenue(venue)} 
                        disabled={busy === `venue-delete-${venue.id}`}
                      >
                        <Trash style={{ width: 16, height: 16, marginRight: 4 }} />
                        Delete
                      </button>
                    </div></td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr><td colSpan={7} className="muted">No venues match current filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span className="muted">Showing {rows.length} of {filteredVenues.length}</span>
          <div className="action-row">
            <button className="secondary-button small" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</button>
            <span className="info-badge">Page {page} / {totalPages}</span>
            <button className="secondary-button small" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</button>
          </div>
        </div>
      </section>
    </>
  );
}