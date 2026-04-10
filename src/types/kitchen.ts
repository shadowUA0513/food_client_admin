export interface KitchenOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface KitchenOrder {
  id: string;
  company_id: string;
  partner_id: string;
  user_id: number;
  creator_name?: string;
  phone_number?: string;
  user_phone?: string;
  user_phone_number?: string;
  total_amount: number;
  status: string;
  payment_type?: string;
  payment_status: string;
  delivery_address: string;
  comment: string;
  items: KitchenOrderItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface KitchenPartnerGroup {
  partner_id: string;
  partner_name: string;
  orders: KitchenOrder[];
  order_count: number;
}

export interface KitchenOrdersResponse {
  error: boolean;
  data: KitchenPartnerGroup[];
}
