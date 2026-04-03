import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import type {
  CreatePartnerPayload,
  Partner,
  PartnerListResponse,
  PartnerResponse,
  UpdatePartnerPayload,
} from "../types/partners";
import { api } from "./api";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function extractPartner(payload: Partner | PartnerResponse) {
  if ("id" in payload) {
    return payload;
  }

  return payload.data ?? payload.partner;
}

export function usePartners(
  companyId?: string,
  limit = 10,
  page = 1,
  query = "",
) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ["partners", resolvedCompanyId, limit, page, query],
    queryFn: async () => {
      try {
        const { data } = await api.get<PartnerListResponse>(
          `/api/v1/company/${resolvedCompanyId}/partners`,
          {
            params: {
              limit,
              page,
              query: query || undefined,
            },
          },
        );

        return {
          partners: data.data?.partners ?? data.data?.partner ?? data.partners ?? [],
          count: data.data?.count ?? data.count ?? 0,
        };
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load partners."));
      }
    },
    enabled: Boolean(resolvedCompanyId),
    refetchOnWindowFocus: false,
  });
}

export function usePartnerById(companyId?: string, id?: string) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["partner", resolvedCompanyId, id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Partner | PartnerResponse>(
          `/api/v1/company/${resolvedCompanyId}/partner/${id}`,
        );
        const partner = extractPartner(data);

        if (!partner) {
          throw new Error("Partner not found.");
        }

        return partner;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load the partner."));
      }
    },
    enabled: Boolean(resolvedCompanyId && id),
    refetchOnWindowFocus: false,
    initialData: () => {
      if (!id) {
        return undefined;
      }

      const cachedQueries = queryClient.getQueriesData<{
        partners: Partner[];
        count: number;
      }>({
        queryKey: ["partners"],
      });

      for (const [, value] of cachedQueries) {
        const found = value?.partners.find((partner) => partner.id === id);

        if (found) {
          return found;
        }
      }

      return undefined;
    },
  });
}

export const useCreatePartner = () =>
  useMutation<Partner, Error, CreatePartnerPayload>({
    mutationFn: async (payload) => {
      try {
        const companyId = payload.company_id || useAuthStore.getState().company?.id;

        if (!companyId) {
          throw new Error("Company ID is required for creating a partner.");
        }

        const requestPayload = {
          ...payload,
          company_id: companyId,
        };

        const { data } = await api.post<Partner | PartnerResponse>(
          `/api/v1/company/${companyId}/partner`,
          requestPayload,
        );
        const partner = extractPartner(data);

        if (!partner) {
          throw new Error("Partner not found.");
        }

        return partner;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to create partner."));
      }
    },
  });

export const useUpdatePartner = () =>
  useMutation<Partner, Error, { id: string; payload: UpdatePartnerPayload }>({
    mutationFn: async ({ id, payload }) => {
      try {
        const { data } = await api.put<Partner | PartnerResponse>(
          `/api/v1/company/partner/${id}`,
          payload,
        );
        const partner = extractPartner(data);

        if (!partner) {
          throw new Error("Partner not found.");
        }

        return partner;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to update partner."));
      }
    },
  });

export const useDeletePartner = () =>
  useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        await api.delete(`/api/v1/company/partner/${id}`);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to delete partner."));
      }
    },
  });
