import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth-server';

// Create a Supabase client with the SERVICE ROLE key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const user = await verifyAdmin(request as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { id, status, admin_note } = body;

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

        // 4. Log Action
        await supabaseAdmin
            .from('audit_logs')
            .insert({
                admin_id: user.id,
                admin_email: user.email,
                action: 'UPDATE_STATUS',
                target_id: id,
                details: { status, previous_status: data?.status || 'UNKNOWN', admin_note }
            });

        // 5. Success Response
        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error('[API] Unexpected Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
