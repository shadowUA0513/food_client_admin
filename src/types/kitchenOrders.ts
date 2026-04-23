export interface KitchenProduct {
  product_name: string;
  product_id: string;
  count_to_prepare: number;
}

export interface KitchenPartner {
  partner_id: string;
  partner_name: string;
  products: KitchenProduct[];
}

export interface KitchenOrdersResponse {
  error: boolean;
  data: KitchenPartner[];
}
