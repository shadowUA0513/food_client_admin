export interface Product {
  id: string;
  company_id: string;
  category_id: string;
  name_uz: string;
  name_ru: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  company_id: string;
  category_id: string;
  name_ru: string;
  name_uz: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  is_available: boolean;
}

export type UpdateProductPayload = CreateProductPayload;

export interface ProductListResponse {
  error: boolean;
  data: {
    products: Product[];
    count: number;
  };
}

export interface ProductResponse {
  error?: boolean;
  data?: Product;
  product?: Product;
}
