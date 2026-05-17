const fallbackBaseUrl = "https://api.a-bed.uz/";

export const env = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? fallbackBaseUrl,
};