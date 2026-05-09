import api from "@/api/axios";
import type { ApiResponse, Venue } from "@/types";

export interface AdminVenueInformationPayload {
  merchant_id: number | null;
  name: string;
  category: "club" | "bar" | "restaurant" | "takeaway" | "cafe" | string;
  address?: string | null;
  city?: string | null;
  postcode: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  promo_message?: string | null;
  approval_status?: "pending" | "approved" | "rejected";
  venue_code?: string | null;
  offer_type?: "ride" | "food" | "dual_choice" | "dual" | string | null;
  ride_trip_type?: "to_venue" | "to_and_from" | string | null;
  offer_value?: number | null;
  minimum_order?: number | null;
}

export interface VenueInformationListPayload {
  summary: Record<string, number>;
  items: Venue[];
  [key: string]: any;
}

export async function getAdminInformation(params?: {
  status?: "all" | "pending" | "approved" | "rejected";
  merchant_id?: number | null;
  search?: string;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<VenueInformationListPayload>>("/admin/information", { params });
  return response.data.data;
}

export async function createAdminInformation(payload: AdminVenueInformationPayload) {
  const response = await api.post<ApiResponse<{ venue: Venue; summary: Record<string, number> }>>("/admin/information", payload);
  return response.data.data;
}

export async function updateAdminInformation(id: number, payload: Partial<AdminVenueInformationPayload>) {
  const response = await api.put<ApiResponse<{ venue: Venue; summary: Record<string, number> }>>(`/admin/information/${id}`, payload);
  return response.data.data;
}

export async function approveInformation(id: number, venue_code: string) {
  const response = await api.post<ApiResponse<{ venue: Venue; summary: Record<string, number> }>>(`/admin/information/${id}/approve`, {
    venue_code,
  });
  return response.data.data;
}

export async function publishInformation(id: number, venue_code: string) {
  return approveInformation(id, venue_code);
}

export async function rejectInformation(id: number, reason?: string) {
  const response = await api.post<ApiResponse<{ venue: Venue; summary: Record<string, number> }>>(`/admin/information/${id}/reject`, { reason });
  return response.data.data;
}

export async function deleteInformation(id: number) {
  const response = await api.delete<ApiResponse<{ summary: Record<string, number> }>>(`/admin/information/${id}`);
  return response.data.data;
}

export async function exportInformation(format: "csv" | "excel" = "csv", filters?: { status?: string; merchant_id?: number | null }) {
  const response = await api.get<Blob>("/admin/information/export", {
    params: { format, ...filters },
    responseType: "blob",
  });

  return response.data;
}
