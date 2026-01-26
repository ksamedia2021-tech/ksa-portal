import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const { path, pin } = await req.json();

        // 1. Verify Admin PIN
        if (pin !== '2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!path) {
            return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
        }

        // 2. Generate Signed URL (valid for 10 minutes)
        const { data, error } = await supabaseAdmin.storage
            .from('completed-forms')
            .createSignedUrl(path, 600); // 600 seconds = 10 minutes

        if (error) {
            console.error('Signed URL Error:', error);
            return NextResponse.json({ error: 'Failed to generate secure link' }, { status: 500 });
        }

        return NextResponse.json({ signedUrl: data.signedUrl });

    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
