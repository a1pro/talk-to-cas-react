export type Role = "user" | "merchant" | "admin";

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}


export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number | null;
  to?: number | null;
  [key: string]: any;
}

export interface PaginatedPayload<T> {
  summary?: Record<string, any>;
  items: T[];
  meta?: PaginationMeta;
  filters?: Record<string, any>;
  [key: string]: any;
}

export interface AuthUser {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  primary_role?: Role;
  roles?: Role[];
  postcode?: string | null;
  is_active?: boolean;
  [key: string]: any;
}

export interface WalletAlertStatus {
  level?: string;
  message?: string;
  sent?: boolean;
  channels?: string[];
  [key: string]: any;
}

export interface WalletTransaction {
  id: number;
  type: string;
  amount: string | number;
  balance_before?: string | number;
  balance_after?: string | number;
  reference?: string | null;
  notes?: string | null;
  created_at?: string | null;
  [key: string]: any;
}

export interface MerchantVenueProfile {
  merchant: {
    id: number;
    business_name: string;
    business_type?: string | null;
    joined_at?: string | null;
    [key: string]: any;
  };
  venue: Venue;
  address_change?: VenueAddressChangeMerchantPayload | null;
  [key: string]: any;
}

export interface MerchantOfferSettings {
  merchant?: {
    id: number;
    business_name: string;
    business_type?: string | null;
    joined_at?: string | null;
    [key: string]: any;
  };
  venue?: Venue;
  offer: {
    offer_enabled: boolean;
    voucher_amount: string | number;
    offer_days: string[];
    start_time?: string | null;
    end_time?: string | null;
    minimum_order?: string | number | null;
    fulfilment_type?: string | null;
    offer_type: "food" | "ride" | "dual_choice";
    ride_trip_type?: "to_venue" | "to_and_from" | null;
    ride_trip_type_label?: string | null;
    review_status?: string | null;
    urgency_enabled?: boolean;
    daily_voucher_cap?: string | null;
    [key: string]: any;
  };
  wallet?: {
    balance: string;
    low_balance_threshold: string;
    auto_top_up_enabled: boolean;
    auto_top_up_amount: string;
    alert_status?: WalletAlertStatus;
    [key: string]: any;
  };
  offer_rules?: {
    voucher_amount?: {
      min: number;
      max: number;
      default_value: number;
      label?: string;
    };
    minimum_order_default?: number | null;
    minimum_order_required?: boolean;
    offer_types?: Array<{ value: string; label: string; description?: string }>;
    ride_trip_types?: Array<{ value: string; label: string; description?: string }>;
    minimum_balance_for_two_trips?: string;
    [key: string]: any;
  };
  offer_sync?: OfferSyncAdminPayload | { summary?: any; pending_request?: OfferSyncRequestRecord | null; [key: string]: any } | null;
  address_change?: VenueAddressChangeMerchantPayload | null;
  exact_voucher_links?: ProviderVoucherLinkSummary | null;
  [key: string]: any;
}

export interface Venue {
  id: number;
  name: string;
  category?: string | null;
  city?: string | null;
  postcode?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  approval_status?: "pending" | "approved" | "rejected" | string | null;
  venue_code?: string | null;
  submitted_for_approval_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  offer_value?: string | number | null;
  minimum_order?: string | number | null;
  fulfilment_type?: string | null;
  distance_miles?: number | null;
  distance_label?: string | null;
  offer_type?: string | null;
  ride_trip_type?: string | null;
  weather_note?: string | null;
  urgency?: { level?: string; label?: string; [key: string]: any } | null;
  recommended_coupon?: {
    id?: number;
    title?: string | null;
    code?: string | null;
    provider?: string | null;
    discount_amount?: string | number | null;
    minimum_order?: string | number | null;
    is_new_customer_only?: boolean;
    eligibility_note?: string | null;
    eligibility_reason?: string | null;
    requires_profile_confirmation?: boolean;
    eligible_for_user?: boolean | null;
    status_badge?: string | null;
    provider_customer_state?: string | null;
    provider_customer_label?: string | null;
    profile_complete?: boolean;
    live_coupon_count?: number;
    eligible_coupon_count?: number;
    general_coupon_count?: number;
    new_customer_only_count?: number;
    filtered_out_new_customer_only_count?: number;
    filtered_out_minimum_order_count?: number;
    basket_total?: string | number | null;
    expires_at?: string | null;
    [key: string]: any;
  } | null;
  merchant?: { business_name?: string; business_type?: string; [key: string]: any };
  [key: string]: any;
}

export interface Voucher {
  id: number;
  code: string;
  status: string;
  journey_type?: string | null;
  promo_message?: string | null;
  voucher_value?: string | number | null;
  minimum_order?: string | number | null;
  service_fee?: string | number | null;
  total_charge?: string | number | null;
  issued_at?: string | null;
  expires_at?: string | null;
  redeemed_at?: string | null;
  venue?: Venue | null;
  user?: { id: number; name: string; email?: string | null; phone?: string | null; [key: string]: any } | null;
  provider_link_url?: string | null;
  [key: string]: any;
}

export interface OfferSyncRequestRecord {
  id: number;
  status: string;
  merchant_name?: string;
  venue_name?: string;
  changed_fields?: string[];
  requested_payload?: any;
  previous_payload?: any;
  admin_notes?: string | null;
  created_at?: string | null;
  [key: string]: any;
}

export interface OfferSyncAdminPayload {
  summary?: {
    pending?: number;
    synced?: number;
    rejected?: number;
    [key: string]: any;
  };
  items?: OfferSyncRequestRecord[];
  pending_request?: OfferSyncRequestRecord | null;
  export_ready?: boolean;
  [key: string]: any;
}

export interface OfferSyncExportPayload {
  generated_at?: string;
  csv_preview?: string;
  rows?: Array<Record<string, any>>;
  [key: string]: any;
}

export interface ProviderVoucherLinkRecord {
  id: number;
  merchant_id?: number;
  venue_id?: number | null;
  venue_code_reference?: string | null;
  provider: "uber" | "ubereats";
  link_url: string;
  offer_type?: string | null;
  ride_trip_type?: string | null;
  voucher_amount?: string | number | null;
  minimum_order?: string | number | null;
  location_postcode?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active?: boolean;
  circulation_mode?: "shared_sequence" | "unique_individual" | string | null;
  max_issue_count?: number | null;
  issued_count?: number | null;
  remaining_issue_count?: number | null;
  source_label?: string | null;
  notes?: string | null;
  merchant?: { id: number; business_name: string; [key: string]: any } | null;
  venue?: { id: number; name: string; postcode?: string | null; venue_code?: string | null; [key: string]: any } | null;
  creator?: { id: number; name: string; [key: string]: any } | null;
  created_at?: string | null;
  [key: string]: any;
}

export interface ProviderVoucherLinkSummary {
  summary?: {
    total?: number;
    active?: number;
    by_provider?: Record<string, number>;
    [key: string]: any;
  };
  items?: ProviderVoucherLinkRecord[];
  latest?: ProviderVoucherLinkRecord | null;
  meta?: PaginationMeta;
  filters?: Record<string, any>;
  [key: string]: any;
}



export interface ProviderVoucherCreationRow {
  venue_code?: string | null;
  uber_business_reference?: string | null;
  merchant_id?: number | string | null;
  merchant_name?: string | null;
  venue_id?: number | string | null;
  venue_name?: string | null;
  provider?: "uber" | "ubereats" | string | null;
  offer_type?: "food" | "ride" | "dual_choice" | string | null;
  ride_trip_type?: string | null;
  voucher_amount?: string | number | null;
  minimum_order?: string | number | null;
  location_postcode?: string | null;
  address?: string | null;
  city?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  max_issue_count?: string | number | null;
  has_uploaded_link?: "yes" | "no" | string | null;
  uploaded_link_count?: string | number | null;
  remaining_issue_count?: string | number | null;
  admin_note?: string | null;
  [key: string]: any;
}

export interface ProviderVoucherCreationExportPayload {
  generated_at?: string;
  headers?: string[];
  rows?: ProviderVoucherCreationRow[];
  csv?: string;
  tsv?: string;
  sheet_tab_name?: string;
  suggested_filename?: string;
  instructions?: string[];
  summary?: {
    approved_venues?: number;
    rows?: number;
    with_uploaded_links?: number;
    missing_uploaded_links?: number;
    [key: string]: any;
  };
  filters?: Record<string, any>;
  [key: string]: any;
}

export interface ProviderVoucherLinkExportPayload {
  generated_at?: string;
  headers?: string[];
  rows?: Array<Record<string, any>>;
  csv?: string;
  tsv?: string;
  sheet_tab_name?: string;
  suggested_filename?: string;
  instructions?: string[];
  batch_summary?: Array<{
    import_batch_code?: string | null;
    source_label?: string | null;
    record_count?: number;
    latest_created_at?: string | null;
    [key: string]: any;
  }>;
  filters?: Record<string, any>;
  [key: string]: any;
}

export interface VenueAddressChangeRecord {
  id: number;
  status: "pending" | "approved" | "rejected" | "superseded";
  merchant_id?: number;
  venue_id?: number;
  business_name?: string | null;
  venue_name?: string | null;
  previous_address?: string | null;
  previous_city?: string | null;
  previous_postcode?: string | null;
  requested_address?: string | null;
  requested_city?: string | null;
  requested_postcode?: string | null;
  requested_latitude?: number | null;
  requested_longitude?: number | null;
  reason?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
  decided_at?: string | null;
  [key: string]: any;
}

export interface VenueAddressChangeMerchantPayload {
  support_message?: string;
  can_edit_directly?: boolean;
  latest_request?: VenueAddressChangeRecord | null;
  summary?: {
    pending?: number;
    approved?: number;
    rejected?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface FraudUserSummary {
  id: number;
  name: string;
  email?: string | null;
  status?: string;
  signal_count?: number;
  [key: string]: any;
}

export interface FraudAdminPayload {
  summary: {
    flagged_users: number;
    blocked_users: number;
    pending_review_users: number;
    signals_last_7_days: number;
    [key: string]: any;
  };
  users: FraudUserSummary[];
  [key: string]: any;
}

export interface IntegrationReadinessPayload {
  status?: string;
  items?: Array<{ key: string; label: string; status: string; detail?: string; [key: string]: any }>;
  [key: string]: any;
}

export interface AdminCoupon {
  id: number;
  code?: string;
  provider?: string | null;
  status?: string;
  merchant_name?: string | null;
  venue_name?: string | null;
  [key: string]: any;
}

export interface AdminCouponListResponse {
  summary: {
    total: number;
    live: number;
    csv_uploaded: number;
    [key: string]: any;
  };
  items: AdminCoupon[];
  [key: string]: any;
}

export interface WhatsAppTemplateRecord {
  id: number;
  key?: string;
  body?: string;
  status?: string;
  channel?: string | null;
  journey_type?: string | null;
  weather_condition?: string | null;
  emoji?: string | null;
  category?: string | null;
  language?: string | null;
  sort_order?: number;
  is_active?: boolean;
  provider_template_id?: string | null;
  provider_template_name?: string | null;
  approval_status?: "draft" | "pending_approval" | "approved" | "rejected" | string;
  approval_notes?: string | null;
  last_submitted_at?: string | null;
  last_synced_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface WhatsAppProviderStatus {
  provider?: string;
  enabled?: boolean;
  display_phone_number?: string | null;
  connect_url?: string | null;
  templates_required?: boolean;
  allow_simulated_approval?: boolean;
  phase_message?: string;
  counts?: {
    total?: number;
    approved?: number;
    pending_approval?: number;
    approval_completion_rate?: number;
    [key: string]: any;
  };
  configuration?: Record<string, any>;
  [key: string]: any;
}

export interface WhatsAppStarterTemplatePreset {
  key: string;
  channel?: string | null;
  journey_type?: string | null;
  weather_condition?: string | null;
  emoji?: string | null;
  body: string;
  is_active?: boolean;
  sort_order?: number;
  category?: string | null;
  language?: string | null;
  [key: string]: any;
}

export interface WhatsAppStarterPackResult {
  created?: number;
  updated?: number;
  skipped?: number;
  overwrite_existing?: boolean;
  template_ids?: number[];
  [key: string]: any;
}

export interface WhatsAppAdminPayload {
  provider?: WhatsAppProviderStatus;
  summary?: Record<string, any>;
  templates?: WhatsAppTemplateRecord[];
  items?: WhatsAppTemplateRecord[];
  approved_template_keys?: string[];
  starter_templates?: WhatsAppStarterTemplatePreset[];
  [key: string]: any;
}

export interface UserProviderProfile {
  is_uber_existing_customer?: boolean | null;
  is_ubereats_existing_customer?: boolean | null;
  [key: string]: any;
}

export interface FraudUserStatus {
  status?: string;
  reasons?: string[];
  [key: string]: any;
}

export interface AffiliateDashboard {
  invite_url?: string;
  share_code?: string;
  clicks?: number;
  signups?: number;
  issued_vouchers?: number;
  redeemed_vouchers?: number;
  pending_commission?: string | number;
  paid_commission?: string | number;
  payouts?: StripePayoutRun[];
  qr_image_url?: string | null;
  share_message?: string | null;
  share_actions?: Record<string, string>;
  active_attribution_signups?: number;
  recent_signups_last_7_days?: number;
  last_shared_at?: string | null;
  conversion_rates?: {
    click_to_signup?: number;
    signup_to_issued?: number;
    signup_to_redeemed?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface AffiliateCommissionDashboard {
  enabled?: boolean;
  summary?: Record<string, any>;
  notification_summary?: Record<string, any>;
  recent_events?: Array<Record<string, any>>;
  weekly_reports?: Array<Record<string, any>>;
  monthly_reports?: Array<Record<string, any>>;
  [key: string]: any;
}

export interface AffiliatePayoutProfile {
  payout_email?: string | null;
  country_code?: string | null;
  currency?: string | null;
  onboarding_status?: string | null;
  stripe_account_id?: string | null;
  payouts?: StripePayoutRun[];
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  allow_simulated_success?: boolean;
  webhook_ready?: boolean;
  onboarding_url?: string | null;
  summary?: Record<string, any>;
  notification_summary?: Record<string, any>;
  payout_health?: Record<string, any>;
  recent_commissions?: Array<Record<string, any>>;
  recent_payouts?: StripePayoutRun[];
  weekly_reports?: Array<Record<string, any>>;
  monthly_reports?: Array<Record<string, any>>;
  [key: string]: any;
}

export interface AffiliateTestAlertPayload {
  sent?: boolean;
  channels?: string[];
  summary?: Record<string, any>;
  latest_week?: Record<string, any>;
  [key: string]: any;
}

export interface StripePayoutRun {
  id?: number;
  payout_code: string;
  amount?: string | number;
  total_amount?: string | number;
  status?: string;
  created_at?: string | null;
  paid_at?: string | null;
  [key: string]: any;
}

export interface StripeTopUpIntent {
  id?: number;
  checkout_code?: string;
  amount?: string | number;
  mode?: string;
  status?: string;
  checkout_url?: string | null;
  [key: string]: any;
}

export interface BnplPlan {
  key: string;
  name?: string;
  title?: string;
  amount_gbp?: string | number;
  description?: string | null;
  instalment_copy?: string | null;
  voucher_value?: string | number;
  service_fee?: string | number;
  total?: string | number;
  [key: string]: any;
}

export interface BnplOptionsPayload {
  plans?: BnplPlan[];
  recommended_plan_key?: string | null;
  provider?: string;
  merchant_of_record?: string;
  terms_summary?: string;
  compliance_message?: string;
  simulate_payment_available?: boolean;
  live_checkout_ready?: boolean;
  checkout_mode?: string;
  checkout_success_url?: string;
  checkout_cancel_url?: string;
  [key: string]: any;
}

export interface BnplVoucherOrder {
  id?: number;
  checkout_code?: string;
  status?: string;
  plan_key?: string;
  plan_name?: string;
  amount?: string | number;
  amount_gbp?: string | number;
  payment_provider?: string;
  payment_status?: string;
  voucher_status?: string;
  voucher_code?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  checkout_completed_at?: string | null;
  payment_confirmed_at?: string | null;
  voucher_issued_at?: string | null;
  metadata?: Record<string, any>;
  voucher_download_ready?: boolean;
  simulate_payment_available?: boolean;
  checkout_url?: string | null;
  review_url?: string | null;
  success_url?: string | null;
  cancel_url?: string | null;
  live_checkout_ready?: boolean;
  checkout_mode?: string;
  payment_reference?: string | null;
  failure_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: any;
}

export interface AffiliateInvitePayload {
  share_code?: string;
  invite_url?: string;
  inviter_name?: string | null;
  merchant_name?: string | null;
  qr_image_url?: string | null;
  share_message?: string | null;
  share_actions?: Record<string, string>;
  [key: string]: any;
}

export interface AffiliateTestAlertPayload {
  sent?: boolean;
  channel?: string | null;
  [key: string]: any;
}

export interface LeadGeneratorPayload {
  id?: number;
  customer_name?: string;
  postcode?: string;
  city?: string | null;
  journey_type?: string;
  created_at?: string | null;
  [key: string]: any;
}

export interface TagInvite {
  id?: number;
  share_code?: string;
  venue_name?: string;
  inviter_name?: string | null;
  inviter_email?: string | null;
  venue_contact_email?: string | null;
  public_url?: string | null;
  join_url?: string | null;
  share_message?: string | null;
  share_actions?: Record<string, string>;
  share_copy_variants?: Record<string, string>;
  invite_notifications?: {
    channels?: string[];
    last_sent_at?: string | null;
    email_sent?: boolean;
    whatsapp_sent?: boolean;
    delivery_attempted?: boolean;
    [key: string]: any;
  } | null;
  [key: string]: any;
}


export interface JourneyPreview {
  key: string;
  title?: string;
  count?: number;
  top_venue?: string | null;
  offer_hint?: string | null;
  [key: string]: any;
}

export interface EscalationItem {
  level: number;
  title?: string;
  message?: string;
  [key: string]: any;
}

export interface EscalationPayload {
  highest_level?: number;
  headline?: string | null;
  items?: EscalationItem[];
  upgrade_available?: boolean;
  [key: string]: any;
}

export interface ObjectionPromptOption {
  key: string;
  label: string;
  [key: string]: any;
}

export interface ObjectionPromptPayload {
  objection_type?: string;
  title?: string | null;
  body?: string | null;
  options?: ObjectionPromptOption[];
  [key: string]: any;
}

export interface ChatMessage {
  id?: number;
  role?: "system" | "assistant" | "user";
  message?: string;
  created_at?: string | null;
  weather_note?: string | null;
  [key: string]: any;
}

export interface ChatSessionPayload {
  id?: number;
  status?: string;
  journey_type?: string | null;
  last_step?: string;
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  live_area?: Record<string, any> | null;
  resolved_location?: Record<string, any> | null;
  session?: {
    id: number;
    status?: string;
    journey_type?: string | null;
    user_name?: string | null;
    [key: string]: any;
  };
  messages?: ChatMessage[];
  suggestions?: string[];
  venues?: Venue[];
  venue_results?: Venue[];
  journey_previews?: JourneyPreview[];
  weather_note?: string | null;
  budget_tips?: string[];
  weather?: Record<string, any> | null;
  escalation?: EscalationPayload | null;
  objection_prompt?: ObjectionPromptPayload | null;
  selected_venue?: Venue | null;
  selected_offer_usage?: string | null;
  voucher?: Voucher | null;
  [key: string]: any;
}

export interface InformationRecord {
  id: number;
  merchant_id?: number | null;
  venue_id?: number | null;
  source: "merchant" | "admin" | string;
  category?: string | null;
  title: string;
  content: string;
  status: "draft" | "pending" | "approved" | "published" | "rejected" | string;
  submitted_at?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  merchant?: {
    id: number;
    business_name: string;
    status?: string | null;
    contact_email?: string | null;
    [key: string]: any;
  } | null;
  venue?: {
    id: number;
    name: string;
    postcode?: string | null;
    approval_status?: string | null;
    venue_code?: string | null;
    [key: string]: any;
  } | null;
  created_by?: { id: number; name: string; [key: string]: any } | null;
  approved_by?: { id: number; name: string; [key: string]: any } | null;
  [key: string]: any;
}

export interface InformationRecordListPayload {
  summary: Record<string, number>;
  items: InformationRecord[];
  [key: string]: any;
}
