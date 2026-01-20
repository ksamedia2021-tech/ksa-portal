-- 1. Add admin_note column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'admin_note') THEN
        ALTER TABLE applicants ADD COLUMN admin_note TEXT;
    END IF;
END $$;

-- 1b. Fix status CHECK constraint to include NEEDS_CORRECTION
ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_status_check;
ALTER TABLE applicants ADD CONSTRAINT applicants_status_check 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CORRECTION'));

-- 1c. Fix course_track CHECK constraint
ALTER TABLE applicants DROP CONSTRAINT IF EXISTS applicants_course_track_check;
ALTER TABLE applicants ADD CONSTRAINT applicants_course_track_check 
    CHECK (course_track IN ('CBET', 'DIPLOMA', 'CERTIFICATE'));

-- 2. Enable RLS and Clean up Policies
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON applicants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON applicants;
DROP POLICY IF EXISTS "Enable update access for all users" ON applicants;

-- 3. Create Strict Policies
-- Allow READ for everyone (needed for Admin + Status Page)
CREATE POLICY "Enable read access for all users" 
ON applicants FOR SELECT 
USING (true);

-- Allow INSERT for everyone (needed for Public Form)
CREATE POLICY "Enable insert access for all users" 
ON applicants FOR INSERT 
WITH CHECK (true);

-- LOCK DOWN UPDATES (No client-side updates allowed)
CREATE POLICY "Enable update access for all users" 
ON applicants FOR UPDATE 
USING (false);
