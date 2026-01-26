import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const pin = req.headers.get('x-admin-pin');
        if (pin !== '2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
