import api from "@/api/axios";
import type { ApiResponse, LeadGeneratorPayload } from "@/types";

export interface CreateLeadPayload {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  postcode: string;
  city?: string;
  journey_type: "nightlife" | "food";
  flow_type?: "going_out" | "order_food";
  desired_venue_name?: string;
  desired_category?: string;
  source?: "discovery_no_results" | "waiting_list" | "manual" | "tag_missing_venue";
  notes?: string;
  utm_source?: string;
  submitted_from?: string;
  contact_consent: boolean;
}

export async function createLead(payload: CreateLeadPayload): Promise<LeadGeneratorPayload> {
  const response = await api.post<ApiResponse<LeadGeneratorPayload>>("/lead-generator", payload);
  return response.data.data;
}
