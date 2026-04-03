export interface Partner {
  id: string;
  company_id: string;
  name_uz: string;
  name_ru: string;
  latitude: number;
  longitude: number;
  address_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePartnerPayload {
  company_id?: string;
  name_uz: string;
  name_ru: string;
  latitude: number;
  longitude: number;
  address_description: string;
  is_active: boolean;
}

export type UpdatePartnerPayload = CreatePartnerPayload;

export interface PartnerListResponse {
  error?: boolean;
  data?: {
    partners?: Partner[];
    partner?: Partner[];
    count?: number;
  };
  partners?: Partner[];
  count?: number;
}

export interface PartnerResponse {
  error?: boolean;
  data?: Partner;
  partner?: Partner;
}
