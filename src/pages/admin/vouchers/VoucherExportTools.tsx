interface VoucherExportToolsProps {
  busy: string | null;
  onDownloadTemplateCsv: () => Promise<void>;
  onCopyGoogleSheetsRows: () => Promise<void>;
  onDownloadDriveReadyCsv: () => Promise<void>;
  onDownloadVenueVoucherCreationCsv?: () => Promise<void>;
}

export function VoucherExportTools({
  busy,
  onDownloadTemplateCsv,
  onCopyGoogleSheetsRows,
  onDownloadDriveReadyCsv,
  onDownloadVenueVoucherCreationCsv,
}: VoucherExportToolsProps) {
  return (
    <div className="action-row" style={{ flexWrap: "wrap" }}>
      <button className="secondary-button" onClick={() => void onDownloadTemplateCsv()} disabled={busy === "provider-template"}>
        {busy === "provider-template" ? "Preparing template..." : "Download template CSV"}
      </button>
      <button className="secondary-button" onClick={() => void onCopyGoogleSheetsRows()} disabled={busy === "provider-sheets"}>
        {busy === "provider-sheets" ? "Copying..." : "Copy Google Sheets rows"}
      </button>
      <button className="secondary-button" onClick={() => void onDownloadDriveReadyCsv()} disabled={busy === "provider-export"}>
        {busy === "provider-export" ? "Exporting..." : "Download Drive-ready CSV"}
      </button>
      {onDownloadVenueVoucherCreationCsv ? (
        <button className="primary-button" onClick={() => void onDownloadVenueVoucherCreationCsv()} disabled={busy === "voucher-creation-export"}>
          {busy === "voucher-creation-export" ? "Preparing venue voucher CSV..." : "Download all venue voucher rows"}
        </button>
      ) : null}
    </div>
  );
}
