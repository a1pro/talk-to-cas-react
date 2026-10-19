import api from "./axios";
import type { ApiResponse, OfferSyncAdminPayload, OfferSyncExportPayload, OfferSyncRequestRecord } from "@/types";

export function getOfferSyncRequests(status: string = "pending", limit = 25) {
  return api
    .get<ApiResponse<{ items: OfferSyncRequestRecord[] }>>("/admin/offer-sync/requests", {
      params: { status, limit },
    })
    .then((response) => response.data.data.items);
}

export function exportOfferSyncCsvPreview() {
  return api
    .get<ApiResponse<OfferSyncExportPayload>>("/admin/offer-sync/export")
    .then((response) => response.data.data);
}

export function markOfferSyncAsSynced(id: number, admin_notes?: string) {
  return api
    .post<ApiResponse<{ request: OfferSyncRequestRecord; dashboard: OfferSyncAdminPayload }>>(
      `/admin/offer-sync/requests/${id}/mark-synced`,
      { admin_notes }
    )
    .then((response) => response.data);
}

export function rejectOfferSyncRequest(id: number, admin_notes?: string) {
  return api
    .post<ApiResponse<{ request: OfferSyncRequestRecord; dashboard: OfferSyncAdminPayload }>>(
      `/admin/offer-sync/requests/${id}/reject`,
      { admin_notes }
    )
    .then((response) => response.data);
}
