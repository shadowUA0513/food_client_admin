export interface LoginPayload {
  phone: string;
  password: string;
}

export interface LoginUser {
  id: string;
  full_name: string;
  phone_number: string;
  role: string;
  tg_id: number;
  tg_user_name: string;
  created_at: string;
  updated_at: string;
  company : LoginCompany
}

export interface LoginCompany {
  id: string;
  name: string;
}

export interface LoginResponse {
  access_token: string;
  user: LoginUser;
}

export interface AuthSession {
  token: string;
  phone: string;
  user: LoginUser;
  company: LoginCompany;
}

