export interface Category {
  id: string;
  company_id: string;
  name_uz: string;
  name_ru: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryPayload {
  company_id: string;
  name_uz: string;
  name_ru: string;
  sort_order: number;
}

export type UpdateCategoryPayload = CreateCategoryPayload;

export interface CategoryListResponse {
  error: boolean;
  data: {
    categories: Category[];
    count: number;
  };
}

export interface CategoryResponse {
  error?: boolean;
  data?: Category;
  category?: Category;
}
