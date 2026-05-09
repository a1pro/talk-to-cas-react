import api from "./axios";
import type { ApiResponse } from "@/types";

export interface MerchantJoinEligibilityPayload {
  business_name?: string;
  business_type?: string;
  address?: string;
  city?: string;
  postcode?: string;
  venue_description?: string;
  requested_plan?: "free_trial" | "payg";
}

export interface MerchantJoinEligibilityResult {
  requested_plan?: "free_trial" | "payg";
  resolved_plan?: "free_trial" | "payg";
  free_trial_available?: boolean;
  free_trial_status?: string;
  free_trial_message?: string | null;
  free_trial_ineligible_reason?: string | null;
  blocked_keywords?: string[];
  normalized_trial_address?: string | null;
  minimum_top_up_amount?: string;
  same_address_match?: {
    merchant_id: number;
    business_name: string;
    joined_at?: string | null;
    [key: string]: any;
  } | null;
  [key: string]: any;
}

export async function getMerchantJoinEligibility(payload: MerchantJoinEligibilityPayload) {
  const response = await api.post<ApiResponse<MerchantJoinEligibilityResult>>(
    "/auth/register/merchant/eligibility",
    payload
  );

  return response.data.data;
}
