-- 1. Add column to track the submitted form path
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'submitted_form_path') THEN
        ALTER TABLE applicants ADD COLUMN submitted_form_path TEXT;
    END IF;
END $$;

-- 2. Create Storage Bucket (if not exists)
-- Note: inserting into storage.buckets table directly
INSERT INTO storage.buckets (id, name, public) 
SELECT 'completed-forms', 'completed-forms', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'completed-forms'
);

-- 3. Configure Storage RLS Policies for 'completed-forms' bucket

-- Allow authenticated/anon uploads (logic handled by our secure API route usually, 
-- but we set policies here for the Service Role/Direct access)

DROP POLICY IF EXISTS "Allow student uploads" ON storage.objects;
CREATE POLICY "Allow student uploads" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'completed-forms');

-- Allow Service Role to manage all objects (Default)
-- Allow direct read access ONLY via signed URLs (Private bucket)

DROP POLICY IF EXISTS "Restricted access to forms" ON storage.objects;
CREATE POLICY "Restricted access to forms"
ON storage.objects FOR SELECT
USING (bucket_id = 'completed-forms' AND (auth.role() = 'service_role'));
