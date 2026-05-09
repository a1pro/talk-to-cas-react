import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";
import type { WhatsAppAdminPayload, WhatsAppTemplateRecord } from "@/types";
import type { AdminPayload, AdminSection, TemplateFormState } from "./types";

interface AdminUsersPageProps {
  activeSection: AdminSection;
  dashboard: AdminPayload | null;
  fraudDashboard: any;
  whatsAppDashboard: WhatsAppAdminPayload | null;
  templateForm: TemplateFormState;
  templateNote: string;
  editingTemplateId: number | null;
  busy: string | null;
  setTemplateForm: Dispatch<SetStateAction<TemplateFormState>>;
  setTemplateNote: Dispatch<SetStateAction<string>>;
  resetTemplateForm: () => void;
  applyTemplateToForm: (template: WhatsAppTemplateRecord) => void;
  saveWhatsAppTemplate: () => Promise<void>;
  installStarterPack: (overwriteExisting?: boolean) => Promise<void>;
  submitTemplateForApproval: (templateId: number) => Promise<void>;
  simulateTemplateDecision: (templateId: number, approvalStatus: "approved" | "rejected") => Promise<void>;
  markUserReviewed: (userId: number) => Promise<void>;
  blockUserAccount: (userId: number) => Promise<void>;
  unblockUserAccount: (userId: number) => Promise<void>;
  formatDateTime: (value?: string | null) => string;
}

export function AdminUsersPage({
  activeSection,
  dashboard,
  fraudDashboard,
  whatsAppDashboard,
  templateForm,
  templateNote,
  editingTemplateId,
  busy,
  setTemplateForm,
  setTemplateNote,
  resetTemplateForm,
  applyTemplateToForm,
  saveWhatsAppTemplate,
  installStarterPack,
  submitTemplateForApproval,
  simulateTemplateDecision,
  markUserReviewed,
  blockUserAccount,
  unblockUserAccount,
  formatDateTime,
}: AdminUsersPageProps) {
  return (
    <>
      {activeSection === "users" ? (
        <>
          <section className="card-grid four">
            <article className="card stat-card"><h3>Total users</h3><strong>{dashboard?.stats.total_users ?? 0}</strong></article>
            <article className="card stat-card"><h3>Flagged users</h3><strong>{fraudDashboard?.summary?.flagged_users ?? dashboard?.stats?.flagged_users ?? 0}</strong></article>
            <article className="card stat-card"><h3>Blocked users</h3><strong>{fraudDashboard?.summary?.blocked_users ?? dashboard?.stats?.blocked_users ?? 0}</strong></article>
            <article className="card stat-card"><h3>Pending review</h3><strong>{fraudDashboard?.summary?.pending_review_users ?? 0}</strong></article>
          </section>

          <div className="split-grid">
            <section className="card">
              <span className="eyebrow">Fraud and risk queue</span>
              <h2 style={{ marginBottom: 8 }}>Users needing admin attention</h2>
              <p className="muted" style={{ marginBottom: 16 }}>
                This keeps the user review flow available in Batch 2 instead of hiding it behind the simplified menu.
              </p>
              <div className="list compact-list">
                {(fraudDashboard?.users || []).length ? (fraudDashboard?.users || []).map((user: any) => (
                  <div key={user.id} className="voucher-row admin-user-row" style={{ alignItems: "flex-start" }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <strong>{user.name}</strong>
                      <span className="muted">{user.email || "No email"}{user.phone ? ` · ${user.phone}` : ""}</span>
                      <span className="muted">Score: {user.fraud_score ?? 0} · Recent signals: {user.recent_signal_count ?? 0} · Vouchers: {user.voucher_count ?? 0}</span>
                      {user.fraud_blocked_until ? <span className="muted">Blocked until {formatDateTime(user.fraud_blocked_until)}</span> : null}
                    </div>
                    <div style={{ display: "grid", gap: 10, minWidth: 230 }}>
                      <span className="status live">{user.fraud_status || "clear"}</span>
                      <button className="secondary-button small" onClick={() => void markUserReviewed(user.id)} disabled={busy === `fraud-review-${user.id}`}>
                        {busy === `fraud-review-${user.id}` ? "Saving..." : "Mark reviewed"}
                      </button>
                      {user.fraud_status === "blocked" ? (
                        <button className="primary-button small" onClick={() => void unblockUserAccount(user.id)} disabled={busy === `fraud-unblock-${user.id}`}>
                          {busy === `fraud-unblock-${user.id}` ? "Saving..." : "Unblock"}
                        </button>
                      ) : (
                        <button className="primary-button small" onClick={() => void blockUserAccount(user.id)} disabled={busy === `fraud-block-${user.id}`}>
                          {busy === `fraud-block-${user.id}` ? "Saving..." : "Block 30 days"}
                        </button>
                      )}
                    </div>
                  </div>
                )) : <p className="muted">No users currently need review.</p>}
              </div>
            </section>

            <section className="card">
              <span className="eyebrow">Messaging rollout</span>
              <h2 style={{ marginBottom: 8 }}>WhatsApp delivery readiness</h2>
              <div className="badge-row compact-badges" style={{ marginBottom: 16 }}>
                <span className="info-badge">Approved: {whatsAppDashboard?.summary?.approved_templates ?? dashboard?.whatsapp_templates?.summary?.approved_templates ?? 0}</span>
                <span className="info-badge">Pending: {whatsAppDashboard?.summary?.pending_templates ?? dashboard?.whatsapp_templates?.summary?.pending_templates ?? 0}</span>
                <span className="info-badge">Active: {whatsAppDashboard?.summary?.active_templates ?? dashboard?.whatsapp_templates?.summary?.active_templates ?? 0}</span>
              </div>
              <div className="list compact-list">
                {(dashboard?.whatsapp_templates?.preview || []).length ? (dashboard?.whatsapp_templates?.preview || []).map((item) => (
                  <div key={`${item.id || item.key}`} className="list-row align-start">
                    <div>
                      <strong>{item.key || "template"}</strong>
                      <p>{item.journey_type || "general"}</p>
                    </div>
                  </div>
                )) : <p className="muted">No approved template previews yet.</p>}
              </div>
              <div className="action-row" style={{ marginTop: 16 }}>
                <Link className="primary-button link-button" to="/admin/users/whatsapp">Open WhatsApp rollout</Link>
              </div>
            </section>
          </div>
        </>
      ) : null}

      <div className="split-grid" style={{ display: activeSection === "users-whatsapp" ? undefined : "none" }}>
        <section className="card">
          <span className="eyebrow">WhatsApp rollout</span>
          <h2 style={{ marginBottom: 8 }}>Outbound template readiness</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            Install the starter pack, edit message copy, then submit templates for approval so voucher delivery and alert flows are ready for rollout.
          </p>

          <div className="badge-row" style={{ marginBottom: 16 }}>
            <span className="info-badge">Provider: {whatsAppDashboard?.provider?.provider || dashboard?.whatsapp_templates?.provider?.provider || "360dialog"}</span>
            <span className="info-badge">Approved: {whatsAppDashboard?.summary?.approved_templates ?? dashboard?.whatsapp_templates?.summary?.approved_templates ?? 0}</span>
            <span className="info-badge">Pending: {whatsAppDashboard?.summary?.pending_templates ?? dashboard?.whatsapp_templates?.summary?.pending_templates ?? 0}</span>
            <span className="info-badge">Active: {whatsAppDashboard?.summary?.active_templates ?? dashboard?.whatsapp_templates?.summary?.active_templates ?? 0}</span>
          </div>

          <p className="muted" style={{ marginBottom: 16 }}>
            {whatsAppDashboard?.provider?.phase_message || dashboard?.whatsapp_templates?.provider?.phase_message || "Create and approve WhatsApp templates before full rollout."}
          </p>

          <div className="action-row" style={{ marginBottom: 16 }}>
            <button className="primary-button" onClick={() => void installStarterPack(false)} disabled={busy === "template-starter" || busy === "template-starter-overwrite"}>
              {busy === "template-starter" ? "Applying..." : "Install starter pack"}
            </button>
            <button className="secondary-button" onClick={() => void installStarterPack(true)} disabled={busy === "template-starter" || busy === "template-starter-overwrite"}>
              {busy === "template-starter-overwrite" ? "Updating..." : "Overwrite starter pack"}
            </button>
            <button className="secondary-button" onClick={() => resetTemplateForm()}>
              New custom template
            </button>
          </div>

          <div className="form-grid">
            <label>
              Template key
              <input value={templateForm.key} onChange={(event) => setTemplateForm((current) => ({ ...current, key: event.target.value }))} placeholder="voucher_delivery_ride" />
            </label>
            <label>
              Channel
              <input value={templateForm.channel} onChange={(event) => setTemplateForm((current) => ({ ...current, channel: event.target.value }))} placeholder="whatsapp" />
            </label>
            <label>
              Journey type
              <input value={templateForm.journey_type} onChange={(event) => setTemplateForm((current) => ({ ...current, journey_type: event.target.value }))} placeholder="going_out" />
            </label>
            <label>
              Weather condition
              <input value={templateForm.weather_condition} onChange={(event) => setTemplateForm((current) => ({ ...current, weather_condition: event.target.value }))} placeholder="rain" />
            </label>
            <label>
              Emoji
              <input value={templateForm.emoji} onChange={(event) => setTemplateForm((current) => ({ ...current, emoji: event.target.value }))} placeholder="🚕" />
            </label>
            <label>
              Category
              <input value={templateForm.category} onChange={(event) => setTemplateForm((current) => ({ ...current, category: event.target.value }))} placeholder="utility" />
            </label>
            <label>
              Language
              <input value={templateForm.language} onChange={(event) => setTemplateForm((current) => ({ ...current, language: event.target.value }))} placeholder="en_GB" />
            </label>
            <label>
              Sort order
              <input value={templateForm.sort_order} onChange={(event) => setTemplateForm((current) => ({ ...current, sort_order: event.target.value }))} placeholder="10" />
            </label>
            <label style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 28 }}>
              <input type="checkbox" checked={templateForm.is_active} onChange={(event) => setTemplateForm((current) => ({ ...current, is_active: event.target.checked }))} />
              Active template
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Approval notes (used when simulating approve/reject)
              <input value={templateNote} onChange={(event) => setTemplateNote(event.target.value)} placeholder="Optional note for simulated approval or rejection" />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Message body
              <textarea
                value={templateForm.body}
                onChange={(event) => setTemplateForm((current) => ({ ...current, body: event.target.value }))}
                rows={5}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 12, background: "var(--bg-input)", color: "var(--text-secondary)", border: "1px solid var(--border-input)", resize: "vertical" }}
              />
            </label>
          </div>

          <div className="action-row" style={{ marginTop: 16 }}>
            <button className="primary-button" onClick={() => void saveWhatsAppTemplate()} disabled={busy === "template-create" || (editingTemplateId !== null && busy === `template-update-${editingTemplateId}`)}>
              {editingTemplateId !== null
                ? busy === `template-update-${editingTemplateId}` ? "Updating..." : "Update template"
                : busy === "template-create" ? "Creating..." : "Create template"}
            </button>
            {editingTemplateId !== null ? (
              <button className="secondary-button" onClick={() => resetTemplateForm()}>
                Cancel edit
              </button>
            ) : null}
          </div>
        </section>

        <section className="card">
          <span className="eyebrow">Launch preview</span>
          <h2 style={{ marginBottom: 8 }}>Approved template preview</h2>
          <div className="badge-row" style={{ marginBottom: 16 }}>
            <span className="info-badge">Phone: {whatsAppDashboard?.provider?.display_phone_number || dashboard?.whatsapp_templates?.provider?.display_phone_number || "Not set"}</span>
            <span className="info-badge">Approval rate: {whatsAppDashboard?.provider?.counts?.approval_completion_rate ?? dashboard?.whatsapp_templates?.provider?.counts?.approval_completion_rate ?? 0}%</span>
          </div>

          <div className="list">
            {(dashboard?.whatsapp_templates?.preview || []).length ? (dashboard?.whatsapp_templates?.preview || []).map((item) => (
              <div key={item.id || item.key} className="voucher-row" style={{ alignItems: "flex-start" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <strong>{item.key || `Template ${item.id}`}</strong>
                  <span className="muted">{item.journey_type || "general"}</span>
                  <span>{item.body || "-"}</span>
                </div>
              </div>
            )) : (
              <p className="muted">No approved templates yet. Install the starter pack and approve a few templates to see the rollout preview.</p>
            )}
          </div>
        </section>
      </div>

      <section className="card" style={{ display: activeSection === "users-whatsapp" ? undefined : "none" }}>
        <span className="eyebrow">Template queue</span>
        <h2 style={{ marginBottom: 8 }}>Manage WhatsApp templates</h2>
        <div className="list">
          {(whatsAppDashboard?.templates || []).length ? (whatsAppDashboard?.templates || []).map((template) => (
            <div key={template.id} className="voucher-row" style={{ alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6, flex: 1 }}>
                <strong>{template.emoji ? `${template.emoji} ` : ""}{template.key || `Template ${template.id}`}</strong>
                <span className="muted">{template.channel || "whatsapp"} · {template.journey_type || "general"} · {template.category || "marketing"}</span>
                <span>{template.body || "-"}</span>
                <div className="badge-row">
                  <span className="info-badge">Status: {template.approval_status || template.status || "draft"}</span>
                  <span className="info-badge">Sort: {template.sort_order ?? 0}</span>
                  <span className="info-badge">{template.is_active ? "Active" : "Inactive"}</span>
                  {template.provider_template_name ? <span className="info-badge">{template.provider_template_name}</span> : null}
                </div>
                {template.approval_notes ? <span className="muted">Notes: {template.approval_notes}</span> : null}
                <span className="muted">Updated: {formatDateTime(template.updated_at)}</span>
              </div>
              <div style={{ display: "grid", gap: 10, minWidth: 220 }}>
                <button className="secondary-button small" onClick={() => applyTemplateToForm(template)}>
                  Edit
                </button>
                <button className="primary-button small" onClick={() => void submitTemplateForApproval(template.id)} disabled={busy === `template-submit-${template.id}` || !template.body}>
                  {busy === `template-submit-${template.id}` ? "Submitting..." : "Submit for approval"}
                </button>
                <button className="secondary-button small" onClick={() => void simulateTemplateDecision(template.id, "approved")} disabled={busy === `template-approved-${template.id}` || !(whatsAppDashboard?.provider?.allow_simulated_approval ?? true)}>
                  {busy === `template-approved-${template.id}` ? "Approving..." : "Simulate approve"}
                </button>
                <button className="secondary-button small" onClick={() => void simulateTemplateDecision(template.id, "rejected")} disabled={busy === `template-rejected-${template.id}` || !(whatsAppDashboard?.provider?.allow_simulated_approval ?? true)}>
                  {busy === `template-rejected-${template.id}` ? "Rejecting..." : "Simulate reject"}
                </button>
              </div>
            </div>
          )) : <p className="muted">No WhatsApp templates found yet.</p>}
        </div>
      </section>
    </>
  );
}
