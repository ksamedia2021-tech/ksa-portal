-- CLEANUP: Remove the typo column and ensure the correct one exists
DO $$ 
BEGIN
    -- 1. Drop the typo column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_recidence') THEN
        ALTER TABLE applicants DROP COLUMN county_of_recidence;
    END IF;

    -- 2. Add the correct column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_residence') THEN
        ALTER TABLE applicants ADD COLUMN county_of_residence TEXT;
    END IF;
END $$;
