import api from "@/api/axios";
import type { ApiResponse, UserProviderProfile } from "@/types";

export async function updateUserProviderProfile(payload: {
  is_uber_existing_customer?: boolean | null;
  is_ubereats_existing_customer?: boolean | null;
}) {
  const response = await api.patch<ApiResponse<{ provider_profile: UserProviderProfile }>>(
    "/user/provider-profile",
    payload
  );

  return response.data.data.provider_profile;
}
