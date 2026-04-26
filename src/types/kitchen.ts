export interface KitchenOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    name_ru?: string;
    name_uz?: string;
    image_url?: string;
    price?: number;
  };
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface KitchenOrder {
  id: string;
  company_id: string;
  partner_id: string;
  partner?: {
    id: string;
    name_ru?: string;
    name_uz?: string;
    address_description?: string;
  };
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

export interface KitchenOrderUpdateItemPayload {
  product_id: string;
  quantity: number;
  price: number;
}

export interface KitchenOrderUpdatePayload {
  company_id: string;
  partner_id: string;
  user_id: number;
  delivery_address: string;
  comment: string;
  payment_type: string;
  items: KitchenOrderUpdateItemPayload[];
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

export interface OrderHistoryResponse {
  error: boolean;
  data: {
    total: number;
    orders: KitchenOrder[];
  };
}
