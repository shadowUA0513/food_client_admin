import { AxiosError } from "axios";
import type { KitchenOrdersResponse } from "../types/kitchenOrders";
import { api } from "./api";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;

  return axiosError.response?.data?.message ?? fallback;
}

export async function getKitchenOrders(
  companyId: string,
  partnerId: string,
): Promise<KitchenOrdersResponse> {
  try {
    const { data } = await api.get<KitchenOrdersResponse>(
      `/api/v1/company/${companyId}/kitchen/orders-itms`,
      {
        params: {
          partner_id: partnerId,
        },
      },
    );

    return data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "Failed to load kitchen orders."),
    );
  }
}
