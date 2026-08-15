-- Migration: Add Customers table and update Locations to reference Customers
-- This migration adds a Customers table and creates a relationship between Customers and Locations

-- ============================================================================
-- STEP 1: CREATE CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
  customer_id BIGSERIAL PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE,
  customer_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: ADD CUSTOMER_ID FOREIGN KEY TO LOCATIONS TABLE
-- ============================================================================

-- Add customer_id column to locations table
ALTER TABLE public.locations
ADD COLUMN customer_id BIGINT;

-- Add foreign key constraint
ALTER TABLE public.locations
ADD CONSTRAINT locations_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 3: CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_locations_customer_id ON public.locations(customer_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the changes were successful:

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers';
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'customer_id';
-- SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'locations' AND constraint_type = 'FOREIGN KEY';
