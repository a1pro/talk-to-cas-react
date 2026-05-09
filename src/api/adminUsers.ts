import api from "@/api/axios";
import type { ApiResponse, FraudAdminPayload } from "@/types";

export async function getFraudAdminDashboard(): Promise<FraudAdminPayload> {
  const response = await api.get<ApiResponse<FraudAdminPayload>>("/admin/fraud/users");
  return response.data.data;
}

export async function reviewFraudUser(userId: number, notes?: string) {
  const response = await api.post<ApiResponse<Record<string, any>>>(`/admin/fraud/users/${userId}/review`, {
    notes,
  });

  return response.data.data;
}

export async function blockFraudUser(userId: number, reason?: string, days = 30) {
  const response = await api.post<ApiResponse<Record<string, any>>>(`/admin/fraud/users/${userId}/block`, {
    reason,
    days,
  });

  return response.data.data;
}

export async function unblockFraudUser(userId: number, notes?: string) {
  const response = await api.post<ApiResponse<Record<string, any>>>(`/admin/fraud/users/${userId}/unblock`, {
    notes,
  });

  return response.data.data;
}
