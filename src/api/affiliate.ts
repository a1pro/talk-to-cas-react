import api from "@/api/axios";
import type { AffiliateInvitePayload, AffiliateTestAlertPayload, ApiResponse } from "@/types";

export async function getAffiliateInvite(shareCode: string, track = true) {
  const response = await api.get<ApiResponse<AffiliateInvitePayload>>(`/affiliate/${encodeURIComponent(shareCode)}`, {
    params: { track },
  });
  return response.data.data;
}

export async function sendAffiliateTestAlert() {
  const response = await api.post<ApiResponse<AffiliateTestAlertPayload>>("/user/affiliate/test-alert");
  return response.data;
}
