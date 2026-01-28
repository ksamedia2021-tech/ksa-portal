import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth-server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyAdmin(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const params = await props.params;

        const { data, error } = await supabaseAdmin
            .from('application_messages')
            .select('*')
            .eq('applicant_id', params.id)
            .order('sent_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Fetch Messages Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
