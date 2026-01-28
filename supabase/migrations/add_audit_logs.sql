-- Create Audit Logs table for Admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    admin_email TEXT,
    action TEXT NOT NULL,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs (if we define a policy, for now service role will handle it)
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT
    USING (auth.jwt() ->> 'email' LIKE '%@ksa.ac.ke'); -- Optional: restrict to domain
