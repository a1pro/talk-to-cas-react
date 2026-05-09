import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import { AppShell } from "@/components/AppShell";
import { WorkspaceQuickLinks } from "@/components/WorkspaceQuickLinks";
import { updateUserProviderProfile } from "@/api/user";
import { sendAffiliateTestAlert } from "@/api/affiliate";
import {
  createAffiliatePayoutRun,
  simulateAffiliatePayoutApproval,
  simulateAffiliatePayoutRun,
  startAffiliatePayoutOnboarding,
  updateAffiliatePayoutProfile,
} from "@/api/finance";
import type {
  AffiliateCommissionDashboard,
  AffiliateDashboard,
  AffiliatePayoutProfile,
  ApiResponse,
  BnplVoucherOrder,
  FraudUserStatus,
  StripePayoutRun,
  UserProviderProfile,
  Venue,
  Voucher,
} from "@/types";

interface UserDashboardResponse {
  user: {
    name: string;
    email?: string | null;
    email_verified_at?: string | null;
    phone?: string | null;
    postcode?: string | null;
    phone_verified_at?: string | null;
  };
  provider_profile?: UserProviderProfile | null;
  stats: {
    total_vouchers: number;
    redeemed_vouchers: number;
    issued_vouchers: number;
  };
  recent_vouchers: Voucher[];
  recent_bnpl_orders?: BnplVoucherOrder[];
  affiliate?: AffiliateDashboard | null;
  affiliate_reports?: AffiliateCommissionDashboard | null;
  payout_profile?: AffiliatePayoutProfile | null;
  fraud?: FraudUserStatus | null;
}

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


function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

export default function UserDashboard() {
  const [dashboard, setDashboard] = useState<UserDashboardResponse | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [creating, setCreating] = useState<number | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingProviderProfile, setSavingProviderProfile] = useState(false);
  const [savingPayoutProfile, setSavingPayoutProfile] = useState(false);
  const [payoutRunBusy, setPayoutRunBusy] = useState<string | null>(null);
  const [sendingAffiliateAlert, setSendingAffiliateAlert] = useState(false);

  async function loadData() {
    const [dashboardRes, venuesRes] = await Promise.all([
      api.get<ApiResponse<UserDashboardResponse>>("/user/dashboard"),
      api.get<ApiResponse<Venue[]>>("/user/venues"),
    ]);

    setDashboard(dashboardRes.data.data);
    setVenues(venuesRes.data.data);
  }

  useEffect(() => {
    void loadData();
  }, []);

  const affiliate = dashboard?.affiliate ?? null;
  const affiliateReports = dashboard?.affiliate_reports ?? null;
  const fraud = dashboard?.fraud ?? null;
  const providerProfile = dashboard?.provider_profile ?? null;
  const payoutProfile = dashboard?.payout_profile ?? null;
  const location = useLocation();
  const activeSection = useMemo(() => {
    if (location.pathname === "/user/affiliate") return "affiliate";
    if (location.pathname === "/user/payouts") return "payouts";
    if (location.pathname === "/user/promo-profile") return "eligibility";
    if (location.pathname === "/user/security") return "security";
    if (location.pathname === "/user/upgrades") return "upgrades";
    if (location.pathname === "/user/history") return "history";
    return new URLSearchParams(location.search).get("section") || "overview";
  }, [location.pathname, location.search]);
  const pageCopy = {
    overview: {
      title: "User overview",
      subtitle: "See your account summary and open the main user tools from the left menu.",
    },
    affiliate: {
      title: "Affiliate hub",
      subtitle: "Keep your referral link, signups, and affiliate metrics in one dedicated area.",
    },
    payouts: {
      title: "Payouts",
      subtitle: "Manage Stripe Connect onboarding and payout runs without scrolling past the rest of the dashboard.",
    },
    eligibility: {
      title: "Promo profile",
      subtitle: "Set your Uber and Uber Eats eligibility so discovery can filter the right promo codes.",
    },
    security: {
      title: "Security",
      subtitle: "Review fraud-screening status and account protection signals in one place.",
    },
    upgrades: {
      title: "Voucher upgrades",
      subtitle: "Track BNPL upgrades, checkout status, and upgrade notes from a separate screen.",
    },
    history: {
      title: "Voucher history",
      subtitle: "Review recent voucher activity without mixing it into every other user tool.",
    },
  } as const;

  const referralSummary = useMemo(
    () => [
      { label: "Referral clicks", value: affiliate?.clicks ?? 0 },
      { label: "Signed up", value: affiliate?.signups ?? 0 },
      { label: "Issued vouchers", value: affiliate?.issued_vouchers ?? 0 },
      { label: "Redeemed vouchers", value: affiliate?.redeemed_vouchers ?? 0 },
    ],
    [affiliate]
  );

  async function createVoucher(venueId: number) {
    setCreating(venueId);
    setActionMessage(null);
    setActionError(null);

    try {
      const response = await api.post<ApiResponse<Voucher>>("/user/vouchers", { venue_id: venueId });
      setActionMessage(response.data.message || "Voucher created.");
      await loadData();
    } catch (error: any) {
      setActionError(
        error?.response?.data?.errors?.fraud?.[0] ||
          error?.response?.data?.message ||
          "Voucher could not be created right now."
      );
      await loadData();
    } finally {
      setCreating(null);
    }
  }

  async function copyInviteLink() {
    if (!affiliate?.invite_url) return;
    try {
      await navigator.clipboard.writeText(affiliate.invite_url);
      setCopyMessage("Invite link copied.");
      window.setTimeout(() => setCopyMessage(""), 1600);
    } catch {
      setCopyMessage("Could not copy the link automatically.");
    }
  }

  async function copyShareMessage() {
    if (!affiliate?.share_message) return;
    try {
      await navigator.clipboard.writeText(affiliate.share_message);
      setCopyMessage("Share message copied.");
      window.setTimeout(() => setCopyMessage(""), 1600);
    } catch {
      setCopyMessage("Could not copy the share message automatically.");
    }
  }


  async function triggerAffiliateAlertTest() {
    setSendingAffiliateAlert(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const result = await sendAffiliateTestAlert();
      const channels = result.data?.channels?.length ? result.data.channels.join(" + ") : "no channel";
      setActionMessage(result.message || `Affiliate alert test processed via ${channels}.`);
      await loadData();
    } catch (error: any) {
      setActionError(error?.response?.data?.message || "Could not send the affiliate test alert.");
    } finally {
      setSendingAffiliateAlert(false);
    }
  }

  async function saveProviderProfile(nextProfile: {
    is_uber_existing_customer: boolean | null;
    is_ubereats_existing_customer: boolean | null;
  }) {
    setSavingProviderProfile(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const profile = await updateUserProviderProfile(nextProfile);
      setDashboard((current) =>
        current
          ? {
              ...current,
              provider_profile: profile,
            }
          : current
      );
      setActionMessage("Provider profile updated. Discovery can now filter live promo codes more accurately.");
    } catch (error: any) {
      setActionError(error?.response?.data?.message || "Could not update provider profile.");
    } finally {
      setSavingProviderProfile(false);
    }
  }

  async function savePayoutProfile(nextProfile: {
    payout_email?: string | null;
    country_code?: string | null;
    currency?: string | null;
  }) {
    setSavingPayoutProfile(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const profile = await updateAffiliatePayoutProfile(nextProfile);
      setDashboard((current) => (current ? { ...current, payout_profile: profile } : current));
      setActionMessage("Affiliate payout profile updated. Stripe Connect onboarding can now use these details.");
    } catch (error: any) {
      setActionError(error?.response?.data?.message || "Could not update the payout profile.");
    } finally {
      setSavingPayoutProfile(false);
    }
  }

  async function beginPayoutOnboarding() {
    setSavingPayoutProfile(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const profile = await startAffiliatePayoutOnboarding();
      setDashboard((current) => (current ? { ...current, payout_profile: profile } : current));
      setActionMessage("Stripe Connect onboarding started on localhost foundation flow.");
    } catch (error: any) {
      setActionError(error?.response?.data?.message || "Could not start Stripe Connect onboarding.");
    } finally {
      setSavingPayoutProfile(false);
    }
  }

  async function createPayoutRunRequest() {
    setPayoutRunBusy("create");
    setActionError(null);
    setActionMessage(null);

    try {
      const result = await createAffiliatePayoutRun();
      setDashboard((current) => (current ? { ...current, payout_profile: result.payout_profile } : current));
      setActionMessage(`Affiliate payout run ${result.payout_run.payout_code} created successfully.`);
    } catch (error: any) {
      setActionError(error?.response?.data?.message || "Could not create the affiliate payout run.");
    } finally {
      setPayoutRunBusy(null);
    }
  }

  async function settlePayoutRun(run: StripePayoutRun) {
    setPayoutRunBusy(run.payout_code);
    setActionError(null);
    setActionMessage(null);

    try {
      const result = await simulateAffiliatePayoutRun(run.payout_code);
      setDashboard((current) => (current ? { ...current, payout_profile: result.payout_profile } : current));
      setActionMessage(`Affiliate payout ${run.payout_code} marked as paid on localhost.`);
    } catch (error: any) {
      setActionError(error?.response?.data?.message || "Could not mark this affiliate payout as paid.");
    } finally {
      setPayoutRunBusy(null);
    }
  }

  async function approvePayoutOnboarding() {
    setSavingPayoutProfile(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const profile = await simulateAffiliatePayoutApproval();
      setDashboard((current) => (current ? { ...current, payout_profile: profile } : current));
      setActionMessage("Stripe Connect approval simulated successfully. Affiliate payout onboarding is now marked ready.");
    } catch (error: any) {
      setActionError(error?.response?.data?.message || "Could not simulate Stripe approval.");
    } finally {
      setSavingPayoutProfile(false);
    }
  }

  return (
    <AppShell
      title={pageCopy[activeSection as keyof typeof pageCopy]?.title || "User dashboard"}
      subtitle={pageCopy[activeSection as keyof typeof pageCopy]?.subtitle || "Use the left menu to switch between the main user tools."}
    >
      <section className="profile-summary-card card">
        <div>
          <span className="eyebrow">Account setup</span>
          <h2>{dashboard?.user.name ?? "User"}</h2>
          <p className="muted">
            {dashboard?.user.phone ?? "No phone"}
            {dashboard?.user.email ? ` · ${dashboard.user.email}` : " · No email"}
          </p>
        </div>
        <div className="badge-row">
          <span className="info-badge">{dashboard?.user.postcode || "Postcode not added"}</span>
          <span className="info-badge success-badge">
            {dashboard?.user.email_verified_at ? "Email verified" : "Email pending"}
          </span>
          <span className="info-badge">
            {dashboard?.user.phone_verified_at ? "Phone verified" : "Phone saved for later OTP"}
          </span>
          {affiliate?.share_code ? <span className="info-badge">Affiliate: {affiliate.share_code}</span> : null}
          {fraud ? <span className={`info-badge ${fraud.status === "blocked" ? "warning-badge" : ""}`}>Security: {fraud.status}</span> : null}
        </div>
      </section>

      {actionError ? <div className="error-box top-gap">{actionError}</div> : null}
      {actionMessage ? <div className="success-box top-gap">{actionMessage}</div> : null}

      {activeSection === "overview" ? (
        <>
          <WorkspaceQuickLinks
            title="Open the right user tool faster"
            subtitle="Each important user action now has its own menu path, so you can jump straight to the area you need without working through one long page."
            items={[
              { label: "Discover venues", description: "Browse nearby offers and venue matches", to: "/user/venues" },
              { label: "Affiliate hub", description: "Open your invite link, referrals, and earnings", to: "/user/affiliate" },
              { label: "Payouts", description: "Manage Stripe Connect onboarding and payout runs", to: "/user/payouts" },
              { label: "Promo profile", description: "Set Uber and Uber Eats eligibility", to: "/user/promo-profile" },
              { label: "Voucher upgrades", description: "Track BNPL checkout and larger voucher upgrades", to: "/user/upgrades" },
              { label: "Security", description: "Review fraud checks and account protection", to: "/user/security" },
              { label: "Voucher history", description: "See recent issued and redeemed vouchers", to: "/user/history" },
            ]}
          />

          <section className="card-grid three">
            <article className="card stat-card">
              <h3>Total vouchers</h3>
              <strong>{dashboard?.stats.total_vouchers ?? 0}</strong>
            </article>
            <article className="card stat-card">
              <h3>Issued</h3>
              <strong>{dashboard?.stats.issued_vouchers ?? 0}</strong>
            </article>
            <article className="card stat-card">
              <h3>Redeemed</h3>
              <strong>{dashboard?.stats.redeemed_vouchers ?? 0}</strong>
            </article>
          </section>

          <section className="card">
            <div className="split-card-header">
              <div>
                <h2>Live assistant flow</h2>
                <p className="muted">Use the TALK to CAS widget on the welcome page to choose Going Out or Food, then enter your postcode or share GPS.</p>
              </div>
              <Link to="/welcome" className="primary-button link-button">Open assistant</Link>
            </div>
          </section>

          <section className="card">
            <h2>Recent vouchers</h2>
            <div className="list">
              {dashboard?.recent_vouchers?.map((voucher) => (
                <div key={voucher.id} className="voucher-row">
                  <div>
                    <strong>{voucher.code}</strong>
                    <p>
                      {voucher.venue?.name ?? "Venue pending"} · £{voucher.voucher_value} · {voucher.status}
                    </p>
                  </div>
                  <span className={`status ${voucher.status}`}>{voucher.status}</span>
                </div>
              ))}

              {!dashboard?.recent_vouchers?.length ? <p className="muted">No vouchers yet.</p> : null}
            </div>
          </section>
        </>
      ) : null}

      {activeSection === "payouts" ? (
        <section className="card">
          <div className="split-card-header">
            <div>
              <h2>Affiliate payout profile</h2>
              <p className="muted">Manage your Stripe Connect payout destination for weekly affiliate payouts. Save the payout details, complete onboarding, create payout runs, and use localhost simulation while live webhook settlement is being tested.</p>
            </div>
            <div className="badge-row compact-badges">
              <span className="info-badge">Status: {payoutProfile?.onboarding_status || "not_started"}</span>
              <span className="info-badge">Health: {payoutProfile?.payout_health?.label || "Setup required"}</span>
              <span className="info-badge">Ready £{payoutProfile?.summary?.ready_total ?? "0.00"}</span>
              <span className="info-badge">Webhook: {payoutProfile?.webhook_ready ? "ready" : "disabled"}</span>
            </div>
          </div>

          <div className="card-grid three top-gap">
            <article className="card stat-card">
              <h3>Payout email</h3>
              <strong>{payoutProfile?.payout_email || dashboard?.user.email || "Not set"}</strong>
              <div className="action-row wrap-actions compact-actions top-gap">
                <button
                  className="secondary-button small"
                  disabled={savingPayoutProfile}
                  onClick={() =>
                    void savePayoutProfile({
                      payout_email: dashboard?.user.email || payoutProfile?.payout_email || null,
                      country_code: payoutProfile?.country_code || "GB",
                      currency: payoutProfile?.currency || "GBP",
                    })
                  }
                >
                  {savingPayoutProfile ? "Saving..." : "Use account email"}
                </button>
              </div>
            </article>
            <article className="card stat-card">
              <h3>This week</h3>
              <strong>£{payoutProfile?.summary?.latest_week_total ?? "0.00"}</strong>
              <p className="muted top-gap">{payoutProfile?.summary?.latest_week_events ?? 0} commission events</p>
            </article>
            <article className="card stat-card">
              <h3>Average event</h3>
              <strong>£{payoutProfile?.summary?.average_commission ?? "0.00"}</strong>
              <p className="muted top-gap">Paid total £{payoutProfile?.summary?.paid_total ?? "0.00"}</p>
            </article>
          </div>

          <div className="badge-row compact-badges top-gap">
            <span className="info-badge">Country: {payoutProfile?.country_code || "GB"}</span>
            <span className="info-badge">Currency: {payoutProfile?.currency || "GBP"}</span>
            <span className="info-badge">Charges: {payoutProfile?.charges_enabled ? "enabled" : "pending"}</span>
            <span className="info-badge">Payouts: {payoutProfile?.payouts_enabled ? "enabled" : "pending"}</span>
            <span className="info-badge">Runs: {payoutProfile?.summary?.processing_runs ?? 0} processing / {payoutProfile?.summary?.paid_runs ?? 0} paid</span>
            <span className="info-badge">Last paid: {formatDateTime(payoutProfile?.summary?.latest_paid_at)}</span>
          </div>

          <div className="info-box top-gap">
            <strong>{payoutProfile?.payout_health?.label || "Payout status"}</strong>
            <p>{payoutProfile?.payout_health?.next_action || "Complete payout setup, then create payout runs as commission events become ready."}</p>
          </div>

          <div className="action-row wrap-actions top-gap">
            <button className="secondary-button" disabled={savingPayoutProfile} onClick={() => void beginPayoutOnboarding()}>
              {savingPayoutProfile ? "Starting..." : "Start Stripe Connect onboarding"}
            </button>
            <button className="primary-button" disabled={savingPayoutProfile || !payoutProfile?.allow_simulated_success} onClick={() => void approvePayoutOnboarding()}>
              {savingPayoutProfile ? "Confirming..." : "Simulate approval (localhost)"}
            </button>
            <button
              className="secondary-button"
              disabled={payoutRunBusy === "create" || !payoutProfile?.payouts_enabled || (payoutProfile?.summary?.ready_events ?? 0) === 0}
              onClick={() => void createPayoutRunRequest()}
            >
              {payoutRunBusy === "create" ? "Creating payout..." : "Create payout run"}
            </button>
          </div>

          <div className="split-grid top-gap">
            <article className="card">
              <div className="split-card-header">
                <div>
                  <h3>Recent commission events</h3>
                  <p className="muted">Review the latest referral redemptions that are feeding the payout queue.</p>
                </div>
                <div className="badge-row compact-badges">
                  <span className="info-badge">Email alerts: {payoutProfile?.notification_summary?.email_events ?? 0}</span>
                  <span className="info-badge">WhatsApp alerts: {payoutProfile?.notification_summary?.whatsapp_events ?? 0}</span>
                </div>
              </div>
              <div className="list compact-list top-gap">
                {payoutProfile?.recent_commissions?.length ? (
                  payoutProfile.recent_commissions.map((event) => (
                    <div key={event.id} className="list-row align-start">
                      <div>
                        <strong>{event.voucher_code || "Commission event"} · £{event.commission_amount}</strong>
                        <p>{event.referred_user_name || "Referral"} · {event.venue_name || "Venue pending"}</p>
                        <p>{formatDateTime(event.earned_at)}</p>
                      </div>
                      <div className="badge-row compact-badges">
                        <span className="info-badge">{event.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="info-box">
                    <strong>No commission events yet</strong>
                    <p>Once your referred users redeem vouchers, payout-ready commission events will appear here.</p>
                  </div>
                )}
              </div>
            </article>

            <article className="card">
              <div className="split-card-header">
                <div>
                  <h3>Weekly payout reports</h3>
                  <p className="muted">Use this during QA to confirm weekly totals, pending amounts, and paid settlement progress.</p>
                </div>
                <div className="badge-row compact-badges">
                  <span className="info-badge">Ready events: {payoutProfile?.summary?.ready_events ?? 0}</span>
                  <span className="info-badge">Ready total: £{payoutProfile?.summary?.ready_total ?? "0.00"}</span>
                </div>
              </div>
              <div className="list compact-list top-gap">
                {payoutProfile?.weekly_reports?.length ? (
                  payoutProfile.weekly_reports.slice(0, 4).map((report) => (
                    <div key={report.week_start || report.label} className="list-row align-start">
                      <div>
                        <strong>{report.label || `${report.week_start} - ${report.week_end}`}</strong>
                        <p>{report.earned_events ?? 0} events</p>
                      </div>
                      <div className="badge-row compact-badges">
                        <span className="info-badge">Earned £{report.earned_total ?? "0.00"}</span>
                        <span className="info-badge">Pending £{report.pending_total ?? "0.00"}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">Weekly payout reports will appear once commission events start landing.</p>
                )}
              </div>
            </article>
          </div>

          <div className="split-card-header top-gap">
            <div>
              <h3>Recent payout runs</h3>
              <p className="muted">Create a payout run once commission events are ready. Live Stripe settlement can close the run through webhooks, while localhost simulation stays available for testing.</p>
            </div>
            <div className="badge-row compact-badges">
              <span className="info-badge">Ready events: {payoutProfile?.summary?.ready_events ?? 0}</span>
              <span className="info-badge">Ready total: £{payoutProfile?.summary?.ready_total ?? "0.00"}</span>
            </div>
          </div>

          <div className="list compact-list top-gap">
            {payoutProfile?.recent_payouts?.length ? (
              payoutProfile.recent_payouts.map((run) => (
                <div key={run.id} className="list-row align-start">
                  <div>
                    <strong>{run.payout_code} · £{run.total_amount}</strong>
                    <p>{run.commission_event_count} commission events · {run.provider}</p>
                    <p>{formatDateTime(run.created_at)}</p>
                  </div>
                  <div className="badge-row compact-badges">
                    <span className="info-badge">{run.status}</span>
                    {run.status !== "paid" ? (
                      <button
                        className="secondary-button small"
                        disabled={payoutRunBusy === run.payout_code || !payoutProfile?.allow_simulated_success}
                        onClick={() => void settlePayoutRun(run)}
                      >
                        {payoutRunBusy === run.payout_code ? "Processing..." : "Simulate paid (localhost)"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="info-box">
                <strong>No payout runs yet</strong>
                <p>After onboarding is approved and you have ready commission events, create your first payout run here.</p>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeSection === "eligibility" ? (
        <section className="card">
          <div className="split-card-header">
            <div>
              <h2>Promo eligibility profile</h2>
              <p className="muted">Tell CAS whether you already use Uber or Uber Eats. Discovery can then hide new-customer-only codes automatically.</p>
            </div>
            <div className="badge-row compact-badges">
              <span className="info-badge">Updated: {formatDateTime(providerProfile?.updated_at)}</span>
            </div>
          </div>

          <div className="card-grid two top-gap">
            <article className="card stat-card">
              <h3>Uber rides</h3>
              <strong>{providerProfile?.is_uber_existing_customer ? "Existing customer" : "New / unknown"}</strong>
              <div className="badge-row compact-badges top-gap">
                <button
                  className="secondary-button small"
                  onClick={() =>
                    void saveProviderProfile({
                      is_uber_existing_customer: false,
                      is_ubereats_existing_customer: providerProfile?.is_ubereats_existing_customer ?? null,
                    })
                  }
                  disabled={savingProviderProfile}
                >
                  New to Uber
                </button>
                <button
                  className="primary-button small"
                  onClick={() =>
                    void saveProviderProfile({
                      is_uber_existing_customer: true,
                      is_ubereats_existing_customer: providerProfile?.is_ubereats_existing_customer ?? null,
                    })
                  }
                  disabled={savingProviderProfile}
                >
                  Already use Uber
                </button>
              </div>
            </article>

            <article className="card stat-card">
              <h3>Uber Eats</h3>
              <strong>{providerProfile?.is_ubereats_existing_customer ? "Existing customer" : "New / unknown"}</strong>
              <div className="badge-row compact-badges top-gap">
                <button
                  className="secondary-button small"
                  onClick={() =>
                    void saveProviderProfile({
                      is_uber_existing_customer: providerProfile?.is_uber_existing_customer ?? null,
                      is_ubereats_existing_customer: false,
                    })
                  }
                  disabled={savingProviderProfile}
                >
                  New to Uber Eats
                </button>
                <button
                  className="primary-button small"
                  onClick={() =>
                    void saveProviderProfile({
                      is_uber_existing_customer: providerProfile?.is_uber_existing_customer ?? null,
                      is_ubereats_existing_customer: true,
                    })
                  }
                  disabled={savingProviderProfile}
                >
                  Already use Uber Eats
                </button>
              </div>
            </article>
          </div>

          <p className="muted top-gap">
            This improves the “live valid promo” logic from the proposal without needing the full external provider integration layer yet.
          </p>
        </section>
      ) : null}

      {activeSection === "security" ? (
        <section className="card">
          <div className="split-card-header">
            <div>
              <h2>Account security</h2>
              <p className="muted">Fraud screening is now active. The system checks device fingerprint reuse and the one-voucher-per-verified-phone 30-day rule.</p>
            </div>
            <div className="badge-row compact-badges">
              <span className="info-badge">Score: {fraud?.score ?? 0}</span>
              <span className="info-badge">Recent signals: {fraud?.recent_signals ?? 0}</span>
            </div>
          </div>

          <div className="marketing-list top-gap">
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>{fraud?.message ?? "Fraud screening is active on this account."}</p>
            </div>
            <div className="marketing-list-item">
              <span className="marketing-dot" />
              <p>Verified phone rule window: {fraud?.phone_rule_window_days ?? 30} days.</p>
            </div>
            {fraud?.blocked_until ? (
              <div className="marketing-list-item">
                <span className="marketing-dot" />
                <p>Blocked until: {formatDateTime(fraud.blocked_until)}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {activeSection === "affiliate" ? (
        <>
          <section className="card">
            <div className="split-card-header">
              <div>
                <span className="eyebrow">Affiliate foundation</span>
                <h2>Your referral link</h2>
                <p className="muted">
                  Share your invite link. Signups and voucher activity inside the {affiliate?.attribution_days ?? 30}-day attribution window are tracked here.
                </p>
              </div>
              <div className="badge-row compact-badges">
                <button className="primary-button small" onClick={() => void copyInviteLink()} disabled={!affiliate?.invite_url}>
                  Copy invite link
                </button>
                <button className="secondary-button small" onClick={() => void triggerAffiliateAlertTest()} disabled={sendingAffiliateAlert}>
                  {sendingAffiliateAlert ? "Sending..." : "Send test alert"}
                </button>
                {affiliate?.invite_url ? (
                  <a href={affiliate.invite_url} target="_blank" rel="noreferrer" className="secondary-button small link-button">
                    Open invite page
                  </a>
                ) : null}
              </div>
            </div>

            {copyMessage ? <p className="wa-helper-inline">{copyMessage}</p> : null}

            <div className="badge-row top-gap">
              <span className="info-badge">Code: {affiliate?.share_code ?? "Loading..."}</span>
              <span className="info-badge">Estimated earnings: £{affiliate?.estimated_earnings ?? "0.00"}</span>
              <span className="info-badge">Rate per redeemed voucher: £{affiliate?.commission_per_redeemed_voucher ?? "0.00"}</span>
              <span className="info-badge">Last shared: {formatDateTime(affiliate?.last_shared_at)}</span>
            </div>

            <div className="card-grid two top-gap">
              {referralSummary.map((item) => (
                <article key={item.label} className="card stat-card">
                  <h3>{item.label}</h3>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>

            <div className="badge-row compact-badges top-gap">
              <span className="info-badge">Clicks → signups: {formatPercent(affiliate?.conversion_rates?.click_to_signup)}</span>
              <span className="info-badge">Signups → issued: {formatPercent(affiliate?.conversion_rates?.signup_to_issued)}</span>
              <span className="info-badge">Signups → redeemed: {formatPercent(affiliate?.conversion_rates?.signup_to_redeemed)}</span>
              <span className="info-badge">Active attribution: {affiliate?.active_attribution_signups ?? 0}</span>
              <span className="info-badge">Last 7 days: {affiliate?.recent_signups_last_7_days ?? 0}</span>
            </div>

            <div className="split-grid top-gap">
              <article className="card" style={{ display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0 }}>Affiliate QR code</h3>
                <p className="muted" style={{ margin: 0 }}>
                  Scan this from another device or save it into printed flyers and creator packs.
                </p>
                {affiliate?.qr_image_url ? (
                  <img
                    src={affiliate.qr_image_url}
                    alt="Affiliate QR code"
                    style={{ width: 220, maxWidth: "100%", borderRadius: 18, border: "1px solid var(--border-input)", background: "#fff", padding: 10 }}
                  />
                ) : (
                  <div className="muted">QR preview will appear when the affiliate share payload is ready.</div>
                )}
              </article>

              <article className="card" style={{ display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0 }}>Share actions</h3>
                <p className="muted" style={{ margin: 0 }}>
                  Open the invite directly in WhatsApp, email, X, Facebook, Telegram, or LinkedIn, or copy the prepared share message first.
                </p>
                <div className="action-row" style={{ flexWrap: "wrap" }}>
                  {affiliate?.share_actions?.whatsapp ? (
                    <a href={affiliate.share_actions.whatsapp} target="_blank" rel="noreferrer" className="secondary-button small link-button">WhatsApp</a>
                  ) : null}
                  {affiliate?.share_actions?.email ? (
                    <a href={affiliate.share_actions.email} className="secondary-button small link-button">Email</a>
                  ) : null}
                  {affiliate?.share_actions?.x ? (
                    <a href={affiliate.share_actions.x} target="_blank" rel="noreferrer" className="secondary-button small link-button">X</a>
                  ) : null}
                  {affiliate?.share_actions?.facebook ? (
                    <a href={affiliate.share_actions.facebook} target="_blank" rel="noreferrer" className="secondary-button small link-button">Facebook</a>
                  ) : null}
                  {affiliate?.share_actions?.telegram ? (
                    <a href={affiliate.share_actions.telegram} target="_blank" rel="noreferrer" className="secondary-button small link-button">Telegram</a>
                  ) : null}
                  {affiliate?.share_actions?.linkedin ? (
                    <a href={affiliate.share_actions.linkedin} target="_blank" rel="noreferrer" className="secondary-button small link-button">LinkedIn</a>
                  ) : null}
                  <button className="primary-button small" onClick={() => void copyShareMessage()} disabled={!affiliate?.share_message}>
                    Copy share message
                  </button>
                </div>
                {affiliate?.share_message ? (
                  <div className="card" style={{ padding: 14, background: "rgba(255,255,255,0.04)" }}>
                    <strong style={{ display: "block", marginBottom: 6 }}>Prepared share text</strong>
                    <p className="muted" style={{ margin: 0 }}>{affiliate.share_message}</p>
                  </div>
                ) : null}
              </article>
            </div>
          </section>

          <div className="split-grid">
            <article className="card">
              <div className="split-card-header">
                <div>
                  <h2>Recent referral signups</h2>
                  <p className="muted">Use this list during final QA to confirm attribution windows and referral-to-voucher flow continuity.</p>
                </div>
                <div className="badge-row compact-badges">
                  <span className="info-badge">Email alerts: {affiliateReports?.notification_summary?.email_events ?? 0}</span>
                  <span className="info-badge">WhatsApp alerts: {affiliateReports?.notification_summary?.whatsapp_events ?? 0}</span>
                </div>
              </div>
              <div className="list top-gap">
                {affiliate?.recent_referrals?.map((referral) => (
                  <div key={referral.id} className="voucher-row">
                    <div>
                      <strong>{referral.user?.name || "New signup"}</strong>
                      <p>
                        Joined {formatDateTime(referral.signed_up_at)} · Issued {referral.issued_vouchers} · Redeemed {referral.redeemed_vouchers}
                      </p>
                    </div>
                    <span className={`status ${referral.status}`}>{referral.status}</span>
                  </div>
                ))}

                {!affiliate?.recent_referrals?.length ? (
                  <p className="muted">No referred signups yet.</p>
                ) : null}
              </div>
            </article>

            <article className="card">
              <div className="split-card-header">
                <div>
                  <h2>Commission activity</h2>
                  <p className="muted">This mirrors the payout queue so you can spot missing notifications or unexpected status transitions early.</p>
                </div>
                <div className="badge-row compact-badges">
                  <span className="info-badge">Pending £{affiliateReports?.summary?.pending_total ?? "0.00"}</span>
                  <span className="info-badge">Paid £{affiliateReports?.summary?.paid_total ?? "0.00"}</span>
                </div>
              </div>
              <div className="list compact-list top-gap">
                {affiliateReports?.recent_events?.length ? (
                  affiliateReports.recent_events.map((event) => (
                    <div key={event.id} className="list-row align-start">
                      <div>
                        <strong>{event.voucher?.code || event.metadata?.voucher_code || "Commission event"} · £{event.commission_amount}</strong>
                        <p>{event.referred_user?.name || event.metadata?.referred_user_name || "Referral"} · {event.metadata?.venue_name || "Venue pending"}</p>
                        <p>{formatDateTime(event.earned_at)}</p>
                      </div>
                      <div className="badge-row compact-badges">
                        <span className="info-badge">{event.status}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">No commission activity yet.</p>
                )}
              </div>
            </article>
          </div>

          <section className="card">
            <div className="split-card-header">
              <div>
                <h2>Weekly affiliate reports</h2>
                <p className="muted">Final QA should verify weekly event counts against payout-ready totals and notification delivery.</p>
              </div>
              <div className="badge-row compact-badges">
                <span className="info-badge">Average £{affiliateReports?.summary?.average_commission ?? "0.00"}</span>
                <span className="info-badge">Last notified: {formatDateTime(affiliateReports?.notification_summary?.last_notified_at)}</span>
              </div>
            </div>
            <div className="list compact-list top-gap">
              {affiliateReports?.weekly_reports?.length ? (
                affiliateReports.weekly_reports.slice(0, 4).map((report) => (
                  <div key={report.week_start || report.label} className="list-row align-start">
                    <div>
                      <strong>{report.label || `${report.week_start} - ${report.week_end}`}</strong>
                      <p>{report.earned_events ?? 0} earned events</p>
                    </div>
                    <div className="badge-row compact-badges">
                      <span className="info-badge">Earned £{report.earned_total ?? "0.00"}</span>
                      <span className="info-badge">Pending £{report.pending_total ?? "0.00"}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">Weekly reports will appear after the first commission events are created.</p>
              )}
            </div>
          </section>
        </>
      ) : null}

      {activeSection === "upgrades" ? (
        <section className="split-grid">
          <article className="card">
            <div className="split-card-header">
              <div>
                <span className="eyebrow">BNPL checkout</span>
                <h2>Voucher upgrades</h2>
                <p className="muted">Start a bigger voucher upgrade from here or from the WhatsApp flow. Orders stay pending until payment confirmation is received through Stripe webhook settlement or localhost simulation.</p>
              </div>
              <Link to="/voucher-upgrade" className="primary-button link-button">Open voucher upgrade</Link>
            </div>

            <div className="list top-gap">
              {dashboard?.recent_bnpl_orders?.map((order) => (
                <div key={order.id} className="voucher-row">
                  <div>
                    <strong>{order.plan_name} · £{order.amount_gbp}</strong>
                    <p>
                      {order.checkout_code} · Payment {order.payment_status} · Voucher {order.voucher_status}
                    </p>
                  </div>
                  <Link className="secondary-button small link-button" to={`/voucher-upgrade/${order.checkout_code}`}>
                    View
                  </Link>
                </div>
              ))}

              {!dashboard?.recent_bnpl_orders?.length ? (
                <p className="muted">No voucher upgrade orders yet.</p>
              ) : null}
            </div>
          </article>

          <article className="card">
            <h2>Upgrade notes</h2>
            <div className="marketing-list top-gap">
              <div className="marketing-list-item">
                <span className="marketing-dot" />
                <p>Available upgrade tiers now match the proposal: £30, £50, £75, and £100.</p>
              </div>
              <div className="marketing-list-item">
                <span className="marketing-dot" />
                <p>Orders receive a unique checkout code plus a checkout handoff URL, ready for hosted payment links and Stripe events.</p>
              </div>
              <div className="marketing-list-item">
                <span className="marketing-dot" />
                <p>Provider-profile settings from this dashboard also improve promo-code matching in the discovery journey.</p>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      {activeSection === "history" ? (
        <section className="card">
          <h2>Recent vouchers</h2>
          <div className="list">
            {dashboard?.recent_vouchers?.map((voucher) => (
              <div key={voucher.id} className="voucher-row">
                <div>
                  <strong>{voucher.code}</strong>
                  <p>
                    {voucher.venue?.name ?? "Venue pending"} · £{voucher.voucher_value} · {voucher.status}
                  </p>
                </div>
                <span className={`status ${voucher.status}`}>{voucher.status}</span>
              </div>
            ))}

            {!dashboard?.recent_vouchers?.length ? <p className="muted">No vouchers yet.</p> : null}
          </div>
        </section>
      ) : null}
    </AppShell>
  );

}