/**
 * Types for the rebuilt schema (migration 007).
 *
 * Hand-maintained rather than raw `supabase gen types` output for one reason:
 * the value sets live in CHECK constraints, which the generator emits as plain
 * `string`. Declaring them here as const arrays gives us a single source of
 * truth that both the dropdowns and the type checker use, so a form option can
 * never drift from what the database will accept.
 *
 * If you change a CHECK constraint in a migration, change the matching array
 * below in the same commit.
 */

export type Json = string | number | boolean | null | { [k: string]: Json | undefined } | Json[]

/* ------------------------------------------------------------------ */
/* Value sets — mirror the CHECK constraints in migrations/007         */
/* ------------------------------------------------------------------ */

export const EQUIPMENT_TYPES = [
  'X-Ray', 'CT', 'MRI', 'Ultrasound', 'Mammography',
  'Fluoroscopy', 'PET', 'SPECT', 'DR/CR', 'C-Arm', 'Other',
] as const
export type EquipmentType = (typeof EQUIPMENT_TYPES)[number]

export const EQUIPMENT_STATUSES = ['Active', 'Under Maintenance', 'Out of Service', 'Retired'] as const
export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number]

export const RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const
export type RiskLevel = (typeof RISK_LEVELS)[number]

export const REQUEST_CHANNELS = ['Phone', 'Email', 'WhatsApp', 'Walk-in', 'Other'] as const
export type RequestChannel = (typeof REQUEST_CHANNELS)[number]

export const URGENCIES = ['Emergency', 'High', 'Medium', 'Low'] as const
export type Urgency = (typeof URGENCIES)[number]

export const REQUEST_STATUSES = ['New', 'Triaged', 'Converted', 'Resolved', 'Cancelled'] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const WORKORDER_TYPES = [
  'Preventive', 'Corrective', 'Emergency', 'Calibration', 'Installation', 'Inspection',
] as const
export type WorkOrderType = (typeof WORKORDER_TYPES)[number]

export const PRIORITIES = ['Emergency', 'High', 'Medium', 'Low'] as const
export type Priority = (typeof PRIORITIES)[number]

export const WORKORDER_STATUSES = ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] as const
export type WorkOrderStatus = (typeof WORKORDER_STATUSES)[number]

export const ASSIGNMENT_ROLES = ['Lead', 'Assistant'] as const
export type AssignmentRole = (typeof ASSIGNMENT_ROLES)[number]

export const FREQUENCIES = [
  'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed',
] as const
export type Frequency = (typeof FREQUENCIES)[number]

export const PASS_FAIL_STATUSES = ['Pass', 'Fail', 'Conditional'] as const
export type PassFailStatus = (typeof PASS_FAIL_STATUSES)[number]

export const APP_ROLES = ['admin', 'technician', 'viewer'] as const
export type AppRole = (typeof APP_ROLES)[number]

/**
 * Narrowing guard for values arriving from outside the app — URL parameters,
 * form payloads, imports. `list.includes(x)` checks at runtime but does not
 * narrow the type, so the typed Supabase client would still reject the value.
 *
 *   if (isOneOf(EQUIPMENT_TYPES, type)) query.eq('equipment_type', type)
 */
export function isOneOf<T extends readonly string[]>(
  list: T,
  value: unknown
): value is T[number] {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

/* ------------------------------------------------------------------ */
/* Row shapes                                                          */
/* ------------------------------------------------------------------ */

// NOTE: these are `type` aliases, not `interface`, on purpose. postgrest-js
// constrains table shapes to Record<string, unknown>; TypeScript grants an
// implicit index signature to type aliases but never to interfaces, so using
// `interface` here makes every Row/Insert resolve to `never`.
export type Customer = {
  customer_id: string
  customer_code: string
  customer_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state_province: string | null
  postal_code: string | null
  country: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export type Location = {
  location_id: string
  customer_id: string
  facility_name: string | null
  department_name: string
  building: string | null
  floor_level: string | null
  room_number: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Manufacturer = {
  manufacturer_id: string
  manufacturer_code: string
  manufacturer_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  website: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Technician = {
  technician_id: string
  technician_code: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  specialization: string | null
  certification: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Equipment = {
  equipment_id: string
  equipment_code: string
  customer_id: string
  location_id: string | null
  manufacturer_id: string | null
  equipment_name: string
  equipment_type: EquipmentType
  model_number: string | null
  serial_number: string | null
  installation_date: string | null
  purchase_date: string | null
  purchase_price: number | null
  warranty_expiry: string | null
  risk_level: RiskLevel | null
  status: EquipmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export type Supplier = {
  supplier_id: string
  supplier_code: string
  supplier_name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  country: string | null
  gst_number: string | null
  payment_terms: string | null
  lead_time_days: number | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PartsInventory = {
  part_id: string
  /** Our internal catalogue code, e.g. PART-0001. */
  part_code: string
  /** The manufacturer's own identifier, e.g. GA-3T-4401. */
  part_number: string
  part_name: string
  manufacturer_id: string | null
  supplier_id: string | null
  /** Machine family this part fits; null for generic items. */
  equipment_type: EquipmentType | null
  category: string | null
  description: string | null
  unit_cost: number | null
  currency_code: string
  unit_of_measure: string
  quantity_on_hand: number
  minimum_stock: number | null
  reorder_point: number | null
  storage_location: string | null
  lead_time_days: number | null
  last_purchase_date: string | null
  is_consumable: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MaintenanceSchedule = {
  schedule_id: string
  equipment_id: string
  maintenance_type: string
  frequency: Frequency
  frequency_interval: number | null
  last_performed: string | null
  next_due: string
  estimated_hours: number | null
  required_parts: string | null
  procedure_details: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
}

export type ServiceRequest = {
  request_id: string
  request_number: string
  customer_id: string
  equipment_id: string | null
  channel: RequestChannel
  reported_by_name: string | null
  reported_by_phone: string | null
  problem_summary: string
  problem_details: string | null
  urgency: Urgency
  status: RequestStatus
  received_at: string
  received_by: string | null
  /** What we found when assessing the call, and the disposition. */
  triage_notes: string | null
  /** How it was closed without a visit. */
  resolution_notes: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
}

export type WorkOrder = {
  workorder_id: string
  workorder_number: string
  service_request_id: string | null
  equipment_id: string
  schedule_id: string | null
  workorder_type: WorkOrderType
  priority: Priority
  status: WorkOrderStatus
  problem_description: string | null
  fault_code: string | null
  scheduled_date: string | null
  start_date: string | null
  completion_date: string | null
  downtime_hours: number | null
  work_description: string | null
  resolution: string | null
  service_provider: string | null
  labor_cost: number
  /** Maintained by trigger from workorder_parts — never write directly. */
  parts_cost: number
  /** Generated column: labor_cost + parts_cost. Read-only. */
  total_cost: number | null
  currency_code: string
  created_at: string
  updated_at: string
  created_by: string | null
}

export type WorkOrderTechnician = {
  assignment_id: string
  workorder_id: string
  technician_id: string
  role: AssignmentRole
  hours_worked: number | null
  notes: string | null
  assigned_at: string
}

export type WorkOrderPart = {
  usage_id: string
  workorder_id: string
  part_id: string
  quantity: number
  /** Defaulted from the catalogue by trigger when omitted on insert. */
  unit_cost: number | null
  /** Generated column: quantity * unit_cost. Read-only. */
  line_cost: number | null
  notes: string | null
  used_at: string
  created_by: string | null
}

export type QcTest = {
  qc_test_id: string
  equipment_id: string
  workorder_id: string | null
  test_type: string
  test_date: string
  technician_id: string | null
  test_protocol: string | null
  phantom_used: string | null
  measured_values: Json | null
  acceptance_criteria: string | null
  pass_fail_status: PassFailStatus
  deviations: string | null
  corrective_actions: string | null
  next_test_due: string | null
  approved: boolean
  approved_by: string | null
  approved_date: string | null
  created_at: string
  updated_at: string
}

export type UserProfile = {
  user_id: string
  must_change_password: boolean | null
  password_changed_at: string | null
  created_at: string | null
  updated_at: string | null
  role: AppRole
  full_name: string | null
}

/* ------------------------------------------------------------------ */
/* Insert / Update helpers                                             */
/* ------------------------------------------------------------------ */

/** Columns the database fills in: PKs, codes, timestamps, generated values. */
type ServerManaged =
  | 'created_at' | 'updated_at' | 'assigned_at' | 'used_at' | 'received_at'
  | 'customer_code' | 'manufacturer_code' | 'technician_code' | 'equipment_code'
  | 'part_code' | 'supplier_code'
  | 'request_number' | 'workorder_number'
  | 'total_cost' | 'line_cost' | 'parts_cost'

export type Insert<T, PK extends keyof T> = Omit<T, PK | Extract<keyof T, ServerManaged>> &
  Partial<Pick<T, Extract<keyof T, ServerManaged>>>

export type Update<T, PK extends keyof T> = Partial<Omit<T, PK | Extract<keyof T, ServerManaged>>>

export type CustomerInsert       = Insert<Customer, 'customer_id'>
export type EquipmentUpdate      = Partial<Insert<Equipment, 'equipment_id'>>
export type LocationInsert       = Insert<Location, 'location_id'>
export type ManufacturerInsert   = Insert<Manufacturer, 'manufacturer_id'>
export type TechnicianInsert     = Insert<Technician, 'technician_id'>
export type EquipmentInsert      = Insert<Equipment, 'equipment_id'>
export type PartInsert           = Insert<PartsInventory, 'part_id'>
export type SupplierInsert       = Insert<Supplier, 'supplier_id'>
export type ScheduleInsert       = Insert<MaintenanceSchedule, 'schedule_id'>
export type ServiceRequestInsert = Insert<ServiceRequest, 'request_id'>
export type WorkOrderInsert      = Insert<WorkOrder, 'workorder_id'>
export type AssignmentInsert     = Insert<WorkOrderTechnician, 'assignment_id'>
export type PartUsageInsert      = Insert<WorkOrderPart, 'usage_id'>
export type QcTestInsert         = Insert<QcTest, 'qc_test_id'>

/* ------------------------------------------------------------------ */
/* Supabase client typing                                              */
/* ------------------------------------------------------------------ */

/**
 * NOTE: every table must carry a `Relationships` key. supabase-js checks the
 * schema against its GenericTable constraint, and a table missing that key
 * fails the check — at which point insert/update argument types silently
 * collapse to `never` and every query result is treated as possibly null.
 * Empty tuple is fine; we don't rely on typed embedded joins.
 */
type Rel = { Relationships: [] }

export type Database = {
  __InternalSupabase: { PostgrestVersion: '13.0.5' }
  public: {
    Tables: {
      customers:             { Row: Customer;            Insert: CustomerInsert;       Update: Partial<CustomerInsert> } & Rel
      locations:             { Row: Location;            Insert: LocationInsert;       Update: Partial<LocationInsert> } & Rel
      manufacturers:         { Row: Manufacturer;        Insert: ManufacturerInsert;   Update: Partial<ManufacturerInsert> } & Rel
      technicians:           { Row: Technician;          Insert: TechnicianInsert;     Update: Partial<TechnicianInsert> } & Rel
      equipment:             { Row: Equipment;           Insert: EquipmentInsert;      Update: Partial<EquipmentInsert> } & Rel
      parts_inventory:       { Row: PartsInventory;      Insert: PartInsert;           Update: Partial<PartInsert> } & Rel
      suppliers:             { Row: Supplier;            Insert: SupplierInsert;       Update: Partial<SupplierInsert> } & Rel
      maintenance_schedules: { Row: MaintenanceSchedule; Insert: ScheduleInsert;       Update: Partial<ScheduleInsert> } & Rel
      service_requests:      { Row: ServiceRequest;      Insert: ServiceRequestInsert; Update: Partial<ServiceRequestInsert> } & Rel
      work_orders:           { Row: WorkOrder;           Insert: WorkOrderInsert;      Update: Partial<WorkOrderInsert> } & Rel
      workorder_technicians: { Row: WorkOrderTechnician; Insert: AssignmentInsert;     Update: Partial<AssignmentInsert> } & Rel
      workorder_parts:       { Row: WorkOrderPart;       Insert: PartUsageInsert;      Update: Partial<PartUsageInsert> } & Rel
      qc_tests:              { Row: QcTest;              Insert: QcTestInsert;         Update: Partial<QcTestInsert> } & Rel
      user_profiles:         { Row: UserProfile;         Insert: Partial<UserProfile>; Update: Partial<UserProfile> } & Rel
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
