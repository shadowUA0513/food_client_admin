export interface Client {
  id: number;
  uuid_id: string;
  full_name: string;
  username: string;
  phone_number: string;
  language_code: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ClientsResponse {
  error: boolean;
  data?: {
    clients?: Client[];
    count?: number;
  };
}
