import { Link } from "react-router-dom";
import { Building2, CheckCircle2, MessageCircle, Settings, ShieldAlert, Store, TicketCheck, Users, WalletCards } from "lucide-react";
import type { AdminPayload } from "./types";

interface AdminOverviewPageProps {
  dashboard: AdminPayload | null;
  merchantCount: number;
  venueCount: number;
  voucherCount: number;
  pendingVenueCount: number;
  pendingMerchantCount: number;
  lowBalanceCount: number;
}

function MetricCard({ label, value, icon: Icon, tone = "blue" }: { label: string; value: string | number; icon: any; tone?: "blue" | "green" | "orange" | "purple" }) {
  return (
    <article className={`card admin-metric-card tone-${tone}`}>
      <span><Icon size={22} /></span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export function AdminOverviewPage({
  dashboard,
  merchantCount,
  venueCount,
  voucherCount,
  pendingVenueCount,
  pendingMerchantCount,
  lowBalanceCount,
}: AdminOverviewPageProps) {
  return (
    <>
      <section className="admin-hero-card">
        <div>
          <span className="eyebrow">Operations overview</span>
          <h2>Everything important in one admin command center</h2>
          <p className="muted">
            Use the main menus to manage merchants, venues, vouchers, users, and settings without mixing workflows together.
          </p>
        </div>
        <div className="admin-hero-actions">
          <Link className="primary-button link-button" to="/admin/venues/approvals">Review venue approvals</Link>
          <Link className="secondary-button link-button" to="/admin/vouchers/download">Download voucher rows</Link>
        </div>
      </section>

      <section className="card-grid four">
        <MetricCard label="Merchants" value={dashboard?.stats.total_merchants ?? merchantCount} icon={Store} tone="blue" />
        <MetricCard label="Venues" value={dashboard?.stats.total_venues ?? venueCount} icon={Building2} tone="purple" />
        <MetricCard label="Issued vouchers" value={dashboard?.stats.issued_vouchers ?? voucherCount} icon={TicketCheck} tone="green" />
        <MetricCard label="Users" value={dashboard?.stats.total_users ?? 0} icon={Users} tone="orange" />
      </section>

      <section className="admin-workspace-grid">
        <Link className="card admin-workspace-card" to="/admin/merchants/pending">
          <span className="admin-workspace-icon"><ShieldAlert size={24} /></span>
          <div>
            <strong>Merchant approvals</strong>
            <p className="muted">{pendingMerchantCount} merchants need accept/reject review.</p>
          </div>
        </Link>
        <Link className="card admin-workspace-card" to="/admin/venues/approvals">
          <span className="admin-workspace-icon"><CheckCircle2 size={24} /></span>
          <div>
            <strong>Venue approvals</strong>
            <p className="muted">{pendingVenueCount} venues need a 6-character reference code.</p>
          </div>
        </Link>
        <Link className="card admin-workspace-card" to="/admin/merchants/finance">
          <span className="admin-workspace-icon"><WalletCards size={24} /></span>
          <div>
            <strong>Finance checks</strong>
            <p className="muted">{lowBalanceCount} low-balance merchants need attention.</p>
          </div>
        </Link>
        <Link className="card admin-workspace-card" to="/admin/settings/whatsapp">
          <span className="admin-workspace-icon"><MessageCircle size={24} /></span>
          <div>
            <strong>WhatsApp templates</strong>
            <p className="muted">Manage delivery templates and approval rollout.</p>
          </div>
        </Link>
        <Link className="card admin-workspace-card" to="/admin/settings/integrations">
          <span className="admin-workspace-icon"><Settings size={24} /></span>
          <div>
            <strong>System settings</strong>
            <p className="muted">Information, integrations, and operational configuration.</p>
          </div>
        </Link>
      </section>
    </>
  );
}
