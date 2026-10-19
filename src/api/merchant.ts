import api from "./axios";
import type {
  ApiResponse,
  InformationRecord,
  InformationRecordListPayload,
  MerchantOfferSettings,
  MerchantVenueProfile,
  PaginatedPayload,
  Voucher,
  WalletAlertStatus,
  WalletTransaction,
  Venue,
} from "@/types";

interface MerchantBusinessRuleSnapshot {
  resolved_plan?: "free_trial" | "payg";
  free_trial_status?: string | null;
  free_trial_message?: string | null;
  free_trial_ineligible_reason?: string | null;
  blocked_keywords?: string[];
  minimum_top_up_amount?: string;
  [key: string]: any;
}

export interface MerchantDashboardResponse {
  merchant: {
    id?: number;
    business_name: string;
    business_type?: string | null;
    status?: string | null;
    onboarding_plan?: "free_trial" | "payg";
    free_trial_status?: string | null;
    free_trial_message?: string | null;
    free_trial_ineligible_reason?: string | null;
    trial_blocked_keywords?: string[];
    business_rules?: MerchantBusinessRuleSnapshot;
    wallet: {
      balance: string;
      low_balance_threshold: string;
      auto_top_up_enabled: boolean;
      auto_top_up_amount: string;
      minimum_top_up_amount?: string;
      last_alert_at?: string | null;
      alert_status: WalletAlertStatus;
    };
  };
  stats: {
    active_venues: number;
    issued_vouchers: number;
    redeemed_vouchers: number;
    wallet_balance: string;
  };
  primary_venue?: Venue | null;
  offer_snapshot?: MerchantOfferSettings | null;
  address_change?: { latest_request?: Record<string, any> | null; [key: string]: any } | null;
  exact_voucher_links?: Record<string, any> | null;
  recent_vouchers: Voucher[];
  recent_transactions: WalletTransaction[];
  [key: string]: any;
}

export interface OfferSettingsPayload {
  offer_enabled: boolean;
  business_type: string;
  offer_type: "food" | "ride" | "dual_choice";
  voucher_amount: number;
  offer_days: string[];
  start_time: string | null;
  end_time: string | null;
  minimum_order: number | null;
  fulfilment_type: string | null;
  ride_trip_type: "to_venue" | "to_and_from" | null;
  low_balance_threshold: number;
  auto_top_up_enabled: boolean;
  auto_top_up_amount: number;
}

export interface MerchantCreateVoucherPayload {
  user_name: string;
  user_email?: string | null;
  user_phone?: string | null;
  journey_type: "ride" | "food";
  voucher_value?: number | null;
  promo_message?: string | null;
}

export interface VenueProfilePayload {
  business_name: string;
  business_type: string;
  venue_name: string;
  address?: string | null;
  city?: string | null;
  postcode: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
}

export interface MerchantVenuePayload {
  name: string;
  category: string;
  address?: string | null;
  city?: string | null;
  postcode: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  promo_message?: string | null;
}

export interface MerchantInformationPayload {
  venue_id?: number | null;
  category?: string | null;
  title: string;
  content: string;
}

export interface MerchantListParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category?: string;
  journey_type?: string;
  type?: string;
  paginated?: boolean;
}

function cleanMerchantQueryParams<T extends Record<string, any> | undefined>(params?: T): Record<string, any> | undefined {
  if (!params) return undefined;
  const cleaned: Record<string, any> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || typeof value === "undefined" || value === "") return;
    cleaned[key] = typeof value === "boolean" ? (value ? 1 : 0) : value;
  });

  return cleaned;
}

export const merchantApi = {
  getOfferSettings: () => api.get<ApiResponse<MerchantOfferSettings>>("/merchant/offer-settings"),
  updateOfferSettings: (payload: OfferSettingsPayload) =>
    api.put<ApiResponse<MerchantOfferSettings>>("/merchant/offer-settings", payload),
  getDashboard: () => api.get<ApiResponse<MerchantDashboardResponse>>("/merchant/dashboard"),
  getVenueProfile: () => api.get<ApiResponse<MerchantVenueProfile>>("/merchant/venue-profile"),
  updateVenueProfile: (payload: VenueProfilePayload) =>
    api.put<ApiResponse<MerchantVenueProfile>>("/merchant/venue-profile", payload),
  topUpWallet: (amount: number) =>
    api.post<ApiResponse<{ wallet: MerchantDashboardResponse["merchant"]["wallet"]; alert_status: WalletAlertStatus }>>(
      "/merchant/wallet/top-up",
      { amount }
    ),
  sendTestLowBalanceAlert: () =>
    api.post<ApiResponse<{ sent: boolean; reason: string; channels: string[]; status: WalletAlertStatus }>>(
      "/merchant/wallet/alerts/test"
    ),
  createStripeTopUpCheckout: (amount: number, mode: "manual" | "auto_top_up" = "manual") =>
    api.post<ApiResponse<{ intent: import("@/types").StripeTopUpIntent }>>("/merchant/wallet/stripe-checkout", { amount, mode }),
  simulateStripeTopUpSuccess: (checkoutCode: string) =>
    api.post<ApiResponse<{ intent: import("@/types").StripeTopUpIntent }>>(`/merchant/wallet/stripe-checkout/${checkoutCode}/simulate-success`),
  createVoucher: (payload: MerchantCreateVoucherPayload) =>
    api.post<ApiResponse<{ voucher: Voucher; wallet: MerchantDashboardResponse["merchant"]["wallet"] }>>(
      "/merchant/vouchers",
      payload
    ),
  redeemVoucher: (voucherId: number) =>
    api.post<ApiResponse<{ wallet: MerchantDashboardResponse["merchant"]["wallet"]; voucher: Voucher; low_balance_alert: { sent: boolean; reason: string; channels: string[]; status: WalletAlertStatus } }>>(
      `/merchant/vouchers/${voucherId}/redeem`
    ),
  getInformation: () => api.get<ApiResponse<InformationRecordListPayload>>("/merchant/information"),
  createInformation: (payload: MerchantInformationPayload) =>
    api.post<ApiResponse<{ record: InformationRecord }>>("/merchant/information", payload),
  updateInformation: (recordId: number, payload: MerchantInformationPayload) =>
    api.put<ApiResponse<{ record: InformationRecord }>>(`/merchant/information/${recordId}`, payload),
  deleteInformation: (recordId: number) =>
    api.delete<ApiResponse<[]>>(`/merchant/information/${recordId}`),
  getVenues: () => api.get<ApiResponse<Venue[]>>("/merchant/venues"),
  getPaginatedVenues: async (params: MerchantListParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedPayload<Venue>>>("/merchant/venues", {
      params: cleanMerchantQueryParams({ ...params, paginated: true }),
    });
    return response.data.data;
  },
  createVenue: (payload: MerchantVenuePayload) =>
    api.post<ApiResponse<{ venue: Venue }>>("/merchant/venues", payload),
  updateVenue: (venueId: number, payload: MerchantVenuePayload) =>
    api.put<ApiResponse<{ venue: Venue }>>(`/merchant/venues/${venueId}`, payload),
  deleteVenue: (venueId: number) =>
    api.delete<ApiResponse<[]>>(`/merchant/venues/${venueId}`),
  getWalletTransactions: () => api.get<ApiResponse<WalletTransaction[]>>("/merchant/wallet/transactions"),
  getPaginatedWalletTransactions: async (params: MerchantListParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedPayload<WalletTransaction>>>("/merchant/wallet/transactions", {
      params: cleanMerchantQueryParams({ ...params, paginated: true }),
    });
    return response.data.data;
  },
  getVouchers: () => api.get<ApiResponse<Voucher[]>>("/merchant/vouchers"),
  getPaginatedVouchers: async (params: MerchantListParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedPayload<Voucher>>>("/merchant/vouchers", {
      params: cleanMerchantQueryParams({ ...params, paginated: true }),
    });
    return response.data.data;
  },
};
