export type PatientStatus = "prospect" | "active" | "inactive" | "discharged";
export type PaymentFormat = "vencimento" | "antecipado" | "avulso";

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
  session_price_cents: number | null;
  created_at: string;
  updated_at: string;
  payment_format: PaymentFormat | null;
  default_payment_method: string | null;
  session_number_start: number | null;
};

// =========================================================
// Recorrência configurável
// =========================================================
export type RecurrenceType =
  | "once"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "yearly"
  | "every_30_days"
  | "custom_days";

export type ScheduleInput = {
  weekday: number;                  // 0=domingo, 6=sábado
  startTime: string | null;         // "HH:MM" ou null se for dia inteiro
  durationMin: number | null;       // default 50 ou null se for dia inteiro
  recurrenceType?: RecurrenceType;
  recurrenceDays?: number | null;
  anchorDate?: string | null;       // YYYY-MM-DD
  color?: string | null;
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
  session_price_cents: number | null;
  created_at: string;
  updated_at: string;
  payment_format: PaymentFormat | null;
  default_payment_method: string | null;
  session_number_start: number | null;
};

// =========================================================
// Vencimentos de Prestadores (company)
// =========================================================
export type BillingFrequency = "monthly" | "bimonthly" | "semiannual" | "yearly" | "once";

export type ProviderBilling = {
  id: string;
  user_id: string;
  provider_id: string;
  description: string;
  amount_cents: number;
  due_day: number;
  due_month: number | null;
  frequency: "monthly" | "bimonthly" | "semiannual" | "yearly" | "once" | "biweekly" | "custom_days";
  custom_interval_days: number | null;
  starts_on: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
};

export type AppointmentType = "session" | "personal" | "blocked" | "due";
export type AppointmentStatus =
  | "active"
  | "cancelled"
  | "completed"
  | "no_show_justified"
  | "no_show_unjustified";

export type Appointment = {
  id: string;
  user_id: string;
  patient_id: string | null;
  provider_id: string | null;
  type: AppointmentType;
  weekday: number;
  start_time: string;
  duration_min: number;
  starts_on: string;   // YYYY-MM-DD
  ends_on: string;     // YYYY-MM-DD
  is_recurring: boolean;
  status: AppointmentStatus;
  google_event_id: string | null;
  linked_expense: boolean;
  notes: string | null;
  title: string | null;    // <-- Adicionado
  color: string | null;    // <-- Adicionado
  created_at: string;
  updated_at: string;
};

// Appointment + dados do paciente/provider (retornado pelo hook)
export type AppointmentWithRelations = Appointment & {
  patient: {
    id: string;
    full_name: string;
  } | null;
  provider: {
    id: string;
    display_name: string;
  } | null;
};

// =========================================================
// Financeiro (transactions)
// =========================================================
export type TransactionType = "income" | "expense";
export type PaymentMethod = "pix" | "cash" | "card" | "transfer" | "other";

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  amount_cents: number;
  description: string;
  category: string;
  occurred_on: string;
  paid_on: string | null;
  patient_id: string | null;
  provider_id: string | null;
  billing_id: string | null;
  appointment_id: string | null;
  payment_method: PaymentMethod | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
  payment_format: PaymentFormat | null;

};

export type TransactionInput = {
  type: TransactionType;
  amount_cents: number;
  description: string;
  category: string;
  occurred_on: string;
  paid_on: string | null;
  patient_id: string | null;
  provider_id: string | null;
  billing_id: string | null;
  payment_method: PaymentMethod | null;
  payment_format: PaymentFormat | null; // <-- Adicione essa linha
  notes: string | null;
};
