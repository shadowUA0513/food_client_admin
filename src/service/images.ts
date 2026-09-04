import { AxiosError } from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/auth";
import { api } from "./api";

interface ImageUploadResponse {
  url?: string;
  image_url?: string;
  data?: string | { url?: string; image_url?: string };
}

type ProductImageResponse = ImageUploadResponse;
type ProductImageHistoryResponse = unknown;

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

function extractImageUrl(payload: ImageUploadResponse) {
  if (typeof payload.url === "string" && payload.url.trim()) {
    return payload.url;
  }

  if (typeof payload.image_url === "string" && payload.image_url.trim()) {
    return payload.image_url;
  }

  if (typeof payload.data === "string" && payload.data.trim()) {
    return payload.data;
  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    "url" in payload.data &&
    typeof payload.data.url === "string" &&
    payload.data.url.trim()
  ) {
    return payload.data.url;
  }

  if (
    payload.data &&
    typeof payload.data === "object" &&
    "image_url" in payload.data &&
    typeof payload.data.image_url === "string" &&
    payload.data.image_url.trim()
  ) {
    return payload.data.image_url;
  }

  return null;
}

function extractImageUrlFromValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  return extractImageUrl(value as ImageUploadResponse);
}

function normalizeHistoryResponse(payload: ProductImageHistoryResponse) {
  if (Array.isArray(payload)) {
    return payload
      .map((value) => extractImageUrlFromValue(value))
      .filter((value): value is string => Boolean(value));
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidates = [
    record.data,
    record.history,
    record.images,
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((value) => extractImageUrlFromValue(value))
        .filter((value): value is string => Boolean(value));
    }
  }

  return [];
}

export async function uploadImage(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  try {
    const { data } = await api.post<ImageUploadResponse>("/api/v1/image/upload", formData);
    const imageUrl = extractImageUrl(data);

    if (!imageUrl) {
      throw new Error("Image upload succeeded but no image URL was returned.");
    }

    return imageUrl;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to upload image."));
  }
}

export async function generateProductImage(
  productId: string,
  payload: Record<string, unknown>,
) {
  try {
    const { data } = await api.post<ProductImageResponse>(
      `/api/v1/company/product/${productId}/generate-image`,
      payload,
    );
    const imageUrl = extractImageUrl(data);

    if (!imageUrl) {
      throw new Error(
        "Image generation succeeded but no image URL was returned.",
      );
    }

    return imageUrl;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to generate image."));
  }
}

export async function getProductImageHistory(productId: string) {
  try {
    const { data } = await api.get<ProductImageHistoryResponse>(
      `/api/v1/company/product/${productId}/generate-image/history`,
    );

    return normalizeHistoryResponse(data);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load image history."));
  }
}

export function useProductImageHistory(productId?: string) {
  return useQuery({
    queryKey: ["product-image-history", productId ?? null],
    queryFn: async () => {
      if (!productId) {
        return [];
      }

      return getProductImageHistory(productId);
    },
    enabled: Boolean(productId),
    refetchOnWindowFocus: false,
  });
}

export interface ImageGeneration {
  id: string;
  time: string;
  company: string;
  product_name: string;
  status: "success" | "failed";
  duration: string;
}

export interface ImageGenerationQueryParams {
  companyId?: string;
  query?: string;
  status?: string | null;
  paid?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key].trim()) {
      return record[key].trim();
    }
  }

  return "";
}

function readNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (typeof record[key] === "number") {
      return record[key];
    }
  }

  return null;
}

function extractGenerationItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const data = record.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;

    for (const key of ["generations", "items", "results", "logs"]) {
      if (Array.isArray(dataRecord[key])) {
        return dataRecord[key];
      }
    }
  }

  for (const key of ["generations", "items", "results", "logs"]) {
    if (Array.isArray(record[key])) {
      return record[key];
    }
  }

  return [];
}

function normalizeGeneration(value: unknown, index: number): ImageGeneration | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawStatus = readString(record, ["status", "state"]).toLowerCase();
  const status: ImageGeneration["status"] =
    rawStatus === "success" ||
    rawStatus === "successful" ||
    rawStatus === "completed"
      ? "success"
      : "failed";
  const durationValue = readNumber(record, ["duration", "duration_seconds", "processing_time"]);

  return {
    id: readString(record, ["id", "uuid"]) || `${index}`,
    time: readString(record, ["created_at", "createdAt", "timestamp", "time"]),
    company: readString(record, ["company_name", "company", "companyName"]),
    product_name: readString(record, ["product_name", "product", "productName"]),
    status,
    duration: durationValue === null ? "-" : `${durationValue}s`,
  };
}

export function useImageGenerations(params: ImageGenerationQueryParams = {}) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const companyId = params.companyId || authCompanyId;
  const query = params.query?.trim() || undefined;
  const status = params.status || undefined;
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  return useQuery({
    queryKey: [
      "image-generations",
      companyId ?? null,
      query ?? null,
      status ?? null,
      params.paid ?? false,
      params.from ?? null,
      params.to ?? null,
      page,
      limit,
    ],
    queryFn: async () => {
      if (!companyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.get<unknown>(
          "/api/v1/company/image-generations",
          {
            params: {
              query,
              status,
              paid: params.paid ?? false,
              from: params.from,
              to: params.to,
              page,
              limit,
              company_id: companyId,
            },
          },
        );

        return extractGenerationItems(data)
          .map(normalizeGeneration)
          .filter((item): item is ImageGeneration => Boolean(item));
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load image generations."));
      }
    },
    enabled: Boolean(companyId),
    refetchOnWindowFocus: false,
  });
}

export interface ImageGenerationUsage {
  total: number;
  successful: number;
  errors: number;
  estimatedCost: number;
}

function readMetric(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return 0;
}

function normalizeUsage(payload: unknown): ImageGenerationUsage {
  if (!payload || typeof payload !== "object") {
    return { total: 0, successful: 0, errors: 0, estimatedCost: 0 };
  }

  const record = payload as Record<string, unknown>;
  const source =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : record;

  return {
    total: readMetric(source, ["total_generations", "total", "count"]),
    successful: readMetric(source, [
      "successful_generations",
      "successful",
      "success",
      "success_count",
    ]),
    errors: readMetric(source, ["failed_generations", "errors", "error", "error_count"]),
    estimatedCost: readMetric(source, [
      "estimated_cost",
      "estimatedCost",
      "cost",
      "total_cost",
    ]),
  };
}

export function useImageGenerationUsage(
  params: { companyId?: string; from?: string; to?: string } = {},
) {
  const authCompanyId = useAuthStore((state) => state.company?.id);
  const companyId = params.companyId || authCompanyId;

  return useQuery({
    queryKey: [
      "image-generation-usage",
      companyId ?? null,
      params.from ?? null,
      params.to ?? null,
    ],
    queryFn: async () => {
      if (!companyId) {
        throw new Error("Company ID is required.");
      }

      try {
        const { data } = await api.get<unknown>(
          "/api/v1/company/image-generations/usage",
          {
            params: {
              from: params.from,
              to: params.to,
              company_id: companyId,
            },
          },
        );

        return normalizeUsage(data);
      } catch (error) {
        throw new Error(getErrorMessage(error, "Failed to load image generation usage."));
      }
    },
    enabled: Boolean(companyId && params.from && params.to),
    refetchOnWindowFocus: false,
  });
}
