import { NextRequest, NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/schemas';
import { supabase } from '@/lib/supabase';

// PDF IDs Config
const PDF_IDS = {
    CBET: '1uMgdaa8KGlWmyKz24V1HDUpn8z13CHh7',
    DIPLOMA: '1571BpZBELkh3p3j5LlRrj5gXQhQvuO2i'
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // 1. Zod Validation
        const parsedData = applicationSchema.safeParse(body);
        if (!parsedData.success) {
            return NextResponse.json({ error: 'Validation failed', details: parsedData.error.errors }, { status: 400 });
        }

        const data = parsedData.data;

        // Recalculate Age Server-Side to be safe
        const birthDate = new Date(data.dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        // 2. Logic Check (Server Enforcement)
        let courseTrack = 'DIPLOMA';
        if (age >= 21) {
            courseTrack = 'CBET';
        } else {
            courseTrack = 'DIPLOMA';
            // Server-side Grade Check for Diploma
            if (data.kcseMeanGrade) {
                const gradeValue = {
                    'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
                    'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
                };
                // @ts-ignore
                const val = gradeValue[data.kcseMeanGrade] || 0;
                if (val < 3) { // Less than D Plain
                    return NextResponse.json({ error: 'Academic requirement not met (Minimum D Plain required)' }, { status: 400 });
                }
            }
        }

        // 3. Insert into Supabase
        // Map camelCase to snake_case for DB
        const dbData = {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            national_id: data.nationalId,
            dob: data.dob,
            calculated_age: age,
            email: data.email,
            course_track: courseTrack,
            highest_qualification: data.highestQualification,
            kcse_mean_grade: data.kcseMeanGrade,
            preferred_campus: data.preferredCampus || (courseTrack === 'DIPLOMA' ? 'Thika' : null),
            mpesa_code: data.mpesaCode,
            status: 'PENDING',
            email_sent: false
        };

        const { data: inserted, error: dbError } = await supabase
            .from('applicants')
            .insert([dbData])
            .select()
            .single();

        if (dbError) {
            console.error('Supabase Error:', dbError);
            return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 });
        }

        // 4. Email Trigger Logic
        const pdfId = courseTrack === 'CBET' ? PDF_IDS.CBET : PDF_IDS.DIPLOMA;
        const emailSubject = `Your KSA 2026 Application Form - ${courseTrack}`;
        const emailBody = `Dear ${data.fullName}, congratulations on qualifying. Please download the attached PDF, fill it in BLOCK LETTERS, and return it by Feb 6th, 2026.`;
        const googleDriveLink = `https://drive.google.com/uc?id=${pdfId}&export=download`;

        // MOCK EMAIL SENDING
        console.log("---------------------------------------------------");
        console.log("📧 MOCK EMAIL TRIGGERED");
        console.log(`To: ${data.email}`);
        console.log(`Subject: ${emailSubject}`);
        console.log(`Body: ${emailBody}`);
        console.log(`Attachment Link: ${googleDriveLink}`);
        console.log("---------------------------------------------------");

        // In a real scenario, we would update email_sent to true here
        await supabase.from('applicants').update({ email_sent: true }).eq('id', inserted.id);

        return NextResponse.json({ success: true, trackingId: inserted.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
