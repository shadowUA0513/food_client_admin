export type StaffRole = "admin" | "super_admin";

export interface StaffUser {
  id: string;
  full_name: string;
  phone_number: string;
  role: StaffRole;
  tg_id: number;
  tg_user_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStaffPayload {
  full_name: string;
  phone_number: string;
  password: string;
  role: StaffRole;
}

export interface UpdateStaffPayload {
  full_name: string;
  phone_number: string;
  password?: string;
  role: StaffRole;
}

export interface StaffListResponse {
  data?: {
    count: number;
    users?: StaffUser[];
  };
}

export interface StaffCreateResponse {
  user: StaffUser;
}
