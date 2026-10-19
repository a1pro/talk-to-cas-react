import api from "@/api/axios";
import type { ApiResponse } from "@/types";

export interface ResolvedLocation {
  postcode?: string | null;
  postcode_prefix?: string | null;
  area_prefix?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  source?: "gps" | "postcode" | "open" | string;
  coordinates_source?: string | null;
  is_valid_postcode?: boolean | null;
  is_full_postcode?: boolean | null;
  geocoded_postcode?: boolean;
  formatted_address?: string | null;
  place_id?: string | null;
}

export interface LocationResolveResponse {
  location: ResolvedLocation;
  live_area?: {
    enabled?: boolean;
    is_live?: boolean;
    message?: string | null;
    [key: string]: any;
  } | null;
}

export async function resolveLocation(params: {
  postcode?: string;
  latitude?: number;
  longitude?: number;
}) {
  const response = await api.get<ApiResponse<LocationResolveResponse>>("/location/resolve", {
    params,
  });

  return response.data.data;
}
