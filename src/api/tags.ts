import api from "@/api/axios";
import type { ApiResponse, TagInvite } from "@/types";

export async function createTagInvite(payload: {
  venue_name: string;
  inviter_name?: string;
  inviter_phone?: string;
  inviter_email?: string;
  venue_contact_email?: string;
  venue_contact_phone?: string;
  source_channel?: string;
}): Promise<TagInvite> {
  const response = await api.post<ApiResponse<{ tag: TagInvite }>>("/tags", payload);
  return response.data.data.tag;
}

export async function getTagInvite(shareCode: string): Promise<TagInvite> {
  const response = await api.get<ApiResponse<{ tag: TagInvite }>>(`/tags/${shareCode}`);
  return response.data.data.tag;
}

export async function resendTagInvite(shareCode: string): Promise<TagInvite> {
  const response = await api.post<ApiResponse<{ tag: TagInvite }>>(`/tags/${shareCode}/resend`);
  return response.data.data.tag;
}
