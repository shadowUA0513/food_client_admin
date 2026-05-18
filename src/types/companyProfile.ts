export interface CompanyProfile {
  id: string;
  name: string;
  bot_token: string;
  bot_username: string;
  telegram_chat_id: number;
  brand_color: string;
  logo_url: string;
  is_active: boolean;
  supported_order_types: string[];
  phone_numbers: string[];
  card_pans: string[];
  delivery_fee: number;
  delivery_estimated_time: number;
  free_delivery_threshold: number;
  min_order_amount: number;
  address: string;
  lat: number;
  long: number;
  min_order_distance: number;
  payment_accepting_style: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfileResponse {
  error: boolean;
  data: CompanyProfile;
}

export interface UpdateCompanyProfilePayload {
  name: string;
  bot_token: string;
  bot_username: string;
  address: string;
  lat: number;
  long: number;
  min_order_distance: number;
  telegram_chat_id: number;
  phone_numbers: string[];
  card_pans: string[];
  brand_color: string;
  logo_url: string;
  is_active: boolean;
  supported_order_types: string[];
  min_order_amount: number;
  delivery_fee: number;
  delivery_estimated_time: number;
  free_delivery_threshold: number;
  payment_accepting_style: string;
}
