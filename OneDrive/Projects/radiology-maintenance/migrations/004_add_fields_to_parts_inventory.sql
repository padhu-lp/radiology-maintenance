-- Add equipment_id foreign key and additional fields to parts_inventory table

-- Add equipment_id foreign key (UUID to match inventory table)
ALTER TABLE public.parts_inventory
ADD COLUMN equipment_id UUID;

-- Add foreign key constraint
ALTER TABLE public.parts_inventory
ADD CONSTRAINT fk_parts_inventory_equipment
FOREIGN KEY (equipment_id)
REFERENCES public.inventory(equipment_id) ON DELETE SET NULL;

-- Add new fields to parts_inventory
ALTER TABLE public.parts_inventory
ADD COLUMN serial_number VARCHAR(16),
ADD COLUMN division VARCHAR(2),
ADD COLUMN country VARCHAR(2),
ADD COLUMN eq_status VARCHAR(6),
ADD COLUMN eq_substatus VARCHAR(6),
ADD COLUMN service_partner VARCHAR(6),
ADD COLUMN service_partner_name VARCHAR(16),
ADD COLUMN location_code VARCHAR(16),
ADD COLUMN location_name VARCHAR(30),
ADD COLUMN location_short_form VARCHAR(7),
ADD COLUMN location_street VARCHAR(6),
ADD COLUMN location_city VARCHAR(6),
ADD COLUMN location_zip_code VARCHAR(5),
ADD COLUMN software_version VARCHAR(1),
ADD COLUMN date_of_delivery DATE,
ADD COLUMN install_date DATE,
ADD COLUMN bl_warranty_start_date DATE,
ADD COLUMN bl_warranty_end_date DATE,
ADD COLUMN customer_warranty_start_date DATE,
ADD COLUMN customer_warranty_end_date DATE,
ADD COLUMN hq_purchase_order VARCHAR(12),
ADD COLUMN hq_sales_order VARCHAR(8),
ADD COLUMN hc_submission_no VARCHAR(10),
ADD COLUMN debitor VARCHAR(8),
ADD COLUMN end_of_delivery_date DATE,
ADD COLUMN end_of_support_date DATE,
ADD COLUMN last_country_activity DATE,
ADD COLUMN license_type VARCHAR(10);

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_parts_equipment_id ON public.parts_inventory(equipment_id);
CREATE INDEX IF NOT EXISTS idx_parts_serial_number ON public.parts_inventory(serial_number);
CREATE INDEX IF NOT EXISTS idx_parts_eq_status ON public.parts_inventory(eq_status);
CREATE INDEX IF NOT EXISTS idx_parts_location_code ON public.parts_inventory(location_code);
CREATE INDEX IF NOT EXISTS idx_parts_service_partner ON public.parts_inventory(service_partner);
