import { Link } from "react-router-dom";
import type { ProviderVoucherLinkRecord } from "@/types";
import { VoucherRecordsList } from "./VoucherRecordsList";
 
interface VoucherWorkspaceHeaderProps {
  mode: "records" | "create" | "upload" | "download";
  total: number;
  active: number;
  inCirculation: number;
  providerLinks?: ProviderVoucherLinkRecord[]; // made optional for safety
  circulationModeLabel: (mode?: string | null) => string;
}
 
export function VoucherWorkspaceHeader({ mode, total, active, inCirculation, providerLinks, circulationModeLabel }: VoucherWorkspaceHeaderProps) {
  return (
    <>
    {/* <div className="split-grid"> */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <span className="eyebrow">Voucher workspace</span>
            <h2 style={{ marginBottom: 8 }}>
              {mode === "create" ? "Create voucher link" : mode === "upload" ? "Upload voucher links" : mode === "download" ? "Download voucher exports" : "Voucher link records"}
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              {mode === "create"
                ? "Manual entry keeps exact provider HTML links, venue selection, and start / end dates together in one place."
                : mode === "upload"
                  ? "Upload provider CSV / XLSX batches and match them back to venues using the 6 character reference code."
                  : mode === "download"
                    ? "Download approved venue rows for Uber Business, the upload template, and Drive-ready provider link exports."
                    : "Review, edit, deactivate, or delete stored provider links without mixing the screen with create and upload controls."}
            </p>
          </div>
 
          <div className="badge-row compact-badges">
            <span className="info-badge">Stored: {total}</span>
            <span className="info-badge">Active: {active}</span>
            <span className="info-badge">In circulation: {inCirculation}</span>
          </div>
        </div>
 
        <div className="action-row" style={{ marginTop: 16, flexWrap: "wrap" }}>
          <Link className={`secondary-button link-button ${mode === "records" ? "active" : ""}`} to="/admin/vouchers">Records</Link>
          <Link className={`secondary-button link-button ${mode === "create" ? "active" : ""}`} to="/admin/vouchers/create">Create</Link>
          <Link className={`secondary-button link-button ${mode === "upload" ? "active" : ""}`} to="/admin/vouchers/upload">Upload</Link>
          <Link className={`secondary-button link-button ${mode === "download" ? "active" : ""}`} to="/admin/vouchers/download">Download</Link>
          <Link className="secondary-button link-button" to="/admin/vouchers/integrations">Integrations</Link>
        </div>
      </div>
 
      {/* <section className="card">
        <span className="eyebrow">Recent link records</span>
        <h2 style={{ marginBottom: 8 }}>Latest saved records</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Recent records stay visible here for checking while manual links are being created.
        </p>
        <VoucherRecordsList
          records={providerLinks || []}
          circulationModeLabel={circulationModeLabel}
          compact
          limit={8}
        />
      </section> */}
      {/* </div> */}
    </>
  )
}