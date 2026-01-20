-- Secure RLS: Disable direct client-side updates
-- The Admin API and Correction API use the Service Role, so they bypass this.
-- This ensures no user (anon or authenticated) can directly UPDATE the applicants table via the client SDK.

DROP POLICY IF EXISTS "Enable update access for all users" ON applicants;

CREATE POLICY "Enable update access for all users" 
ON applicants FOR UPDATE 
USING (false); -- Explicitly deny all client-side updates (Service Role still works)
