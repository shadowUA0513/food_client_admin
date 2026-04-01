import { AxiosError } from "axios";
import { api } from "./api";
import type { AuthSession, LoginPayload, LoginResponse } from "../types/auth";



export async function loginRequest(payload: LoginPayload) {
  try {
    const { data } = await api.post<LoginResponse>(
      "/api/v1/users/login",
      {
        Phone: payload.phone,
        Password: payload.password,
      },
      {
        headers: {
          Authorization: "basic",
        },
      },
    );

    return {
      token: data.access_token,
      phone: data.user.phone_number,
      user: data.user,
      company: data.user.company,
    } satisfies AuthSession;
  } catch (error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    const message =
      axiosError.response?.data?.message ??
      `Login failed with status ${axiosError.response?.status ?? "unknown"}.`;

    throw new Error(message);
  }
}
