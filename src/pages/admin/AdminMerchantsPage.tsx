import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, Trash } from "lucide-react";
import type { OfferSyncExportPayload, OfferSyncRequestRecord, Venue, VenueAddressChangeRecord } from "@/types";
import type { AdminMerchantUpdatePayload, AdminVenueUpdatePayload } from "@/api/adminBusinessRules";
import type {
  AdminMerchant,
  AdminPayload,
  AdminSection,
  AreaLaunchAlertPreviewPayload,
  AreaLaunchDashboardPayload,
} from "./types";

interface AdminMerchantsPageProps {
  activeSection: AdminSection;
  dashboard: AdminPayload | null;
  merchants: AdminMerchant[];
  pendingMerchants: AdminMerchant[];
  venueApprovals: Venue[];
  addressChanges: VenueAddressChangeRecord[];
  offerSyncRequests: OfferSyncRequestRecord[];
  offerSyncExport: OfferSyncExportPayload | null;
  areaLaunchDashboard: AreaLaunchDashboardPayload | null;
  areaLaunchPreview: AreaLaunchAlertPreviewPayload | null;
  areaLaunchMerchantId: string;
  areaLaunchNotes: string;
  busy: string | null;
  loading: boolean;
  formatDateTime: (value?: string | null) => string;
  onApproveAddress: (id: number) => Promise<void>;
  onRejectAddress: (id: number) => Promise<void>;
  onApproveMerchant: (id: number) => Promise<void>;
  onRejectMerchant: (id: number) => Promise<void>;
  onUpdateMerchant: (id: number, payload: AdminMerchantUpdatePayload) => Promise<void>;
  onDeleteMerchant: (id: number) => Promise<void>;
  onApproveVenue: (id: number, venueCode: string) => Promise<void>;
  onRejectVenue: (id: number) => Promise<void>;
  onUpdateVenue: (id: number, payload: AdminVenueUpdatePayload) => Promise<void>;
  onDeleteVenue: (id: number) => Promise<void>;
  onSyncOfferRequest: (id: number) => Promise<void>;
  onRejectOfferRequest: (id: number) => Promise<void>;
  onExportPreview: () => Promise<void>;
  onAreaLaunchMerchantChange: (value: string) => void;
  onAreaLaunchNotesChange: (value: string) => void;
  onPreviewAreaLaunch: () => Promise<void>;
  onSendAreaLaunch: () => Promise<void>;
}

type MerchantForm = {
  business_name: string;
  business_type: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_number: string;
  default_service_fee: string;
  status: "pending" | "active" | "inactive" | "rejected";
  user_name: string;
  user_email: string;
  user_is_active: boolean;
  wallet_low_balance_threshold: string;
};

type VenueForm = {
  name: string;
  category: string;
  address: string;
  city: string;
  postcode: string;
  description: string;
  approval_status: "pending" | "approved" | "rejected";
  is_active: boolean;
  venue_code: string;
  offer_value: string;
  minimum_order: string;
  offer_type: "food" | "ride" | "dual_choice";
  ride_trip_type: "to_venue" | "to_and_from";
  daily_voucher_cap: string;
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

function merchantStatus(merchant: AdminMerchant) {
  if (merchant.status === "rejected") return "rejected";
  if (merchant.status === "active" && merchant.user_is_active !== false) return "approved";
  return "pending";
}

function merchantToForm(merchant: AdminMerchant): MerchantForm {
  return {
    business_name: merchant.business_name || "",
    business_type: merchant.business_type || "",
    contact_email: merchant.contact_email || merchant.user?.email || "",
    contact_phone: merchant.contact_phone || "",
    whatsapp_number: merchant.whatsapp_number || "",
    default_service_fee: merchant.default_service_fee ?? "",
    status: (merchant.status as MerchantForm["status"]) || (merchant.is_approved ? "active" : "pending"),
    user_name: merchant.user?.name || "",
    user_email: merchant.user?.email || "",
    user_is_active: Boolean(merchant.user_is_active ?? merchant.user?.is_active),
    wallet_low_balance_threshold: merchant.wallet?.low_balance_threshold ?? "",
  };
}

function venueToForm(venue: Venue): VenueForm {
  return {
    name: venue.name || "",
    category: venue.category || "restaurant",
    address: venue.address || "",
    city: venue.city || "",
    postcode: venue.postcode || "",
    description: venue.description || "",
    approval_status: (venue.approval_status as VenueForm["approval_status"]) || "pending",
    is_active: Boolean(venue.is_active),
    venue_code: normaliseVenueCode(venue.venue_code || ""),
    offer_value: venue.offer_value !== null && venue.offer_value !== undefined ? String(venue.offer_value) : "",
    minimum_order: venue.minimum_order !== null && venue.minimum_order !== undefined ? String(venue.minimum_order) : "",
    offer_type: (venue.offer_type as VenueForm["offer_type"]) || "ride",
    ride_trip_type: (venue.ride_trip_type as VenueForm["ride_trip_type"]) || "to_venue",
    daily_voucher_cap: venue.daily_voucher_cap !== null && venue.daily_voucher_cap !== undefined ? String(venue.daily_voucher_cap) : "",
    promo_message: venue.promo_message || "",
  };
}

export function AdminMerchantsPage({
  activeSection,
  dashboard,
  merchants,
  pendingMerchants,
  venueApprovals,
  addressChanges,
  offerSyncRequests,
  offerSyncExport,
  areaLaunchDashboard,
  areaLaunchPreview,
  areaLaunchMerchantId,
  areaLaunchNotes,
  busy,
  loading,
  formatDateTime,
  onApproveAddress,
  onRejectAddress,
  onApproveMerchant,
  onRejectMerchant,
  onUpdateMerchant,
  onDeleteMerchant,
  onApproveVenue,
  onRejectVenue,
  onUpdateVenue,
  onDeleteVenue,
  onSyncOfferRequest,
  onRejectOfferRequest,
  onExportPreview,
  onAreaLaunchMerchantChange,
  onAreaLaunchNotesChange,
  onPreviewAreaLaunch,
  onSendAreaLaunch,
}: AdminMerchantsPageProps) {
  const [merchantSearch, setMerchantSearch] = useState("");
  const [merchantPage, setMerchantPage] = useState(1);
  const [editingMerchantId, setEditingMerchantId] = useState<number | null>(null);
  const [merchantForm, setMerchantForm] = useState<MerchantForm | null>(null);
  const [venueCodes, setVenueCodes] = useState<Record<number, string>>({});
  const [venueSearch, setVenueSearch] = useState("");
  const [venueStatusFilter, setVenueStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [venuePage, setVenuePage] = useState(1);
  const [editingVenueId, setEditingVenueId] = useState<number | null>(null);
  const [venueForm, setVenueForm] = useState<VenueForm | null>(null);

  const statusFromSection = activeSection === "merchant-pending"
    ? "pending"
    : activeSection === "merchant-approved"
      ? "approved"
      : activeSection === "merchant-rejected"
        ? "rejected"
        : "all";

  const merchantRows = useMemo(() => {
    const search = merchantSearch.trim().toLowerCase();
    return merchants
      .filter((merchant) => statusFromSection === "all" || merchantStatus(merchant) === statusFromSection)
      .filter((merchant) => {
        if (!search) return true;
        return [merchant.business_name, merchant.business_type, merchant.contact_email, merchant.contact_phone, merchant.user?.email, merchant.user?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }, [merchants, merchantSearch, statusFromSection]);

  const merchantTotalPages = Math.max(1, Math.ceil(merchantRows.length / PAGE_SIZE));
  const merchantPageRows = merchantRows.slice((merchantPage - 1) * PAGE_SIZE, merchantPage * PAGE_SIZE);

  const venueRows = useMemo(() => {
    const search = venueSearch.trim().toLowerCase();
    return venueApprovals
      .filter((venue) => venueStatusFilter === "all" || venue.approval_status === venueStatusFilter)
      .filter((venue) => {
        if (!search) return true;
        return [venue.name, venue.category, venue.city, venue.postcode, venue.venue_code, venue.merchant?.business_name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
  }, [venueApprovals, venueSearch, venueStatusFilter]);

  const venueTotalPages = Math.max(1, Math.ceil(venueRows.length / PAGE_SIZE));
  const venuePageRows = venueRows.slice((venuePage - 1) * PAGE_SIZE, venuePage * PAGE_SIZE);
  const pendingMerchantList = pendingMerchants?.length ? pendingMerchants : merchants.filter((merchant) => merchantStatus(merchant) === "pending");
  const pendingVenueCount = venueApprovals.filter((venue) => venue.approval_status === "pending").length;
  const approvedVenueCount = venueApprovals.filter((venue) => venue.approval_status === "approved").length;
  const rejectedVenueCount = venueApprovals.filter((venue) => venue.approval_status === "rejected").length;

  function startMerchantEdit(merchant: AdminMerchant) {
    setEditingMerchantId(merchant.id);
    setMerchantForm(merchantToForm(merchant));
  }

  async function saveMerchantEdit() {
    if (!editingMerchantId || !merchantForm) return;
    await onUpdateMerchant(editingMerchantId, {
      business_name: merchantForm.business_name.trim(),
      business_type: merchantForm.business_type.trim() || null,
      contact_email: merchantForm.contact_email.trim() || null,
      contact_phone: merchantForm.contact_phone.trim() || null,
      whatsapp_number: merchantForm.whatsapp_number.trim() || null,
      default_service_fee: parseOptionalNumber(merchantForm.default_service_fee),
      status: merchantForm.status,
      user_name: merchantForm.user_name.trim() || null,
      user_email: merchantForm.user_email.trim() || null,
      user_is_active: merchantForm.user_is_active,
      wallet_low_balance_threshold: parseOptionalNumber(merchantForm.wallet_low_balance_threshold),
    });
    setEditingMerchantId(null);
    setMerchantForm(null);
  }

  function startVenueEdit(venue: Venue) {
    setEditingVenueId(venue.id);
    setVenueForm(venueToForm(venue));
  }

  async function saveVenueEdit() {
    if (!editingVenueId || !venueForm) return;
    await onUpdateVenue(editingVenueId, {
      name: venueForm.name.trim(),
      category: venueForm.category.trim() || null,
      address: venueForm.address.trim() || null,
      city: venueForm.city.trim() || null,
      postcode: venueForm.postcode.trim().toUpperCase() || null,
      description: venueForm.description.trim() || null,
      approval_status: venueForm.approval_status,
      is_active: venueForm.is_active,
      venue_code: normaliseVenueCode(venueForm.venue_code) || null,
      offer_value: parseOptionalNumber(venueForm.offer_value),
      minimum_order: parseOptionalNumber(venueForm.minimum_order),
      offer_type: venueForm.offer_type,
      ride_trip_type: venueForm.ride_trip_type,
      daily_voucher_cap: parseOptionalNumber(venueForm.daily_voucher_cap),
      promo_message: venueForm.promo_message.trim() || null,
    });
    setEditingVenueId(null);
    setVenueForm(null);
  }

  async function confirmDeleteMerchant(merchant: AdminMerchant) {
    if (!window.confirm(`Delete ${merchant.business_name}? This removes the merchant and related merchant records.`)) return;
    await onDeleteMerchant(merchant.id);
    toast.success(`Merchant "${merchant.business_name}" has been deleted successfully!`);
  }

  async function confirmDeleteVenue(venue: Venue) {
    if (!window.confirm(`Delete venue ${venue.name}? This removes related venue records.`)) return;
    await onDeleteVenue(venue.id);
  }

  function getVenueCode(venue: Venue) {
    return normaliseVenueCode(venueCodes[venue.id] ?? venue.venue_code ?? "");
  }

  const merchantDirectorySection = activeSection === "merchants" || activeSection === "merchant-pending" || activeSection === "merchant-approved" || activeSection === "merchant-rejected";

  return (
    <>
      {merchantDirectorySection ? (
        <>
          <section className="card-grid four">
            <article className="card stat-card"><h3>Total merchants</h3><strong>{dashboard?.stats.total_merchants ?? merchants.length}</strong></article>
            <article className="card stat-card"><h3>Pending merchants</h3><strong>{pendingMerchantList.length}</strong></article>
            <article className="card stat-card"><h3>Approved venues</h3><strong>{approvedVenueCount}</strong></article>
            <article className="card stat-card"><h3>Pending venues</h3><strong>{pendingVenueCount}</strong></article>
          </section>

          {editingMerchantId && merchantForm ? (
            <section className="card admin-edit-panel">
              <div className="split-card-header">
                <div>
                  <span className="eyebrow">Edit merchant</span>
                  <h2>Update merchant, owner account, and wallet threshold</h2>
                </div>
                <button className="secondary-button small" type="button" onClick={() => { setEditingMerchantId(null); setMerchantForm(null); }}>Cancel</button>
              </div>
              <div className="form-grid two">
                <label>Business name<input value={merchantForm.business_name} onChange={(event) => setMerchantForm({ ...merchantForm, business_name: event.target.value })} /></label>
                <label>Business type<input value={merchantForm.business_type} onChange={(event) => setMerchantForm({ ...merchantForm, business_type: event.target.value })} /></label>
                <label>Contact email<input value={merchantForm.contact_email} onChange={(event) => setMerchantForm({ ...merchantForm, contact_email: event.target.value })} /></label>
                <label>Contact phone<input value={merchantForm.contact_phone} onChange={(event) => setMerchantForm({ ...merchantForm, contact_phone: event.target.value })} /></label>
                <label>WhatsApp number<input value={merchantForm.whatsapp_number} onChange={(event) => setMerchantForm({ ...merchantForm, whatsapp_number: event.target.value })} /></label>
                <label>Status<select value={merchantForm.status} onChange={(event) => setMerchantForm({ ...merchantForm, status: event.target.value as MerchantForm["status"] })}><option value="pending">Pending</option><option value="active">Active / approved</option><option value="inactive">Inactive</option><option value="rejected">Rejected</option></select></label>
                <label>Owner name<input value={merchantForm.user_name} onChange={(event) => setMerchantForm({ ...merchantForm, user_name: event.target.value })} /></label>
                <label>Owner email<input value={merchantForm.user_email} onChange={(event) => setMerchantForm({ ...merchantForm, user_email: event.target.value })} /></label>
                <label>Default service fee<input type="number" min="0" step="0.01" value={merchantForm.default_service_fee} onChange={(event) => setMerchantForm({ ...merchantForm, default_service_fee: event.target.value })} /></label>
                <label>Low balance threshold<input type="number" min="0" step="0.01" value={merchantForm.wallet_low_balance_threshold} onChange={(event) => setMerchantForm({ ...merchantForm, wallet_low_balance_threshold: event.target.value })} /></label>
                <label className="inline-checkbox"><input type="checkbox" checked={merchantForm.user_is_active} onChange={(event) => setMerchantForm({ ...merchantForm, user_is_active: event.target.checked })} /> User login active</label>
              </div>
              <div className="action-row">
                <button className="primary-button" type="button" onClick={() => void saveMerchantEdit()} disabled={busy === `merchant-update-${editingMerchantId}`}>Save merchant</button>
              </div>
            </section>
          ) : null}

          <section className="card">
            <div className="split-card-header">
              <div>
                <span className="eyebrow">Merchant access</span>
                <h2>{statusFromSection === "all" ? "All merchants" : `${statusFromSection} merchants`}</h2>
                <p className="muted">Approve, reject, edit, update, and delete merchants from one data table.</p>
              </div>
              <div className="action-row">
                <Link className="secondary-button small link-button" to="/admin/venues/approvals">Manage venues</Link>
                <Link className="secondary-button small link-button" to="/admin/information">Create venue</Link>
              </div>
            </div>
            <div className="filter-row">
              <input value={merchantSearch} onChange={(event) => { setMerchantSearch(event.target.value); setMerchantPage(1); }} placeholder="Search merchant, email, phone, owner" />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Merchant</th>
                    <th>Status</th>
                    <th>Contact</th>
                    <th>Venues</th>
                    <th>Wallet</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchantPageRows.map((merchant) => (
                    <tr key={merchant.id}>
                      <td><strong>{merchant.business_name}</strong><br /><span className="muted">{merchant.business_type || "business"}</span></td>
                      <td><span className={`status ${merchantStatus(merchant) === "approved" ? "live" : merchantStatus(merchant) === "rejected" ? "expired" : "issued"}`}>{merchantStatus(merchant)}</span></td>
                      <td>{merchant.contact_email || merchant.user?.email || "-"}<br /><span className="muted">{merchant.contact_phone || merchant.user?.name || "-"}</span></td>
                      <td>{merchant.venues?.length ?? 0}</td>
                      <td>£{merchant.wallet?.balance ?? "0.00"}</td>
                      <td>
                        <div className="table-actions">
                          {merchantStatus(merchant) !== "approved" ? (
                            <button 
                              className="primary-button small" 
                              onClick={() => {
                                onApproveMerchant(merchant.id);
                                toast.success(`Merchant "${merchant.business_name}" has been approved successfully!`);
                              }} 
                              disabled={busy === `merchant-approve-${merchant.id}` || loading}
                            >
                              Approve
                            </button>
                          ) : (
                            <button 
                              className="primary-button small"
                            >
                              <Check style={{ width: 16, height: 16, marginRight: 4 }} />
                              Approved
                            </button>
                          )}
                          <button 
                            className="secondary-button small" 
                            onClick={() => {
                              startMerchantEdit(merchant);
                              toast.info(`Editing merchant "${merchant.business_name}"`);
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="secondary-button small danger-button" 
                            onClick={() => void confirmDeleteMerchant(merchant)} 
                            disabled={busy === `merchant-delete-${merchant.id}`}
                          >
                            <Trash style={{ width: 16, height: 16, marginRight: 4 }} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!merchantPageRows.length ? <tr><td colSpan={6} className="muted">No merchants found.</td></tr> : null}
                </tbody>
              </table>
            </div>
            <div className="pagination-row">
              <span className="muted">Showing {merchantPageRows.length} of {merchantRows.length}</span>
              <div className="action-row">
                <button className="secondary-button small" onClick={() => setMerchantPage((page) => Math.max(1, page - 1))} disabled={merchantPage <= 1}>Previous</button>
                <span className="info-badge">Page {merchantPage} / {merchantTotalPages}</span>
                <button className="secondary-button small" onClick={() => setMerchantPage((page) => Math.min(merchantTotalPages, page + 1))} disabled={merchantPage >= merchantTotalPages}>Next</button>
              </div>
            </div>
          </section>
        </>
      ) : null}

      <section className="card" style={{ display: activeSection === "merchant-finance" ? undefined : "none" }}>
        <span className="eyebrow">Finance</span>
        <h2>Low-balance merchants and recent wallet debits</h2>
        <div className="table-wrap">
          <table><thead><tr><th>Merchant</th><th>Wallet</th><th>Threshold</th><th>Main venue</th></tr></thead><tbody>
            {dashboard?.low_balance_merchants?.length ? dashboard.low_balance_merchants.map((merchant) => (
              <tr key={merchant.id}><td>{merchant.business_name}</td><td>£{merchant.wallet?.balance || "0.00"}</td><td>£{merchant.wallet?.low_balance_threshold || "0.00"}</td><td>{merchant.venues?.[0]?.name || "-"}</td></tr>
            )) : <tr><td colSpan={4} className="muted">No low-balance merchants right now.</td></tr>}
          </tbody></table>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>When</th></tr></thead><tbody>
          {dashboard?.recent_transactions?.length ? dashboard.recent_transactions.slice(0, 12).map((item) => (
            <tr key={item.id}><td>{item.reference || item.notes || `TX-${item.id}`}</td><td>{item.type}</td><td>£{item.amount}</td><td>{formatDateTime(item.created_at)}</td></tr>
          )) : <tr><td colSpan={4} className="muted">No recent wallet transactions found.</td></tr>}
        </tbody></table></div>
      </section>

      {activeSection === "merchant-venues" ? (
        <>
          {editingVenueId && venueForm ? (
            <section className="card admin-edit-panel">
              <div className="split-card-header"><div><span className="eyebrow">Edit venue</span><h2>Update venue information and offer setup</h2></div><button className="secondary-button small" onClick={() => { setEditingVenueId(null); setVenueForm(null); }}>Cancel</button></div>
              <div className="form-grid two">
                <label>Venue name<input value={venueForm.name} onChange={(event) => setVenueForm({ ...venueForm, name: event.target.value })} /></label>
                <label>Category<input value={venueForm.category} onChange={(event) => setVenueForm({ ...venueForm, category: event.target.value })} /></label>
                <label>Address<input value={venueForm.address} onChange={(event) => setVenueForm({ ...venueForm, address: event.target.value })} /></label>
                <label>City<input value={venueForm.city} onChange={(event) => setVenueForm({ ...venueForm, city: event.target.value })} /></label>
                <label>Postcode<input value={venueForm.postcode} onChange={(event) => setVenueForm({ ...venueForm, postcode: event.target.value.toUpperCase() })} /></label>
                <label>Approval status<select value={venueForm.approval_status} onChange={(event) => setVenueForm({ ...venueForm, approval_status: event.target.value as VenueForm["approval_status"] })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label>
                <label>Manual 6-character code<input maxLength={6} value={venueForm.venue_code} onChange={(event) => setVenueForm({ ...venueForm, venue_code: normaliseVenueCode(event.target.value) })} /></label>
                <label>Offer type<select value={venueForm.offer_type} onChange={(event) => setVenueForm({ ...venueForm, offer_type: event.target.value as VenueForm["offer_type"] })}><option value="ride">Ride</option><option value="food">Food</option><option value="dual_choice">Ride or Food</option></select></label>
                <label>Ride trip type<select value={venueForm.ride_trip_type} onChange={(event) => setVenueForm({ ...venueForm, ride_trip_type: event.target.value as VenueForm["ride_trip_type"] })}><option value="to_venue">To venue</option><option value="to_and_from">To and from</option></select></label>
                <label>Voucher value £<input type="number" min="0" step="0.01" value={venueForm.offer_value} onChange={(event) => setVenueForm({ ...venueForm, offer_value: event.target.value })} /></label>
                <label>Minimum order £<input type="number" min="0" step="0.01" value={venueForm.minimum_order} onChange={(event) => setVenueForm({ ...venueForm, minimum_order: event.target.value })} /></label>
                <label>Daily voucher cap<input type="number" min="0" value={venueForm.daily_voucher_cap} onChange={(event) => setVenueForm({ ...venueForm, daily_voucher_cap: event.target.value })} /></label>
                <label className="inline-checkbox"><input type="checkbox" checked={venueForm.is_active} onChange={(event) => setVenueForm({ ...venueForm, is_active: event.target.checked })} /> Venue active</label>
                <label style={{ gridColumn: "1 / -1" }}>Description<textarea rows={3} value={venueForm.description} onChange={(event) => setVenueForm({ ...venueForm, description: event.target.value })} /></label>
                <label style={{ gridColumn: "1 / -1" }}>Promo message<textarea rows={3} value={venueForm.promo_message} onChange={(event) => setVenueForm({ ...venueForm, promo_message: event.target.value })} /></label>
              </div>
              <div className="action-row"><button className="primary-button" onClick={() => void saveVenueEdit()} disabled={busy === `venue-update-${editingVenueId}`}>Save venue</button></div>
            </section>
          ) : null}

          <section className="card">
            <div className="split-card-header"><div><span className="eyebrow">Venue management</span><h2>All venues, approvals, update and delete</h2><p className="muted">Approve venues with a manual 6-character code, reject, edit offer information, or delete.</p></div><div className="badge-row"><span className="info-badge">Pending {pendingVenueCount}</span><span className="info-badge">Approved {approvedVenueCount}</span><span className="info-badge">Rejected {rejectedVenueCount}</span></div></div>
            <div className="filter-row"><select value={venueStatusFilter} onChange={(event) => { setVenueStatusFilter(event.target.value as any); setVenuePage(1); }}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><input value={venueSearch} onChange={(event) => { setVenueSearch(event.target.value); setVenuePage(1); }} placeholder="Search venue, merchant, postcode or code" /></div>
            <div className="table-wrap"><table><thead><tr><th>Venue</th><th>Merchant</th><th>Status</th><th>Code</th><th>Offer</th><th>Actions</th></tr></thead><tbody>
              {venuePageRows.map((venue) => {
                const code = getVenueCode(venue);
                const merchantApproved = venue.merchant?.status === "active" && venue.merchant?.user_is_active !== false;
                return (
                  <tr key={venue.id}>
                    <td><strong>{venue.name}</strong><br /><span className="muted">{venue.category || "venue"} · {venue.postcode || "no postcode"}</span></td>
                    <td>{venue.merchant?.business_name || `Merchant ${venue.merchant_id}`}</td>
                    <td><span className={`status ${venue.approval_status === "approved" ? "live" : venue.approval_status === "rejected" ? "expired" : "issued"}`}>{venue.approval_status || "pending"}</span></td>
                    <td><input className="compact-input" value={code} maxLength={6} onChange={(event) => setVenueCodes((current) => ({ ...current, [venue.id]: normaliseVenueCode(event.target.value) }))} /></td>
                    <td>£{venue.offer_value ?? "0.00"}<br /><span className="muted">{venue.offer_type || "ride"}</span></td>
                    <td><div className="table-actions">
                      {!merchantApproved && venue.merchant_id ? <button className="primary-button small" onClick={() => void onApproveMerchant(Number(venue.merchant_id))} disabled={busy === `merchant-approve-${venue.merchant_id}`}>Approve merchant</button> : null}
                      {venue.approval_status !== "approved" ? <button className="primary-button small" onClick={() => void onApproveVenue(venue.id, code)} disabled={!isValidVenueCode(code) || !merchantApproved || busy === `venue-approve-${venue.id}`}>Approve</button> : null}
                      {venue.approval_status !== "rejected" ? <button className="secondary-button small" onClick={() => void onRejectVenue(venue.id)} disabled={busy === `venue-reject-${venue.id}`}>Reject</button> : null}
                      <button className="secondary-button small" onClick={() => startVenueEdit(venue)}>Edit</button>
                      <button className="secondary-button small danger-button" onClick={() => void confirmDeleteVenue(venue)} disabled={busy === `venue-delete-${venue.id}`}>Delete</button>
                    </div></td>
                  </tr>
                );
              })}
              {!venuePageRows.length ? <tr><td colSpan={6} className="muted">No venues found.</td></tr> : null}
            </tbody></table></div>
            <div className="pagination-row"><span className="muted">Showing {venuePageRows.length} of {venueRows.length}</span><div className="action-row"><button className="secondary-button small" onClick={() => setVenuePage((page) => Math.max(1, page - 1))} disabled={venuePage <= 1}>Previous</button><span className="info-badge">Page {venuePage} / {venueTotalPages}</span><button className="secondary-button small" onClick={() => setVenuePage((page) => Math.min(venueTotalPages, page + 1))} disabled={venuePage >= venueTotalPages}>Next</button></div></div>
          </section>
        </>
      ) : null}

      {activeSection === "merchant-address" ? (
        <section className="card"><span className="eyebrow">Address approval queue</span><h2>Pending venue address changes</h2><div className="list">
          {addressChanges.length ? addressChanges.map((item) => (
            <div key={item.id} className="voucher-row" style={{ alignItems: "flex-start" }}><div style={{ display: "grid", gap: 6 }}><strong>{item.business_name || item.venue_name || `Request #${item.id}`}</strong><span className="muted">Current: {item.previous_address || "-"}, {item.previous_city || "-"}, {item.previous_postcode || "-"}</span><span>Requested: {item.requested_address || "-"}, {item.requested_city || "-"}, {item.requested_postcode || "-"}</span><span className="muted">Requested at {formatDateTime(item.created_at)}</span></div><div className="table-actions"><span className="status live">{item.status}</span><button className="primary-button small" onClick={() => void onApproveAddress(item.id)} disabled={busy === `address-approve-${item.id}` || loading}>Approve</button><button className="secondary-button small" onClick={() => void onRejectAddress(item.id)} disabled={busy === `address-reject-${item.id}` || loading}>Reject</button></div></div>
          )) : <p className="muted">No pending address-change requests.</p>}
        </div></section>
      ) : null}

      {activeSection === "merchant-offer-sync" ? (
        <section className="card"><div className="split-card-header"><div><span className="eyebrow">Offer sync queue</span><h2>Merchant changes awaiting provider sync</h2></div><button className="secondary-button small" onClick={() => void onExportPreview()} disabled={busy === "offer-export"}>CSV preview</button></div><div className="list">
          {offerSyncRequests.length ? offerSyncRequests.map((item) => (
            <div key={item.id} className="voucher-row" style={{ alignItems: "flex-start" }}><div><strong>{item.merchant_name || item.venue_name || `Request #${item.id}`}</strong><p className="muted">Changed fields: {(item.changed_fields || []).join(", ") || "-"} · {formatDateTime(item.created_at)}</p></div><div className="table-actions"><button className="primary-button small" onClick={() => void onSyncOfferRequest(item.id)} disabled={busy === `offer-sync-${item.id}`}>Mark synced</button><button className="secondary-button small" onClick={() => void onRejectOfferRequest(item.id)} disabled={busy === `offer-reject-${item.id}`}>Reject</button></div></div>
          )) : <p className="muted">No pending offer sync requests.</p>}
        </div>{offerSyncExport?.csv_preview ? <pre className="admin-code-preview">{offerSyncExport.csv_preview}</pre> : null}</section>
      ) : null}

      {activeSection === "merchant-area-launch" ? (
        <>
          <div className="split-grid">
            <section className="card"><span className="eyebrow">Launch alert composer</span><h2>Preview and send area launch alerts</h2><div className="form-grid"><label>Merchant<select value={areaLaunchMerchantId} onChange={(event) => onAreaLaunchMerchantChange(event.target.value)}><option value="">Choose merchant</option>{merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.business_name}</option>)}</select></label><label>Notes<textarea value={areaLaunchNotes} onChange={(event) => onAreaLaunchNotesChange(event.target.value)} rows={3} /></label></div><div className="action-row"><button className="secondary-button" onClick={() => void onPreviewAreaLaunch()} disabled={busy === "area-launch-preview"}>Load preview</button><button className="primary-button" onClick={() => void onSendAreaLaunch()} disabled={busy === "area-launch-send"}>Send launch alert</button></div></section>
            <section className="card"><span className="eyebrow">Audience preview</span><h2>Coverage and recipient match</h2>{areaLaunchPreview ? <div className="list compact-list"><div className="list-row align-start"><div><strong>{areaLaunchPreview.merchant_name}</strong><p>{areaLaunchPreview.coverage?.venue_name || "No venue"} · {areaLaunchPreview.coverage?.postcode || "No postcode"}</p></div><span className="info-badge">{areaLaunchPreview.journey_type || "general"}</span></div><div className="list-row align-start"><div><strong>Audience</strong><p>{areaLaunchPreview.audience?.registered_users ?? 0} registered users · {areaLaunchPreview.audience?.waiting_list_leads ?? 0} leads</p></div><span className="info-badge">Unique emails: {areaLaunchPreview.audience?.unique_email_count ?? 0}</span></div></div> : <p className="muted">Load a preview to inspect postcode coverage and sample recipients.</p>}</section>
          </div>
          <section className="card"><span className="eyebrow">Recent launch runs</span><h2>Latest alert activity</h2><div className="list">{(areaLaunchDashboard?.items || []).length ? (areaLaunchDashboard?.items || []).map((run) => <div key={run.id} className="voucher-row"><div><strong>{run.merchant?.business_name || `Run #${run.id}`}</strong><p className="muted">{run.venue?.name || "No venue"} · Sent {run.sent_count ?? 0} / Attempted {run.attempted_count ?? 0}</p></div><span className="info-badge">{run.status}</span></div>) : <p className="muted">No area launch runs recorded yet.</p>}</div></section>
        </>
      ) : null}
    </>
  );
}
