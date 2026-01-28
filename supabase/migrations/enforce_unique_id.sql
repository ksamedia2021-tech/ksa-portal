-- 1. Cleanup Duplicates (Keep only the latest entry)
-- IMPORTANT: Run this before applying the unique constraint if you have existing duplicates.
DELETE FROM applicants
WHERE id NOT IN (
    SELECT DISTINCT ON (national_id) id
    FROM applicants
    ORDER BY national_id, created_at DESC
);

-- 2. Add Unique Constraint
-- This prevents any future duplicates from being created at the database level.
ALTER TABLE applicants 
ADD CONSTRAINT unique_national_id UNIQUE (national_id);
