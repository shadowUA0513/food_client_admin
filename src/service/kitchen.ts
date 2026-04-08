import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import type { KitchenOrdersResponse, KitchenPartnerGroup } from "../types/kitchen";
import { api } from "./api";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function extractPartnerGroups(payload: unknown): KitchenPartnerGroup[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return record.data as KitchenPartnerGroup[];
  }

  return [];
}

export function useKitchenOrders(companyId?: string) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ["kitchen-orders", resolvedCompanyId],
    queryFn: async () => {
      if (!resolvedCompanyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.get<KitchenOrdersResponse>(
          `/api/v1/company/${resolvedCompanyId}/kitchen/orders`
        );

        const partners = extractPartnerGroups(data);

        return {
          raw: data,
          partners,
        };
      } catch (error) {
        throw new Error(
          getErrorMessage(error, "Failed to load kitchen orders.")
        );
      }
    },
    enabled: Boolean(resolvedCompanyId),
    refetchOnWindowFocus: false,
  });
}

type UpdateKitchenOrderStatusPayload = {
  companyId?: string;
  order_id: string;
  status: string;
};

export function useUpdateKitchenOrderStatus() {
  return useMutation<void, Error, UpdateKitchenOrderStatusPayload>({
    mutationFn: async ({ companyId, order_id, status }) => {
      const resolvedCompanyId = companyId || useAuthStore.getState().company?.id;

      if (!resolvedCompanyId) {
        throw new Error("Company ID is required.");
      }

      try {
        await api.patch(
          `/api/v1/company/${resolvedCompanyId}/kitchen/order/status`,
          {
            order_id,
            status,
          }
        );
      } catch (error) {
        throw new Error(
          getErrorMessage(error, "Failed to update kitchen order status.")
        );
      }
    },
  });
}
