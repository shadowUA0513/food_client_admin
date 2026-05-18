import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import type {
  CompanyProfile,
  CompanyProfileResponse,
  UpdateCompanyProfilePayload,
} from "../types/companyProfile";
import { api } from "./api";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function extractCompanyProfile(
  payload: CompanyProfileResponse | CompanyProfile | null | undefined,
) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  if ("data" in payload && payload.data && typeof payload.data === "object") {
    return payload.data;
  }

  return payload as CompanyProfile;
}

export function useCompanyProfile(companyId?: string) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ["company-profile", resolvedCompanyId],
    queryFn: async () => {
      if (!resolvedCompanyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.get<CompanyProfileResponse | CompanyProfile>(
          `/api/v1/company/${resolvedCompanyId}`,
        );
        const profile = extractCompanyProfile(data);

        if (!profile) {
          throw new Error("Company profile not found.");
        }

        return profile;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load company profile."));
      }
    },
    enabled: Boolean(resolvedCompanyId),
    refetchOnWindowFocus: false,
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();

  return useMutation<
    CompanyProfile,
    Error,
    { companyId?: string; payload: UpdateCompanyProfilePayload }
  >({
    mutationFn: async ({ companyId, payload }) => {
      const resolvedCompanyId = companyId || useAuthStore.getState().company?.id;

      if (!resolvedCompanyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.put<CompanyProfileResponse | CompanyProfile>(
          `/api/v1/company/${resolvedCompanyId}`,
          payload,
        );
        const profile = extractCompanyProfile(data);

        if (!profile) {
          throw new Error("Company profile not found.");
        }

        return profile;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to update company profile."));
      }
    },
    onSuccess: async (_, variables) => {
      const resolvedCompanyId =
        variables.companyId || useAuthStore.getState().company?.id;

      await queryClient.invalidateQueries({
        queryKey: ["company-profile", resolvedCompanyId],
      });
    },
  });
}
