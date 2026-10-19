import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "@/api/axios";
import type { MerchantJoinEligibilityResult } from "@/api/auth";
import type { ApiResponse, AuthUser, Role } from "@/types";

type LoginPayload = { login: string; password: string };

type RegisterPayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
  postcode?: string;
  latitude?: number | null;
  longitude?: number | null;
  referral_code?: string;
};

type MerchantRegisterPayload = {
  owner_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  business_name: string;
  business_type: string;
  contact_phone: string;
  whatsapp_number?: string;
  address?: string;
  city?: string;
  postcode: string;
  latitude?: number | null;
  longitude?: number | null;
  low_balance_threshold: number;
  venue_description?: string;
  tag_code?: string;
  requested_plan?: "free_trial" | "payg";
};

type RegisterResponse = {
  token: string;
  user: AuthUser;
};

type MerchantRegisterResponse = {
  merchant_id: number;
  status: string;
  message: string;
  onboarding_plan?: "free_trial" | "payg";
  free_trial?: MerchantJoinEligibilityResult;
  tag_attribution?: {
    share_code: string;
    status: string;
    reward_credit: string;
  } | null;
};

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  registerUser: (payload: RegisterPayload) => Promise<AuthUser>;
  registerMerchant: (payload: MerchantRegisterPayload) => Promise<MerchantRegisterResponse>;
  verifyEmail: (payload: { email: string; token: string }) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const response = await api.get<ApiResponse<AuthUser>>("/auth/profile");
      setUser(response.data.data);
    } catch {
      localStorage.removeItem("talktocas_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("talktocas_token");
    if (!token) {
      setLoading(false);
      return;
    }
    void loadProfile();
  }, []);

  async function login(payload: LoginPayload) {
    const response = await api.post<ApiResponse<{ token: string; user: AuthUser }>>(
      "/auth/login",
      payload
    );
    localStorage.setItem("talktocas_token", response.data.data.token);
    setUser(response.data.data.user);
  }

  async function registerUser(payload: RegisterPayload) {
    const response = await api.post<ApiResponse<RegisterResponse>>(
      "/auth/register/user",
      payload
    );
    localStorage.setItem("talktocas_token", response.data.data.token);
    setUser(response.data.data.user);
    return response.data.data.user;
  }

  async function registerMerchant(payload: MerchantRegisterPayload) {
    const response = await api.post<ApiResponse<MerchantRegisterResponse>>(
      "/auth/register/merchant",
      payload
    );
    return response.data.data;
  }

  async function verifyEmail() {
    throw new Error("Email verification is disabled in this demo build.");
  }

  async function resendVerificationEmail() {
    throw new Error("Email verification is disabled in this demo build.");
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("talktocas_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      registerUser,
      registerMerchant,
      verifyEmail,
      resendVerificationEmail,
      logout,
      isRole: (role: Role) => user?.primary_role === role || user?.roles?.includes(role) || false,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
