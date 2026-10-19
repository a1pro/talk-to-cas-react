import api from "@/api/axios";
import type { AffiliatePayoutProfile, ApiResponse, StripePayoutRun } from "@/types";

export async function updateAffiliatePayoutProfile(payload: {
  payout_email?: string | null;
  country_code?: string | null;
  currency?: string | null;
}) {
  const response = await api.patch<ApiResponse<{ payout_profile: AffiliatePayoutProfile }>>(
    "/user/affiliate/payout-profile",
    payload
  );
  return response.data.data.payout_profile;
}

export async function startAffiliatePayoutOnboarding() {
  const response = await api.post<ApiResponse<{ payout_profile: AffiliatePayoutProfile }>>(
    "/user/affiliate/payout-profile/onboarding"
  );
  return response.data.data.payout_profile;
}

export async function simulateAffiliatePayoutApproval() {
  const response = await api.post<ApiResponse<{ payout_profile: AffiliatePayoutProfile }>>(
    "/user/affiliate/payout-profile/simulate-approval"
  );
  return response.data.data.payout_profile;
}


export async function createAffiliatePayoutRun() {
  const response = await api.post<ApiResponse<{ payout_profile: AffiliatePayoutProfile; payout_run: StripePayoutRun }>>(
    "/user/affiliate/payouts"
  );
  return response.data.data;
}

export async function simulateAffiliatePayoutRun(payoutCode: string) {
  const response = await api.post<ApiResponse<{ payout_profile: AffiliatePayoutProfile; payout_run: StripePayoutRun }>>(
    `/user/affiliate/payouts/${payoutCode}/simulate-paid`
  );
  return response.data.data;
}
