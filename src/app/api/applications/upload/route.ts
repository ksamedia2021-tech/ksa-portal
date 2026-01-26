import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const nationalId = formData.get('nationalId') as string;
        const referenceId = formData.get('referenceId') as string;

        if (!file || !nationalId || !referenceId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Verify Applicant exists and matches National ID
        const { data: applicant, error: fetchError } = await supabaseAdmin
            .from('applicants')
            .select('id, national_id')
            .eq('id', referenceId)
            .single();

        if (fetchError || !applicant || applicant.national_id !== nationalId) {
            return NextResponse.json({ error: 'Invalid reference or National ID' }, { status: 401 });
        }

        // 2. Prepare file for upload
        const fileExt = file.name.split('.').pop();
        const fileName = `${referenceId}_${nationalId}_${Date.now()}.${fileExt}`;
        const filePath = `forms/${fileName}`;

        // 3. Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from('completed-forms')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }

        // 4. Update the applicants table
        const { error: updateError } = await supabaseAdmin
            .from('applicants')
            .update({
                submitted_form_path: filePath,
                form_submitted_at: new Date().toISOString()
            })
            .eq('id', referenceId);

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ error: 'Failed to update application status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, path: filePath });

    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
