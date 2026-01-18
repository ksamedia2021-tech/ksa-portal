-- 1. Ensure 'preferred_campus' column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applicants' AND column_name = 'preferred_campus') THEN
        ALTER TABLE applicants ADD COLUMN preferred_campus TEXT;
    END IF;
END $$;

-- 2. Clean up existing views to avoid conflicts
DROP VIEW IF EXISTS analytics_daily_activity;
DROP VIEW IF EXISTS analytics_grade_distribution;
DROP VIEW IF EXISTS analytics_fraud_guard;
DROP VIEW IF EXISTS analytics_campus_demand;

-- 3. Re-Create Views (Robust)
CREATE VIEW analytics_daily_activity AS
SELECT 
    TO_CHAR(created_at, 'YYYY-MM-DD') as date, 
    COUNT(*) as count 
FROM applicants 
GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') 
ORDER BY date ASC;

CREATE VIEW analytics_grade_distribution AS
SELECT 
    COALESCE(kcse_mean_grade, 'N/A') as grade, 
    COUNT(*) as count 
FROM applicants 
GROUP BY kcse_mean_grade 
ORDER BY count DESC;

CREATE VIEW analytics_fraud_guard AS
SELECT 
    mpesa_code, 
    COUNT(*) as count 
FROM applicants 
WHERE mpesa_code IS NOT NULL
GROUP BY mpesa_code 
HAVING COUNT(*) > 1;

CREATE VIEW analytics_campus_demand AS
SELECT 
    COALESCE(preferred_campus, 'Unspecified') as campus, 
    COUNT(*) as count 
FROM applicants 
GROUP BY preferred_campus 
ORDER BY count DESC;

-- 4. Seed Dummy Data (OPTIONAL - Run only if you have no data)
-- Uncomment the lines below to insert test data if your dashboard is empty
/*
INSERT INTO applicants (id, created_at, full_name, email, phone_number, national_id, course_track, calculated_age, kcse_mean_grade, preferred_campus, mpesa_code, status, ip_address, device_type) VALUES
(gen_random_uuid(), NOW(), 'Test Student 1', 'test1@example.com', '0700000001', '11111111', 'CBET', 22, NULL, 'Nairobi', 'MPESA001', 'APPROVED', '127.0.0.1', 'Desktop'),
(gen_random_uuid(), NOW() - INTERVAL '1 DAY', 'Test Student 2', 'test2@example.com', '0700000002', '22222222', 'DIPLOMA', 19, 'B+', 'Thika', 'MPESA002', 'PENDING', '127.0.0.1', 'Mobile'),
(gen_random_uuid(), NOW() - INTERVAL '2 DAYS', 'Test Student 3', 'test3@example.com', '0700000003', '33333333', 'DIPLOMA', 20, 'C+', 'Nairobi', 'MPESA003', 'REJECTED', '127.0.0.1', 'Mobile');
*/
