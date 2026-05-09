import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import api from "@/api/axios";
import { AppShell } from "@/components/AppShell";
import { getAdminWorkspaceSection } from "@/lib/workspace";
import {
  createWhatsAppTemplate,
  getWhatsAppAdminDashboard,
  installWhatsAppStarterPack,
  simulateWhatsAppTemplateApproval,
  submitWhatsAppTemplate,
  updateWhatsAppTemplate,
} from "@/api/adminWhatsapp";
import { exportOfferSyncCsvPreview, markOfferSyncAsSynced, rejectOfferSyncRequest } from "@/api/adminOfferSync";
import { blockFraudUser, getFraudAdminDashboard, reviewFraudUser, unblockFraudUser } from "@/api/adminUsers";
import {
  approveAddressChangeRequest,
  deleteAdminMerchant,
  deleteAdminVenue,
  deleteProviderVoucherLink,
  createProviderVoucherLink,
  exportProviderVoucherLinks,
  exportVenueVoucherCreationRows,
  getAddressChangeRequests,
  getProviderVoucherLinkTemplate,
  getProviderVoucherLinks,
  getVenueApprovalQueue,
  getAdminMerchants,
  approveMerchantApplication,
  rejectMerchantApplication,
  approveVenue,
  rejectVenue,
  rejectAddressChangeRequest,
  updateAdminMerchant,
  updateAdminVenue,
  updateProviderVoucherLink,
  uploadProviderVoucherLinks,
  type AdminMerchantUpdatePayload,
  type AdminVenueUpdatePayload,
  type ProviderVoucherLinkPayload,
} from "@/api/adminBusinessRules";
import type {
  ApiResponse,
  FraudAdminPayload,
  OfferSyncAdminPayload,
  OfferSyncExportPayload,
  OfferSyncRequestRecord,
  ProviderVoucherLinkExportPayload,
  ProviderVoucherCreationExportPayload,
  ProviderVoucherLinkRecord,
  Venue,
  VenueAddressChangeRecord,
  WhatsAppAdminPayload,
  WhatsAppTemplateRecord,
} from "@/types";
import { AdminMerchantsPage } from "./admin/AdminMerchantsPage";
import { AdminNavigation } from "./admin/AdminNavigation";
import { AdminOverviewPage } from "./admin/AdminOverviewPage";
import { AdminSettingsPage } from "./admin/AdminSettingsPage";
import { AdminVenuesPage } from "./admin/AdminVenuesPage";
import { AdminUsersPage } from "./admin/AdminUsersPage";
import { AdminVouchersPage } from "./admin/AdminVouchersPage";
import type {
  AdminMerchant,
  AdminPayload,
  AdminSection,
  AreaLaunchAlertPreviewPayload,
  AreaLaunchAlertRunLite,
  AreaLaunchDashboardPayload,
  IntegrationPlaybookPayloadLocal,
  LinkFormState,
  TemplateFormState,
} from "./admin/types";
import { circulationModeLabel, formatDateTime } from "./admin/utils";

function downloadTextFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminPayload | null>(null);
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [venueApprovals, setVenueApprovals] = useState<Venue[]>([]);
  const [addressChanges, setAddressChanges] = useState<VenueAddressChangeRecord[]>([]);
  const [providerLinks, setProviderLinks] = useState<ProviderVoucherLinkRecord[]>([]);
  const [offerSyncRequests, setOfferSyncRequests] = useState<OfferSyncRequestRecord[]>([]);
  const [offerSyncExport, setOfferSyncExport] = useState<OfferSyncExportPayload | null>(null);
  const [providerLinkExport, setProviderLinkExport] = useState<ProviderVoucherLinkExportPayload | null>(null);
  const [voucherCreationExport, setVoucherCreationExport] = useState<ProviderVoucherCreationExportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [linkForm, setLinkForm] = useState<LinkFormState>({
    merchant_id: "",
    venue_id: "",
    provider: "uber",
    link_url: "",
    offer_type: "ride",
    ride_trip_type: "to_venue",
    voucher_amount: "5.00",
    minimum_order: "",
    location_postcode: "",
    start_time: "00:00",
    end_time: "23:59",
    valid_from: "",
    valid_until: "",
    is_active: true,
    circulation_mode: "shared_sequence",
    max_issue_count: "",
    source_label: "manual-admin-entry",
    notes: "",
  });
  const [whatsAppDashboard, setWhatsAppDashboard] = useState<WhatsAppAdminPayload | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>({
    key: "voucher_delivery_ride",
    channel: "whatsapp",
    journey_type: "going_out",
    weather_condition: "",
    emoji: "🚕",
    body: "",
    is_active: true,
    sort_order: "10",
    category: "utility",
    language: "en_GB",
  });
  const [templateNote, setTemplateNote] = useState("");
  const [areaLaunchDashboard, setAreaLaunchDashboard] = useState<AreaLaunchDashboardPayload | null>(null);
  const [areaLaunchPreview, setAreaLaunchPreview] = useState<AreaLaunchAlertPreviewPayload | null>(null);
  const [areaLaunchMerchantId, setAreaLaunchMerchantId] = useState("");
  const [areaLaunchNotes, setAreaLaunchNotes] = useState("");
  const [integrationPlaybook, setIntegrationPlaybook] = useState<IntegrationPlaybookPayloadLocal | null>(null);
  const [fraudDashboard, setFraudDashboard] = useState<FraudAdminPayload | null>(null);
  const location = useLocation();

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const [
        dashboardRes,
        merchantsRes,
        venueApprovalsRes,
        addressRes,
        linksRes,
        offerSyncRes,
        whatsAppRes,
        areaLaunchRes,
        integrationRes,
        fraudRes,
      ] = await Promise.all([
        api.get<ApiResponse<AdminPayload>>("/admin/dashboard"),
        getAdminMerchants({ status: "all" }),
        getVenueApprovalQueue("all", 200),
        getAddressChangeRequests("pending", 25),
        getProviderVoucherLinks({ limit: 100 }),
        api.get<ApiResponse<{ items: OfferSyncRequestRecord[] }>>("/admin/offer-sync/requests", {
          params: { status: "pending", limit: 25 },
        }),
        getWhatsAppAdminDashboard(),
        api.get<ApiResponse<AreaLaunchDashboardPayload>>("/admin/area-launch-alerts", { params: { limit: 8 } }),
        api.get<ApiResponse<IntegrationPlaybookPayloadLocal>>("/admin/integrations/playbook"),
        getFraudAdminDashboard(),
      ]);

      const nextMerchants = Array.isArray(merchantsRes) ? merchantsRes : merchantsRes.items;
      setDashboard(dashboardRes.data.data);
      setWhatsAppDashboard(whatsAppRes);
      setMerchants(nextMerchants);
      setVenueApprovals(venueApprovalsRes.items || []);
      setAddressChanges(addressRes.items || []);
      setProviderLinks(linksRes.items || []);
      setOfferSyncRequests(offerSyncRes.data.data.items || []);
      setAreaLaunchDashboard(areaLaunchRes.data.data);
      setIntegrationPlaybook(integrationRes.data.data);
      setFraudDashboard(fraudRes);

      if (!linkForm.merchant_id && nextMerchants[0]) {
        setLinkForm((current) => ({
          ...current,
          merchant_id: String(nextMerchants[0].id),
          venue_id: nextMerchants[0].venues[0] ? String(nextMerchants[0].venues[0].id) : "",
        }));
      }

      if (!areaLaunchMerchantId && nextMerchants[0]) {
        setAreaLaunchMerchantId(String(nextMerchants[0].id));
      }
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Admin dashboard could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const selectedMerchant = useMemo(
    () => merchants.find((merchant) => String(merchant.id) === linkForm.merchant_id) || null,
    [linkForm.merchant_id, merchants]
  );

  const activeSection = useMemo(
    () => getAdminWorkspaceSection(location.pathname) as AdminSection,
    [location.pathname]
  );

  const activeFamily = useMemo(() => {
    if (activeSection === "overview") return "overview" as const;
    if (activeSection.startsWith("merchant-") || activeSection === "merchants") return "merchants" as const;
    if (activeSection.startsWith("venue") || activeSection === "venues") return "venues" as const;
    if (activeSection.startsWith("users")) return "users" as const;
    if (activeSection.startsWith("settings")) return "settings" as const;
    return "vouchers" as const;
  }, [activeSection]);

  const pageMeta = useMemo(() => {
    switch (activeSection) {
      case "overview":
        return { title: "Admin dashboard", subtitle: "A clean command center for merchants, venues, vouchers, users, and settings." };
      case "merchant-pending":
        return { title: "Pending merchants", subtitle: "Accept, reject, edit, update, or delete merchant applications." };
      case "merchant-approved":
        return { title: "Approved merchants", subtitle: "Manage live merchants with full admin access." };
      case "merchant-rejected":
        return { title: "Rejected merchants", subtitle: "Review rejected merchants and restore, edit, or delete records." };
      case "merchant-finance":
        return { title: "Merchant finance", subtitle: "Low-balance merchants, wallet movement, and funding checks." };
      case "merchant-offer-sync":
        return { title: "Offer sync", subtitle: "Merchant offer changes waiting for provider sync and export review." };
      case "merchant-area-launch":
        return { title: "Area launch alerts", subtitle: "Preview and send launch alerts for approved merchants and venues." };
      case "venues":
        return { title: "All venues", subtitle: "Search, filter, edit, update, approve, reject, and delete every venue." };
      case "venue-approvals":
      case "venue-pending":
        return { title: "Venue approvals", subtitle: "Accept venues with a 6-character Uber Business reference code or reject them." };
      case "venue-approved":
        return { title: "Approved venues", subtitle: "Manage live venues and update offer/code information." };
      case "venue-rejected":
        return { title: "Rejected venues", subtitle: "Review rejected venues, edit them, or delete them." };
      case "venue-address":
        return { title: "Address approvals", subtitle: "Approve or reject protected venue address-change requests." };
      case "vouchers-create":
        return { title: "Create voucher", subtitle: "Create provider voucher links manually with venue, value, code, and validity details." };
      case "vouchers-upload":
        return { title: "Upload vouchers", subtitle: "Upload Uber Business exports and match them to venues by 6-character code." };
      case "vouchers-download":
        return { title: "Download vouchers", subtitle: "Export approved venue voucher rows and provider-link templates." };
      case "vouchers-integrations":
        return { title: "Voucher integrations", subtitle: "Webhook URLs, payload examples, signature headers, and readiness checks." };
      case "vouchers-records":
        return { title: "Voucher records", subtitle: "Search, filter, edit, update, deactivate, or delete provider voucher links." };
      case "users":
        return { title: "Users", subtitle: "Review user totals, fraud queues, and account safety tools." };
      case "users-whatsapp":
      case "settings-whatsapp":
        return { title: "WhatsApp templates", subtitle: "Create, edit, submit, approve, or reject WhatsApp delivery templates." };
      case "settings-integrations":
        return { title: "Integrations", subtitle: "Operational setup for webhooks, payload examples, and provider readiness." };
      case "settings":
        return { title: "Settings", subtitle: "System settings, venue information, WhatsApp templates, and integrations." };
      default:
        return { title: "Admin dashboard", subtitle: "Full admin access with clean, separated menus." };
    }
  }, [activeSection]);

  const familyNav = useMemo(() => ([
    { label: "Overview", path: "/admin/overview", active: activeFamily === "overview", icon: "overview", description: "Command center", badge: null },
    { label: "Merchants", path: "/admin/merchants", active: activeFamily === "merchants", icon: "merchants", description: "Applications & finance", badge: dashboard?.stats.pending_merchants ?? null },
    { label: "Venues", path: "/admin/venues", active: activeFamily === "venues", icon: "venues", description: "Approvals & codes", badge: dashboard?.stats.pending_venues ?? null },
    { label: "Vouchers", path: "/admin/vouchers", active: activeFamily === "vouchers", icon: "vouchers", description: "Create/upload/download", badge: dashboard?.provider_voucher_links?.summary?.total ?? null },
    { label: "Users", path: "/admin/users", active: activeFamily === "users", icon: "users", description: "Fraud & access", badge: dashboard?.stats.flagged_users ?? null },
    { label: "Settings", path: "/admin/settings", active: activeFamily === "settings", icon: "settings", description: "System tools", badge: null },
  ]), [activeFamily, dashboard]);

  const sectionNav = useMemo(() => {
    if (activeFamily === "overview") {
      return [
        { label: "Dashboard", path: "/admin/overview", active: activeSection === "overview", icon: "overview" },
        { label: "Venue approvals", path: "/admin/venues/approvals", active: false, icon: "approvals", badge: dashboard?.stats.pending_venues ?? null },
        { label: "Voucher download", path: "/admin/vouchers/download", active: false, icon: "download" },
      ];
    }

    if (activeFamily === "merchants") {
      return [
        { label: "All", path: "/admin/merchants", active: activeSection === "merchants", icon: "merchants" },
        { label: "Pending", path: "/admin/merchants/pending", active: activeSection === "merchant-pending", icon: "pending", badge: dashboard?.stats.pending_merchants ?? null },
        { label: "Approved", path: "/admin/merchants/approved", active: activeSection === "merchant-approved", icon: "approved" },
        { label: "Rejected", path: "/admin/merchants/rejected", active: activeSection === "merchant-rejected", icon: "rejected" },
        { label: "Finance", path: "/admin/merchants/finance", active: activeSection === "merchant-finance", icon: "finance" },
        { label: "Offer sync", path: "/admin/merchants/offer-sync", active: activeSection === "merchant-offer-sync", icon: "reports" },
        { label: "Area launch", path: "/admin/merchants/area-launch-alerts", active: activeSection === "merchant-area-launch", icon: "reports" },
      ];
    }

    if (activeFamily === "venues") {
      return [
        { label: "All venues", path: "/admin/venues", active: activeSection === "venues", icon: "venues" },
        { label: "Venue approvals", path: "/admin/venues/approvals", active: activeSection === "venue-approvals" || activeSection === "venue-pending", icon: "approvals", badge: dashboard?.stats.pending_venues ?? null },
        { label: "Approved", path: "/admin/venues/approved", active: activeSection === "venue-approved", icon: "approved" },
        { label: "Rejected", path: "/admin/venues/rejected", active: activeSection === "venue-rejected", icon: "rejected" },
        { label: "Address approvals", path: "/admin/venues/address-approvals", active: activeSection === "venue-address", icon: "address" },
        { label: "Information", path: "/admin/information", active: false, icon: "settings" },
      ];
    }

    if (activeFamily === "users") {
      return [
        { label: "Users", path: "/admin/users", active: activeSection === "users", icon: "users" },
        { label: "WhatsApp templates", path: "/admin/settings/whatsapp", active: false, icon: "whatsapp" },
      ];
    }

    if (activeFamily === "settings") {
      return [
        { label: "Settings", path: "/admin/settings", active: activeSection === "settings", icon: "settings" },
        { label: "Venue information", path: "/admin/information", active: false, icon: "venues" },
        { label: "WhatsApp", path: "/admin/settings/whatsapp", active: activeSection === "settings-whatsapp", icon: "whatsapp" },
        { label: "Integrations", path: "/admin/settings/integrations", active: activeSection === "settings-integrations", icon: "integrations" },
      ];
    }

    return [
      { label: "Records", path: "/admin/vouchers", active: activeSection === "vouchers-records", icon: "vouchers" },
      { label: "Create", path: "/admin/vouchers/create", active: activeSection === "vouchers-create", icon: "pending" },
      { label: "Upload", path: "/admin/vouchers/upload", active: activeSection === "vouchers-upload", icon: "upload" },
      { label: "Download", path: "/admin/vouchers/download", active: activeSection === "vouchers-download", icon: "download" },
      { label: "Integrations", path: "/admin/vouchers/integrations", active: activeSection === "vouchers-integrations", icon: "integrations" },
    ];
  }, [activeFamily, activeSection, dashboard]);

  function resetTemplateForm() {
    setEditingTemplateId(null);
    setTemplateNote("");
    setTemplateForm({
      key: "voucher_delivery_ride",
      channel: "whatsapp",
      journey_type: "going_out",
      weather_condition: "",
      emoji: "🚕",
      body: "",
      is_active: true,
      sort_order: "10",
      category: "utility",
      language: "en_GB",
    });
  }

  function applyTemplateToForm(template: WhatsAppTemplateRecord) {
    setEditingTemplateId(template.id);
    setTemplateNote(template.approval_notes || "");
    setTemplateForm({
      key: template.key || "",
      channel: template.channel || "whatsapp",
      journey_type: template.journey_type || "",
      weather_condition: template.weather_condition || "",
      emoji: template.emoji || "",
      body: template.body || "",
      is_active: Boolean(template.is_active),
      sort_order: String(template.sort_order ?? 0),
      category: template.category || "marketing",
      language: template.language || "en_GB",
    });
  }

  async function refreshAfterAction(message: string) {
    setSuccess(message);
    await loadData();
  }

  async function approveAddress(id: number) {
    setBusy(`address-approve-${id}`);
    setError(null);

    try {
      await approveAddressChangeRequest(id);
      await refreshAfterAction("Address change approved successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not approve the address change.");
    } finally {
      setBusy(null);
    }
  }

  async function rejectAddress(id: number) {
    setBusy(`address-reject-${id}`);
    setError(null);

    try {
      await rejectAddressChangeRequest(id);
      await refreshAfterAction("Address change rejected successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not reject the address change.");
    } finally {
      setBusy(null);
    }
  }

  async function approveMerchantAccount(id: number) {
    setBusy(`merchant-approve-${id}`);
    setError(null);

    try {
      await approveMerchantApplication(id);
      await refreshAfterAction("Merchant account approved. You can approve their venues now.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not approve this merchant account.");
    } finally {
      setBusy(null);
    }
  }

  async function rejectMerchantAccount(id: number) {
    setBusy(`merchant-reject-${id}`);
    setError(null);

    try {
      await rejectMerchantApplication(id);
      await refreshAfterAction("Merchant account kept inactive.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not reject this merchant account.");
    } finally {
      setBusy(null);
    }
  }
  async function updateMerchantAccount(id: number, payload: AdminMerchantUpdatePayload) {
    setBusy(`merchant-update-${id}`);
    setError(null);

    try {
      await updateAdminMerchant(id, payload);
      await refreshAfterAction("Merchant updated successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not update this merchant.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteMerchantAccount(id: number) {
    setBusy(`merchant-delete-${id}`);
    setError(null);

    try {
      await deleteAdminMerchant(id);
      await refreshAfterAction("Merchant deleted successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not delete this merchant.");
    } finally {
      setBusy(null);
    }
  }


  async function updateVenueRequest(id: number, payload: AdminVenueUpdatePayload) {
    setBusy(`venue-update-${id}`);
    setError(null);

    try {
      await updateAdminVenue(id, payload);
      await refreshAfterAction("Venue updated successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not update this venue.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteVenueRequest(id: number) {
    setBusy(`venue-delete-${id}`);
    setError(null);

    try {
      await deleteAdminVenue(id);
      await refreshAfterAction("Venue deleted successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not delete this venue.");
    } finally {
      setBusy(null);
    }
  }

  async function approveVenueRequest(id: number, venueCode: string) {
    const code = venueCode.trim().toUpperCase();
    console.log(`Approving venue ${id} with code: "${code}"`);
    setBusy(`venue-approve-${id}`);
    setError(null);

    try {
      console.log("Approving venue:", id, "with code:", code);
      const result = await approveVenue(id, code);
      console.log("Venue approval result:", result);
      await refreshAfterAction("Venue approved successfully!");
    } catch (requestError: any) {
      console.error("Venue approval error:", requestError);
      const errorMessage = requestError?.response?.data?.message || "Could not approve this venue.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setBusy(null);
    }
  }

  async function rejectVenueRequest(id: number) {
    console.log(`Rejecting venue ${id}`);
    setBusy(`venue-reject-${id}`);
    setError(null);

    try {
      const result = await rejectVenue(id, "Rejected from admin venue approvals page.");
      console.log("Venue rejection result:", result);
      await refreshAfterAction("Venue rejected successfully.");
    } catch (requestError: any) {
      console.error("Venue rejection error:", requestError);
      const errorMessage = requestError?.response?.data?.message || requestError?.message || "Could not reject this venue.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setBusy(null);
    }
  }

  async function syncOfferRequest(id: number) {
    setBusy(`offer-sync-${id}`);
    setError(null);

    try {
      await markOfferSyncAsSynced(id);
      await refreshAfterAction("Offer sync request marked as synced.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not mark this offer sync request as synced.");
    } finally {
      setBusy(null);
    }
  }

  async function rejectOfferRequestAction(id: number) {
    setBusy(`offer-reject-${id}`);
    setError(null);

    try {
      await rejectOfferSyncRequest(id);
      await refreshAfterAction("Offer sync request rejected.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not reject this offer sync request.");
    } finally {
      setBusy(null);
    }
  }

  async function exportPreview() {
    setBusy("offer-export");
    setError(null);

    try {
      const preview = await exportOfferSyncCsvPreview();
      setOfferSyncExport(preview);
      setSuccess("Offer sync export preview loaded.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not generate the offer sync export preview.");
    } finally {
      setBusy(null);
    }
  }

  function onMerchantChange(event: ChangeEvent<HTMLSelectElement>) {
    const merchantId = event.target.value;
    const merchant = merchants.find((item) => String(item.id) === merchantId) || null;
    setLinkForm((current) => ({
      ...current,
      merchant_id: merchantId,
      venue_id: merchant?.venues[0] ? String(merchant.venues[0].id) : "",
      location_postcode: merchant?.venues[0]?.postcode || current.location_postcode,
    }));
  }

  async function saveProviderLink() {
    if (!linkForm.merchant_id || !linkForm.link_url) {
      setError("Choose a merchant and exact Uber link first.");
      return;
    }

    setBusy("save-provider-link");
    setError(null);

    try {
      await createProviderVoucherLink({
        merchant_id: Number(linkForm.merchant_id),
        venue_id: linkForm.venue_id ? Number(linkForm.venue_id) : null,
        provider: linkForm.provider,
        link_url: linkForm.link_url,
        offer_type: linkForm.offer_type,
        ride_trip_type: linkForm.offer_type === "food" ? null : linkForm.ride_trip_type,
        voucher_amount: linkForm.voucher_amount ? Number(linkForm.voucher_amount) : null,
        minimum_order: linkForm.minimum_order ? Number(linkForm.minimum_order) : null,
        location_postcode: linkForm.location_postcode || null,
        start_time: linkForm.start_time || null,
        end_time: linkForm.end_time || null,
        valid_from: linkForm.valid_from || null,
        valid_until: linkForm.valid_until || null,
        is_active: linkForm.is_active,
        circulation_mode: linkForm.circulation_mode,
        max_issue_count: linkForm.max_issue_count ? Number(linkForm.max_issue_count) : null,
        source_label: linkForm.source_label || null,
        notes: linkForm.notes || null,
      });

      await refreshAfterAction("Exact provider link saved successfully.");
      setLinkForm((current) => ({ ...current, link_url: "", notes: "", max_issue_count: current.max_issue_count }));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not save the exact provider link.");
    } finally {
      setBusy(null);
    }
  }

  async function uploadCsv() {
    if (!uploadFile) {
      setError("Choose a CSV or XLSX file first. Merchant is optional when the file includes venue_code references.");
      return;
    }

    setBusy("upload-provider-links");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("is_active", "1");
      formData.append("circulation_mode", "shared_sequence");
      formData.append("source_label", uploadFile.name);
      await uploadProviderVoucherLinks(formData);
      setUploadFile(null);
      await refreshAfterAction("Provider voucher link file uploaded successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not upload the provider link file.");
    } finally {
      setBusy(null);
    }
  }
  async function updateProviderLinkRecord(id: number, payload: ProviderVoucherLinkPayload) {
    setBusy(`provider-link-update-${id}`);
    setError(null);

    try {
      await updateProviderVoucherLink(id, payload);
      await refreshAfterAction("Provider voucher link updated successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not update this provider voucher link.");
    } finally {
      setBusy(null);
    }
  }

  async function deleteProviderLinkRecord(id: number) {
    setBusy(`provider-link-delete-${id}`);
    setError(null);

    try {
      await deleteProviderVoucherLink(id);
      await refreshAfterAction("Provider voucher link deleted successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not delete this provider voucher link.");
    } finally {
      setBusy(null);
    }
  }


  async function loadProviderLinkExport() {
    const result = await exportProviderVoucherLinks({
      limit: 250,
      merchant_id: linkForm.merchant_id ? Number(linkForm.merchant_id) : null,
      provider: linkForm.provider,
      active_only: true,
    });

    setProviderLinkExport(result);
    return result;
  }

  async function downloadProviderTemplateCsv() {
    setBusy("provider-template");
    setError(null);

    try {
      const template = await getProviderVoucherLinkTemplate();
      setProviderLinkExport(template);
      downloadTextFile(template.csv || "", "cas-provider-voucher-link-template.csv", "text/csv;charset=utf-8;");
      setSuccess("Google Sheets / Drive template downloaded successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not load the provider-link template.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadDriveReadyCsv() {
    setBusy("provider-export");
    setError(null);

    try {
      const result = await loadProviderLinkExport();
      downloadTextFile(result.csv || "", result.suggested_filename || "cas-drive-export.csv", "text/csv;charset=utf-8;");
      setSuccess("Drive-ready provider-link CSV exported successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not export the provider-link CSV.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadVenueVoucherCreationCsv() {
    setBusy("voucher-creation-export");
    setError(null);

    try {
      const result = await exportVenueVoucherCreationRows({
        limit: 1000,
        merchant_id: linkForm.merchant_id ? Number(linkForm.merchant_id) : null,
        provider: null,
        missing_only: false,
      });
      setVoucherCreationExport(result);
      downloadTextFile(result.csv || "", result.suggested_filename || "cas-approved-venue-voucher-creation.csv", "text/csv;charset=utf-8;");
      setSuccess("Approved venue voucher creation CSV downloaded. Use venue_code as the Uber Business reference, then upload the Uber export back into CAS.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not export approved venue voucher creation rows.");
    } finally {
      setBusy(null);
    }
  }

  async function copyGoogleSheetsRows() {
    setBusy("provider-sheets");
    setError(null);

    try {
      const result = await loadProviderLinkExport();
      await navigator.clipboard.writeText(result.tsv || "");
      setSuccess("Google Sheets rows copied. Paste directly into your CAS Drive sheet.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not copy the Google Sheets rows.");
    } finally {
      setBusy(null);
    }
  }

  async function saveWhatsAppTemplate() {
    if (!templateForm.key.trim() || !templateForm.body.trim()) {
      setError("Template key and body are required.");
      return;
    }

    setBusy(editingTemplateId ? `template-update-${editingTemplateId}` : "template-create");
    setError(null);

    const payload = {
      key: templateForm.key.trim(),
      channel: templateForm.channel.trim() || "whatsapp",
      journey_type: templateForm.journey_type.trim() || undefined,
      weather_condition: templateForm.weather_condition.trim() || undefined,
      emoji: templateForm.emoji.trim() || undefined,
      body: templateForm.body.trim(),
      is_active: templateForm.is_active,
      sort_order: Number(templateForm.sort_order || 0),
      category: templateForm.category.trim() || undefined,
      language: templateForm.language.trim() || undefined,
    };

    try {
      const nextDashboard = editingTemplateId
        ? await updateWhatsAppTemplate(editingTemplateId, payload)
        : await createWhatsAppTemplate(payload);

      setWhatsAppDashboard(nextDashboard);
      await loadData();
      setSuccess(editingTemplateId ? "WhatsApp template updated successfully." : "WhatsApp template created successfully.");
      resetTemplateForm();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not save the WhatsApp template.");
    } finally {
      setBusy(null);
    }
  }

  async function installStarterPack(overwriteExisting = false) {
    setBusy(overwriteExisting ? "template-starter-overwrite" : "template-starter");
    setError(null);

    try {
      const result = await installWhatsAppStarterPack(overwriteExisting);
      setWhatsAppDashboard(result.dashboard);
      await loadData();
      setSuccess(
        `Starter templates applied. Created ${result.result.created || 0}, updated ${result.result.updated || 0}, skipped ${result.result.skipped || 0}.`
      );
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not apply the starter template pack.");
    } finally {
      setBusy(null);
    }
  }

  async function submitTemplateForApproval(templateId: number) {
    setBusy(`template-submit-${templateId}`);
    setError(null);

    try {
      const nextDashboard = await submitWhatsAppTemplate(templateId);
      setWhatsAppDashboard(nextDashboard);
      await loadData();
      setSuccess("Template submitted for approval.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not submit the template for approval.");
    } finally {
      setBusy(null);
    }
  }

  async function simulateTemplateDecision(templateId: number, approvalStatus: "approved" | "rejected") {
    setBusy(`template-${approvalStatus}-${templateId}`);
    setError(null);

    try {
      const nextDashboard = await simulateWhatsAppTemplateApproval(
        templateId,
        approvalStatus,
        templateNote.trim() || undefined,
      );
      setWhatsAppDashboard(nextDashboard);
      await loadData();
      setSuccess(`Template ${approvalStatus === "approved" ? "approved" : "rejected"} successfully.`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || `Could not mark the template as ${approvalStatus}.`);
    } finally {
      setBusy(null);
    }
  }

  async function previewAreaLaunch() {
    if (!areaLaunchMerchantId) {
      setError("Choose a merchant first.");
      return;
    }

    setBusy("area-launch-preview");
    setError(null);

    try {
      const response = await api.get<ApiResponse<{ preview: AreaLaunchAlertPreviewPayload }>>(`/admin/area-launch-alerts/${areaLaunchMerchantId}/preview`);
      setAreaLaunchPreview(response.data.data.preview);
      setSuccess("Area launch preview loaded.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not load the area launch preview.");
    } finally {
      setBusy(null);
    }
  }

  async function sendAreaLaunch() {
    if (!areaLaunchMerchantId) {
      setError("Choose a merchant first.");
      return;
    }

    setBusy("area-launch-send");
    setError(null);

    try {
      const response = await api.post<ApiResponse<{ run: AreaLaunchAlertRunLite; preview: AreaLaunchAlertPreviewPayload }>>(`/admin/area-launch-alerts/${areaLaunchMerchantId}/send`, {
        notes: areaLaunchNotes.trim() || undefined,
      });
      setAreaLaunchPreview(response.data.data.preview);
      setSuccess("Area launch alert processed successfully.");
      await loadData();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not send the area launch alert.");
    } finally {
      setBusy(null);
    }
  }

  async function markUserReviewed(userId: number) {
    setBusy(`fraud-review-${userId}`);
    setError(null);

    try {
      await reviewFraudUser(userId);
      await refreshAfterAction("User marked as reviewed.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not update the user review status.");
    } finally {
      setBusy(null);
    }
  }

  async function blockUserAccount(userId: number) {
    setBusy(`fraud-block-${userId}`);
    setError(null);

    try {
      await blockFraudUser(userId, "Blocked from admin users page.", 30);
      await refreshAfterAction("User blocked successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not block this user.");
    } finally {
      setBusy(null);
    }
  }

  async function unblockUserAccount(userId: number) {
    setBusy(`fraud-unblock-${userId}`);
    setError(null);

    try {
      await unblockFraudUser(userId, "Unblocked from admin users page.");
      await refreshAfterAction("User unblocked successfully.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "Could not unblock this user.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell title={pageMeta.title} subtitle={pageMeta.subtitle}>
      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="card" style={{ border: "1px solid rgba(34, 197, 94, 0.28)", background: "rgba(34, 197, 94, 0.08)" }}>{success}</div> : null}

      <AdminNavigation familyNav={familyNav} sectionNav={sectionNav} />

      {activeFamily === "overview" ? (
        <AdminOverviewPage
          dashboard={dashboard}
          merchantCount={merchants.length}
          venueCount={venueApprovals.length}
          voucherCount={providerLinks.length}
          pendingVenueCount={venueApprovals.filter((venue) => venue.approval_status === "pending").length}
          pendingMerchantCount={(dashboard?.pending_merchants || []).length}
          lowBalanceCount={(dashboard?.low_balance_merchants || []).length}
        />
      ) : null}

      {activeFamily === "merchants" ? (
        <AdminMerchantsPage
          activeSection={activeSection}
          dashboard={dashboard}
          merchants={merchants}
          pendingMerchants={dashboard?.pending_merchants || []}
          venueApprovals={venueApprovals}
          addressChanges={addressChanges}
          offerSyncRequests={offerSyncRequests}
          offerSyncExport={offerSyncExport}
          areaLaunchDashboard={areaLaunchDashboard}
          areaLaunchPreview={areaLaunchPreview}
          areaLaunchMerchantId={areaLaunchMerchantId}
          areaLaunchNotes={areaLaunchNotes}
          busy={busy}
          loading={loading}
          formatDateTime={formatDateTime}
          onApproveAddress={approveAddress}
          onRejectAddress={rejectAddress}
          onApproveMerchant={approveMerchantAccount}
          onRejectMerchant={rejectMerchantAccount}
          onUpdateMerchant={updateMerchantAccount}
          onDeleteMerchant={deleteMerchantAccount}
          onApproveVenue={approveVenueRequest}
          onRejectVenue={rejectVenueRequest}
          onUpdateVenue={updateVenueRequest}
          onDeleteVenue={deleteVenueRequest}
          onSyncOfferRequest={syncOfferRequest}
          onRejectOfferRequest={rejectOfferRequestAction}
          onExportPreview={exportPreview}
          onAreaLaunchMerchantChange={setAreaLaunchMerchantId}
          onAreaLaunchNotesChange={setAreaLaunchNotes}
          onPreviewAreaLaunch={previewAreaLaunch}
          onSendAreaLaunch={sendAreaLaunch}
        />
      ) : null}

      {activeFamily === "venues" ? (
        <AdminVenuesPage
          activeSection={activeSection}
          dashboard={dashboard}
          merchants={merchants}
          venues={venueApprovals}
          addressChanges={addressChanges}
          busy={busy}
          loading={loading}
          formatDateTime={formatDateTime}
          onApproveMerchant={approveMerchantAccount}
          onApproveVenue={approveVenueRequest}
          onRejectVenue={rejectVenueRequest}
          onUpdateVenue={updateVenueRequest}
          onDeleteVenue={deleteVenueRequest}
          onApproveAddress={approveAddress}
          onRejectAddress={rejectAddress}
        />
      ) : null}

      {activeFamily === "users" ? (
        <AdminUsersPage
          activeSection={activeSection}
          dashboard={dashboard}
          fraudDashboard={fraudDashboard}
          whatsAppDashboard={whatsAppDashboard}
          templateForm={templateForm}
          templateNote={templateNote}
          editingTemplateId={editingTemplateId}
          busy={busy}
          setTemplateForm={setTemplateForm}
          setTemplateNote={setTemplateNote}
          resetTemplateForm={resetTemplateForm}
          applyTemplateToForm={applyTemplateToForm}
          saveWhatsAppTemplate={saveWhatsAppTemplate}
          installStarterPack={installStarterPack}
          submitTemplateForApproval={submitTemplateForApproval}
          simulateTemplateDecision={simulateTemplateDecision}
          markUserReviewed={markUserReviewed}
          blockUserAccount={blockUserAccount}
          unblockUserAccount={unblockUserAccount}
          formatDateTime={formatDateTime}
        />
      ) : null}

      {activeFamily === "vouchers" ? (
        <AdminVouchersPage
          activeSection={activeSection}
          dashboard={dashboard}
          providerLinks={providerLinks}
          providerLinkExport={providerLinkExport}
          voucherCreationExport={voucherCreationExport}
          integrationPlaybook={integrationPlaybook}
          merchants={merchants}
          selectedMerchant={selectedMerchant}
          linkForm={linkForm}
          uploadFile={uploadFile}
          loading={loading}
          busy={busy}
          setLinkForm={setLinkForm}
          setUploadFile={setUploadFile}
          onMerchantChange={onMerchantChange}
          saveProviderLink={saveProviderLink}
          uploadCsv={uploadCsv}
          downloadProviderTemplateCsv={downloadProviderTemplateCsv}
          copyGoogleSheetsRows={copyGoogleSheetsRows}
          downloadDriveReadyCsv={downloadDriveReadyCsv}
          downloadVenueVoucherCreationCsv={downloadVenueVoucherCreationCsv}
          updateProviderLink={updateProviderLinkRecord}
          deleteProviderLink={deleteProviderLinkRecord}
          formatDateTime={formatDateTime}
          circulationModeLabel={circulationModeLabel}
        />
      ) : null}

      {activeFamily === "settings" && activeSection === "settings" ? (
        <AdminSettingsPage dashboard={dashboard} />
      ) : null}

      {activeFamily === "settings" && activeSection === "settings-whatsapp" ? (
        <AdminUsersPage
          activeSection={"users-whatsapp"}
          dashboard={dashboard}
          fraudDashboard={fraudDashboard}
          whatsAppDashboard={whatsAppDashboard}
          templateForm={templateForm}
          templateNote={templateNote}
          editingTemplateId={editingTemplateId}
          busy={busy}
          setTemplateForm={setTemplateForm}
          setTemplateNote={setTemplateNote}
          resetTemplateForm={resetTemplateForm}
          applyTemplateToForm={applyTemplateToForm}
          saveWhatsAppTemplate={saveWhatsAppTemplate}
          installStarterPack={installStarterPack}
          submitTemplateForApproval={submitTemplateForApproval}
          simulateTemplateDecision={simulateTemplateDecision}
          markUserReviewed={markUserReviewed}
          blockUserAccount={blockUserAccount}
          unblockUserAccount={unblockUserAccount}
          formatDateTime={formatDateTime}
        />
      ) : null}

      {activeFamily === "settings" && activeSection === "settings-integrations" ? (
        <AdminVouchersPage
          activeSection={"vouchers-integrations"}
          dashboard={dashboard}
          providerLinks={providerLinks}
          providerLinkExport={providerLinkExport}
          voucherCreationExport={voucherCreationExport}
          integrationPlaybook={integrationPlaybook}
          merchants={merchants}
          selectedMerchant={selectedMerchant}
          linkForm={linkForm}
          uploadFile={uploadFile}
          loading={loading}
          busy={busy}
          setLinkForm={setLinkForm}
          setUploadFile={setUploadFile}
          onMerchantChange={onMerchantChange}
          saveProviderLink={saveProviderLink}
          uploadCsv={uploadCsv}
          downloadProviderTemplateCsv={downloadProviderTemplateCsv}
          copyGoogleSheetsRows={copyGoogleSheetsRows}
          downloadDriveReadyCsv={downloadDriveReadyCsv}
          downloadVenueVoucherCreationCsv={downloadVenueVoucherCreationCsv}
          updateProviderLink={updateProviderLinkRecord}
          deleteProviderLink={deleteProviderLinkRecord}
          formatDateTime={formatDateTime}
          circulationModeLabel={circulationModeLabel}
        />
      ) : null}
    </AppShell>
  );
}
