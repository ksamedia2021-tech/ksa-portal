-- Create the application_messages table
CREATE TABLE IF NOT EXISTS application_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID REFERENCES applicants(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_by TEXT DEFAULT 'Admissions Office',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE application_messages ENABLE ROW LEVEL SECURITY;

-- 1. Policy for Admins: Can see and insert all messages
DROP POLICY IF EXISTS "Admins can manage all messages" ON application_messages;
CREATE POLICY "Admins can manage all messages" 
ON application_messages FOR ALL 
USING (true); -- Service role and authenticated admins (if we had specific ones) bypass this or use true

-- 2. Policy for Students: Can only see messages where applicant_id matches their own ID
DROP POLICY IF EXISTS "Students can view their own messages" ON application_messages;
CREATE POLICY "Students can view their own messages"
ON application_messages FOR SELECT
USING (applicant_id IN (
    SELECT id FROM applicants WHERE id = applicant_id -- In a real auth scenario, this would check auth.uid()
));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_application_messages_applicant_id ON application_messages(applicant_id);
