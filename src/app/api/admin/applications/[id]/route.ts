import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth-server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await verifyAdmin(request as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        const { data, error } = await supabaseAdmin
            .from('applicants')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);

    } catch (err: any) {
        console.error('Fetch Applicant Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
