export interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface WorkingHoursPayload {
  working_hours: WorkingHour[];
}

export interface WorkingHoursResponse {
  error?: boolean;
  data?: WorkingHour[] | WorkingHoursPayload;
  working_hours?: WorkingHour[];
}
