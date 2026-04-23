import { useQuery } from "@tanstack/react-query";
import type { KitchenOrdersResponse } from "../types/kitchenOrders";
import { getKitchenOrders } from "../service/kitchenOrders";

export function useKitchenOrders(
  companyId?: string | null,
  partnerId?: string | null,
  enabled = false,
) {
  return useQuery<KitchenOrdersResponse, Error>({
    queryKey: ["kitchen-orders", companyId ?? null, partnerId ?? null],
    queryFn: async () => {
      if (!companyId || !partnerId) {
        throw new Error("Company ID and partner ID are required.");
      }

      return getKitchenOrders(companyId, partnerId);
    },
    enabled: enabled && Boolean(companyId) && Boolean(partnerId),
    refetchOnWindowFocus: false,
  });
}
