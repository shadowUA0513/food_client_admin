import { useEffect, type PropsWithChildren } from "react";
import { AUTH_EXPIRED_EVENT } from "../../service/api/events";
import { useAuthStore } from "../../store/auth";

export function AuthProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const handleSessionExpired = () => {
      useAuthStore.getState().logout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  return children;
}

export function useAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const phone = useAuthStore((state) => state.phone);
  const user = useAuthStore((state) => state.user);
  const company = useAuthStore((state) => state.company);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  return {
    isAuthenticated,
    phone,
    user,
    company,
    isLoading,
    login,
    logout,
  };
}
