import { AxiosError } from "axios";
import { api } from "./api";
import type {
  CreateStaffPayload,
  StaffCreateResponse,
  StaffListResponse,
  StaffUser,
  UpdateStaffPayload,
} from "../types/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message ?? fallback;
}

export async function getStaffUsers() {
  try {
    const { data } = await api.get<StaffListResponse>("/api/v1/users");
    return data.data?.users ?? [];
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load staff."));
  }
}
export const useStaffUsers = () => {
  return useQuery({
    queryKey: ["staff-users"],
    queryFn: getStaffUsers,
    refetchOnWindowFocus: false,
  });
};


export const useStaffUserById = (id?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["staff-user", id],
    queryFn: () => getStaffUserById(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
    initialData: () => {
      if (!id) {
        return undefined;
      }

      const cachedStaff =
        queryClient.getQueryData<StaffUser[]>(["staff-users"]) ?? [];

      return cachedStaff.find((member) => member.id === id);
    },
  });
};

export async function getStaffUserById(id: string) {
  try {
    const { data } = await api.get<StaffUser>(`/api/v1/users/${id}`);
    return data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to load the staff member."));
  }
}

export async function createStaffUser(payload: CreateStaffPayload) {
  try {
    const { data } = await api.post<StaffCreateResponse>("/api/v1/users", payload);
    return data.user;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to create staff member."));
  }
}

export async function updateStaffUser(id: string, payload: UpdateStaffPayload) {
  try {
    const { data } = await api.put<StaffCreateResponse>(
      `/api/v1/users/${id}`,
      payload,
    );
    return data.user;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to update staff member."));
  }
}

export async function deleteStaffUser(id: string) {
  try {
    await api.delete(`/api/v1/users/${id}`);
  } catch (error) {
    throw new Error(getErrorMessage(error, "Failed to delete staff member."));
  }
}

export const useCreateStaffUser = () =>
  useMutation<StaffUser, Error, CreateStaffPayload>({
    mutationFn: createStaffUser,
  });

export const useUpdateStaffUser = () =>
  useMutation<StaffUser, Error, { id: string; payload: UpdateStaffPayload }>({
    mutationFn: ({ id, payload }) => updateStaffUser(id, payload),
  });

export const useDeleteStaffUser = () =>
  useMutation<void, Error, string>({
    mutationFn: deleteStaffUser,
  });
