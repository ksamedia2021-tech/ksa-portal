-- 1. Hourly Activity View (Last 24 Hours)
-- Shows activity per hour for the last 24 hours
DROP VIEW IF EXISTS analytics_hourly_activity;
CREATE VIEW analytics_hourly_activity AS
SELECT 
    to_char(date_trunc('hour', created_at), 'HH24:00') as hour,
    COUNT(*) as count 
FROM applicants 
WHERE created_at > NOW() - INTERVAL '24 HOURS'
GROUP BY 1
ORDER BY 1 ASC;

-- 2. Fraud Incidences View (Details)
-- Fetches full details of applicants who share an MPESA code
DROP VIEW IF EXISTS fraud_incidences;
CREATE VIEW fraud_incidences AS
SELECT 
    a.* 
FROM applicants a
INNER JOIN (
    SELECT mpesa_code 
    FROM applicants 
    GROUP BY mpesa_code 
    HAVING COUNT(*) > 1
) f ON a.mpesa_code = f.mpesa_code
ORDER BY a.mpesa_code, a.created_at;
