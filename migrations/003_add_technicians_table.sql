-- Add technicians table
CREATE TABLE IF NOT EXISTS public.technicians (
    technician_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    specialization VARCHAR(255),
    certification VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on technician_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_technician_code ON public.technicians(technician_code);

-- Create index on is_active for filtering active technicians
CREATE INDEX IF NOT EXISTS idx_technician_active ON public.technicians(is_active);
