DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'ip_address') THEN
        ALTER TABLE applicants ADD COLUMN ip_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'device_type') THEN
        ALTER TABLE applicants ADD COLUMN device_type TEXT;
    END IF;
END $$;
