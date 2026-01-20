import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/schemas';

// Service Role Client (Bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, nationalId, ...updates } = body;

        if (!id || !nationalId) {
            return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
        }

        // 1. Verify Application State (Must be NEEDS_CORRECTION and match ID/NationalID)
        const { data: app, error: fetchError } = await supabaseAdmin
            .from('applicants')
            .select('status, id')
            .eq('id', id)
            .eq('national_id', nationalId)
            .single();

        if (fetchError || !app) {
            return NextResponse.json({ error: 'Application not found or unauthorized' }, { status: 404 });
        }

        if (app.status !== 'NEEDS_CORRECTION') {
            return NextResponse.json({ error: 'Application is not open for corrections' }, { status: 403 });
        }

        // We manually construct the safe update object to prevent arbitrary field injection (like status='APPROVED')
        // NOTE: national_id is NOT included - it cannot be changed (used as verification key)
        const safeUpdate: any = {
            full_name: updates.fullName,
            email: updates.email,
            phone_number: updates.phoneNumber,
            county_of_recidence: updates.county,
            dob: updates.dob,
            calculated_age: updates.calculatedAge,
            course_track: updates.courseTrack,
            highest_qualification: updates.highestQualification,
            kcse_mean_grade: updates.kcseMeanGrade,
            preferred_campus: updates.preferredCampus,

            // Critical Overrides
            status: 'PENDING',
            admin_note: null
        };

        // Remove undefined fields
        Object.keys(safeUpdate).forEach(key => safeUpdate[key] === undefined && delete safeUpdate[key]);

        // 3. Perform Update
        const { data, error: updateError } = await supabaseAdmin
            .from('applicants')
            .update(safeUpdate)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error('Correction Error:', err);
        return NextResponse.json({ error: 'Correction failed' }, { status: 500 });
    }
}
