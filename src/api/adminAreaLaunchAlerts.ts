import api from "@/api/axios";
import type { ApiResponse, AreaLaunchAlertPreview, AreaLaunchAlertRunRecord } from "@/types";

export async function getAreaLaunchAlerts(limit = 8) {
  const response = await api.get<ApiResponse<{ summary: Record<string, any>; items: AreaLaunchAlertRunRecord[] }>>(
    "/admin/area-launch-alerts",
    { params: { limit } }
  );

  return response.data.data;
}

export async function getAreaLaunchAlertPreview(merchantId: number): Promise<AreaLaunchAlertPreview> {
  const response = await api.get<ApiResponse<{ preview: AreaLaunchAlertPreview }>>(
    `/admin/area-launch-alerts/${merchantId}/preview`
  );

  return response.data.data.preview;
}

export async function sendAreaLaunchAlert(merchantId: number, notes?: string) {
  const response = await api.post<ApiResponse<{ run: AreaLaunchAlertRunRecord; preview: AreaLaunchAlertPreview }>>(
    `/admin/area-launch-alerts/${merchantId}/send`,
    { notes }
  );

  return response.data.data;
}
