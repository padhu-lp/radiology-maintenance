-- ============================================================================
-- 008: Triage findings on service requests   (applied 2026-08-17)
-- ============================================================================
-- Three distinct narrative fields on a service request, deliberately separate:
--   problem_details   - the caller's own description, unedited
--   triage_notes      - what WE found when assessing it, and the disposition
--   resolution_notes  - how it was finally closed (when no visit was needed)
-- Collapsing these into one field loses the distinction between what the
-- customer said and what we concluded, which matters for service records.

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS triage_notes TEXT;

COMMENT ON COLUMN public.service_requests.triage_notes IS
  'Findings and disposition recorded during triage, before a work order is raised.';
