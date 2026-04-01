import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import type { ClientsResponse } from "../types/clients";
import { api } from "./api";

export const CLIENTS_COMPANY_ID = "08d016ac-f8a2-4273-8219-806d5dd1fba1";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export function useCompanyClients(companyId = CLIENTS_COMPANY_ID) {
  return useQuery({
    queryKey: ["company-clients", companyId],
    queryFn: async () => {
      try {
        const { data } = await api.get<ClientsResponse>(
          `/api/v1/company/${companyId}/clients`,
        );

        return {
          clients: data.data?.clients ?? [],
          count: data.data?.count ?? 0,
        };
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load clients."));
      }
    },
    refetchOnWindowFocus: false,
  });
}
