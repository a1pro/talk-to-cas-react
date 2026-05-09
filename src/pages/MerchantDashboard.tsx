import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { merchantApi, type MerchantDashboardResponse, type MerchantVenuePayload, type VenueProfilePayload } from "@/api/merchant";
import { getMerchantWorkspaceSection } from "@/lib/workspace";
import { MerchantNavigation } from "@/pages/merchant/MerchantNavigation";
import type { MerchantVenueProfile, PaginationMeta, Venue, Voucher, WalletTransaction } from "@/types";

const selectStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  background: "var(--bg-input)",
  color: "var(--text-secondary)",
  border: "1px solid var(--border-input)",
} as const;

const emptyVenueForm: MerchantVenuePayload = {
  name: "",
  category: "club",
  address: "",
  city: "",
  postcode: "",
  latitude: null,
  longitude: null,
  description: "",
  promo_message: "",
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value?: string | number | null) {
  const numeric = Number(value ?? 0);
  return `£${Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00"}`;
}

function statusClass(value?: string | null) {
  const normalised = String(value || "").toLowerCase();
  if (["active", "approved", "live", "redeemed", "synced"].includes(normalised)) return "status live";
  if (["pending", "issued", "pending_sync"].includes(normalised)) return "status issued";
  return "status expired";
}

function pageLabel(meta?: PaginationMeta | null) {
  if (!meta || !meta.total) return "0 records";
  return `${meta.from ?? 0}-${meta.to ?? 0} of ${meta.total}`;
}

function PaginationControls({ meta, onPageChange }: { meta?: PaginationMeta | null; onPageChange: (page: number) => void }) {
  if (!meta) return null;

  return (
    <div className="admin-table-footer">
      <span className="muted">{pageLabel(meta)}</span>
      <div className="action-row" style={{ marginTop: 0 }}>
        <button className="secondary-button small" disabled={meta.current_page <= 1} onClick={() => onPageChange(meta.current_page - 1)}>
          Previous
        </button>
        <span className="info-badge">Page {meta.current_page} / {meta.last_page || 1}</span>
        <button className="secondary-button small" disabled={meta.current_page >= meta.last_page} onClick={() => onPageChange(meta.current_page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

type MerchantSection = ReturnType<typeof getMerchantWorkspaceSection>;

function venueStatusForSection(section: MerchantSection) {
  if (section === "venues-approved") return "approved";
  if (section === "venues-pending") return "pending";
  return "all";
}

function voucherStatusForSection(section: MerchantSection) {
  if (section === "vouchers-issued") return "issued";
  if (section === "vouchers-redeemed") return "redeemed";
  return "all";
}

export default function MerchantDashboard() {
  const location = useLocation();
  const activeSection = getMerchantWorkspaceSection(location.pathname);
  const activeFamily = activeSection.startsWith("vouchers")
    ? "vouchers"
    : activeSection === "wallet"
      ? "wallet"
      : ["profile", "offers", "information"].includes(activeSection)
        ? "settings"
        : "venues";

  const [dashboard, setDashboard] = useState<MerchantDashboardResponse | null>(null);
  const [profile, setProfile] = useState<MerchantVenueProfile | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venueSummary, setVenueSummary] = useState<Record<string, any>>({});
  const [venueMeta, setVenueMeta] = useState<PaginationMeta | null>(null);
  const [venueSearch, setVenueSearch] = useState("");
  const [venueAppliedSearch, setVenueAppliedSearch] = useState("");
  const [venueCategory, setVenueCategory] = useState("");
  const [venuePage, setVenuePage] = useState(1);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherSummary, setVoucherSummary] = useState<Record<string, any>>({});
  const [voucherMeta, setVoucherMeta] = useState<PaginationMeta | null>(null);
  const [voucherSearch, setVoucherSearch] = useState("");
  const [voucherAppliedSearch, setVoucherAppliedSearch] = useState("");
  const [voucherJourneyType, setVoucherJourneyType] = useState("");
  const [voucherPage, setVoucherPage] = useState(1);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<Record<string, any>>({});
  const [transactionMeta, setTransactionMeta] = useState<PaginationMeta | null>(null);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionAppliedSearch, setTransactionAppliedSearch] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [transactionPage, setTransactionPage] = useState(1);

  const [form, setForm] = useState<VenueProfilePayload>({
    business_name: "",
    business_type: "club",
    venue_name: "",
    address: "",
    city: "",
    postcode: "",
    description: "",
  });
  const [venueForm, setVenueForm] = useState<MerchantVenuePayload>(emptyVenueForm);
  const [topUpAmount, setTopUpAmount] = useState("30");

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const venueStatus = venueStatusForSection(activeSection);
  const voucherStatus = voucherStatusForSection(activeSection);
  const wallet = dashboard?.merchant.wallet;
  const latestAddressRequest = profile?.address_change?.latest_request || dashboard?.address_change?.latest_request || null;

  const familyNav = useMemo(() => ([
    { label: "Venue", path: "/merchant", active: activeFamily === "venues" },
    { label: "Vouchers", path: "/merchant/vouchers/all", active: activeFamily === "vouchers" },
    { label: "Wallet", path: "/merchant/wallet", active: activeFamily === "wallet" },
    { label: "Settings", path: "/merchant/profile", active: activeFamily === "settings" },
  ]), [activeFamily]);

  const sectionNav = useMemo(() => {
    if (activeFamily === "vouchers") {
      return [
        { label: "All", path: "/merchant/vouchers/all", active: activeSection === "vouchers-all" },
        { label: "Issued", path: "/merchant/vouchers/issued", active: activeSection === "vouchers-issued" },
        { label: "Redeemed", path: "/merchant/vouchers/redeemed", active: activeSection === "vouchers-redeemed" },
      ];
    }

    if (activeFamily === "wallet") {
      return [{ label: "Transactions", path: "/merchant/wallet", active: activeSection === "wallet" }];
    }

    if (activeFamily === "settings") {
      return [
        { label: "Profile", path: "/merchant/profile", active: activeSection === "profile" },
        { label: "Offers", path: "/merchant/offers", active: activeSection === "offers" },
        { label: "Information", path: "/merchant/information", active: activeSection === "information" },
      ];
    }

    return [
      { label: "Overview", path: "/merchant", active: activeSection === "overview" },
      { label: "All", path: "/merchant/venues/all", active: activeSection === "venues-all" },
      { label: "Approved", path: "/merchant/venues/approved", active: activeSection === "venues-approved" },
      { label: "Pending", path: "/merchant/venues/pending", active: activeSection === "venues-pending" },
      { label: "Create", path: "/merchant/venues/create", active: activeSection === "venues-create" },
    ];
  }, [activeFamily, activeSection]);

  const pageMeta = useMemo(() => {
    if (activeSection === "overview") return { title: "Merchant dashboard", subtitle: "Simple overview for venues, wallet, and voucher activity." };
    if (activeSection === "venues-create") return { title: "Create venue", subtitle: "Submit a new venue for admin approval." };
    if (activeSection === "venues-approved") return { title: "Venues", subtitle: "Approved live venues with filters and pagination." };
    if (activeSection === "venues-pending") return { title: "Venues", subtitle: "Venues waiting for admin approval." };
    if (activeSection === "vouchers-issued") return { title: "Vouchers", subtitle: "Issued vouchers that are still waiting for completion." };
    if (activeSection === "vouchers-redeemed") return { title: "Vouchers", subtitle: "Redeemed/completed voucher records." };
    if (activeSection === "wallet") return { title: "Wallet", subtitle: "Balance, top-up, and paginated transaction records." };
    if (activeSection === "profile") return { title: "Merchant profile", subtitle: "Business and primary venue details." };
    return { title: activeFamily === "vouchers" ? "Vouchers" : "Venues", subtitle: "Search, filter, and paginate your records." };
  }, [activeFamily, activeSection]);

  const stats = useMemo(() => ([
    { label: "Wallet balance", value: money(dashboard?.stats?.wallet_balance || wallet?.balance || "0.00") },
    { label: "Active venues", value: dashboard?.stats?.active_venues ?? venueSummary.active ?? 0 },
    { label: "Issued vouchers", value: dashboard?.stats?.issued_vouchers ?? voucherSummary.issued ?? 0 },
    { label: "Redeemed vouchers", value: dashboard?.stats?.redeemed_vouchers ?? voucherSummary.redeemed ?? 0 },
  ]), [dashboard, wallet, venueSummary, voucherSummary]);

  async function loadCommon() {
    setError(null);
    try {
      const [dashboardRes, profileRes] = await Promise.all([merchantApi.getDashboard(), merchantApi.getVenueProfile()]);
      const nextDashboard = dashboardRes.data.data;
      const nextProfile = profileRes.data.data;
      setDashboard(nextDashboard);
      setProfile(nextProfile);
      setForm({
        business_name: nextProfile.merchant.business_name,
        business_type: nextProfile.merchant.business_type || nextProfile.venue.category || "club",
        venue_name: nextProfile.venue.name,
        address: nextProfile.venue.address || "",
        city: nextProfile.venue.city || "",
        postcode: nextProfile.venue.postcode || "",
        latitude: nextProfile.venue.latitude ?? null,
        longitude: nextProfile.venue.longitude ?? null,
        description: nextProfile.venue.description || "",
      });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Merchant dashboard could not be loaded.");
    }
  }

  async function loadVenues() {
    setLoading(true);
    setError(null);
    try {
      const payload = await merchantApi.getPaginatedVenues({
        status: venueStatus,
        category: venueCategory || undefined,
        search: venueAppliedSearch.trim() || undefined,
        page: venuePage,
        per_page: 10,
      });
      setVenues(payload.items || []);
      setVenueSummary(payload.summary || {});
      setVenueMeta(payload.meta || null);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Venue records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function loadVouchers() {
    setLoading(true);
    setError(null);
    try {
      const payload = await merchantApi.getPaginatedVouchers({
        status: voucherStatus,
        journey_type: voucherJourneyType || undefined,
        search: voucherAppliedSearch.trim() || undefined,
        page: voucherPage,
        per_page: 10,
      });
      setVouchers(payload.items || []);
      setVoucherSummary(payload.summary || {});
      setVoucherMeta(payload.meta || null);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Voucher records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions() {
    setLoading(true);
    setError(null);
    try {
      const payload = await merchantApi.getPaginatedWalletTransactions({
        type: transactionType || undefined,
        search: transactionAppliedSearch.trim() || undefined,
        page: transactionPage,
        per_page: 10,
      });
      setTransactions(payload.items || []);
      setTransactionSummary(payload.summary || {});
      setTransactionMeta(payload.meta || null);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Wallet transactions could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCommon();
  }, []);

  useEffect(() => {
    if (activeSection.startsWith("venues") && activeSection !== "venues-create") {
      void loadVenues();
    }
  }, [activeSection, venueStatus, venueCategory, venueAppliedSearch, venuePage]);

  useEffect(() => {
    if (activeSection.startsWith("vouchers")) {
      void loadVouchers();
    }
  }, [activeSection, voucherStatus, voucherJourneyType, voucherAppliedSearch, voucherPage]);

  useEffect(() => {
    if (activeSection === "wallet") {
      void loadTransactions();
    }
  }, [activeSection, transactionType, transactionAppliedSearch, transactionPage]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy("profile");
    setError(null);
    setSuccess(null);

    try {
      const response = await merchantApi.updateVenueProfile({
        ...form,
        postcode: form.postcode.trim().toUpperCase(),
      });
      setProfile(response.data.data);
      setSuccess(response.data.message || "Profile saved.");
      await loadCommon();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.errors?.postcode?.[0] || requestError?.response?.data?.message || "Profile could not be saved.");
    } finally {
      setBusy(null);
    }
  }

  async function submitVenue(event: FormEvent) {
    event.preventDefault();
    setBusy("venue-create");
    setError(null);
    setSuccess(null);

    try {
      await merchantApi.createVenue({
        ...venueForm,
        name: venueForm.name.trim(),
        postcode: venueForm.postcode.trim().toUpperCase(),
        address: venueForm.address?.trim() || null,
        city: venueForm.city?.trim() || null,
        description: venueForm.description?.trim() || null,
        promo_message: venueForm.promo_message?.trim() || null,
      });
      setVenueForm(emptyVenueForm);
      setSuccess("Venue submitted for admin approval.");
      await loadCommon();
      setVenuePage(1);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.errors?.postcode?.[0] || requestError?.response?.data?.message || "Venue could not be submitted.");
    } finally {
      setBusy(null);
    }
  }

  async function topUpWallet(event: FormEvent) {
    event.preventDefault();
    setBusy("top-up");
    setError(null);
    setSuccess(null);

    try {
      await merchantApi.topUpWallet(Number(topUpAmount));
      setSuccess("Wallet topped up successfully.");
      await Promise.all([loadCommon(), loadTransactions()]);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.errors?.amount?.[0] || requestError?.response?.data?.message || "Wallet top-up could not be completed.");
    } finally {
      setBusy(null);
    }
  }

  async function redeemVoucher(voucherId: number) {
    setBusy(`voucher-${voucherId}`);
    setError(null);
    setSuccess(null);

    try {
      await merchantApi.redeemVoucher(voucherId);
      setSuccess("Voucher marked as redeemed.");
      await Promise.all([loadCommon(), loadVouchers()]);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Voucher could not be redeemed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title={pageMeta.title} subtitle={pageMeta.subtitle}>
      <MerchantNavigation familyNav={familyNav} sectionNav={sectionNav} />

      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="card success-box">{success}</div> : null}

      {(activeSection === "overview" || activeSection === "wallet" || activeSection.startsWith("vouchers")) ? (
        <section className="card-grid four">
          {stats.map((item) => (
            <article key={item.label} className="card stat-card">
              <h3>{item.label}</h3>
              <strong>{item.value}</strong>
            </article>
          ))}
        </section>
      ) : null}

      {activeSection === "overview" ? (
        <>
          <section className="card">
            <span className="eyebrow">Overview</span>
            <h2 style={{ marginBottom: 8 }}>{dashboard?.merchant.business_name || "Merchant workspace"}</h2>
            <p className="muted">Use the main menu for venue records, voucher records, wallet transactions, and settings. The dashboard stays clean and avoids long mixed sections.</p>
            <div className="action-row wrap-actions" style={{ marginTop: 16 }}>
              <Link className="primary-button" to="/merchant/venues/all">Open venues</Link>
              <Link className="secondary-button" to="/merchant/vouchers/all">Open vouchers</Link>
              <Link className="secondary-button" to="/merchant/wallet">Open wallet</Link>
            </div>
          </section>

          <section className="card-grid three">
            <article className="card">
              <span className="eyebrow">Primary venue</span>
              <h3>{profile?.venue?.name || dashboard?.primary_venue?.name || "No venue yet"}</h3>
              <p className="muted">{profile?.venue?.postcode || dashboard?.primary_venue?.postcode || "Postcode pending"}</p>
              <p className="table-note">Status: <span className={statusClass(profile?.venue?.approval_status || dashboard?.primary_venue?.approval_status)}>{profile?.venue?.approval_status || dashboard?.primary_venue?.approval_status || "pending"}</span></p>
            </article>
            <article className="card">
              <span className="eyebrow">Offer</span>
              <h3>{dashboard?.offer_snapshot?.offer?.offer_enabled ? "Enabled" : "Not enabled"}</h3>
              <p className="muted">{dashboard?.offer_snapshot?.offer?.offer_type || "Set your voucher rules"}</p>
              <Link className="secondary-button small" to="/merchant/offers">Offer settings</Link>
            </article>
            <article className="card">
              <span className="eyebrow">Address protection</span>
              <h3>{latestAddressRequest ? latestAddressRequest.status : "No pending change"}</h3>
              <p className="muted">{latestAddressRequest ? formatDateTime(latestAddressRequest.created_at) : "Address changes stay reviewable."}</p>
              <Link className="secondary-button small" to="/merchant/profile">Profile</Link>
            </article>
          </section>
        </>
      ) : null}

      {activeSection.startsWith("venues") && activeSection !== "venues-create" ? (
        <section className="card">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Venue records</span>
              <h2>{venueStatus === "all" ? "All venues" : `${venueStatus} venues`}</h2>
              <p className="muted">Total {venueSummary.total ?? 0} · Approved {venueSummary.approved ?? 0} · Pending {venueSummary.pending ?? 0}</p>
            </div>
            <Link className="primary-button" to="/merchant/venues/create">Create venue</Link>
          </div>

          <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); setVenuePage(1); setVenueAppliedSearch(venueSearch); }}>
            <input value={venueSearch} onChange={(event) => setVenueSearch(event.target.value)} placeholder="Search venue, postcode, city, code" />
            <select value={venueCategory} onChange={(event) => { setVenueCategory(event.target.value); setVenuePage(1); }} style={selectStyle}>
              <option value="">All categories</option>
              <option value="club">Club</option>
              <option value="bar">Bar</option>
              <option value="restaurant">Restaurant</option>
              <option value="takeaway">Takeaway</option>
              <option value="cafe">Cafe</option>
            </select>
            <button className="secondary-button" type="submit">Filter</button>
            <button className="text-button" type="button" onClick={() => { setVenueSearch(""); setVenueAppliedSearch(""); setVenueCategory(""); setVenuePage(1); }}>Clear</button>
          </form>

          <div className="admin-data-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Offer</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {venues.length ? venues.map((venue) => (
                  <tr key={venue.id}>
                    <td><strong>{venue.name}</strong><p className="table-note">{venue.description || "No description"}</p></td>
                    <td>{venue.venue_code || "-"}</td>
                    <td>{venue.category || "-"}</td>
                    <td>{venue.postcode || "-"}<p className="table-note">{venue.city || venue.address || "-"}</p></td>
                    <td><span className={statusClass(venue.approval_status)}>{venue.approval_status || "pending"}</span></td>
                    <td>{venue.offer_enabled ? money(venue.offer_value) : "Off"}<p className="table-note">{venue.offer_type || "draft"}</p></td>
                    <td>{formatDateTime(venue.submitted_for_approval_at)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="muted">{loading ? "Loading venues..." : "No venues found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls meta={venueMeta} onPageChange={setVenuePage} />
        </section>
      ) : null}

      {activeSection === "venues-create" ? (
        <section className="card">
          <span className="eyebrow">Create venue</span>
          <h2 style={{ marginBottom: 8 }}>Submit a venue for admin approval</h2>
          <form className="form-grid" onSubmit={submitVenue}>
            <label>Venue name<input value={venueForm.name} onChange={(event) => setVenueForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label>Category<select value={venueForm.category} onChange={(event) => setVenueForm((current) => ({ ...current, category: event.target.value }))} style={selectStyle}><option value="club">Club</option><option value="bar">Bar</option><option value="restaurant">Restaurant</option><option value="takeaway">Takeaway</option><option value="cafe">Cafe</option></select></label>
            <label>Address<input value={venueForm.address || ""} onChange={(event) => setVenueForm((current) => ({ ...current, address: event.target.value }))} /></label>
            <label>City<input value={venueForm.city || ""} onChange={(event) => setVenueForm((current) => ({ ...current, city: event.target.value }))} /></label>
            <label>Postcode<input value={venueForm.postcode} onChange={(event) => setVenueForm((current) => ({ ...current, postcode: event.target.value }))} required /></label>
            <label>Promo message<input value={venueForm.promo_message || ""} onChange={(event) => setVenueForm((current) => ({ ...current, promo_message: event.target.value }))} /></label>
            <label className="full-span">Description<textarea value={venueForm.description || ""} onChange={(event) => setVenueForm((current) => ({ ...current, description: event.target.value }))} rows={4} /></label>
            <div className="action-row full-span"><button className="primary-button" type="submit" disabled={busy === "venue-create"}>{busy === "venue-create" ? "Submitting..." : "Submit venue"}</button></div>
          </form>
        </section>
      ) : null}

      {activeSection.startsWith("vouchers") ? (
        <section className="card">
          <div className="section-heading-row">
            <div>
              <span className="eyebrow">Voucher records</span>
              <h2>{voucherStatus === "all" ? "All vouchers" : `${voucherStatus} vouchers`}</h2>
              <p className="muted">Total {voucherSummary.total ?? 0} · Issued {voucherSummary.issued ?? 0} · Redeemed {voucherSummary.redeemed ?? 0}</p>
            </div>
            <Link className="secondary-button" to="/merchant/offers">Offer settings</Link>
          </div>

          <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); setVoucherPage(1); setVoucherAppliedSearch(voucherSearch); }}>
            <input value={voucherSearch} onChange={(event) => setVoucherSearch(event.target.value)} placeholder="Search code, customer, venue, provider" />
            <select value={voucherJourneyType} onChange={(event) => { setVoucherJourneyType(event.target.value); setVoucherPage(1); }} style={selectStyle}>
              <option value="">All journey types</option>
              <option value="ride">Ride</option>
              <option value="food">Food</option>
            </select>
            <button className="secondary-button" type="submit">Filter</button>
            <button className="text-button" type="button" onClick={() => { setVoucherSearch(""); setVoucherAppliedSearch(""); setVoucherJourneyType(""); setVoucherPage(1); }}>Clear</button>
          </form>

          <div className="admin-data-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer</th>
                  <th>Venue</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.length ? vouchers.map((voucher) => (
                  <tr key={voucher.id}>
                    <td><strong>{voucher.code}</strong><p className="table-note">{voucher.provider_name || voucher.offer_type || "provider"}</p></td>
                    <td>{voucher.user?.name || "Guest"}<p className="table-note">{voucher.user?.email || voucher.user?.phone || "-"}</p></td>
                    <td>{voucher.venue?.name || "-"}<p className="table-note">{voucher.venue?.venue_code || voucher.venue?.postcode || "-"}</p></td>
                    <td>{voucher.journey_type || "-"}</td>
                    <td>{money(voucher.voucher_value)}<p className="table-note">Charge {money(voucher.total_charge)}</p></td>
                    <td><span className={statusClass(voucher.status)}>{voucher.status}</span></td>
                    <td>{formatDateTime(voucher.issued_at)}</td>
                    <td>{voucher.status === "issued" ? <button className="secondary-button small" disabled={busy === `voucher-${voucher.id}`} onClick={() => void redeemVoucher(voucher.id)}>Redeem</button> : <span className="muted">-</span>}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="muted">{loading ? "Loading vouchers..." : "No vouchers found."}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls meta={voucherMeta} onPageChange={setVoucherPage} />
        </section>
      ) : null}

      {activeSection === "wallet" ? (
        <>
          <section className="card-grid three">
            <article className="card"><span className="eyebrow">Balance</span><h3>{money(wallet?.balance)}</h3><p className="muted">Low alert: {money(wallet?.low_balance_threshold)}</p></article>
            <article className="card"><span className="eyebrow">Auto top-up</span><h3>{wallet?.auto_top_up_enabled ? "On" : "Off"}</h3><p className="muted">Amount: {money(wallet?.auto_top_up_amount)}</p></article>
            <article className="card"><span className="eyebrow">Transactions</span><h3>{transactionSummary.total ?? 0}</h3><p className="muted">Deposits {transactionSummary.deposit ?? 0} · Charges {transactionSummary.voucher_charge ?? 0}</p></article>
          </section>

          <section className="card">
            <span className="eyebrow">Top up</span>
            <form className="admin-filter-bar" onSubmit={topUpWallet}>
              <input type="number" min="1" value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} placeholder="Amount" />
              <button className="primary-button" type="submit" disabled={busy === "top-up"}>{busy === "top-up" ? "Processing..." : "Top up wallet"}</button>
            </form>
          </section>

          <section className="card">
            <div className="section-heading-row"><div><span className="eyebrow">Wallet transactions</span><h2>Transactions</h2></div></div>
            <form className="admin-filter-bar" onSubmit={(event) => { event.preventDefault(); setTransactionPage(1); setTransactionAppliedSearch(transactionSearch); }}>
              <input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search reference, notes, type" />
              <select value={transactionType} onChange={(event) => { setTransactionType(event.target.value); setTransactionPage(1); }} style={selectStyle}>
                <option value="">All types</option>
                <option value="deposit">Deposit</option>
                <option value="voucher_charge">Voucher charge</option>
                <option value="refund">Refund</option>
              </select>
              <button className="secondary-button" type="submit">Filter</button>
              <button className="text-button" type="button" onClick={() => { setTransactionSearch(""); setTransactionAppliedSearch(""); setTransactionType(""); setTransactionPage(1); }}>Clear</button>
            </form>

            <div className="admin-data-table-wrap">
              <table className="admin-data-table">
                <thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Amount</th><th>Balance before</th><th>Balance after</th></tr></thead>
                <tbody>
                  {transactions.length ? transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{formatDateTime(transaction.created_at)}</td>
                      <td><span className={statusClass(transaction.type)}>{transaction.type}</span></td>
                      <td>{transaction.reference || "-"}<p className="table-note">{transaction.notes || "-"}</p></td>
                      <td>{money(transaction.amount)}</td>
                      <td>{money(transaction.balance_before)}</td>
                      <td>{money(transaction.balance_after)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="muted">{loading ? "Loading transactions..." : "No transactions found."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <PaginationControls meta={transactionMeta} onPageChange={setTransactionPage} />
          </section>
        </>
      ) : null}

      {activeSection === "profile" ? (
        <section className="card">
          <span className="eyebrow">Profile</span>
          <h2 style={{ marginBottom: 8 }}>Business and primary venue</h2>
          <form className="form-grid" onSubmit={saveProfile}>
            <label>Business name<input value={form.business_name} onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))} required /></label>
            <label>Business type<select value={form.business_type} onChange={(event) => setForm((current) => ({ ...current, business_type: event.target.value }))} style={selectStyle}><option value="club">Club</option><option value="bar">Bar</option><option value="restaurant">Restaurant</option><option value="takeaway">Takeaway</option><option value="cafe">Cafe</option></select></label>
            <label>Venue name<input value={form.venue_name} onChange={(event) => setForm((current) => ({ ...current, venue_name: event.target.value }))} required /></label>
            <label>Postcode<input value={form.postcode} onChange={(event) => setForm((current) => ({ ...current, postcode: event.target.value }))} required /></label>
            <label>Address<input value={form.address || ""} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} /></label>
            <label>City<input value={form.city || ""} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} /></label>
            <label className="full-span">Description<textarea value={form.description || ""} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} /></label>
            {latestAddressRequest ? <div className="info-box full-span"><strong>Address request: {latestAddressRequest.status}</strong><p className="muted">Requested {formatDateTime(latestAddressRequest.created_at)}. Admin notes: {latestAddressRequest.admin_notes || "-"}</p></div> : null}
            <div className="action-row full-span"><button className="primary-button" type="submit" disabled={busy === "profile"}>{busy === "profile" ? "Saving..." : "Save profile"}</button></div>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}
