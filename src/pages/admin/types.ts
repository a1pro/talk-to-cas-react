import type { FraudAdminPayload, OfferSyncRequestRecord, ProviderVoucherLinkRecord, Venue, VenueAddressChangeRecord, WalletTransaction, WhatsAppAdminPayload } from "@/types";

export type AdminSection =
  | "merchants"
  | "merchant-pending"
  | "merchant-approved"
  | "merchant-rejected"
  | "merchant-finance"
  | "merchant-venues"
  | "merchant-address"
  | "merchant-offer-sync"
  | "merchant-area-launch"
  | "overview"
  | "venues"
  | "venue-pending"
  | "venue-approvals"
  | "venue-approved"
  | "venue-rejected"
  | "venue-address"
  | "settings"
  | "settings-whatsapp"
  | "settings-integrations"
  | "users"
  | "users-whatsapp"
  | "vouchers-records"
  | "vouchers-create"
  | "vouchers-upload"
  | "vouchers-download"
  | "vouchers-integrations";

export interface AdminVenueLite {
  id: number;
  name: string;
  category: string;
  city?: string | null;
  postcode?: string | null;
  [key: string]: any;
}

export interface AdminMerchant {
  id: number;
  business_name: string;
  business_type: string;
  status: string;
  contact_email?: string | null;
  user_is_active?: boolean;
  is_approved?: boolean;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    is_active?: boolean;
    [key: string]: any;
  } | null;
  wallet?: {
    balance: string;
    low_balance_threshold: string;
    [key: string]: any;
  } | null;
  venues: AdminVenueLite[];
  [key: string]: any;
}

export interface AreaLaunchAlertRunLite {
  id: number;
  status: string;
  trigger_source?: string | null;
  postcode_prefix?: string | null;
  city?: string | null;
  attempted_count?: number;
  sent_count?: number;
  failed_count?: number;
  notes?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
  merchant?: { id: number; business_name: string } | null;
  venue?: { id: number; name: string } | null;
  triggered_by?: { id: number; name: string } | null;
  audience_breakdown?: Record<string, any>;
}

export interface AreaLaunchAlertPreviewPayload {
  merchant_id: number;
  merchant_name: string;
  journey_type?: string | null;
  coverage?: {
    venue_id?: number | null;
    venue_name?: string | null;
    city?: string | null;
    postcode?: string | null;
    postcode_prefix?: string | null;
  };
  offer?: {
    offer_type?: string | null;
    ride_trip_type?: string | null;
    offer_value?: string | null;
    minimum_order?: string | null;
  };
  audience?: {
    registered_users?: number;
    waiting_list_leads?: number;
    unique_email_count?: number;
    sample_recipients?: Array<{ email: string; source: string; postcode?: string | null }>;
  };
  recent_runs?: AreaLaunchAlertRunLite[];
}

export interface AreaLaunchDashboardPayload {
  summary?: Record<string, any>;
  items?: AreaLaunchAlertRunLite[];
}

export interface IntegrationPlaybookPayloadLocal {
  urls?: Record<string, string | null>;
  examples?: Record<string, { title?: string; payload?: any; curl?: string | null; notes?: string | null }>;
  records?: Record<string, string | null>;
  signature_headers?: Record<string, string>;
}

export interface AdminPayload {
  stats: {
    total_users: number;
    total_merchants: number;
    total_venues: number;
    issued_vouchers: number;
    redeemed_vouchers: number;
    wallet_debits_total: number;
    flagged_users?: number;
    blocked_users?: number;
    [key: string]: any;
  };
  low_balance_merchants: AdminMerchant[];
  recent_transactions: WalletTransaction[];
  pending_merchants?: AdminMerchant[];
  pending_venues?: Venue[];
  offer_sync?: {
    summary?: Record<string, any>;
    items?: OfferSyncRequestRecord[];
    [key: string]: any;
  };
  address_changes?: {
    summary?: Record<string, any>;
    items?: VenueAddressChangeRecord[];
    [key: string]: any;
  };
  provider_voucher_links?: {
    summary?: Record<string, any>;
    items?: ProviderVoucherLinkRecord[];
    [key: string]: any;
  };
  whatsapp_templates?: WhatsAppAdminPayload & {
    preview?: Array<{ id?: number; key?: string; journey_type?: string | null; body?: string }>;
  };
  [key: string]: any;
}

export interface LinkFormState {
  merchant_id: string;
  venue_id: string;
  business_type: string;
  provider: "uber" | "ubereats";
  link_url: string;
  offer_type: "food" | "ride" | "dual_choice";
  ride_trip_type: "to_venue" | "to_and_from";
  voucher_amount: string;
  minimum_order: string;
  location_postcode: string;
  start_time: string;
  end_time: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  circulation_mode: "shared_sequence" | "unique_individual";
  max_issue_count: string;
  source_label: string;
  notes: string;
}

export interface TemplateFormState {
  key: string;
  channel: string;
  journey_type: string;
  weather_condition: string;
  emoji: string;
  body: string;
  is_active: boolean;
  sort_order: string;
  category: string;
  language: string;
}

export interface AdminUsersDashboardData {
  dashboard: AdminPayload | null;
  fraudDashboard: FraudAdminPayload | null;
  whatsAppDashboard: WhatsAppAdminPayload | null;
}
