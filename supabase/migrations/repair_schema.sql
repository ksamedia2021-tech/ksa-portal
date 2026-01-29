-- REPAIR SCRIPT: Fix Column Naming Mismatch
-- This ensures 'county_of_residence' exists, renaming 'county' if necessary.

DO $$
BEGIN
    -- 1. If 'county' exists and 'county_of_residence' DOES NOT, Rename 'county' -> 'county_of_residence'
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_residence') THEN
        ALTER TABLE applicants RENAME COLUMN county TO county_of_residence;
    
    -- 2. If 'county_of_residence' STILL does not exist (meaning 'county' didn't exist either), Create it.
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_residence') THEN
        ALTER TABLE applicants ADD COLUMN county_of_residence TEXT;
    END IF;

    -- 3. Ensure highest_qualification is present
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'highest_qualification') THEN
        ALTER TABLE applicants ADD COLUMN highest_qualification TEXT;
    END IF;
END $$;
