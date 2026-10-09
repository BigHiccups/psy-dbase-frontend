export type PatientStatus = "prospect" | "active" | "inactive" | "discharged";

export type Patient = {
  id: string;
  user_id: string;
  full_name: string;
  cpf: string | null;
  city: string | null;
  birth_date: string | null;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  status: PatientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
export type ScheduleInput = {
  weekday: number;      // 0=domingo, 6=sábado
  startTime: string;    // "HH:MM"
  durationMin: number;  // default 50
};

export type InviteResponse = {
  inviteId: string;
  token: string;
  publicUrl: string;
  shortUrl: string;
  whatsappUrl: string;
  phone: string;
  schedules: ScheduleInput[];
};

export type InviteCheck = {
  valid: boolean;
  reason: string | null;
  patient_name_hint: string | null;
  schedules: ScheduleInput[];
};

export type ProviderKind = "person" | "company";
export type ProviderStatus = "active" | "archived";

export type Provider = {
  id: string;
  user_id: string;
  kind: ProviderKind;
  display_name: string;
  legal_name: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: ProviderStatus;
  created_at: string;
  updated_at: string;
};