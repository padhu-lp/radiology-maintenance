// Auto-generated from the live Supabase schema (project: Radiology / bmfpmawingyslabxsdia).
// Regenerate with: npx supabase gen types typescript --project-id bmfpmawingyslabxsdia > src/lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          country: string | null
          created_date: string | null
          customer_code: string | null
          customer_id: number
          customer_name: string
          email: string | null
          is_active: boolean | null
          phone: string | null
          postal_code: string | null
          state_province: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_date?: string | null
          customer_code?: string | null
          customer_id?: number
          customer_name: string
          email?: string | null
          is_active?: boolean | null
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_date?: string | null
          customer_code?: string | null
          customer_id?: number
          customer_name?: string
          email?: string | null
          is_active?: boolean | null
          phone?: string | null
          postal_code?: string | null
          state_province?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_by: string | null
          created_date: string | null
          department_id: number | null
          equipment_id: string
          equipment_name: string
          equipment_type: string
          installation_date: string | null
          inventory_number: string
          last_modified: string | null
          location_id: number | null
          manufacturer_id: number | null
          model_number: string | null
          modified_by: string | null
          purchase_date: string | null
          purchase_price: number | null
          risk_level: string | null
          serial_number: string | null
          status: string
          warranty_expiry: string | null
        }
        Insert: {
          created_by?: string | null
          created_date?: string | null
          department_id?: number | null
          equipment_id?: string
          equipment_name: string
          equipment_type: string
          installation_date?: string | null
          inventory_number: string
          last_modified?: string | null
          location_id?: number | null
          manufacturer_id?: number | null
          model_number?: string | null
          modified_by?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          risk_level?: string | null
          serial_number?: string | null
          status?: string
          warranty_expiry?: string | null
        }
        Update: {
          created_by?: string | null
          created_date?: string | null
          department_id?: number | null
          equipment_id?: string
          equipment_name?: string
          equipment_type?: string
          installation_date?: string | null
          inventory_number?: string
          last_modified?: string | null
          location_id?: number | null
          manufacturer_id?: number | null
          model_number?: string | null
          modified_by?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          risk_level?: string | null
          serial_number?: string | null
          status?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["location_id"]
          },
          {
            foreignKeyName: "inventory_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["manufacturer_id"]
          },
        ]
      }
      locations: {
        Row: {
          building_code: string | null
          created_date: string | null
          customer_id: number | null
          department_name: string
          description: string | null
          facility_code: string | null
          facility_name: string | null
          floor_level: string | null
          is_active: boolean | null
          location_id: number
          room_number: string | null
        }
        Insert: {
          building_code?: string | null
          created_date?: string | null
          customer_id?: number | null
          department_name: string
          description?: string | null
          facility_code?: string | null
          facility_name?: string | null
          floor_level?: string | null
          is_active?: boolean | null
          location_id?: number
          room_number?: string | null
        }
        Update: {
          building_code?: string | null
          created_date?: string | null
          customer_id?: number | null
          department_name?: string
          description?: string | null
          facility_code?: string | null
          facility_name?: string | null
          floor_level?: string | null
          is_active?: boolean | null
          location_id?: number
          room_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_date: string | null
          email: string | null
          is_active: boolean | null
          manufacturer_code: string | null
          manufacturer_id: number
          manufacturer_name: string
          phone: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_date?: string | null
          email?: string | null
          is_active?: boolean | null
          manufacturer_code?: string | null
          manufacturer_id?: number
          manufacturer_name: string
          phone?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_date?: string | null
          email?: string | null
          is_active?: boolean | null
          manufacturer_code?: string | null
          manufacturer_id?: number
          manufacturer_name?: string
          phone?: string | null
          website?: string | null
        }
        Relationships: []
      }
      parts_inventory: {
        Row: {
          bl_warranty_end_date: string | null
          bl_warranty_start_date: string | null
          category: string | null
          country: string | null
          created_date: string | null
          current_stock: number
          customer_warranty_end_date: string | null
          customer_warranty_start_date: string | null
          date_of_delivery: string | null
          debitor: string | null
          division: string | null
          end_of_delivery_date: string | null
          end_of_support_date: string | null
          eq_status: string | null
          eq_substatus: string | null
          equipment_id: string | null
          expiry_date: string | null
          hc_submission_no: string | null
          hq_purchase_order: string | null
          hq_sales_order: string | null
          install_date: string | null
          is_active: boolean | null
          last_country_activity: string | null
          last_order_date: string | null
          lead_time_days: number | null
          license_type: string | null
          location_city: string | null
          location_code: string | null
          location_name: string | null
          location_short_form: string | null
          location_street: string | null
          location_zip_code: string | null
          manufacturer_id: number | null
          maximum_stock: number | null
          minimum_stock: number | null
          part_id: string
          part_name: string
          part_number: string
          reorder_point: number | null
          serial_number: string | null
          service_partner: string | null
          service_partner_name: string | null
          software_version: string | null
          storage_location: string | null
          unit_cost: number | null
        }
        Insert: {
          bl_warranty_end_date?: string | null
          bl_warranty_start_date?: string | null
          category?: string | null
          country?: string | null
          created_date?: string | null
          current_stock?: number
          customer_warranty_end_date?: string | null
          customer_warranty_start_date?: string | null
          date_of_delivery?: string | null
          debitor?: string | null
          division?: string | null
          end_of_delivery_date?: string | null
          end_of_support_date?: string | null
          eq_status?: string | null
          eq_substatus?: string | null
          equipment_id?: string | null
          expiry_date?: string | null
          hc_submission_no?: string | null
          hq_purchase_order?: string | null
          hq_sales_order?: string | null
          install_date?: string | null
          is_active?: boolean | null
          last_country_activity?: string | null
          last_order_date?: string | null
          lead_time_days?: number | null
          license_type?: string | null
          location_city?: string | null
          location_code?: string | null
          location_name?: string | null
          location_short_form?: string | null
          location_street?: string | null
          location_zip_code?: string | null
          manufacturer_id?: number | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          part_id?: string
          part_name: string
          part_number: string
          reorder_point?: number | null
          serial_number?: string | null
          service_partner?: string | null
          service_partner_name?: string | null
          software_version?: string | null
          storage_location?: string | null
          unit_cost?: number | null
        }
        Update: {
          bl_warranty_end_date?: string | null
          bl_warranty_start_date?: string | null
          category?: string | null
          country?: string | null
          created_date?: string | null
          current_stock?: number
          customer_warranty_end_date?: string | null
          customer_warranty_start_date?: string | null
          date_of_delivery?: string | null
          debitor?: string | null
          division?: string | null
          end_of_delivery_date?: string | null
          end_of_support_date?: string | null
          eq_status?: string | null
          eq_substatus?: string | null
          equipment_id?: string | null
          expiry_date?: string | null
          hc_submission_no?: string | null
          hq_purchase_order?: string | null
          hq_sales_order?: string | null
          install_date?: string | null
          is_active?: boolean | null
          last_country_activity?: string | null
          last_order_date?: string | null
          lead_time_days?: number | null
          license_type?: string | null
          location_city?: string | null
          location_code?: string | null
          location_name?: string | null
          location_short_form?: string | null
          location_street?: string | null
          location_zip_code?: string | null
          manufacturer_id?: number | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          part_id?: string
          part_name?: string
          part_number?: string
          reorder_point?: number | null
          serial_number?: string | null
          service_partner?: string | null
          service_partner_name?: string | null
          software_version?: string | null
          storage_location?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_parts_inventory_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["equipment_id"]
          },
          {
            foreignKeyName: "parts_inventory_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["manufacturer_id"]
          },
        ]
      }
      qc_tests: {
        Row: {
          acceptance_criteria: string | null
          approved: boolean | null
          approved_by: string | null
          approved_date: string | null
          corrective_actions: string | null
          created_date: string | null
          deviations: string | null
          equipment_id: string
          image_attachments: string[] | null
          measured_values: Json | null
          next_test_due: string | null
          pass_fail_status: string
          phantom_used: string | null
          qc_test_id: string
          technician_id: string | null
          test_date: string
          test_protocol: string | null
          test_results: Json | null
          test_type: string
        }
        Insert: {
          acceptance_criteria?: string | null
          approved?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          corrective_actions?: string | null
          created_date?: string | null
          deviations?: string | null
          equipment_id: string
          image_attachments?: string[] | null
          measured_values?: Json | null
          next_test_due?: string | null
          pass_fail_status: string
          phantom_used?: string | null
          qc_test_id?: string
          technician_id?: string | null
          test_date: string
          test_protocol?: string | null
          test_results?: Json | null
          test_type: string
        }
        Update: {
          acceptance_criteria?: string | null
          approved?: boolean | null
          approved_by?: string | null
          approved_date?: string | null
          corrective_actions?: string | null
          created_date?: string | null
          deviations?: string | null
          equipment_id?: string
          image_attachments?: string[] | null
          measured_values?: Json | null
          next_test_due?: string | null
          pass_fail_status?: string
          phantom_used?: string | null
          qc_test_id?: string
          technician_id?: string | null
          test_date?: string
          test_protocol?: string | null
          test_results?: Json | null
          test_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "qc_tests_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["equipment_id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_by: string | null
          created_date: string | null
          equipment_id: string
          estimated_hours: number | null
          frequency: string
          frequency_interval: number | null
          is_active: boolean | null
          last_performed: string | null
          maintenance_type: string
          next_due: string
          procedure_details: string | null
          required_parts: string | null
          schedule_id: string
        }
        Insert: {
          created_by?: string | null
          created_date?: string | null
          equipment_id: string
          estimated_hours?: number | null
          frequency: string
          frequency_interval?: number | null
          is_active?: boolean | null
          last_performed?: string | null
          maintenance_type: string
          next_due: string
          procedure_details?: string | null
          required_parts?: string | null
          schedule_id?: string
        }
        Update: {
          created_by?: string | null
          created_date?: string | null
          equipment_id?: string
          estimated_hours?: number | null
          frequency?: string
          frequency_interval?: number | null
          is_active?: boolean | null
          last_performed?: string | null
          maintenance_type?: string
          next_due?: string
          procedure_details?: string | null
          required_parts?: string | null
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["equipment_id"]
          },
        ]
      }
      technicians: {
        Row: {
          certification: string | null
          created_date: string | null
          email: string | null
          first_name: string
          is_active: boolean | null
          last_name: string
          phone: string | null
          specialization: string | null
          technician_code: string
          technician_id: string
        }
        Insert: {
          certification?: string | null
          created_date?: string | null
          email?: string | null
          first_name: string
          is_active?: boolean | null
          last_name: string
          phone?: string | null
          specialization?: string | null
          technician_code: string
          technician_id?: string
        }
        Update: {
          certification?: string | null
          created_date?: string | null
          email?: string | null
          first_name?: string
          is_active?: boolean | null
          last_name?: string
          phone?: string | null
          specialization?: string | null
          technician_code?: string
          technician_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          must_change_password: boolean | null
          password_changed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          must_change_password?: boolean | null
          password_changed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          must_change_password?: boolean | null
          password_changed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          assigned_technician: string | null
          completion_date: string | null
          created_by: string | null
          created_date: string | null
          downtime_hours: number | null
          equipment_id: string
          fault_code: string | null
          labor_cost: number | null
          labor_hours: number | null
          last_modified: string | null
          modified_by: string | null
          parts_cost: number | null
          priority: string
          problem_description: string | null
          request_date: string
          requested_by: string | null
          resolution: string | null
          scheduled_date: string | null
          service_provider: string | null
          start_date: string | null
          status: string
          total_cost: number | null
          work_description: string | null
          workorder_id: string
          workorder_number: string
          workorder_type: string
        }
        Insert: {
          assigned_technician?: string | null
          completion_date?: string | null
          created_by?: string | null
          created_date?: string | null
          downtime_hours?: number | null
          equipment_id: string
          fault_code?: string | null
          labor_cost?: number | null
          labor_hours?: number | null
          last_modified?: string | null
          modified_by?: string | null
          parts_cost?: number | null
          priority: string
          problem_description?: string | null
          request_date: string
          requested_by?: string | null
          resolution?: string | null
          scheduled_date?: string | null
          service_provider?: string | null
          start_date?: string | null
          status?: string
          total_cost?: number | null
          work_description?: string | null
          workorder_id?: string
          workorder_number: string
          workorder_type: string
        }
        Update: {
          assigned_technician?: string | null
          completion_date?: string | null
          created_by?: string | null
          created_date?: string | null
          downtime_hours?: number | null
          equipment_id?: string
          fault_code?: string | null
          labor_cost?: number | null
          labor_hours?: number | null
          last_modified?: string | null
          modified_by?: string | null
          parts_cost?: number | null
          priority?: string
          problem_description?: string | null
          request_date?: string
          requested_by?: string | null
          resolution?: string | null
          scheduled_date?: string | null
          service_provider?: string | null
          start_date?: string | null
          status?: string
          total_cost?: number | null
          work_description?: string | null
          workorder_id?: string
          workorder_number?: string
          workorder_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["equipment_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
