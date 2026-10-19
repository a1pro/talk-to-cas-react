import api from "@/api/axios";
import type {
  ApiResponse,
  ProviderVoucherLinkRecord,
  ProviderVoucherLinkExportPayload,
  ProviderVoucherCreationExportPayload,
  ProviderVoucherLinkSummary,
  VenueAddressChangeRecord,
  Venue,
} from "@/types";
import type { AdminMerchant } from "@/pages/admin/types";

function cleanAdminQueryParams<T extends Record<string, any> | undefined>(params?: T): Record<string, any> | undefined {
  if (!params) {
    return undefined;
  }

  const cleaned: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || typeof value === "undefined" || value === "") {
      return;
    }

    cleaned[key] = typeof value === "boolean" ? (value ? 1 : 0) : value;
  });

  return cleaned;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface AdminPaginatedPayload<T> {
  summary?: Record<string, any>;
  items: T[];
  pagination?: PaginationMeta;
}

export interface AdminMerchantUpdatePayload {
  business_name?: string;
  business_type?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  whatsapp_number?: string | null;
  default_service_fee?: number | null;
  status?: "pending" | "active" | "inactive" | "rejected";
  user_name?: string | null;
  user_email?: string | null;
  user_is_active?: boolean;
  wallet_low_balance_threshold?: number | null;
}

export interface AdminVenueUpdatePayload {
  merchant_id?: number | null;
  name?: string;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  is_active?: boolean;
  approval_status?: "pending" | "approved" | "rejected";
  venue_code?: string | null;
  rejection_reason?: string | null;
  offer_enabled?: boolean;
  offer_value?: number | null;
  minimum_order?: number | null;
  fulfilment_type?: string | null;
  urgency_enabled?: boolean;
  daily_voucher_cap?: number | null;
  offer_type?: "food" | "ride" | "dual_choice" | null;
  ride_trip_type?: "to_venue" | "to_and_from" | null;
  promo_message?: string | null;
}

export interface ProviderVoucherLinkPayload {
  merchant_id?: number | null;
  venue_id?: number | null;
  venue_code?: string | null;
  provider?: "uber" | "ubereats";
  link_url?: string;
  offer_type?: "food" | "ride" | "dual_choice";
  ride_trip_type?: "to_venue" | "to_and_from" | null;
  voucher_amount?: number | null;
  minimum_order?: number | null;
  location_postcode?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  circulation_mode?: "shared_sequence" | "unique_individual" | null;
  max_issue_count?: number | null;
  source_label?: string | null;
  notes?: string | null;
}

export async function getAddressChangeRequests(status: string = "pending", limit = 25) {
  const response = await api.get<ApiResponse<{ summary: Record<string, any>; items: VenueAddressChangeRecord[] }>>(
    "/admin/address-change-requests",
    { params: { status, limit } }
  );

  return response.data.data;
}

export async function approveAddressChangeRequest(id: number, admin_notes?: string) {
  const response = await api.post<ApiResponse<{ request: VenueAddressChangeRecord; dashboard: Record<string, any> }>>(
    `/admin/address-change-requests/${id}/approve`,
    { admin_notes }
  );

  return response.data.data;
}

export async function rejectAddressChangeRequest(id: number, admin_notes?: string) {
  const response = await api.post<ApiResponse<{ request: VenueAddressChangeRecord; dashboard: Record<string, any> }>>(
    `/admin/address-change-requests/${id}/reject`,
    { admin_notes }
  );

  return response.data.data;
}

export async function getAdminMerchants(params?: {
  status?: "all" | "pending" | "approved" | "active" | "inactive" | "rejected";
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<AdminMerchant[] | AdminPaginatedPayload<AdminMerchant>> {
  const response = await api.get<ApiResponse<AdminMerchant[] | AdminPaginatedPayload<AdminMerchant>>>("/admin/merchants", {
    params: cleanAdminQueryParams(params),
  });

  return response.data.data;
}

export async function updateAdminMerchant(merchantId: number, payload: AdminMerchantUpdatePayload) {
  const response = await api.put<ApiResponse<{ merchant: AdminMerchant }>>(`/admin/merchants/${merchantId}`, payload);
  return response.data.data;
}

export async function deleteAdminMerchant(merchantId: number) {
  const response = await api.delete<ApiResponse<{ deleted: boolean }>>(`/admin/merchants/${merchantId}`);
  return response.data.data;
}

export async function getProviderVoucherLinks(paramsOrLimit: number | {
  limit?: number;
  page?: number;
  per_page?: number;
  merchant_id?: number | null;
  provider?: "uber" | "ubereats" | null;
  active_only?: boolean;
  search?: string | null;
} = 25): Promise<ProviderVoucherLinkSummary & { pagination?: PaginationMeta }> {
  const params = typeof paramsOrLimit === "number" ? { limit: paramsOrLimit } : paramsOrLimit;
  const response = await api.get<ApiResponse<{ summary: Record<string, any>; items: ProviderVoucherLinkRecord[]; pagination?: PaginationMeta }>>(
    "/admin/provider-voucher-links",
    { params: cleanAdminQueryParams(params) }
  );

  return response.data.data;
}

export async function createProviderVoucherLink(payload: ProviderVoucherLinkPayload & {
  merchant_id: number;
  provider: "uber" | "ubereats";
  link_url: string;
  offer_type: "food" | "ride" | "dual_choice";
}) {
  const response = await api.post<ApiResponse<{ record: ProviderVoucherLinkRecord; summary: Record<string, any> }>>(
    "/admin/provider-voucher-links",
    payload
  );

  return response.data.data;
}

export async function updateProviderVoucherLink(id: number, payload: ProviderVoucherLinkPayload) {
  const response = await api.put<ApiResponse<{ record: ProviderVoucherLinkRecord; summary: Record<string, any> }>>(
    `/admin/provider-voucher-links/${id}`,
    payload
  );

  return response.data.data;
}

export async function deleteProviderVoucherLink(id: number) {
  const response = await api.delete<ApiResponse<{ deleted: boolean; summary: Record<string, any> }>>(
    `/admin/provider-voucher-links/${id}`
  );

  return response.data.data;
}

export async function uploadProviderVoucherLinks(formData: FormData) {
  const response = await api.post<ApiResponse<{ count: number; summary: Record<string, any>; items: ProviderVoucherLinkRecord[] }>>(
    "/admin/provider-voucher-links/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data.data;
}

export async function getProviderVoucherLinkTemplate(): Promise<ProviderVoucherLinkExportPayload> {
  const response = await api.get<ApiResponse<ProviderVoucherLinkExportPayload>>("/admin/provider-voucher-links/template");
  return response.data.data;
}

export async function exportProviderVoucherLinks(params?: {
  limit?: number;
  merchant_id?: number | null;
  provider?: "uber" | "ubereats" | null;
  active_only?: boolean;
  source_label?: string | null;
  import_batch_code?: string | null;
}): Promise<ProviderVoucherLinkExportPayload> {
  const response = await api.get<ApiResponse<ProviderVoucherLinkExportPayload>>("/admin/provider-voucher-links/export", {
    params: cleanAdminQueryParams(params),
  });

  return response.data.data;
}

export async function exportVenueVoucherCreationRows(params?: {
  limit?: number;
  merchant_id?: number | null;
  provider?: "uber" | "ubereats" | null;
  missing_only?: boolean;
}): Promise<ProviderVoucherCreationExportPayload> {
  const response = await api.get<ApiResponse<ProviderVoucherCreationExportPayload>>("/admin/provider-voucher-links/venue-export", {
    params: cleanAdminQueryParams(params),
  });

  return response.data.data;
}

export async function approveMerchantApplication(merchantId: number) {
  const response = await api.post<ApiResponse<Record<string, any>>>(`/admin/merchant-applications/${merchantId}/approve`);
  return response.data.data;
}

export async function rejectMerchantApplication(merchantId: number) {
  const response = await api.post<ApiResponse<Record<string, any>>>(`/admin/merchant-applications/${merchantId}/reject`);
  return response.data.data;
}

export async function getVenueApprovalQueue(status: "all" | "pending" | "approved" | "rejected" = "pending", limit = 50) {
  const response = await api.get<ApiResponse<{ summary: Record<string, any>; items: Venue[] }>>(
    "/admin/venues",
    { params: { status, limit } }
  );

  return response.data.data;
}

export async function updateAdminVenue(venueId: number, payload: AdminVenueUpdatePayload) {
  const response = await api.put<ApiResponse<{ venue: Venue }>>(`/admin/venues/${venueId}`, payload);
  return response.data.data;
}

export async function deleteAdminVenue(venueId: number) {
  const response = await api.delete<ApiResponse<{ deleted: boolean }>>(`/admin/venues/${venueId}`);
  return response.data.data;
}

export async function approveVenue(venueId: number, venue_code: string) {
  console.log("API: approveVenue called with:", { venueId, venue_code });
  try {
    const response = await api.post<ApiResponse<{ venue: Venue }>>(`/admin/venues/${venueId}/approve`, {
      venue_code,
    });
    console.log("API: approveVenue success:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("API: approveVenue error:", error);
    throw error;
  }
}

export async function rejectVenue(venueId: number, reason?: string) {
  const response = await api.post<ApiResponse<{ venue: Venue }>>(`/admin/venues/${venueId}/reject`, {
    reason,
  });

  return response.data.data;
}
