import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "../store/auth";
import type {
  WorkingHour,
  WorkingHoursPayload,
  WorkingHoursResponse,
} from "../types/workingHours";
import { api } from "./api";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function extractWorkingHours(payload: WorkingHoursResponse | WorkingHour[] | null | undefined) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if (Array.isArray(payload.working_hours)) {
    return payload.working_hours;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    Array.isArray((payload.data as WorkingHoursPayload).working_hours)
  ) {
    return (payload.data as WorkingHoursPayload).working_hours;
  }

  return [];
}

export function useWorkingHours(companyId?: string) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ["working-hours", resolvedCompanyId],
    queryFn: async () => {
      if (!resolvedCompanyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.get<WorkingHoursResponse>(
          `/api/v1/company/${resolvedCompanyId}/working-hours`,
        );

        return extractWorkingHours(data);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load working hours."));
      }
    },
    enabled: Boolean(resolvedCompanyId),
    refetchOnWindowFocus: false,
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation<
    WorkingHour[],
    Error,
    { companyId?: string; payload: WorkingHoursPayload }
  >({
    mutationFn: async ({ companyId, payload }) => {
      const resolvedCompanyId = companyId || useAuthStore.getState().company?.id;

      if (!resolvedCompanyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.put<WorkingHoursResponse>(
          `/api/v1/company/${resolvedCompanyId}/working-hours`,
          payload,
        );

        return extractWorkingHours(data);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to update working hours."));
      }
    },
    onSuccess: async (_, variables) => {
      const resolvedCompanyId = variables.companyId || useAuthStore.getState().company?.id;

      await queryClient.invalidateQueries({
        queryKey: ["working-hours", resolvedCompanyId],
      });
    },
  });
}
