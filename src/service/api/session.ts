import { AUTH_COOKIE_KEY, AUTH_STORAGE_KEY } from "./constant";

export function setAuthCookie(value: string, days = 7) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${AUTH_COOKIE_KEY}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function clearAuthSession() {
  document.cookie = `${AUTH_COOKIE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
