import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { api } from "./api";
import { useAuthStore } from "../store/auth";
import type {
  Category,
  CategoryListResponse,
  CategoryResponse,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/categories";

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function extractCategory(payload: Category | CategoryResponse) {
  if ("id" in payload) {
    return payload;
  }

  return payload.data ?? payload.category;
}

export function useCategories(
  companyId?: string,
  limit = 10,
  page = 1,
  query = ""
) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  
  const resolvedCompanyId = companyId || authCompanyId;

  return useQuery({
    queryKey: ["categories", resolvedCompanyId, limit, page, query],
    queryFn: async () => {
      try {
        const { data } = await api.get<CategoryListResponse>(
          `/api/v1/company/${resolvedCompanyId}/categories`,
          {
            params: { limit, page, query },
          }
        );

        return {
          categories: data.data?.categories ?? [],
          count: data.data?.count ?? 0,
        };
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load categories."));
      }
    },
    enabled: Boolean(resolvedCompanyId),
    refetchOnWindowFocus: false,
  });
}

export function useCategoryById(companyId?: string, id?: string) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const resolvedCompanyId = companyId || authCompanyId;
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["category", resolvedCompanyId, id],
    queryFn: async () => {
      try {
        const { data } = await api.get<Category | CategoryResponse>(
          `/api/v1/company/${resolvedCompanyId}/category/${id}`
        );
        const category = extractCategory(data);

        if (!category) {
          throw new Error("Category not found.");
        }

        return category;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load the category."));
      }
    },
    enabled: Boolean(resolvedCompanyId && id),
    refetchOnWindowFocus: false,
    initialData: () => {
      if (!id) {
        return undefined;
      }

      const cachedQueries = queryClient.getQueriesData<{
        categories: Category[];
        count: number;
      }>({
        queryKey: ["categories"],
      });

      for (const [, value] of cachedQueries) {
        const found = value?.categories.find((category) => category.id === id);

        if (found) {
          return found;
        }
      }

      return undefined;
    },
  });
}

export const useCreateCategory = () =>
  useMutation<Category, Error, CreateCategoryPayload>({
    mutationFn: async (payload) => {
      try {
        const companyId = payload.company_id || useAuthStore.getState().company?.id;

        if (!companyId) {
          throw new Error("Company ID is required for creating a category.");
        }

        const requestPayload = {
          ...payload,
          company_id: companyId,
        };

        const { data } = await api.post<Category | CategoryResponse>(
          `/api/v1/company/${companyId}/category`,
          requestPayload
        );
        const category = extractCategory(data);

        if (!category) {
          throw new Error("Category not found.");
        }

        return category;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to create category."));
      }
    },
  });

export const useUpdateCategory = () =>
  useMutation<Category, Error, { id: string; payload: UpdateCategoryPayload }>({
    mutationFn: async ({ id, payload }) => {
      try {
        const { data } = await api.put<Category | CategoryResponse>(
          `/api/v1/company/category/${id}`,
          payload
        );
        const category = extractCategory(data);

        if (!category) {
          throw new Error("Category not found.");
        }

        return category;
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to update category."));
      }
    },
  });

export const useDeleteCategory = () =>
  useMutation<void, Error, string>({
    mutationFn: async (id) => {
      try {
        await api.delete(`/api/v1/company/category/${id}`);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to delete category."));
      }
    },
  });
