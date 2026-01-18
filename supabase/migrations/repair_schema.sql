-- REPAIR SCRIPT: Fix Column Naming Mismatch
-- This ensures 'county_of_recidence' exists, renaming 'county' if necessary.

DO $$
BEGIN
    -- 1. If 'county' exists and 'county_of_recidence' DOES NOT, Rename 'county' -> 'county_of_recidence'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_recidence') THEN
        ALTER TABLE applicants RENAME COLUMN county TO county_of_recidence;
    
    -- 2. If 'county_of_recidence' STILL does not exist (meaning 'county' didn't exist either), Create it.
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_recidence') THEN
        ALTER TABLE applicants ADD COLUMN county_of_recidence TEXT;
    END IF;

    -- 3. Ensure highest_qualification is present
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'highest_qualification') THEN
        ALTER TABLE applicants ADD COLUMN highest_qualification TEXT;
    END IF;
END $$;
