import { Link } from "react-router-dom";
import { FileCog, Info, MessageCircle, Settings } from "lucide-react";
import type { AdminPayload } from "./types";

export function AdminSettingsPage({ dashboard }: { dashboard: AdminPayload | null }) {
  return (
    <>
      <section className="admin-hero-card compact">
        <div>
          <span className="eyebrow">Admin settings</span>
          <h2>System settings and operational tools</h2>
          <p className="muted">Keep configuration screens separate from day-to-day merchant, venue, and voucher management.</p>
        </div>
        <span className="info-badge"><Settings size={16} /> Admin only</span>
      </section>

      <section className="admin-workspace-grid">
        <Link className="card admin-workspace-card" to="/admin/information">
          <span className="admin-workspace-icon"><Info size={24} /></span>
          <div>
            <strong>Venue information settings</strong>
            <p className="muted">Create, update, approve, publish, reject, export, or delete information records.</p>
          </div>
        </Link>
        <Link className="card admin-workspace-card" to="/admin/settings/whatsapp">
          <span className="admin-workspace-icon"><MessageCircle size={24} /></span>
          <div>
            <strong>WhatsApp templates</strong>
            <p className="muted">Create, edit, submit, simulate approval, and manage delivery templates.</p>
          </div>
        </Link>
        <Link className="card admin-workspace-card" to="/admin/settings/integrations">
          <span className="admin-workspace-icon"><FileCog size={24} /></span>
          <div>
            <strong>Integrations playbook</strong>
            <p className="muted">Webhook URLs, sample payloads, signature headers, and go-live checks.</p>
          </div>
        </Link>
      </section>

      <section className="card">
        <span className="eyebrow">Configuration summary</span>
        <h2>Current system snapshot</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Area</th><th>Current count</th><th>Manage</th></tr></thead>
            <tbody>
              <tr><td>Users</td><td>{dashboard?.stats.total_users ?? 0}</td><td><Link className="secondary-button small link-button" to="/admin/users">Open users</Link></td></tr>
              <tr><td>Merchants</td><td>{dashboard?.stats.total_merchants ?? 0}</td><td><Link className="secondary-button small link-button" to="/admin/merchants">Open merchants</Link></td></tr>
              <tr><td>Venues</td><td>{dashboard?.stats.total_venues ?? 0}</td><td><Link className="secondary-button small link-button" to="/admin/venues">Open venues</Link></td></tr>
              <tr><td>Voucher links</td><td>{dashboard?.provider_voucher_links?.summary?.total ?? 0}</td><td><Link className="secondary-button small link-button" to="/admin/vouchers">Open vouchers</Link></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
