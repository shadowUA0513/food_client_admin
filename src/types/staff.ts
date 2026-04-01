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
  company_id?: string;
  company?: {
    id: string;
    name?: string;
  };
}

export interface CreateStaffPayload {
  full_name: string;
  phone_number: string;
  password: string;
  role: StaffRole;
  company_id?: string;
}

export interface UpdateStaffPayload {
  full_name: string;
  phone_number: string;
  password?: string;
  role: StaffRole;
  company_id?: string;
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
