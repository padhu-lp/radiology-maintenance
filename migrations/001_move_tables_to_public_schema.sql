-- Migration: Move all tables from custom schemas to public schema
-- This migration recreates all tables in the public schema while preserving all relationships
-- Run this in your Supabase SQL editor

-- ============================================================================
-- STEP 1: CREATE TABLES IN PUBLIC SCHEMA (maintaining all relationships)
-- ============================================================================

-- Create manufacturers table (no dependencies)
CREATE TABLE IF NOT EXISTS public.manufacturers (
  manufacturer_id BIGSERIAL PRIMARY KEY,
  manufacturer_code VARCHAR(50),
  manufacturer_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  website VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create locations table (no dependencies)
CREATE TABLE IF NOT EXISTS public.locations (
  location_id BIGSERIAL PRIMARY KEY,
  facility_code VARCHAR(50),
  facility_name VARCHAR(255),
  building_code VARCHAR(50),
  department_name VARCHAR(255) NOT NULL,
  room_number VARCHAR(50),
  floor_level VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory table (depends on manufacturers, locations)
CREATE TABLE IF NOT EXISTS public.inventory (
  equipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_number VARCHAR(255) UNIQUE NOT NULL,
  serial_number VARCHAR(255),
  model_number VARCHAR(255),
  equipment_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(255) NOT NULL,
  manufacturer_id BIGINT REFERENCES public.manufacturers(manufacturer_id) ON DELETE SET NULL,
  department_id BIGINT,
  location_id BIGINT REFERENCES public.locations(location_id) ON DELETE SET NULL,
  installation_date DATE,
  purchase_date DATE,
  purchase_price DECIMAL(12, 2),
  warranty_expiry DATE,
  risk_level VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  modified_by VARCHAR(255)
);

-- Create work_orders table (depends on inventory)
CREATE TABLE IF NOT EXISTS public.work_orders (
  workorder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workorder_number VARCHAR(255) UNIQUE NOT NULL,
  equipment_id UUID NOT NULL REFERENCES public.inventory(equipment_id) ON DELETE CASCADE,
  workorder_type VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  requested_by VARCHAR(255),
  assigned_technician VARCHAR(255),
  service_provider VARCHAR(255),
  problem_description TEXT,
  fault_code VARCHAR(255),
  request_date TIMESTAMPTZ NOT NULL,
  scheduled_date DATE,
  start_date DATE,
  completion_date DATE,
  downtime_hours DECIMAL(10, 2),
  work_description TEXT,
  resolution TEXT,
  labor_hours DECIMAL(10, 2),
  labor_cost DECIMAL(12, 2),
  parts_cost DECIMAL(12, 2),
  total_cost DECIMAL(12, 2),
  status VARCHAR(50) NOT NULL DEFAULT 'Open',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  modified_by VARCHAR(255),
  last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- Create schedules table (depends on inventory)
CREATE TABLE IF NOT EXISTS public.schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.inventory(equipment_id) ON DELETE CASCADE,
  maintenance_type VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  frequency_interval INTEGER,
  last_performed DATE,
  next_due DATE NOT NULL,
  estimated_hours DECIMAL(10, 2),
  required_parts TEXT,
  procedure_details TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Create parts_inventory table (depends on manufacturers)
CREATE TABLE IF NOT EXISTS public.parts_inventory (
  part_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number VARCHAR(255) UNIQUE NOT NULL,
  part_name VARCHAR(255) NOT NULL,
  manufacturer_id BIGINT REFERENCES public.manufacturers(manufacturer_id) ON DELETE SET NULL,
  category VARCHAR(255),
  unit_cost DECIMAL(12, 2),
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER,
  maximum_stock INTEGER,
  reorder_point INTEGER,
  storage_location VARCHAR(255),
  lead_time_days INTEGER,
  last_order_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create qc_tests table (depends on inventory)
CREATE TABLE IF NOT EXISTS public.qc_tests (
  qc_test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES public.inventory(equipment_id) ON DELETE CASCADE,
  test_type VARCHAR(255) NOT NULL,
  test_date DATE NOT NULL,
  technician_id VARCHAR(255),
  test_protocol VARCHAR(255),
  phantom_used VARCHAR(255),
  test_results JSONB,
  pass_fail_status VARCHAR(50) NOT NULL,
  measured_values JSONB,
  acceptance_criteria TEXT,
  deviations TEXT,
  corrective_actions TEXT,
  next_test_due DATE,
  image_attachments TEXT[],
  approved BOOLEAN DEFAULT FALSE,
  approved_by VARCHAR(255),
  approved_date DATE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_manufacturer_id ON public.inventory(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON public.inventory(location_id);

CREATE INDEX IF NOT EXISTS idx_work_orders_equipment_id ON public.work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON public.work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_workorder_number ON public.work_orders(workorder_number);

CREATE INDEX IF NOT EXISTS idx_schedules_equipment_id ON public.schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_schedules_next_due ON public.schedules(next_due);

CREATE INDEX IF NOT EXISTS idx_parts_inventory_manufacturer_id ON public.parts_inventory(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_parts_inventory_part_number ON public.parts_inventory(part_number);

CREATE INDEX IF NOT EXISTS idx_qc_tests_equipment_id ON public.qc_tests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_qc_tests_test_date ON public.qc_tests(test_date);

-- ============================================================================
-- STEP 3: DELETE OLD SCHEMAS (if empty after migration)
-- ============================================================================

-- WARNING: Only run these if you've confirmed data migration is complete
-- Comment these out if you want to keep the old schemas temporarily

DROP SCHEMA IF EXISTS quality CASCADE;
DROP SCHEMA IF EXISTS maintenance CASCADE;
DROP SCHEMA IF EXISTS equipment CASCADE;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the migration was successful:

SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
SELECT constraint_name, table_name, column_name, foreign_table_name FROM information_schema.table_constraints
  WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';
