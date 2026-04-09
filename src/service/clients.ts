import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import type { ClientsResponse } from "../types/clients";
import { api } from "./api";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export function useCompanyClients(companyId?: string) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ["company-clients", resolvedCompanyId],
    queryFn: async () => {
      try {
        const { data } = await api.get<ClientsResponse>(
          `/api/v1/company/${resolvedCompanyId}/clients`,
        );

        return {
          clients: data.data?.clients ?? [],
          count: data.data?.count ?? 0,
        };
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load clients."));
      }
    },
    enabled: Boolean(resolvedCompanyId),
    refetchOnWindowFocus: false,
  });
}
