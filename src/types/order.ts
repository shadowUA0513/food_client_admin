export interface CreateCompanyOrderItemPayload {
  product_id: string;
  quantity: number;
  price: number;
}

export interface CreateCompanyOrderPayload {
  company_id: string;
  partner_id?: string;
  phone_number: string;
  delivery_address: string;
  comment: string;
  payment_type: string;
  items: CreateCompanyOrderItemPayload[];
}

export interface CompanyOrder {
  id: string;
  company_id: string;
  partner_id?: string | null;
  phone_number?: string | null;
  delivery_address?: string | null;
  comment?: string | null;
  payment_type?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}
