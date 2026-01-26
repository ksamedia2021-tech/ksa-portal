-- Add column to track when the form was submitted
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'form_submitted_at') THEN
        ALTER TABLE applicants ADD COLUMN form_submitted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
