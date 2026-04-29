import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "./api";
import type { CompanyOrder, CreateCompanyOrderPayload } from "../types/order";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export async function createCompanyOrder(payload: CreateCompanyOrderPayload) {
  try {
    const { data } = await api.post<CompanyOrder | { data?: CompanyOrder }>(
      `/api/v1/company/${payload.company_id}/order`,
      payload,
    );

    if ("id" in data) {
      return data;
    }

    return data.data ?? null;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create order."));
  }
}

export function useCreateCompanyOrder() {
  return useMutation({
    mutationFn: createCompanyOrder,
  });
}
