-- 1. Daily Activity View
CREATE OR REPLACE VIEW analytics_daily_activity AS
SELECT 
    DATE(created_at) as date, 
    COUNT(*) as count 
FROM applicants 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) ASC;

-- 2. Grade Distribution View
CREATE OR REPLACE VIEW analytics_grade_distribution AS
SELECT 
    kcse_mean_grade as grade, 
    COUNT(*) as count 
FROM applicants 
WHERE kcse_mean_grade IS NOT NULL 
GROUP BY kcse_mean_grade 
ORDER BY count DESC;

-- 3. Fraud Guard View (Duplicate M-PESA Codes)
CREATE OR REPLACE VIEW analytics_fraud_guard AS
SELECT 
    mpesa_code, 
    COUNT(*) as count 
FROM applicants 
GROUP BY mpesa_code 
HAVING COUNT(*) > 1;

-- 4. Campus Demand View
CREATE OR REPLACE VIEW analytics_campus_demand AS
SELECT 
    preferred_campus as campus, 
    COUNT(*) as count 
FROM applicants 
WHERE preferred_campus IS NOT NULL 
GROUP BY preferred_campus 
ORDER BY count DESC;
