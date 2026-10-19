import { Link } from "react-router-dom";
import type { ProviderVoucherCreationExportPayload, ProviderVoucherLinkExportPayload, ProviderVoucherLinkRecord } from "@/types";
import type { ProviderVoucherLinkPayload } from "@/api/adminBusinessRules";
import { VoucherExportTools } from "./VoucherExportTools";
import { VoucherRecordsList } from "./VoucherRecordsList";

interface VoucherRecordsPanelProps {
  providerLinks: ProviderVoucherLinkRecord[];
  providerLinkExport: ProviderVoucherLinkExportPayload | null;
  voucherCreationExport: ProviderVoucherCreationExportPayload | null;
  busy: string | null;
  focusExports?: boolean;
  onDownloadTemplateCsv: () => Promise<void>;
  onCopyGoogleSheetsRows: () => Promise<void>;
  onDownloadDriveReadyCsv: () => Promise<void>;
  onDownloadVenueVoucherCreationCsv: () => Promise<void>;
  onUpdateProviderLink: (id: number, payload: ProviderVoucherLinkPayload) => Promise<void>;
  onDeleteProviderLink: (id: number) => Promise<void>;
  formatDateTime: (value?: string | null) => string;
  circulationModeLabel: (mode?: string | null) => string;
}

export function VoucherRecordsPanel({
  providerLinks,
  providerLinkExport,
  voucherCreationExport,
  busy,
  focusExports = false,
  onDownloadTemplateCsv,
  onCopyGoogleSheetsRows,
  onDownloadDriveReadyCsv,
  onDownloadVenueVoucherCreationCsv,
  onUpdateProviderLink,
  onDeleteProviderLink,
  formatDateTime,
  circulationModeLabel,
}: VoucherRecordsPanelProps) {
  return (
    <div className="split-grid">
      {!focusExports ? (
        <section className="card">
          <span className="eyebrow">Provider voucher links</span>
          <h2 style={{ marginBottom: 8 }}>Records with edit, update, deactivate and delete</h2>
          <p className="muted" style={{ marginBottom: 16 }}>
            Admin can manage every Uber / Uber Eats link already uploaded or manually created. Venue code remains the reference for Uber Business matching.
          </p>

          <VoucherRecordsList
            records={providerLinks}
            busy={busy}
            circulationModeLabel={circulationModeLabel}
            onUpdateProviderLink={onUpdateProviderLink}
            onDeleteProviderLink={onDeleteProviderLink}
          />
        </section>
      ) : null}

      <section className="card">
        <span className="eyebrow">Download and roundtrip tools</span>
        <h2 style={{ marginBottom: 8 }}>Create, upload, export and download</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Download approved venue voucher rows, create vouchers in Uber Business with the 6 character venue code as reference, then upload the Uber export back into CAS.
        </p>

        <div className="action-row" style={{ flexWrap: "wrap", marginBottom: 16 }}>
          <Link className="primary-button link-button" to="/admin/vouchers/create">Create voucher link</Link>
          <Link className="secondary-button link-button" to="/admin/vouchers/upload">Upload Uber export</Link>
        </div>

        <VoucherExportTools
          busy={busy}
          onDownloadTemplateCsv={onDownloadTemplateCsv}
          onCopyGoogleSheetsRows={onCopyGoogleSheetsRows}
          onDownloadDriveReadyCsv={onDownloadDriveReadyCsv}
          onDownloadVenueVoucherCreationCsv={onDownloadVenueVoucherCreationCsv}
        />

        {voucherCreationExport ? (
          <div className="card" style={{ marginTop: 16, padding: 16, background: "rgba(37, 99, 235, 0.08)", display: "grid", gap: 10 }}>
            <div>
              <strong style={{ display: "block", marginBottom: 6 }}>Latest approved venue voucher export</strong>
              <p className="muted" style={{ margin: 0 }}>
                {voucherCreationExport.rows?.length ?? 0} venue/provider rows · {voucherCreationExport.summary?.missing_uploaded_links ?? 0} missing uploaded links
                {voucherCreationExport.summary?.source === "provider_link_records" ? " · shown from existing provider-link records" : ""}.
              </p>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Reference</th><th>Venue</th><th>Provider</th><th>Amount</th><th>Uploaded?</th></tr></thead>
                <tbody>
                  {(voucherCreationExport.rows || []).slice(0, 12).map((row, index) => (
                    <tr key={`${row.venue_code || "venue"}-${row.provider || "provider"}-${index}`}>
                      <td><strong>{row.uber_business_reference || row.venue_code || "No code"}</strong></td>
                      <td>{row.venue_name || "Venue"}<br /><span className="muted">{row.location_postcode || "postcode"}</span></td>
                      <td>{row.provider || "provider"}</td>
                      <td>£{row.voucher_amount || "0.00"}</td>
                      <td>{row.has_uploaded_link === "yes" ? "Linked" : "Needs upload"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
    </div>
  );
}
