import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AUTH_STORAGE_KEY } from "../service/api/constant";
import { clearAuthSession, setAuthCookie } from "../service/api/session";
import { loginRequest } from "../service/auth";
import type { LoginPayload, LoginUser } from "../types/auth";

interface AuthStore {
  isAuthenticated: boolean;
  phone: string | null;
  user: LoginUser | null;
  company: { id: string; name: string } | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      phone: null,
      user: null,
      company: null,
      isLoading: false,
      login: async (payload) => {
        set({ isLoading: true });

        try {
          const session = await loginRequest(payload);

          if (session.token) {
            setAuthCookie(session.token);
          }

          
          console.log(session.company);
          
          set({
            isAuthenticated: true,
            phone: session.phone,
            user: session.user,
            company: session.company,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      logout: () => {
        clearAuthSession();
        set({
          isAuthenticated: false,
          phone: null,
          user: null,
          company: null,
          isLoading: false,
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        phone: state.phone,
        user: state.user,
        company: state.company,
      }),
    },
  ),
);
