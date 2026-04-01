import { AxiosError } from "axios";
import { api } from "./api";

interface ImageUploadResponse {
  url?: string;
  image_url?: string;
  data?: string | { url?: string; image_url?: string };
}

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
