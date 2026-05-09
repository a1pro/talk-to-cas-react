import api from "@/api/axios";
import type { ApiResponse, BnplOptionsPayload, BnplVoucherOrder } from "@/types";

export interface CreateBnplOrderPayload {
  plan_key: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  source_context?: string;
}

export const bnplApi = {
  getOptions: async () => {
    const response = await api.get<ApiResponse<BnplOptionsPayload>>("/bnpl/options");
    return response.data.data;
  },
  createOrder: async (payload: CreateBnplOrderPayload) => {
    const response = await api.post<ApiResponse<BnplVoucherOrder>>("/bnpl/orders", payload);
    return response.data.data;
  },
  getOrder: async (checkoutCode: string) => {
    const response = await api.get<ApiResponse<BnplVoucherOrder>>(`/bnpl/orders/${encodeURIComponent(checkoutCode)}`);
    return response.data.data;
  },
  simulatePayment: async (checkoutCode: string) => {
    const response = await api.post<ApiResponse<BnplVoucherOrder>>(
      `/bnpl/orders/${encodeURIComponent(checkoutCode)}/simulate-payment`
    );
    return response.data.data;
  },
};
