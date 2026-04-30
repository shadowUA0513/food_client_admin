import { useQuery } from "@tanstack/react-query";
import { publicApi } from "./api";
import type { CompanySettings } from "../types/settings";

interface SettingsApiResponse {
  error: boolean;
  data: CompanySettings;
}

export async function fetchCompanySettings(companyId: string) {
  const { data } = await publicApi.get<SettingsApiResponse>(
    `/api/v1/twa/company/${companyId}/settings`,
  );

  return data.data;
}

export function useCompanySettings(companyId: string) {
  return useQuery({
    queryKey: ["companySettings", companyId],
    queryFn: () => fetchCompanySettings(companyId),
    enabled: Boolean(companyId),
  });
}