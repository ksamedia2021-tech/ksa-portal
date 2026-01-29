import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Service Role Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nationalId, phone } = body;

        if (!nationalId || !phone) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('applicants')
            .select('*')
            .eq('national_id', nationalId)
            .eq('phone_number', phone)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return NextResponse.json({ found: false, data: null });
        }

        // Fetch messages for this applicant
        const { data: messages } = await supabaseAdmin
            .from('application_messages')
            .select('*')
            .eq('applicant_id', data.id)
            .order('sent_at', { ascending: false });

        return NextResponse.json({
            found: true,
            data: { ...data, messages: messages || [] }
        });

    } catch (err: any) {
        console.error('Status Check Error:', err);
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}
