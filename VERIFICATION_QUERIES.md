# Corrected Verification Queries for Database Migration

Use these corrected queries to verify the migration was successful:

## Query 1: Verify all tables are in public schema

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output (7 tables):**
- locations
- manufacturers
- inventory
- parts_inventory
- qc_tests
- schedules
- work_orders

---

## Query 2: Verify foreign key relationships are intact

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS referenced_table_name,
  ccu.column_name AS referenced_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

**Expected output (6 foreign keys):**

| constraint_name | table_name | column_name | referenced_table_name | referenced_column_name |
|---|---|---|---|---|
| inventory_manufacturer_id_fk | inventory | manufacturer_id | manufacturers | manufacturer_id |
| inventory_location_id_fk | inventory | location_id | locations | location_id |
| work_orders_equipment_id_fk | work_orders | equipment_id | inventory | equipment_id |
| schedules_equipment_id_fk | schedules | equipment_id | inventory | equipment_id |
| parts_inventory_manufacturer_id_fk | parts_inventory | manufacturer_id | manufacturers | manufacturer_id |
| qc_tests_equipment_id_fk | qc_tests | equipment_id | inventory | equipment_id |

---

## Query 3: Verify indexes were created

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%pkey'
ORDER BY tablename, indexname;
```

**Expected output (should have 10+ indexes):**
- idx_inventory_status
- idx_inventory_manufacturer_id
- idx_inventory_location_id
- idx_work_orders_equipment_id
- idx_work_orders_status
- idx_work_orders_workorder_number
- idx_schedules_equipment_id
- idx_schedules_next_due
- idx_parts_inventory_manufacturer_id
- idx_parts_inventory_part_number
- idx_qc_tests_equipment_id
- idx_qc_tests_test_date

---

## Query 4: Verify table row counts

```sql
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected output:** All tables should show 0 rows (since you're starting fresh)

---

## Query 5: Verify primary keys

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  kcu.data_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**Expected output:**

| table_name | column_name | data_type |
|---|---|---|
| inventory | equipment_id | uuid |
| locations | location_id | bigint |
| manufacturers | manufacturer_id | bigint |
| parts_inventory | part_id | uuid |
| qc_tests | qc_test_id | uuid |
| schedules | schedule_id | uuid |
| work_orders | workorder_id | uuid |

---

## Query 6: Quick schema summary

```sql
SELECT
  t.table_name,
  COUNT(c.column_name) as column_count,
  ARRAY_AGG(c.column_name ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
GROUP BY t.table_name
ORDER BY t.table_name;
```

**This shows:** Each table with its column count and column names

---

## Step-by-Step Verification Process

Run these queries in order to fully verify your migration:

1. **Run Query 1** - Verify 7 tables exist in public schema ✓
2. **Run Query 2** - Verify 6 foreign key relationships ✓
3. **Run Query 3** - Verify indexes are created ✓
4. **Run Query 4** - Verify row counts (should be 0) ✓
5. **Run Query 5** - Verify primary keys ✓
6. **Run Query 6** - Quick visual summary ✓

If all 6 queries return expected results, your migration is **successful**!

---

## After Successful Verification - Delete Old Schemas

Once you've confirmed everything is working, run this to clean up the old schemas:

```sql
DROP SCHEMA IF EXISTS quality CASCADE;
DROP SCHEMA IF EXISTS maintenance CASCADE;
DROP SCHEMA IF EXISTS equipment CASCADE;
```

**Warning:** This will permanently delete all tables in these schemas. Make sure you've verified the migration is complete first!

---

## Troubleshooting

If any query fails or returns unexpected results:

1. **No tables found** - Migration script didn't run or failed. Check SQL editor for error messages and re-run the migration script.

2. **Missing foreign keys** - Some foreign keys may not have been created. Check the migration script output for errors.

3. **Missing indexes** - This is less critical but should still be there. You can recreate them manually with the index creation statements from the migration script.

4. **Old schemas still exist** - This is fine for now. Just make sure the new public schema tables are working. You can delete the old schemas later.

---

## Next Steps

✅ Run the migration script
✅ Run all 6 verification queries
✅ Confirm all expected results
✅ Delete old schemas (optional)
✅ Test your application at http://localhost:3000
