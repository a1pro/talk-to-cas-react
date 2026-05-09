import api from "@/api/axios";
import type { ApiResponse, ChatSessionPayload } from "@/types";

export async function startWebsiteChatSession(
  phone: string,
  name = "Website visitor",
  mirrorToWhatsApp = true,
): Promise<ChatSessionPayload> {
  const response = await api.post<ApiResponse<ChatSessionPayload>>("/whatsapp/sessions", {
    phone,
    name,
    channel: "web_widget",
    mirror_to_whatsapp: mirrorToWhatsApp,
  });

  return response.data.data;
}

export async function sendWebsiteChatMessage(sessionId: number, message: string): Promise<ChatSessionPayload> {
  const response = await api.post<ApiResponse<ChatSessionPayload>>(`/whatsapp/sessions/${sessionId}/messages`, {
    message,
  });

  return response.data.data;
}

export async function sendWebsiteChatLocation(
  sessionId: number,
  payload: { postcode?: string; latitude?: number; longitude?: number },
): Promise<ChatSessionPayload> {
  const response = await api.post<ApiResponse<ChatSessionPayload>>(`/whatsapp/sessions/${sessionId}/location`, payload);
  return response.data.data;
}

export async function selectWebsiteChatVenue(sessionId: number, venueId: number): Promise<ChatSessionPayload> {
  const response = await api.post<ApiResponse<ChatSessionPayload>>(`/whatsapp/sessions/${sessionId}/select-venue`, {
    venue_id: venueId,
  });

  return response.data.data;
}
