import type { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";
import type { ProviderVoucherCreationExportPayload, ProviderVoucherLinkExportPayload, ProviderVoucherLinkRecord } from "@/types";
import { VoucherExportTools } from "./VoucherExportTools";
import { VoucherRecordsList } from "./VoucherRecordsList";

interface VoucherUploadPanelProps {
  providerLinks: ProviderVoucherLinkRecord[];
  providerLinkExport: ProviderVoucherLinkExportPayload | null;
  voucherCreationExport: ProviderVoucherCreationExportPayload | null;
  uploadFile: File | null;
  busy: string | null;
  setUploadFile: Dispatch<SetStateAction<File | null>>;
  onUploadCsv: () => Promise<void>;
  onDownloadTemplateCsv: () => Promise<void>;
  onCopyGoogleSheetsRows: () => Promise<void>;
  onDownloadDriveReadyCsv: () => Promise<void>;
  onDownloadVenueVoucherCreationCsv: () => Promise<void>;
  formatDateTime: (value?: string | null) => string;
  circulationModeLabel: (mode?: string | null) => string;
}

export function VoucherUploadPanel({
  providerLinks,
  providerLinkExport,
  voucherCreationExport,
  uploadFile,
  busy,
  setUploadFile,
  onUploadCsv,
  onDownloadTemplateCsv,
  onCopyGoogleSheetsRows,
  onDownloadDriveReadyCsv,
  onDownloadVenueVoucherCreationCsv,
  formatDateTime,
  circulationModeLabel,
}: VoucherUploadPanelProps) {
  return (
    <div className="split-grid">
      <section className="card">
        <span className="eyebrow">Batch upload</span>
        <h2 style={{ marginBottom: 8 }}>Upload CSV / XLSX voucher links</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Step 1: download all approved venue voucher rows and create the vouchers in Uber Business using venue_code as the reference. Step 2: upload the Uber export back here so CAS assigns each link to the matching venue.
        </p>

        <div className="badge-row" style={{ marginBottom: 16 }}>
          <span className="info-badge">CSV and XLSX supported</span>
          <span className="info-badge">venue_code reference matching</span>
          <span className="info-badge">value + 6-digit code export</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <VoucherExportTools
            busy={busy}
            onDownloadTemplateCsv={onDownloadTemplateCsv}
            onCopyGoogleSheetsRows={onCopyGoogleSheetsRows}
            onDownloadDriveReadyCsv={onDownloadDriveReadyCsv}
            onDownloadVenueVoucherCreationCsv={onDownloadVenueVoucherCreationCsv}
          />
        </div>

        <div className="card" style={{ padding: 16, background: "rgba(255,255,255,0.04)" }}>
          <strong style={{ display: "block", marginBottom: 6 }}>Upload file</strong>
          <p className="muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Each row can include venue_code / reference / ref. CAS will find the approved venue, infer its merchant, and attach the uploaded voucher link to that venue.
          </p>
          <div className="action-row" style={{ flexWrap: "wrap" }}>
            <input
              type="file"
              accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
            />
            <button className="primary-button" onClick={() => void onUploadCsv()} disabled={busy === "upload-provider-links" || !uploadFile}>
              {busy === "upload-provider-links" ? "Uploading..." : "Upload CSV / XLSX"}
            </button>
          </div>
        </div>

        <div className="action-row" style={{ flexWrap: "wrap", marginTop: 16 }}>
          <Link className="secondary-button link-button" to="/admin/vouchers">View records</Link>
          <Link className="secondary-button link-button" to="/admin/vouchers/create">Open manual create</Link>
        </div>

        {voucherCreationExport ? (
          <div className="card" style={{ marginTop: 16, padding: 16, background: "rgba(37, 99, 235, 0.08)", display: "grid", gap: 12 }}>
            <div>
              <strong style={{ display: "block", marginBottom: 6 }}>Approved venue voucher creation rows</strong>
              <p className="muted" style={{ margin: 0 }}>
                {voucherCreationExport.rows?.length ?? 0} rows · {voucherCreationExport.summary?.missing_uploaded_links ?? 0} still missing uploaded Uber links
                {voucherCreationExport.summary?.source === "provider_link_records" ? " · shown from existing provider-link records" : ""}.
              </p>
            </div>
            <div className="list compact-list">
              {(voucherCreationExport.rows || []).slice(0, 12).map((row, index) => (
                <div key={`${row.venue_code || "code"}-${row.provider || "provider"}-${index}`} className="list-row align-start">
                  <div>
                    <strong>{row.venue_name || "Venue"} · {row.venue_code || "No code"}</strong>
                    <p>
                      {row.provider || "provider"} · £{row.voucher_amount || "0.00"} · {row.location_postcode || "postcode"} · ref {row.uber_business_reference || row.venue_code || "missing"} · uploaded link: {row.has_uploaded_link || "no"}
                    </p>
                  </div>
                  <span className="muted">{row.offer_type || "offer"}</span>
                </div>
              ))}
            </div>
            {(voucherCreationExport.rows?.length || 0) > 12 ? (
              <p className="muted" style={{ margin: 0 }}>Showing first 12 rows. The downloaded CSV contains all rows.</p>
            ) : null}
          </div>
        ) : null}

        {providerLinkExport ? (
          <div className="card" style={{ marginTop: 16, padding: 16, background: "rgba(255,255,255,0.04)", display: "grid", gap: 12 }}>
            <div>
              <strong style={{ display: "block", marginBottom: 6 }}>Google Sheets / CAS Drive export preview</strong>
              <p className="muted" style={{ margin: 0 }}>
                {providerLinkExport.rows?.length ?? 0} rows ready for {providerLinkExport.sheet_tab_name || "CAS Voucher Links"}.
              </p>
            </div>
            {providerLinkExport.batch_summary?.length ? (
              <div className="list">
                {providerLinkExport.batch_summary.map((batch, index) => (
                  <div key={`${batch.import_batch_code || "manual"}-${index}`} className="list-row">
                    <div>
                      <strong>{batch.source_label || "manual-entry"}</strong>
                      <p>{batch.import_batch_code || "manual"} · {batch.record_count ?? 0} rows</p>
                    </div>
                    <span className="muted">{formatDateTime(batch.latest_created_at)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="card">
        <span className="eyebrow">Recent imports</span>
        <h2 style={{ marginBottom: 8 }}>Latest uploaded records</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Use this side panel to confirm the newest imported records after each upload.
        </p>
        <VoucherRecordsList
          records={providerLinks}
          circulationModeLabel={circulationModeLabel}
          limit={10}
        />
      </section>
    </div>
  );
}
