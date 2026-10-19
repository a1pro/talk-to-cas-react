import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GlobalThemeToggle } from "@/components/GlobalThemeToggle";
import { WhatsAppLaunchWidget } from "@/components/WhatsAppLaunchWidget";
import { Toaster } from "sonner";
import HomeRouter from "@/pages/HomeRouter";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import MerchantJoinPage from "@/pages/MerchantJoinPage";
import LandingPage from "@/pages/LandingPage";
import EmailVerificationPendingPage from "@/pages/EmailVerificationPendingPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import UserDashboard from "@/pages/UserDashboard";
import PublicVenueDiscoveryPage from "@/pages/PublicVenueDiscoveryPage";
import MerchantDashboard from "@/pages/MerchantDashboard";
import MerchantOfferSettingsPage from "@/pages/MerchantOfferSettingsPage";
import MerchantInformationPage from "@/pages/MerchantInformationPage";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminInformationPage from "@/pages/admin/AdminInformationPage";
import TagVenuePage from "@/pages/TagVenuePage";
import AffiliateInvitePage from "@/pages/AffiliateInvitePage";
import BnplVoucherUpgradePage from "@/pages/BnplVoucherUpgradePage";
import BnplVoucherCheckoutPage from "@/pages/BnplVoucherCheckoutPage";
import LeadGeneratorPage from "@/pages/LeadGeneratorPage";
import NotFound from "@/pages/NotFound";

function AppContent() {
  const location = useLocation();
  const showWhatsAppWidget =
    ["/", "/welcome", "/discover", "/join"].includes(location.pathname) ||
    location.pathname.startsWith("/tag") ||
    location.pathname.startsWith("/invite") ||
    location.pathname.startsWith("/voucher-upgrade") ||
    location.pathname.startsWith("/lead-generator");

  return (
    <>
      <GlobalThemeToggle />
      {showWhatsAppWidget ? <WhatsAppLaunchWidget /> : null}
      <Routes>
        <Route path="/" element={<HomeRouter />} />
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/discover" element={<Navigate to="/welcome" replace />} />
        <Route path="/join" element={<MerchantJoinPage />} />
        <Route path="/invite/:shareCode" element={<AffiliateInvitePage />} />
        <Route path="/voucher-upgrade" element={<BnplVoucherUpgradePage />} />
        <Route path="/voucher-upgrade/:checkoutCode" element={<BnplVoucherCheckoutPage />} />
        <Route path="/lead-generator" element={<LeadGeneratorPage />} />
        <Route path="/tag" element={<TagVenuePage />} />
        <Route path="/tag/:shareCode" element={<TagVenuePage />} />
        <Route path="/verify-email-pending" element={<EmailVerificationPendingPage />} />
        <Route path="/verify-email-pending/*" element={<EmailVerificationPendingPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-email/*" element={<VerifyEmailPage />} />

        <Route path="/user" element={<AuthGuard role="user"><UserDashboard /></AuthGuard>} />
        <Route path="/user/overview" element={<AuthGuard role="user"><Navigate to="/user" replace /></AuthGuard>} />
        <Route path="/user/affiliate" element={<AuthGuard role="user"><UserDashboard /></AuthGuard>} />
        <Route path="/user/payouts" element={<AuthGuard role="user"><UserDashboard /></AuthGuard>} />
        <Route path="/user/promo-profile" element={<AuthGuard role="user"><UserDashboard /></AuthGuard>} />
        <Route path="/user/security" element={<AuthGuard role="user"><UserDashboard /></AuthGuard>} />
        <Route path="/user/upgrades" element={<AuthGuard role="user"><UserDashboard /></AuthGuard>} />
        <Route path="/user/history" element={<AuthGuard role="user"><UserDashboard /></AuthGuard>} />
        <Route path="/user/venues" element={<AuthGuard role="user"><PublicVenueDiscoveryPage /></AuthGuard>} />
        <Route path="/user/discover" element={<AuthGuard role="user"><Navigate to="/user/venues" replace /></AuthGuard>} />

        <Route path="/merchant" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/overview" element={<AuthGuard role="merchant"><Navigate to="/merchant" replace /></AuthGuard>} />
        <Route path="/merchant/profile" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/venues" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/venues/create" element={<AuthGuard role="merchant"><MerchantInformationPage /></AuthGuard>} />
        <Route path="/merchant/information" element={<AuthGuard role="merchant"><MerchantInformationPage /></AuthGuard>} />
        <Route path="/merchant/address-workflow" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/wallet" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/activity" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/sync-links" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/protections" element={<AuthGuard role="merchant"><MerchantDashboard /></AuthGuard>} />
        <Route path="/merchant/offers" element={<AuthGuard role="merchant"><MerchantOfferSettingsPage /></AuthGuard>} />

        <Route path="/admin" element={<AuthGuard role="admin"><Navigate to="/admin/overview" replace /></AuthGuard>} />
        <Route path="/admin/overview" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />

        <Route path="/admin/merchants" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/merchants/pending" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/merchants/approved" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/merchants/rejected" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/merchants/finance" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/merchants/offer-sync" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/merchants/area-launch-alerts" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />

        <Route path="/admin/venues" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/venues/pending" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/venues/approvals" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/venues/approved" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/venues/rejected" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/venues/address-approvals" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/information" element={<AuthGuard role="admin"><AdminInformationPage /></AuthGuard>} />
        <Route path="/admin/information/create" element={<AuthGuard role="admin"><AdminInformationPage /></AuthGuard>} />

        <Route path="/admin/vouchers" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/vouchers/create" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/vouchers/upload" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/vouchers/download" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/vouchers/integrations" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />

        <Route path="/admin/users" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />

        <Route path="/admin/settings" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/settings/information" element={<AuthGuard role="admin"><Navigate to="/admin/information" replace /></AuthGuard>} />
        <Route path="/admin/settings/whatsapp" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />
        <Route path="/admin/settings/integrations" element={<AuthGuard role="admin"><AdminDashboard /></AuthGuard>} />

        <Route path="/admin/venue-approvals" element={<AuthGuard role="admin"><Navigate to="/admin/venues/approvals" replace /></AuthGuard>} />
        <Route path="/admin/address-approvals" element={<AuthGuard role="admin"><Navigate to="/admin/venues/address-approvals" replace /></AuthGuard>} />
        <Route path="/admin/merchants/venue-approvals" element={<AuthGuard role="admin"><Navigate to="/admin/venues/approvals" replace /></AuthGuard>} />
        <Route path="/admin/merchants/address-approvals" element={<AuthGuard role="admin"><Navigate to="/admin/venues/address-approvals" replace /></AuthGuard>} />
        <Route path="/admin/offer-sync" element={<AuthGuard role="admin"><Navigate to="/admin/merchants/offer-sync" replace /></AuthGuard>} />
        <Route path="/admin/voucher-links" element={<AuthGuard role="admin"><Navigate to="/admin/vouchers" replace /></AuthGuard>} />
        <Route path="/admin/area-launch-alerts" element={<AuthGuard role="admin"><Navigate to="/admin/merchants/area-launch-alerts" replace /></AuthGuard>} />
        <Route path="/admin/whatsapp-rollout" element={<AuthGuard role="admin"><Navigate to="/admin/settings/whatsapp" replace /></AuthGuard>} />
        <Route path="/admin/users/whatsapp" element={<AuthGuard role="admin"><Navigate to="/admin/settings/whatsapp" replace /></AuthGuard>} />
        <Route path="/admin/integrations" element={<AuthGuard role="admin"><Navigate to="/admin/settings/integrations" replace /></AuthGuard>} />
        <Route path="/admin/finance" element={<AuthGuard role="admin"><Navigate to="/admin/merchants/finance" replace /></AuthGuard>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
