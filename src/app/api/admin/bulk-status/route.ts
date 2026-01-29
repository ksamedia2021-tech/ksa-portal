import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth-server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAdmin(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { applicantIds, status, adminNote } = body;

        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return NextResponse.json({ error: 'Missing applicant IDs' }, { status: 400 });
        }

        if (!status) {
            return NextResponse.json({ error: 'Missing status' }, { status: 400 });
        }

        // 1. Update records in Supabase
        const { data: updated, error: dbError } = await supabaseAdmin
            .from('applicants')
            .update({
                status: status,
                admin_note: status === 'NEEDS_CORRECTION' ? adminNote : null
            })
            .in('id', applicantIds)
            .select('id, email, full_name');

        if (dbError) {
            console.error('Bulk Update DB Error:', dbError);
            return NextResponse.json({ error: `Database update failed: ${dbError.message} (${dbError.code})` }, { status: 500 });
        }

        // 2. Send emails if status is NEEDS_CORRECTION
        if (status === 'NEEDS_CORRECTION' && updated) {
            const emailPromises = updated.map(app => {
                return resend.emails.send({
                    from: process.env.EMAIL_FROM || 'KSA Admissions <no-reply@admissions.ksa.ac.ke>',
                    to: [app.email],
                    subject: 'Action Required: Application Correction Needed',
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <div style="background-color: #f59e0b; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                                <h1 style="margin: 0;">Correction Required</h1>
                            </div>
                            <div style="padding: 20px;">
                                <p>Dear ${app.full_name},</p>
                                <p>Our admissions team has reviewed your application and noted that some information requires correction before we can proceed.</p>
                                
                                <div style="background-color: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                                    <h3 style="margin-top: 0; color: #92400e;">Admin Note:</h3>
                                    <p style="font-style: italic;">"${adminNote}"</p>
                                </div>

                                <p><strong>What to do next:</strong></p>
                                <ol>
                                    <li>Visit the <a href="https://ksa-portal.vercel.app/check-status" style="color: #f59e0b; font-weight: bold;">Application Status Portal</a>.</li>
                                    <li>Log in with your National ID and Phone Number.</li>
                                    <li>Click on <strong>"Edit Application & Resubmit"</strong>.</li>
                                    <li>Update the fields as requested and save.</li>
                                </ol>

                                <p>Please complete these corrections as soon as possible to avoid delays in your enrollment.</p>
                                <p>Best Regards,<br/>KSA Admissions Team</p>
                            </div>
                        </div>
                    `
                });
            });

            // We fire and forget or wait for all? For bulk, let's wait to ensure we log any mass failures
            const results = await Promise.allSettled(emailPromises);
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                console.error(`Bulk Email Failures: ${failures.length} out of ${applicantIds.length}`);
            }

            // 2b. Record messages in database so student can see them in portal
            try {
                const messageRecords = updated.map(app => ({
                    applicant_id: app.id,
                    subject: 'Application Correction Needed',
                    body: adminNote,
                    sent_by: 'Admissions Office'
                }));
                await supabaseAdmin.from('application_messages').insert(messageRecords);
            } catch (msgError) {
                console.error('Failed to save messages to DB:', msgError);
            }
        }

        // 3. Log Audit Activity (Optional but recommended)
        try {
            await supabaseAdmin.from('audit_logs').insert({
                admin_id: user.id,
                action: `BULK_STATUS_UPDATE_${status}`,
                target_id: applicantIds.join(','),
                details: { count: applicantIds.length, note: adminNote }
            });
        } catch (auditError) {
            console.error('Audit Logging Failed:', auditError);
        }

        return NextResponse.json({ success: true, count: updated.length });

    } catch (err: any) {
        console.error('Bulk Status API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
