# Database Migration Guide: Moving Tables to Public Schema

## Overview
This guide walks you through moving all database tables from custom schemas (equipment, maintenance, quality) to the public schema in Supabase.

## Prerequisites
- Access to your Supabase dashboard at https://bmfpmawingyslabxsdia.supabase.co
- All tables are currently empty (only test/demo data)
- You have admin access to run SQL migrations

## Migration Steps

### Step 1: Backup Your Current Database (Optional but Recommended)
1. Go to your Supabase dashboard
2. Click **Database** → **Backups** (if available)
3. Create a manual backup before proceeding

### Step 2: Execute the Migration Script

1. **Open SQL Editor in Supabase**:
   - Go to https://bmfpmawingyslabxsdia.supabase.co
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

2. **Copy and Paste the Migration Script**:
   - Open `/migrations/001_move_tables_to_public_schema.sql` from your project
   - Copy the entire content
   - Paste it into the Supabase SQL editor

3. **Run the Migration**:
   - Click the **Run** button (or press Ctrl+Enter)
   - Wait for the query to complete (should show "Success" message)

### Step 3: Verify the Migration

Run these verification queries in the SQL editor to confirm everything worked:

#### Verify all tables are in public schema:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected output (7 tables):
```
locations
manufacturers
inventory
work_orders
schedules
parts_inventory
qc_tests
```

#### Verify foreign key relationships are intact:
```sql
SELECT
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE table_schema = 'public'
ORDER BY table_name, column_name;
```

Expected output (6 foreign keys):
- inventory.manufacturer_id → manufacturers.manufacturer_id
- inventory.location_id → locations.location_id
- work_orders.equipment_id → inventory.equipment_id
- schedules.equipment_id → inventory.equipment_id
- parts_inventory.manufacturer_id → manufacturers.manufacturer_id
- qc_tests.equipment_id → inventory.equipment_id

#### Verify indexes were created:
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Step 4: Delete Old Schemas (After Verification)

**Important**: Only after confirming the tables are in the public schema and contain any data you need, run:

```sql
DROP SCHEMA IF EXISTS quality CASCADE;
DROP SCHEMA IF EXISTS maintenance CASCADE;
DROP SCHEMA IF EXISTS equipment CASCADE;
```

**Warning**: The `CASCADE` keyword will delete everything in those schemas. Make sure you don't have any data you need before running this.

### Step 5: Update Application Configuration (If Needed)

The application should work without changes since it queries Supabase and the public schema is the default. However, verify:

1. Check `src/lib/types/database.ts` - No changes needed, types are schema-agnostic
2. Check all Supabase queries in your application - They should automatically use public schema

### Step 6: Test Your Application

1. Go to http://localhost:3000
2. Test all dashboard features:
   - View equipment list
   - View work orders
   - Create new equipment
   - Check all other menu items

All queries should work as before since they're now pointing to the public schema.

## Rollback Plan (If Something Goes Wrong)

If you need to rollback:

1. Restore from backup (if you created one)
2. Or manually recreate the old schema structure
3. Or contact Supabase support for recovery options

## Table Structure Reference

After migration, your public schema will contain:

### 1. **manufacturers** (no dependencies)
- Stores equipment manufacturer information
- Referenced by: inventory, parts_inventory

### 2. **locations** (no dependencies)
- Stores facility/department locations
- Referenced by: inventory

### 3. **inventory** (main equipment table)
- Depends on: manufacturers, locations
- Referenced by: work_orders, schedules, qc_tests

### 4. **work_orders** (maintenance tasks)
- Depends on: inventory
- Stores maintenance work requests and completions

### 5. **schedules** (maintenance schedules)
- Depends on: inventory
- Stores preventive maintenance schedules

### 6. **parts_inventory** (spare parts)
- Depends on: manufacturers
- Stores spare parts inventory

### 7. **qc_tests** (quality control)
- Depends on: inventory
- Stores quality control test results

## Foreign Key Relationships

```
manufacturers (no dependencies)
    ↑
    ├── referenced by inventory
    └── referenced by parts_inventory

locations (no dependencies)
    ↑
    └── referenced by inventory

inventory
    ↓
    ├── referenced by work_orders (CASCADE delete)
    ├── referenced by schedules (CASCADE delete)
    └── referenced by qc_tests (CASCADE delete)
```

## Constraint Details

All foreign keys are configured with:
- **ON DELETE SET NULL** for optional relationships (manufacturer_id, location_id)
- **ON DELETE CASCADE** for required relationships (equipment_id)

This ensures data integrity while allowing safe deletion of parent records.

## Questions or Issues?

If you encounter any issues:
1. Check the SQL editor error message for specific details
2. Review the migration script for any syntax errors
3. Verify your Supabase credentials are correct
4. Check that you have admin access to run DDL commands

## Next Steps After Migration

1. ✅ Run the migration script
2. ✅ Verify tables in public schema
3. ✅ Delete old schemas (optional but recommended)
4. ✅ Test your application
5. ✅ Update CLAUDE.md if needed

Once complete, your database schema will be properly organized with all tables in the public schema, following Supabase best practices!
