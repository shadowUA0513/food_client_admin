import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import type { KitchenOrder, OrderHistoryResponse } from "../types/kitchen";
import { api } from "./api";

type NullableParam = string | number | null | undefined;

export interface OrderHistoryQueryParams {
  companyId?: string;
  partnerId?: string | null;
  paymentType?: NullableParam;
  status?: NullableParam;
  startDate?: NullableParam;
  endDate?: NullableParam;
  page?: NullableParam;
  limit?: NullableParam;
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function normalizeParam(value: NullableParam) {
  if (value === undefined || value === null || value === "" || value === "null") {
    return null;
  }

  return value;
}

function extractOrders(payload: unknown): KitchenOrder[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (record.data && typeof record.data === "object") {
    const dataRecord = record.data as Record<string, unknown>;

    if (Array.isArray(dataRecord.orders)) {
      return dataRecord.orders as KitchenOrder[];
    }
  }

  return [];
}

function extractTotal(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return 0;
  }

  const record = payload as Record<string, unknown>;

  if (record.data && typeof record.data === "object") {
    const dataRecord = record.data as Record<string, unknown>;

    if (typeof dataRecord.total === "number") {
      return dataRecord.total;
    }
  }

  return 0;
}

export function useOrderHistory(params: OrderHistoryQueryParams = {}) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const companyId = params.companyId || authCompanyId;
  const partnerId = normalizeParam(params.partnerId);
  const paymentType = normalizeParam(params.paymentType);
  const status = normalizeParam(params.status);
  const startDate = normalizeParam(params.startDate);
  const endDate = normalizeParam(params.endDate);
  const page = normalizeParam(params.page);
  const limit = normalizeParam(params.limit);

  return useQuery({
    queryKey: [
      "order-history",
      companyId ?? null,
      partnerId,
      paymentType,
      status,
      startDate,
      endDate,
      page,
      limit,
    ],
    queryFn: async () => {
      if (!companyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.get<OrderHistoryResponse>(
          `/api/v1/company/${companyId}/orders-history`,
          {
            params: {
              partner_id: partnerId,
              payment_type: paymentType,
              status,
              start_date: startDate,
              end_date: endDate,
              page,
              limit,
            },
          },
        );

        return {
          raw: data,
          total: extractTotal(data),
          orders: extractOrders(data),
        };
      } catch (error) {
        throw new Error(
          getErrorMessage(error, "Failed to load order history."),
        );
      }
    },
    enabled: Boolean(companyId),
    refetchOnWindowFocus: false,
  });
}
