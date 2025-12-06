// lib/types/database.ts
// Auto-generated from Supabase schema - tables are in public schema

export type Database = {
    public: {
        inventory: {
            Row: {
                equipment_id: string
                inventory_number: string
                serial_number?: string
                model_number?: string
                equipment_name: string
                equipment_type: string
                manufacturer_id?: number
                department_id?: number
                location_id?: number
                installation_date?: string
                purchase_date?: string
                purchase_price?: number
                warranty_expiry?: string
                risk_level?: string
                status: string
                created_date: string
                last_modified: string
                created_by?: string
                modified_by?: string
            }
            Insert: Omit<Database['public']['inventory']['Row'], 'equipment_id' | 'created_date' | 'last_modified'>
            Update: Partial<Database['public']['inventory']['Insert']>
        }
        manufacturers: {
            Row: {
                manufacturer_id: number
                manufacturer_code?: string
                manufacturer_name: string
                contact_name?: string
                phone?: string
                email?: string
                address?: string
                website?: string
                is_active: boolean
                created_date: string
            }
            Insert: Omit<Database['public']['manufacturers']['Row'], 'manufacturer_id' | 'created_date'>
            Update: Partial<Database['public']['manufacturers']['Insert']>
        }
        customers: {
            Row: {
                customer_id: number
                customer_code: string
                customer_name: string
                contact_name?: string
                phone?: string
                email?: string
                address?: string
                city?: string
                state_province?: string
                postal_code?: string
                country?: string
                is_active: boolean
                created_date: string
            }
            Insert: Omit<Database['public']['customers']['Row'], 'customer_id' | 'created_date'>
            Update: Partial<Database['public']['customers']['Insert']>
        }
        locations: {
            Row: {
                location_id: number
                customer_id?: number
                facility_code?: string
                facility_name?: string
                building_code?: string
                department_name: string
                room_number?: string
                floor_level?: string
                description?: string
                is_active: boolean
                created_date: string
            }
            Insert: Omit<Database['public']['locations']['Row'], 'location_id' | 'created_date'>
            Update: Partial<Database['public']['locations']['Insert']>
        }
        work_orders: {
            Row: {
                workorder_id: string
                workorder_number: string
                equipment_id: string
                workorder_type: string
                priority: string
                requested_by?: string
                assigned_technician?: string
                service_provider?: string
                problem_description?: string
                fault_code?: string
                request_date: string
                scheduled_date?: string
                start_date?: string
                completion_date?: string
                downtime_hours?: number
                work_description?: string
                resolution?: string
                labor_hours?: number
                labor_cost?: number
                parts_cost?: number
                total_cost?: number
                status: string
                created_date: string
                created_by?: string
                modified_by?: string
                last_modified: string
            }
            Insert: Omit<Database['public']['work_orders']['Row'], 'workorder_id' | 'created_date' | 'last_modified'>
            Update: Partial<Database['public']['work_orders']['Insert']>
        }
        schedules: {
            Row: {
                schedule_id: string
                equipment_id: string
                maintenance_type: string
                frequency: string
                frequency_interval?: number
                last_performed?: string
                next_due: string
                estimated_hours?: number
                required_parts?: string
                procedure_details?: string
                is_active: boolean
                created_date: string
                created_by?: string
            }
            Insert: Omit<Database['public']['schedules']['Row'], 'schedule_id' | 'created_date'>
            Update: Partial<Database['public']['schedules']['Insert']>
        }
        parts_inventory: {
            Row: {
                part_id: string
                part_number: string
                part_name: string
                equipment_id?: string
                manufacturer_id?: number
                category?: string
                unit_cost?: number
                current_stock: number
                minimum_stock?: number
                maximum_stock?: number
                reorder_point?: number
                storage_location?: string
                lead_time_days?: number
                last_order_date?: string
                expiry_date?: string
                serial_number?: string
                division?: string
                country?: string
                eq_status?: string
                eq_substatus?: string
                service_partner?: string
                service_partner_name?: string
                location_code?: string
                location_name?: string
                location_short_form?: string
                location_street?: string
                location_city?: string
                location_zip_code?: string
                software_version?: string
                date_of_delivery?: string
                install_date?: string
                bl_warranty_start_date?: string
                bl_warranty_end_date?: string
                customer_warranty_start_date?: string
                customer_warranty_end_date?: string
                hq_purchase_order?: string
                hq_sales_order?: string
                hc_submission_no?: string
                debitor?: string
                end_of_delivery_date?: string
                end_of_support_date?: string
                last_country_activity?: string
                license_type?: string
                is_active: boolean
                created_date: string
            }
            Insert: Omit<Database['public']['parts_inventory']['Row'], 'part_id' | 'created_date'>
            Update: Partial<Database['public']['parts_inventory']['Insert']>
        }
        qc_tests: {
            Row: {
                qc_test_id: string
                equipment_id: string
                test_type: string
                test_date: string
                technician_id?: string
                test_protocol?: string
                phantom_used?: string
                test_results?: any
                pass_fail_status: string
                measured_values?: any
                acceptance_criteria?: string
                deviations?: string
                corrective_actions?: string
                next_test_due?: string
                image_attachments?: string[]
                approved: boolean
                approved_by?: string
                approved_date?: string
                created_date: string
            }
            Insert: Omit<Database['public']['qc_tests']['Row'], 'qc_test_id' | 'created_date'>
            Update: Partial<Database['public']['qc_tests']['Insert']>
        }
        technicians: {
            Row: {
                technician_id: string
                technician_code: string
                first_name: string
                last_name: string
                email?: string
                phone?: string
                specialization?: string
                certification?: string
                is_active: boolean
                created_date: string
            }
            Insert: Omit<Database['public']['technicians']['Row'], 'technician_id' | 'created_date'>
            Update: Partial<Database['public']['technicians']['Insert']>
        }
    }
}

// Type helper for accessing public schema tables
export type Tables<T extends keyof Database['public']> = Database['public'][T]