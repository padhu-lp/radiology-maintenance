-- ============================================================================
-- 009: Suppliers, and the part attributes the sample catalogue revealed
--      (applied 2026-08-17)
-- ============================================================================
-- Manufacturer and supplier are different parties: Siemens makes the gradient
-- amplifier, Siemens Service India sells it to you. Lead times, GST numbers and
-- payment terms belong to the supplier, not the manufacturer.

CREATE TABLE IF NOT EXISTS public.suppliers (
  supplier_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code   VARCHAR(30) NOT NULL UNIQUE DEFAULT public.next_entity_code('SUPP'),
  supplier_name   VARCHAR(255) NOT NULL,
  contact_name    VARCHAR(255),
  phone           VARCHAR(30),
  email           VARCHAR(255),
  address         TEXT,
  city            VARCHAR(100),
  country         VARCHAR(100) DEFAULT 'India',
  gst_number      VARCHAR(20),
  payment_terms   VARCHAR(100),
  lead_time_days  INTEGER CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_inventory
  -- Internal catalogue code (PART-0001), distinct from part_number
  -- (GA-3T-4401) which is the manufacturer's identifier, not ours.
  ADD COLUMN IF NOT EXISTS part_code VARCHAR(30) UNIQUE DEFAULT public.next_entity_code('PART'),
  -- Machine family this part fits. Nullable: cables, fuses and consumables
  -- are not tied to one modality.
  ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(supplier_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'Each',
  ADD COLUMN IF NOT EXISTS last_purchase_date DATE,
  ADD COLUMN IF NOT EXISTS is_consumable BOOLEAN NOT NULL DEFAULT FALSE;

-- Same value set as equipment.equipment_type, so filtering a work order's parts
-- by the machine it is for actually matches.
ALTER TABLE public.parts_inventory DROP CONSTRAINT IF EXISTS parts_inventory_equipment_type_check;
ALTER TABLE public.parts_inventory ADD CONSTRAINT parts_inventory_equipment_type_check CHECK (
  equipment_type IS NULL OR equipment_type IN
    ('X-Ray','CT','MRI','Ultrasound','Mammography','Fluoroscopy',
     'PET','SPECT','DR/CR','C-Arm','Other'));

-- A reorder point below the minimum stock level is almost always a data entry
-- slip: you would be reordering only after breaching the floor.
ALTER TABLE public.parts_inventory DROP CONSTRAINT IF EXISTS parts_inventory_reorder_sane;
ALTER TABLE public.parts_inventory ADD CONSTRAINT parts_inventory_reorder_sane CHECK (
  reorder_point IS NULL OR minimum_stock IS NULL OR reorder_point >= minimum_stock);

-- DEFAULT only applies to new rows; backfill before enforcing NOT NULL.
UPDATE public.parts_inventory SET part_code = public.next_entity_code('PART')
 WHERE part_code IS NULL;
ALTER TABLE public.parts_inventory ALTER COLUMN part_code SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_parts_equipment_type ON public.parts_inventory(equipment_type);
CREATE INDEX IF NOT EXISTS idx_parts_supplier       ON public.parts_inventory(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name       ON public.suppliers(supplier_name);

DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_suppliers_audit ON public.suppliers;
CREATE TRIGGER trg_suppliers_audit AFTER INSERT OR UPDATE OR DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION audit.log_change('supplier_id');

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_select ON public.suppliers;
DROP POLICY IF EXISTS suppliers_insert ON public.suppliers;
DROP POLICY IF EXISTS suppliers_update ON public.suppliers;
DROP POLICY IF EXISTS suppliers_delete ON public.suppliers;

CREATE POLICY suppliers_select ON public.suppliers FOR SELECT TO authenticated
  USING ((select public.user_role()) IS NOT NULL);
CREATE POLICY suppliers_insert ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK ((select public.is_admin()));
CREATE POLICY suppliers_update ON public.suppliers FOR UPDATE TO authenticated
  USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
CREATE POLICY suppliers_delete ON public.suppliers FOR DELETE TO authenticated
  USING ((select public.is_admin()));

-- Sample catalogue (12 parts, 4 suppliers) was seeded separately; see the
-- session record. Re-running is safe — inserts are guarded by NOT EXISTS.
