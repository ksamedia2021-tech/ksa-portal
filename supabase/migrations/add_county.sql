-- Migration to safely add 'county_of_residence' only if it doesn't exist
-- User indicated this column might already exist.

DO $$
BEGIN
    -- Check for the correct spelling first
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_residence') THEN
         -- If 'county' doesn't exist either, add the correct one
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county') THEN
             ALTER TABLE applicants ADD COLUMN county_of_residence TEXT;
        END IF;
    END IF;

    -- Ensure highest_qualification is present
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'highest_qualification') THEN
        ALTER TABLE applicants ADD COLUMN highest_qualification TEXT;
    END IF;
END $$;
