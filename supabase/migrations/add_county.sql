-- Migration to safely add 'county_of_recidence' (sic) only if it doesn't exist
-- User indicated this column might already exist.

DO $$
BEGIN
    -- Check for the user-specified spelling first
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county_of_recidence') THEN
         -- If specifically requested "county" doesn't exist either, add the one the code expects
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'county') THEN
             ALTER TABLE applicants ADD COLUMN county_of_recidence TEXT;
        END IF;
    END IF;

    -- Ensure highest_qualification is present
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'highest_qualification') THEN
        ALTER TABLE applicants ADD COLUMN highest_qualification TEXT;
    END IF;
END $$;
