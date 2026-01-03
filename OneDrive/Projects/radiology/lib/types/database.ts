// lib/types/database.ts
// This is a temporary types file - replace with generated types later

export type Database = {
    equipment: {
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
            Insert: Omit<Database['equipment']['inventory']['Row'], 'equipment_id' | 'created_date' | 'last_modified'>
            Update: Partial<Database['equipment']['inventory']['Insert']>
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
        }
        locations: {
            Row: {
                location_id: number
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
        }
    }
    maintenance: {
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
        }
        schedules: {
            Row: {
                schedule_id: string
                equipment_id: string
                maintenance_type: string
                frequency: string
                frequency_interval: number
                last_performed?: string
                next_due: string
                estimated_hours?: number
                required_parts?: string
                procedure_details?: string
                is_active: boolean
                created_date: string
                created_by?: string
            }
        }
        parts_inventory: {
            Row: {
                part_id: string
                part_number: string
                part_name: string
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
                is_active: boolean
                created_date: string
            }
        }
    }
    quality: {
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
        }
    }
    technicians: {
        Row: {
            id: string;
            name: string;
            contact: string;
            specialization: string;
        }
        Insert: Omit<Database['technicians']['Row'], 'id'>
        Update: Partial<Database['technicians']['Insert']>
    }
}

// Simplified type for now - you can use 'any' if needed
export type Tables<T extends keyof Database> = Database[T]