import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import { api } from "./api";

export interface FinancialPartnerStat {
  partner_name: string;
  order_count: number;
  cash_amount: number;
  click_amount: number;
  payme_amount: number;
  total_amount: number;
}

export interface FinancialGrandTotal {
  total_orders: number;
  total_cash: number;
  total_click: number;
  total_payme: number;
  total_revenue: number;
}

export interface FinancialStatsResponse {
  error: boolean;
  data: {
    partners: FinancialPartnerStat[];
    grand_total: FinancialGrandTotal;
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export function useFinancialStats(
  startDate = "2026-04-06",
  endDate = "2026-04-07",
  companyId?: string,
) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ["financial-stats", resolvedCompanyId, startDate, endDate],
    queryFn: async () => {
      if (!resolvedCompanyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.get<FinancialStatsResponse>(
          `/api/v1/company/${resolvedCompanyId}/financial-stats`,
          {
            params: {
              start_date: startDate,
              end_date: endDate,
            },
          },
        );

        return data;
      } catch (error) {
        throw new Error(
          getErrorMessage(error, "Failed to load financial statistics."),
        );
      }
    },
    enabled: Boolean(resolvedCompanyId),
    refetchOnWindowFocus: false,
  });
}
