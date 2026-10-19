import api from "@/api/axios";
import type { ApiResponse, IntegrationPlaybookPayload } from "@/types";

export async function getIntegrationPlaybook(): Promise<IntegrationPlaybookPayload> {
  const response = await api.get<ApiResponse<IntegrationPlaybookPayload>>("/admin/integrations/playbook");
  return response.data.data;
}
