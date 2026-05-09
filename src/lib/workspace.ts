export type RoleKey = "user" | "merchant" | "admin";

export type MenuItem = {
  label: string;
  description: string;
  path: string;
};

export type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export const MENU_GROUPS_BY_ROLE: Record<RoleKey, MenuGroup[]> = {
  user: [
    {
      label: "Account",
      items: [
        { label: "Overview", description: "Account summary and quick actions", path: "/user" },
        { label: "Discover venues", description: "Browse nearby partner venues", path: "/user/venues" },
        { label: "Promo profile", description: "Uber and Uber Eats eligibility", path: "/user/promo-profile" },
        { label: "Security", description: "Fraud checks and account status", path: "/user/security" },
      ],
    },
    {
      label: "Affiliate",
      items: [
        { label: "Affiliate hub", description: "Referral link, signups, and earnings", path: "/user/affiliate" },
        { label: "Payouts", description: "Stripe Connect and payout runs", path: "/user/payouts" },
      ],
    },
    {
      label: "Vouchers",
      items: [
        { label: "Voucher upgrades", description: "BNPL upgrades and payment status", path: "/user/upgrades" },
        { label: "Voucher history", description: "Recent voucher activity", path: "/user/history" },
      ],
    },
  ],
  merchant: [
    {
      label: "Workspace",
      items: [
        { label: "Overview", description: "Business health and important alerts", path: "/merchant" },
        { label: "Venue profile", description: "Business details and address requests", path: "/merchant/profile" },
        { label: "Venues", description: "Manage all submitted venues", path: "/merchant/venues" },
        { label: "Venue information", description: "Create venues with location and information", path: "/merchant/information" },
        { label: "Offer settings", description: "Voucher rules and offer toggles", path: "/merchant/offers" },
      ],
    },
    {
      label: "Funding",
      items: [
        { label: "Wallet & funding", description: "Balance, alerts, and transactions", path: "/merchant/wallet" },
        { label: "Voucher activity", description: "Latest issued and redeemed vouchers", path: "/merchant/activity" },
      ],
    },
    {
      label: "Protections",
      items: [
        { label: "Business protections", description: "Free-trial and fraud-prevention rules", path: "/merchant/protections" },
      ],
    },
  ],
  admin: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", description: "Operations command center", path: "/admin/overview" },
      ],
    },
    {
      label: "Merchants",
      items: [
        { label: "All merchants", description: "Search, edit, approve, reject, delete", path: "/admin/merchants" },
        { label: "Pending merchants", description: "Accept or reject new applications", path: "/admin/merchants/pending" },
        { label: "Approved merchants", description: "Manage live merchants", path: "/admin/merchants/approved" },
        { label: "Rejected merchants", description: "Review inactive/rejected accounts", path: "/admin/merchants/rejected" },
        { label: "Merchant finance", description: "Low balance and wallet checks", path: "/admin/merchants/finance" },
        { label: "Offer sync", description: "Provider sync approvals", path: "/admin/merchants/offer-sync" },
        { label: "Area launch", description: "Launch alert previews", path: "/admin/merchants/area-launch-alerts" },
      ],
    },
    {
      label: "Venues",
      items: [
        { label: "All venues", description: "Search, edit, approve, reject, delete", path: "/admin/venues" },
        { label: "Venue approvals", description: "Accept with 6 digit reference", path: "/admin/venues/approvals" },
        { label: "Approved venues", description: "Manage live venues", path: "/admin/venues/approved" },
        { label: "Rejected venues", description: "Review rejected venues", path: "/admin/venues/rejected" },
        { label: "Address approvals", description: "Protected address-change queue", path: "/admin/venues/address-approvals" },
        { label: "Venue information", description: "Create and publish information", path: "/admin/information" },
      ],
    },
    {
      label: "Vouchers",
      items: [
        { label: "Voucher records", description: "Edit, deactivate, delete voucher links", path: "/admin/vouchers" },
        { label: "Create voucher", description: "Manual provider link entry", path: "/admin/vouchers/create" },
        { label: "Upload vouchers", description: "Upload Uber export by venue code", path: "/admin/vouchers/upload" },
        { label: "Download vouchers", description: "CSV rows for Uber Business", path: "/admin/vouchers/download" },
      ],
    },
    {
      label: "Users",
      items: [
        { label: "Users", description: "Fraud queue and user access", path: "/admin/users" },
      ],
    },
    {
      label: "Settings",
      items: [
        { label: "Settings", description: "System settings overview", path: "/admin/settings" },
        { label: "WhatsApp templates", description: "Template approval workflow", path: "/admin/settings/whatsapp" },
        { label: "Integrations", description: "Webhook playbook and URLs", path: "/admin/settings/integrations" },
      ],
    },
  ],
};

export function flattenMenuGroups(role: RoleKey): MenuItem[] {
  return MENU_GROUPS_BY_ROLE[role].flatMap((group) => group.items);
}

export function findActiveMenuItem(role: RoleKey, pathname: string): MenuItem | null {
  const items = flattenMenuGroups(role).sort((a, b) => b.path.length - a.path.length);
  return items.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)) || null;
}

export function getUserWorkspaceSection(pathname: string) {
  if (pathname === "/user/payouts") return "payouts" as const;
  if (pathname === "/user/promo-profile") return "eligibility" as const;
  if (pathname === "/user/security") return "security" as const;
  if (pathname === "/user/affiliate") return "affiliate" as const;
  if (pathname === "/user/upgrades") return "upgrades" as const;
  if (pathname === "/user/history") return "history" as const;
  return "overview" as const;
}

export function getMerchantWorkspaceSection(pathname: string) {
  if (pathname === "/merchant/profile") return "profile" as const;
  if (pathname === "/merchant/venues") return "venues" as const;
  if (pathname === "/merchant/information") return "information" as const;
  if (pathname === "/merchant/wallet") return "wallet" as const;
  if (pathname === "/merchant/activity") return "activity" as const;
  if (pathname === "/merchant/protections") return "protections" as const;
  return "overview" as const;
}

export function getAdminWorkspaceSection(pathname: string) {
  if (pathname === "/admin" || pathname === "/admin/overview") return "overview" as const;

  if (pathname === "/admin/merchants") return "merchants" as const;
  if (pathname === "/admin/merchants/pending") return "merchant-pending" as const;
  if (pathname === "/admin/merchants/approved") return "merchant-approved" as const;
  if (pathname === "/admin/merchants/rejected") return "merchant-rejected" as const;
  if (pathname === "/admin/finance" || pathname === "/admin/merchants/finance") return "merchant-finance" as const;
  if (pathname === "/admin/offer-sync" || pathname === "/admin/merchants/offer-sync") return "merchant-offer-sync" as const;
  if (pathname === "/admin/area-launch-alerts" || pathname === "/admin/merchants/area-launch-alerts") return "merchant-area-launch" as const;

  if (pathname === "/admin/venues") return "venues" as const;
  if (pathname === "/admin/venues/pending" || pathname === "/admin/venues/approvals" || pathname === "/admin/venue-approvals" || pathname === "/admin/merchants/venue-approvals") return "venue-approvals" as const;
  if (pathname === "/admin/venues/approved") return "venue-approved" as const;
  if (pathname === "/admin/venues/rejected") return "venue-rejected" as const;
  if (pathname === "/admin/venues/address-approvals" || pathname === "/admin/address-approvals" || pathname === "/admin/merchants/address-approvals") return "venue-address" as const;

  if (pathname === "/admin/users") return "users" as const;
  if (pathname === "/admin/whatsapp-rollout" || pathname === "/admin/users/whatsapp") return "users-whatsapp" as const;

  if (pathname === "/admin/information" || pathname === "/admin/information/create") return "settings" as const;
  if (pathname === "/admin/settings") return "settings" as const;
  if (pathname === "/admin/settings/whatsapp") return "settings-whatsapp" as const;
  if (pathname === "/admin/settings/integrations") return "settings-integrations" as const;

  if (pathname === "/admin/voucher-links" || pathname === "/admin/vouchers") return "vouchers-records" as const;
  if (pathname === "/admin/vouchers/create") return "vouchers-create" as const;
  if (pathname === "/admin/vouchers/upload") return "vouchers-upload" as const;
  if (pathname === "/admin/vouchers/download") return "vouchers-download" as const;
  if (pathname === "/admin/integrations" || pathname === "/admin/vouchers/integrations") return "vouchers-integrations" as const;

  return "overview" as const;
}
