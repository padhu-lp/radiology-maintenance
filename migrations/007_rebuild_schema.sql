-- ============================================================================
-- 007: Full schema rebuild per SCHEMA_REDESIGN.md  (applied 2026-08-17)
-- ============================================================================
-- Applied to the live project as four named migrations:
--   rebuild_core_schema
--   rebuild_triggers_and_rls
--   grant_audit_log_select
--   allow_staff_delete_workorder_lines
-- Consolidated here so the repository matches the database.
--
-- PRESERVED from the previous schema: auth.users, public.user_profiles,
-- the app_role enum, and the RBAC helpers user_role()/is_admin()/is_staff()
-- from migration 006.
-- ============================================================================

-- ---------- drop the old world ----------
DROP TABLE IF EXISTS public.work_orders      CASCADE;
DROP TABLE IF EXISTS public.schedules        CASCADE;
DROP TABLE IF EXISTS public.qc_tests         CASCADE;
DROP TABLE IF EXISTS public.parts_inventory  CASCADE;
DROP TABLE IF EXISTS public.inventory        CASCADE;
DROP TABLE IF EXISTS public.locations        CASCADE;
DROP TABLE IF EXISTS public.customers        CASCADE;
DROP TABLE IF EXISTS public.manufacturers    CASCADE;
DROP TABLE IF EXISTS public.technicians      CASCADE;
DROP TABLE IF EXISTS audit.cybersecurity_alerts CASCADE;
DROP TABLE IF EXISTS audit.activity_log      CASCADE;
DROP FUNCTION IF EXISTS public.update_parts_stock()        CASCADE;
DROP FUNCTION IF EXISTS public.update_modified_timestamp() CASCADE;

-- DEFERRED vendor-import columns, previously on parts_inventory. These describe
-- installed equipment tracked by a vendor system, not spare parts. If that feed
-- becomes a requirement, build a dedicated `installed_base` table - do not
-- re-attach them here:
--   serial_number, division, country, eq_status, eq_substatus, service_partner,
--   service_partner_name, location_code, location_name, location_short_form,
--   location_street, location_city, location_zip_code, software_version,
--   date_of_delivery, install_date, bl_warranty_start_date, bl_warranty_end_date,
--   customer_warranty_start_date, customer_warranty_end_date, hq_purchase_order,
--   hq_sales_order, hc_submission_no, debitor, end_of_delivery_date,
--   end_of_support_date, last_country_activity, license_type

-- ---------- document numbering ----------
CREATE TABLE IF NOT EXISTS public.document_counters (
  prefix TEXT NOT NULL, year INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (prefix, year)
);

CREATE OR REPLACE FUNCTION public.next_document_number(p_prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE y INTEGER := EXTRACT(YEAR FROM now())::INTEGER; n INTEGER;
BEGIN
  INSERT INTO public.document_counters (prefix, year, counter) VALUES (p_prefix, y, 1)
  ON CONFLICT (prefix, year) DO UPDATE SET counter = document_counters.counter + 1
  RETURNING counter INTO n;
  RETURN p_prefix || '-' || y || '-' || lpad(n::TEXT, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION public.next_entity_code(p_prefix TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE n INTEGER;
BEGIN
  INSERT INTO public.document_counters (prefix, year, counter) VALUES (p_prefix, 0, 1)
  ON CONFLICT (prefix, year) DO UPDATE SET counter = document_counters.counter + 1
  RETURNING counter INTO n;
  RETURN p_prefix || '-' || lpad(n::TEXT, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ---------- tables ----------
CREATE TABLE public.customers (
  customer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code VARCHAR(30) NOT NULL UNIQUE DEFAULT public.next_entity_code('CUST'),
  customer_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255), phone VARCHAR(30), email VARCHAR(255),
  address TEXT, city VARCHAR(100), state_province VARCHAR(100),
  postal_code VARCHAR(20), country VARCHAR(100) DEFAULT 'India', notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.locations (
  location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  facility_name VARCHAR(255), department_name VARCHAR(255) NOT NULL,
  building VARCHAR(50), floor_level VARCHAR(50), room_number VARCHAR(50),
  description TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.manufacturers (
  manufacturer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer_code VARCHAR(30) NOT NULL UNIQUE DEFAULT public.next_entity_code('MFR'),
  manufacturer_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255), phone VARCHAR(30), email VARCHAR(255),
  address TEXT, website VARCHAR(255), is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.technicians (
  technician_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_code VARCHAR(30) NOT NULL UNIQUE DEFAULT public.next_entity_code('TECH'),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255), phone VARCHAR(30),
  specialization VARCHAR(255), certification VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.parts_inventory (
  part_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number VARCHAR(100) NOT NULL UNIQUE,
  part_name VARCHAR(255) NOT NULL,
  manufacturer_id UUID REFERENCES public.manufacturers(manufacturer_id) ON DELETE SET NULL,
  category VARCHAR(100), description TEXT,
  unit_cost NUMERIC(12,2) CHECK (unit_cost IS NULL OR unit_cost >= 0),
  currency_code CHAR(3) NOT NULL DEFAULT 'INR',
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  minimum_stock INTEGER CHECK (minimum_stock IS NULL OR minimum_stock >= 0),
  reorder_point INTEGER CHECK (reorder_point IS NULL OR reorder_point >= 0),
  storage_location VARCHAR(255),
  lead_time_days INTEGER CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.equipment (
  equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_code VARCHAR(30) NOT NULL UNIQUE DEFAULT public.next_entity_code('EQ'),
  customer_id UUID NOT NULL REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
  location_id UUID REFERENCES public.locations(location_id) ON DELETE SET NULL,
  manufacturer_id UUID REFERENCES public.manufacturers(manufacturer_id) ON DELETE SET NULL,
  equipment_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100) NOT NULL CHECK (equipment_type IN
    ('X-Ray','CT','MRI','Ultrasound','Mammography','Fluoroscopy','PET','SPECT','DR/CR','C-Arm','Other')),
  model_number VARCHAR(255), serial_number VARCHAR(255),
  installation_date DATE, purchase_date DATE,
  purchase_price NUMERIC(12,2) CHECK (purchase_price IS NULL OR purchase_price >= 0),
  warranty_expiry DATE,
  risk_level VARCHAR(20) CHECK (risk_level IS NULL OR risk_level IN ('Critical','High','Medium','Low')),
  status VARCHAR(30) NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active','Under Maintenance','Out of Service','Retired')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.maintenance_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(equipment_id) ON DELETE CASCADE,
  maintenance_type VARCHAR(255) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN
    ('Daily','Weekly','Monthly','Quarterly','Semi-Annual','Annual','As Needed')),
  frequency_interval INTEGER CHECK (frequency_interval IS NULL OR frequency_interval > 0),
  last_performed DATE, next_due DATE NOT NULL,
  estimated_hours NUMERIC(10,2) CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  required_parts TEXT, procedure_details TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.service_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(30) NOT NULL UNIQUE DEFAULT public.next_document_number('SR'),
  customer_id UUID NOT NULL REFERENCES public.customers(customer_id) ON DELETE RESTRICT,
  -- Nullable by design: a caller may report an unregistered machine and staff
  -- attach the equipment during triage. Tighten to NOT NULL once workflows settle.
  equipment_id UUID REFERENCES public.equipment(equipment_id) ON DELETE SET NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'Phone'
    CHECK (channel IN ('Phone','Email','WhatsApp','Walk-in','Other')),
  reported_by_name VARCHAR(255), reported_by_phone VARCHAR(30),
  problem_summary VARCHAR(255) NOT NULL, problem_details TEXT,
  urgency VARCHAR(20) NOT NULL DEFAULT 'Medium'
    CHECK (urgency IN ('Emergency','High','Medium','Low')),
  status VARCHAR(20) NOT NULL DEFAULT 'New'
    CHECK (status IN ('New','Triaged','Converted','Resolved','Cancelled')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT, closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.work_orders (
  workorder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workorder_number VARCHAR(30) NOT NULL UNIQUE DEFAULT public.next_document_number('WO'),
  service_request_id UUID REFERENCES public.service_requests(request_id) ON DELETE SET NULL,
  equipment_id UUID NOT NULL REFERENCES public.equipment(equipment_id) ON DELETE RESTRICT,
  schedule_id UUID REFERENCES public.maintenance_schedules(schedule_id) ON DELETE SET NULL,
  workorder_type VARCHAR(20) NOT NULL CHECK (workorder_type IN
    ('Preventive','Corrective','Emergency','Calibration','Installation','Inspection')),
  priority VARCHAR(20) NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Emergency','High','Medium','Low')),
  status VARCHAR(20) NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open','In Progress','On Hold','Completed','Cancelled')),
  problem_description TEXT, fault_code VARCHAR(50),
  scheduled_date DATE, start_date DATE, completion_date DATE,
  downtime_hours NUMERIC(10,2) CHECK (downtime_hours IS NULL OR downtime_hours >= 0),
  work_description TEXT, resolution TEXT, service_provider VARCHAR(255),
  labor_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (labor_cost >= 0),
  -- parts_cost is maintained by trigger from workorder_parts; do not write directly.
  parts_cost NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (parts_cost >= 0),
  total_cost NUMERIC(12,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
  currency_code CHAR(3) NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT work_orders_dates_sane CHECK (
    completion_date IS NULL OR start_date IS NULL OR completion_date >= start_date),
  CONSTRAINT work_orders_completion_documented CHECK (
    status <> 'Completed' OR (resolution IS NOT NULL AND completion_date IS NOT NULL))
);

CREATE TABLE public.workorder_technicians (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workorder_id UUID NOT NULL REFERENCES public.work_orders(workorder_id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(technician_id) ON DELETE RESTRICT,
  role VARCHAR(20) NOT NULL DEFAULT 'Lead' CHECK (role IN ('Lead','Assistant')),
  hours_worked NUMERIC(10,2) CHECK (hours_worked IS NULL OR hours_worked >= 0),
  notes TEXT, assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workorder_id, technician_id)
);

CREATE TABLE public.workorder_parts (
  usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workorder_id UUID NOT NULL REFERENCES public.work_orders(workorder_id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES public.parts_inventory(part_id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  -- Price captured at time of use: later catalogue changes must not rewrite history.
  -- Nullable so a trigger can default it from parts_inventory.unit_cost.
  unit_cost NUMERIC(12,2) CHECK (unit_cost >= 0),
  line_cost NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  notes TEXT, used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE public.qc_tests (
  qc_test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.equipment(equipment_id) ON DELETE CASCADE,
  workorder_id UUID REFERENCES public.work_orders(workorder_id) ON DELETE SET NULL,
  test_type VARCHAR(255) NOT NULL, test_date DATE NOT NULL,
  technician_id UUID REFERENCES public.technicians(technician_id) ON DELETE SET NULL,
  test_protocol VARCHAR(255), phantom_used VARCHAR(255),
  measured_values JSONB, acceptance_criteria TEXT,
  pass_fail_status VARCHAR(20) NOT NULL CHECK (pass_fail_status IN ('Pass','Fail','Conditional')),
  deviations TEXT, corrective_actions TEXT, next_test_due DATE,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id), approved_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT qc_tests_approval_consistent CHECK (
    approved = FALSE OR (approved_by IS NOT NULL AND approved_date IS NOT NULL))
);

CREATE TABLE audit.activity_log (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL, record_id UUID NOT NULL,
  action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  -- Nullable: service-role and SQL-console changes have no auth.uid().
  user_id UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_values JSONB, new_values JSONB
);

-- ---------- indexes ----------
CREATE INDEX idx_locations_customer     ON public.locations(customer_id);
CREATE INDEX idx_equipment_customer     ON public.equipment(customer_id);
CREATE INDEX idx_equipment_location     ON public.equipment(location_id);
CREATE INDEX idx_equipment_manufacturer ON public.equipment(manufacturer_id);
CREATE INDEX idx_equipment_status       ON public.equipment(status);
CREATE INDEX idx_equipment_type         ON public.equipment(equipment_type);
CREATE INDEX idx_sched_equipment        ON public.maintenance_schedules(equipment_id);
CREATE INDEX idx_sched_next_due         ON public.maintenance_schedules(next_due) WHERE is_active;
CREATE INDEX idx_sr_customer            ON public.service_requests(customer_id);
CREATE INDEX idx_sr_equipment           ON public.service_requests(equipment_id);
CREATE INDEX idx_sr_status              ON public.service_requests(status);
CREATE INDEX idx_sr_received            ON public.service_requests(received_at DESC);
CREATE INDEX idx_wo_equipment           ON public.work_orders(equipment_id);
CREATE INDEX idx_wo_request             ON public.work_orders(service_request_id);
CREATE INDEX idx_wo_status              ON public.work_orders(status);
CREATE INDEX idx_wo_scheduled           ON public.work_orders(scheduled_date);
CREATE INDEX idx_wo_created             ON public.work_orders(created_at DESC);
CREATE INDEX idx_wotech_workorder       ON public.workorder_technicians(workorder_id);
CREATE INDEX idx_wotech_technician      ON public.workorder_technicians(technician_id);
CREATE INDEX idx_woparts_workorder      ON public.workorder_parts(workorder_id);
CREATE INDEX idx_woparts_part           ON public.workorder_parts(part_id);
CREATE INDEX idx_parts_manufacturer     ON public.parts_inventory(manufacturer_id);
CREATE INDEX idx_parts_low_stock        ON public.parts_inventory(quantity_on_hand) WHERE is_active;
CREATE INDEX idx_qc_equipment           ON public.qc_tests(equipment_id);
CREATE INDEX idx_qc_test_date           ON public.qc_tests(test_date DESC);
CREATE INDEX idx_audit_table_record     ON audit.activity_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at       ON audit.activity_log(changed_at DESC);
CREATE INDEX idx_technicians_user       ON public.technicians(user_id);

-- ---------- updated_at triggers ----------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','locations','manufacturers','technicians',
                           'parts_inventory','equipment','maintenance_schedules',
                           'service_requests','work_orders','qc_tests']
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;

-- ---------- audit trail (finally attached, unlike the old schema) ----------
CREATE OR REPLACE FUNCTION audit.log_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, audit, pg_temp AS $$
DECLARE v_record_id UUID; v_old JSONB; v_new JSONB;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD); v_record_id := (v_old ->> TG_ARGV[0])::UUID;
  ELSE
    v_new := to_jsonb(NEW); v_record_id := (v_new ->> TG_ARGV[0])::UUID;
    IF TG_OP = 'UPDATE' THEN
      v_old := to_jsonb(OLD);
      IF v_old = v_new THEN RETURN NEW; END IF;   -- skip no-op updates
    END IF;
  END IF;
  INSERT INTO audit.activity_log (table_name, record_id, action, user_id, old_values, new_values)
  VALUES (TG_TABLE_NAME, v_record_id, TG_OP, auth.uid(), v_old, v_new);
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('customers','customer_id'), ('locations','location_id'),
    ('manufacturers','manufacturer_id'), ('technicians','technician_id'),
    ('parts_inventory','part_id'), ('equipment','equipment_id'),
    ('maintenance_schedules','schedule_id'), ('service_requests','request_id'),
    ('work_orders','workorder_id'), ('workorder_technicians','assignment_id'),
    ('workorder_parts','usage_id'), ('qc_tests','qc_test_id')
  ) AS v(tbl, pk)
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%1$s_audit AFTER INSERT OR UPDATE OR DELETE
      ON public.%1$I FOR EACH ROW EXECUTE FUNCTION audit.log_change(%2$L)', r.tbl, r.pk);
  END LOOP;
END $$;

-- ---------- stock movement + cost rollup ----------
CREATE OR REPLACE FUNCTION public.apply_parts_usage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE v_workorder UUID;
BEGIN
  -- Adjust by delta so edits and deletes are handled, not just inserts.
  IF TG_OP = 'INSERT' THEN
    UPDATE public.parts_inventory SET quantity_on_hand = quantity_on_hand - NEW.quantity
     WHERE part_id = NEW.part_id;
    v_workorder := NEW.workorder_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.part_id <> OLD.part_id THEN
      UPDATE public.parts_inventory SET quantity_on_hand = quantity_on_hand + OLD.quantity WHERE part_id = OLD.part_id;
      UPDATE public.parts_inventory SET quantity_on_hand = quantity_on_hand - NEW.quantity WHERE part_id = NEW.part_id;
    ELSE
      UPDATE public.parts_inventory SET quantity_on_hand = quantity_on_hand + OLD.quantity - NEW.quantity
       WHERE part_id = NEW.part_id;
    END IF;
    v_workorder := NEW.workorder_id;
  ELSE
    UPDATE public.parts_inventory SET quantity_on_hand = quantity_on_hand + OLD.quantity
     WHERE part_id = OLD.part_id;
    v_workorder := OLD.workorder_id;
  END IF;

  UPDATE public.work_orders w SET parts_cost = COALESCE(
    (SELECT SUM(line_cost) FROM public.workorder_parts p WHERE p.workorder_id = v_workorder), 0)
   WHERE w.workorder_id = v_workorder;

  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_workorder_parts_apply
  AFTER INSERT OR UPDATE OR DELETE ON public.workorder_parts
  FOR EACH ROW EXECUTE FUNCTION public.apply_parts_usage();

CREATE OR REPLACE FUNCTION public.default_part_unit_cost()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NEW.unit_cost IS NULL THEN
    SELECT COALESCE(unit_cost, 0) INTO NEW.unit_cost
      FROM public.parts_inventory WHERE part_id = NEW.part_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_workorder_parts_default_cost
  BEFORE INSERT ON public.workorder_parts
  FOR EACH ROW EXECUTE FUNCTION public.default_part_unit_cost();

-- ---------- RLS ----------
ALTER TABLE public.customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manufacturers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workorder_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workorder_parts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_tests              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_counters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.activity_log           ENABLE ROW LEVEL SECURITY;

-- Master data: all signed-in roles read; admins write.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['customers','locations','manufacturers','technicians','parts_inventory','equipment']
  LOOP
    EXECUTE format('CREATE POLICY %1$s_select ON public.%1$I FOR SELECT TO authenticated USING ((select public.user_role()) IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY %1$s_insert ON public.%1$I FOR INSERT TO authenticated WITH CHECK ((select public.is_admin()))', t);
    EXECUTE format('CREATE POLICY %1$s_update ON public.%1$I FOR UPDATE TO authenticated USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()))', t);
    EXECUTE format('CREATE POLICY %1$s_delete ON public.%1$I FOR DELETE TO authenticated USING ((select public.is_admin()))', t);
  END LOOP;
END $$;

-- Operational data: all signed-in roles read; staff write; admins delete parents.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['maintenance_schedules','service_requests','work_orders',
                           'workorder_technicians','workorder_parts','qc_tests']
  LOOP
    EXECUTE format('CREATE POLICY %1$s_select ON public.%1$I FOR SELECT TO authenticated USING ((select public.user_role()) IS NOT NULL)', t);
    EXECUTE format('CREATE POLICY %1$s_insert ON public.%1$I FOR INSERT TO authenticated WITH CHECK ((select public.is_staff()))', t);
    EXECUTE format('CREATE POLICY %1$s_update ON public.%1$I FOR UPDATE TO authenticated USING ((select public.is_staff())) WITH CHECK ((select public.is_staff()))', t);
    EXECUTE format('CREATE POLICY %1$s_delete ON public.%1$I FOR DELETE TO authenticated USING ((select public.is_admin()))', t);
  END LOOP;
END $$;

-- Line items are working records: staff who add them must be able to correct
-- them. Deleting the parent work order stays admin-only.
DROP POLICY IF EXISTS workorder_parts_delete       ON public.workorder_parts;
DROP POLICY IF EXISTS workorder_technicians_delete ON public.workorder_technicians;
CREATE POLICY workorder_parts_delete ON public.workorder_parts
  FOR DELETE TO authenticated USING ((select public.is_staff()));
CREATE POLICY workorder_technicians_delete ON public.workorder_technicians
  FOR DELETE TO authenticated USING ((select public.is_staff()));

CREATE POLICY activity_log_select ON audit.activity_log
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR (select public.is_admin()));

-- ---------- grants ----------
-- RLS narrows access; it does not grant it. Without these the policies are dead.
GRANT USAGE  ON SCHEMA audit TO authenticated;
GRANT SELECT ON audit.activity_log TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON audit.activity_log FROM authenticated, anon;

-- document_counters: reachable only via SECURITY DEFINER functions.
REVOKE ALL ON public.document_counters FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.next_document_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_entity_code(TEXT)     TO authenticated;
REVOKE ALL ON FUNCTION public.next_document_number(TEXT) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.next_entity_code(TEXT)     FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION audit.log_change()              FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.apply_parts_usage()      FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at()         FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.default_part_unit_cost() FROM anon, authenticated, PUBLIC;
