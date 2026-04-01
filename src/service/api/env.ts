const fallbackBaseUrl = "https://dynamicrestaurantmanager-production.up.railway.app";

export const env = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? fallbackBaseUrl,
};
