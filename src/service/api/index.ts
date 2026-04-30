import axios, { AxiosError } from "axios";
import { AUTH_COOKIE_KEY, API_TIMEOUT_MS } from "./constant";
import { env } from "./env";
import { AUTH_EXPIRED_EVENT } from "./events";
import { clearAuthSession } from "./session";

function getCookie(name: string) {
  const escapedName = name.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));

  return match ? decodeURIComponent(match[1]) : null;
}

// Authenticated API instance (adds Bearer token automatically)
export const api = axios.create({
  baseURL: env.baseUrl,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});

// Public API instance (no auth - for endpoints like /twa/company/{id}/settings)
export const publicApi = axios.create({
  baseURL: env.baseUrl,
  timeout: API_TIMEOUT_MS,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getCookie(AUTH_COOKIE_KEY);

  if (token) {
    config.headers.Authorization ??= `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);
