import { NextRequest, NextResponse } from 'next/server';
import { applicationSchema } from '@/lib/schemas';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Clients
const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
            // Determine track based on grade
            const gradeValue: Record<string, number> = {
                'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
                'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
            };
            // @ts-ignore
            const val = gradeValue[data.kcseMeanGrade] || 0;

            if (val >= 5) {
                courseTrack = 'DIPLOMA';
            } else if (val >= 3) {
                courseTrack = 'CERTIFICATE';
            } else {
                return NextResponse.json({ error: 'Academic requirement not met (Minimum D Plain required)' }, { status: 400 });
            }
        }

        // 3. Check for Duplicates (National ID)
        const { data: existingApp } = await supabaseAdmin
            .from('applicants')
            .select('id')
            .eq('national_id', data.nationalId)
            .single();

        if (existingApp) {
            return NextResponse.json({
                error: 'Application already exists for this National ID',
                code: 'DUPLICATE_ID'
            }, { status: 400 });
        }

        // Capture Metadata
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || '';
        const deviceType = /mobile/i.test(userAgent) ? 'Mobile' : 'Desktop';

        // 4. Insert into Supabase
        // Map camelCase to snake_case for DB
        const dbData = {
            full_name: data.fullName,
            phone_number: data.phoneNumber,
            national_id: data.nationalId,
            county_of_residence: data.county,
            dob: data.dob,
            calculated_age: age,
            email: data.email,
            course_track: courseTrack,
            highest_qualification: data.highestQualification,
            kcse_mean_grade: data.kcseMeanGrade,
            preferred_campus: data.preferredCampus || (courseTrack === 'DIPLOMA' ? 'Thika' : null),
            mpesa_code: data.mpesaCode,
            status: 'PENDING',
            email_sent: false,
            ip_address: ip,
            device_type: deviceType,
        };

        const { data: inserted, error: dbError } = await supabaseAdmin
            .from('applicants')
            .insert([dbData])
            .select()
            .single();

        if (dbError) {
            console.error('Supabase Error:', dbError);
            return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 });
        }

        // 4. Send Live Email via Resend
        const pdfId = courseTrack === 'CBET' ? PDF_IDS.CBET : PDF_IDS.DIPLOMA;
        const trackLabel = courseTrack === 'CERTIFICATE' ? 'Certificate' : courseTrack;
        const emailSubject = `Your KSA 2026 Application Form - ${trackLabel}`;
        const googleDriveLink = `https://drive.google.com/uc?id=${pdfId}&export=download`;

        const { error: emailError } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'KSA Admissions <no-reply@admissions.ksa.ac.ke>',
            to: [data.email],
            subject: emailSubject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="background-color: #008000; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0;">KSA Enrollment</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Dear ${data.fullName},</p>
                        <p>Congratulations! You have qualified for the <strong>${trackLabel}</strong> track at Kenya School of Agriculture.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #008000; margin: 20px 0;">
                            <h3 style="margin-top: 0;">Next Steps:</h3>
                            <ol style="line-height: 1.6;">
                                <li><strong>Download:</strong> <a href="${googleDriveLink}" style="color: #008000; font-weight: bold;">Click here to download your application form PDF</a>.</li>
                                <li><strong>Fill & Scan:</strong> Print and fill the form in BLOCK LETTERS. Scan it along with your KCSE Certificate, Leaving Certificate, National ID, and Birth Certificate.</li>
                                <li><strong>Combine:</strong> Merge all documents into <strong>ONE SINGLE PDF</strong> in that specific order.</li>
                                <li><strong>Upload:</strong> Visit our <a href="https://ksa-portal.vercel.app/check-status" style="color: #008000;">Status Portal</a> to upload the final PDF by Feb 6th, 2026.</li>
                            </ol>
                        </div>

                        <p>If you have any questions, please reply to this email or visit our admissions office.</p>
                        <p>Best Regards,<br/>KSA Admissions Team</p>
                    </div>
                </div>
            `
        });

        if (emailError) {
            console.error('Resend Error:', emailError);
            // We don't fail the whole request if email fails, but we log it
        } else {
            // Update email_sent status
            await supabaseAdmin.from('applicants').update({ email_sent: true }).eq('id', inserted.id);
        }

        return NextResponse.json({ success: true, trackingId: inserted.id });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
