export interface CompanySettings {
  id: string;
  name: string;
  telegram_chat_id: number;
  brand_color: string;
  logo_url: string;
  supported_order_types: string[];
  phone_numbers: string[];
  card_pans: string[];
  min_order_amount: number;
  payment_accepting_style: "non-o" | "o";
  today_working_hours: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  } | null;
}