import api from "@/api/axios";
import type { ApiResponse, WhatsAppAdminPayload, WhatsAppStarterPackResult, WhatsAppTemplateRecord } from "@/types";

export interface WhatsAppTemplatePayload {
  key: string;
  channel?: string;
  journey_type?: string;
  weather_condition?: string;
  emoji?: string;
  body: string;
  is_active?: boolean;
  sort_order?: number;
  category?: string;
  language?: string;
}

export async function getWhatsAppAdminDashboard(): Promise<WhatsAppAdminPayload> {
  const response = await api.get<ApiResponse<WhatsAppAdminPayload>>("/admin/whatsapp/templates");
  return response.data.data;
}

export async function installWhatsAppStarterPack(overwrite_existing = false): Promise<{ dashboard: WhatsAppAdminPayload; result: WhatsAppStarterPackResult }> {
  const response = await api.post<ApiResponse<{ dashboard: WhatsAppAdminPayload; result: WhatsAppStarterPackResult }>>(
    "/admin/whatsapp/templates/starter-pack",
    { overwrite_existing },
  );
  return response.data.data;
}

export async function createWhatsAppTemplate(payload: WhatsAppTemplatePayload): Promise<WhatsAppAdminPayload> {
  const response = await api.post<ApiResponse<{ template: WhatsAppTemplateRecord; dashboard: WhatsAppAdminPayload }>>("/admin/whatsapp/templates", payload);
  return response.data.data.dashboard;
}

export async function updateWhatsAppTemplate(templateId: number, payload: Partial<WhatsAppTemplatePayload>): Promise<WhatsAppAdminPayload> {
  const response = await api.put<ApiResponse<{ template: WhatsAppTemplateRecord; dashboard: WhatsAppAdminPayload }>>(
    `/admin/whatsapp/templates/${templateId}`,
    payload,
  );
  return response.data.data.dashboard;
}

export async function submitWhatsAppTemplate(templateId: number): Promise<WhatsAppAdminPayload> {
  const response = await api.post<ApiResponse<{ dashboard: WhatsAppAdminPayload }>>(`/admin/whatsapp/templates/${templateId}/submit`);
  return response.data.data.dashboard;
}

export async function simulateWhatsAppTemplateApproval(
  templateId: number,
  approval_status: "approved" | "rejected",
  approval_notes?: string,
): Promise<WhatsAppAdminPayload> {
  const response = await api.post<ApiResponse<{ dashboard: WhatsAppAdminPayload }>>(
    `/admin/whatsapp/templates/${templateId}/simulate-approval`,
    { approval_status, approval_notes },
  );
  return response.data.data.dashboard;
}
