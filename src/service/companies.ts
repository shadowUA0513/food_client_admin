import { AxiosError } from "axios";
import { api } from "./api";
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  Company,
  CompanyCreateResponse,
  CompanyDetailsResponse,
  CompanyListResponse,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from "../types/companies";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export const useCompanies = (limit = 10, page = 1, query = "") => {
  return useQuery({
    queryKey: ["companies", limit, page, query],
    queryFn: async () => {
      try {
        const { data } = await api.get<CompanyListResponse>("/api/v1/company");
        return data.data?.companies ?? [];
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load companies."));
      }
    },
    refetchOnWindowFocus: false
  });
};

export const useCompanyById = (id?: string) => {
  return useQuery({
    queryKey: ["company", id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Company | CompanyDetailsResponse>(
          `/api/v1/company/${id}`
        );
        return "data" in data ? data.data : data;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load the company."));
      }
    },
    enabled: !!id,
        refetchOnWindowFocus: false

  });
};

export const useCreateCompany = () =>
  useMutation<Company, Error, CreateCompanyPayload>({
    mutationFn: async (payload) => {
      try {
        const { data } = await api.post<CompanyCreateResponse>("/api/v1/company", payload);
        return data.company;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to create company."));
      }
    },
  });

export const useUpdateCompany = () =>
  useMutation<Company, Error, { id: string; payload: UpdateCompanyPayload }>({
    mutationFn: async ({ id, payload }) => {
      try {
        const { data } = await api.put<CompanyCreateResponse>(`/api/v1/company/${id}`, payload);
        return data.company;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to update company."));
      }
    },
  });

export const useDeleteCompany = () =>
  useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        await api.delete(`/api/v1/company/${id}`);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to delete company."));
      }
    },
  });
