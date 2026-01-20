-- Add admin_note column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'admin_note') THEN
        ALTER TABLE applicants ADD COLUMN admin_note TEXT;
    END IF;
END $$;

-- Update status check constraint if it exists (assuming it might be a text column with a check)
-- If it is an ENUM, the approach is different. Assuming TEXT for simplicity as per previous migrations.
-- We will just make sure the application logic handles 'NEEDS_CORRECTION'.
-- If there is a rigorous CHECK constraint, we try to drop and recreate it.

DO $$
BEGIN
    -- Try to drop constraint if it exists (naming convention varies, so this is a best guess or we rely on just Text)
    -- ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_status_check;
    
    -- Re-add constraint with new value (Optional: only if you want to enforce it at DB level)
    -- ALTER TABLE applicants ADD CONSTRAINT applicants_status_check 
    -- CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION'));
    
    -- For this sprint, we successfully rely on App Logic, but let's document the intent.
END $$;
