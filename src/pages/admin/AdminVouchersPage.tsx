import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import type { ProviderVoucherCreationExportPayload, ProviderVoucherLinkExportPayload, ProviderVoucherLinkRecord } from "@/types";
import type { ProviderVoucherLinkPayload } from "@/api/adminBusinessRules";
import type { AdminMerchant, AdminPayload, AdminSection, IntegrationPlaybookPayloadLocal, LinkFormState } from "./types";
import { VoucherCreateForm } from "./vouchers/VoucherCreateForm";
import { VoucherIntegrationsPanel } from "./vouchers/VoucherIntegrationsPanel";
import { VoucherRecordsPanel } from "./vouchers/VoucherRecordsPanel";
import { VoucherUploadPanel } from "./vouchers/VoucherUploadPanel";
import { VoucherWorkspaceHeader } from "./vouchers/VoucherWorkspaceHeader";

interface AdminVouchersPageProps {
  activeSection: AdminSection;
  dashboard: AdminPayload | null;
  providerLinks: ProviderVoucherLinkRecord[];
  providerLinkExport: ProviderVoucherLinkExportPayload | null;
  voucherCreationExport: ProviderVoucherCreationExportPayload | null;
  merchants: AdminMerchant[];
  selectedMerchant: AdminMerchant | null;
  linkForm: LinkFormState;
  uploadFile: File | null;
  loading: boolean;
  busy: string | null;
  integrationPlaybook: IntegrationPlaybookPayloadLocal | null;
  setLinkForm: Dispatch<SetStateAction<LinkFormState>>;
  setUploadFile: Dispatch<SetStateAction<File | null>>;
  onMerchantChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  saveProviderLink: () => Promise<void>;
  uploadCsv: () => Promise<void>;
  downloadProviderTemplateCsv: () => Promise<void>;
  copyGoogleSheetsRows: () => Promise<void>;
  downloadDriveReadyCsv: () => Promise<void>;
  downloadVenueVoucherCreationCsv: () => Promise<void>;
  updateProviderLink: (id: number, payload: ProviderVoucherLinkPayload) => Promise<void>;
  deleteProviderLink: (id: number) => Promise<void>;
  formatDateTime: (value?: string | null) => string;
  circulationModeLabel: (mode?: string | null) => string;
}

export function AdminVouchersPage({
  activeSection,
  dashboard,
  providerLinks,
  providerLinkExport,
  voucherCreationExport,
  merchants,
  selectedMerchant,
  linkForm,
  uploadFile,
  loading,
  busy,
  integrationPlaybook,
  setLinkForm,
  setUploadFile,
  onMerchantChange,
  saveProviderLink,
  uploadCsv,
  downloadProviderTemplateCsv,
  copyGoogleSheetsRows,
  downloadDriveReadyCsv,
  downloadVenueVoucherCreationCsv,
  updateProviderLink,
  deleteProviderLink,
  formatDateTime,
  circulationModeLabel,
}: AdminVouchersPageProps) {
  const isVoucherRecords = activeSection === "vouchers-records";
  const isVoucherCreate = activeSection === "vouchers-create";
  const isVoucherUpload = activeSection === "vouchers-upload";
  const isVoucherDownload = activeSection === "vouchers-download";
  const showVoucherWorkspace = activeSection !== "vouchers-integrations";

  return (
    <>
      {showVoucherWorkspace ? (
        <>
          <VoucherWorkspaceHeader
            mode={isVoucherCreate ? "create" : isVoucherUpload ? "upload" : isVoucherDownload ? "download" : "records"}
            total={dashboard?.provider_voucher_links?.summary?.total ?? providerLinks.length}
            active={dashboard?.provider_voucher_links?.summary?.active ?? 0}
            inCirculation={dashboard?.provider_voucher_links?.summary?.in_circulation ?? 0}
          />

          {isVoucherRecords || isVoucherDownload ? (
            <VoucherRecordsPanel
              providerLinks={providerLinks}
              providerLinkExport={providerLinkExport}
              voucherCreationExport={voucherCreationExport}
              busy={busy}
              focusExports={isVoucherDownload}
              onDownloadTemplateCsv={downloadProviderTemplateCsv}
              onCopyGoogleSheetsRows={copyGoogleSheetsRows}
              onDownloadDriveReadyCsv={downloadDriveReadyCsv}
              onDownloadVenueVoucherCreationCsv={downloadVenueVoucherCreationCsv}
              onUpdateProviderLink={updateProviderLink}
              onDeleteProviderLink={deleteProviderLink}
              formatDateTime={formatDateTime}
              circulationModeLabel={circulationModeLabel}
            />
          ) : null}

          {isVoucherCreate ? (
            <VoucherCreateForm
              merchants={merchants}
              selectedMerchant={selectedMerchant}
              linkForm={linkForm}
              providerLinks={providerLinks}
              loading={loading}
              busy={busy}
              setLinkForm={setLinkForm}
              onMerchantChange={onMerchantChange}
              onSaveProviderLink={saveProviderLink}
              circulationModeLabel={circulationModeLabel}
            />
          ) : null}

          {isVoucherUpload ? (
            <VoucherUploadPanel
              providerLinks={providerLinks}
              providerLinkExport={providerLinkExport}
              voucherCreationExport={voucherCreationExport}
              uploadFile={uploadFile}
              busy={busy}
              setUploadFile={setUploadFile}
              onUploadCsv={uploadCsv}
              onDownloadTemplateCsv={downloadProviderTemplateCsv}
              onCopyGoogleSheetsRows={copyGoogleSheetsRows}
              onDownloadDriveReadyCsv={downloadDriveReadyCsv}
              onDownloadVenueVoucherCreationCsv={downloadVenueVoucherCreationCsv}
              formatDateTime={formatDateTime}
              circulationModeLabel={circulationModeLabel}
            />
          ) : null}
        </>
      ) : null}

      {activeSection === "vouchers-integrations" ? (
        <VoucherIntegrationsPanel integrationPlaybook={integrationPlaybook} />
      ) : null}
    </>
  );
}
