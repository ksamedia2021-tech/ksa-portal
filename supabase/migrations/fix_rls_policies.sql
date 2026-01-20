-- Enable RLS to be sure
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- 1. DROP existing policies to avoid conflicts (clean slate for this table)
DROP POLICY IF EXISTS "Enable read access for all users" ON applicants;
DROP POLICY IF EXISTS "Enable insert access for all users" ON applicants;
DROP POLICY IF EXISTS "Enable update access for all users" ON applicants;

-- 2. Create permissive policies for this simplified app

-- Allow READ for everyone (needed for Admin + Status Page)
CREATE POLICY "Enable read access for all users" 
ON applicants FOR SELECT 
USING (true);

-- Allow INSERT for everyone (needed for Public Form)
CREATE POLICY "Enable insert access for all users" 
ON applicants FOR INSERT 
WITH CHECK (true);

-- Allow UPDATE for everyone (Needed for Admin Correction Note + Status Resubmission)
CREATE POLICY "Enable update access for all users" 
ON applicants FOR UPDATE 
USING (true);
