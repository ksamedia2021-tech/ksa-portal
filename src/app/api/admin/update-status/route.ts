import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client with the SERVICE ROLE key
// This client bypasses Row Level Security (RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, status, admin_note, pin } = body;

        // 1. Server-Side Security Check
        if (pin !== '2026') {
            return NextResponse.json({ error: 'Unauthorized: Invalid Admin PIN' }, { status: 401 });
        }

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Prepare Update Data
        const updateData: any = { status };
        if (admin_note !== undefined) {
            updateData.admin_note = admin_note;
        }

        console.log(`[API] Updating Applicant ${id} to ${status}`);

        // 3. Perform Secure Update (Bypassing RLS)
        const { data, error } = await supabaseAdmin
            .from('applicants')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[API] Update Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 4. Success Response
        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error('[API] Unexpected Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
