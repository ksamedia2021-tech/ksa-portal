import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verifyAdmin } from '@/lib/admin-auth-server';
import { chunkArray } from '@/lib/utils';

// Initialize Clients
const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAdmin(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { applicantIds, subject, body } = await req.json();

        if (!applicantIds || !Array.isArray(applicantIds) || applicantIds.length === 0) {
            return NextResponse.json({ error: 'Recipient list is empty' }, { status: 400 });
        }

        // 2. Fetch Recipient Details (CHUNKED to avoid URL limits)
        const chunks = chunkArray(applicantIds, 50);
        const applicants: any[] = [];

        for (const chunk of chunks) {
            const { data, error: fetchError } = await supabaseAdmin
                .from('applicants')
                .select('id, email, full_name')
                .in('id', chunk);

            if (fetchError) {
                console.error('Batch Fetch Error:', fetchError);
                return NextResponse.json({ error: 'Failed to fetch some recipients' }, { status: 500 });
            }
            if (data) applicants.push(...data);
        }

        if (applicants.length === 0) {
            return NextResponse.json({ error: 'No valid applicants found' }, { status: 404 });
        }

        const emails = applicants.map(app => ({
            from: process.env.EMAIL_FROM || 'KSA Admissions <no-reply@admissions.ksa.ac.ke>',
            to: app.email,
            subject: subject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <div style="background-color: #008000; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
                        <h1 style="margin: 0;">KSA Portal</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>Dear ${app.full_name},</p>
                        <div style="line-height: 1.6; color: #333;">
                            ${body.replace(/\n/g, '<br/>')}
                        </div>
                        <p style="margin-top: 30px; font-size: 12px; color: #888;">
                            This is an official communication from the KSA Admissions Office. 
                            You can view your message history at <a href="https://ksa-portal.vercel.app/check-status">ksa-portal/check-status</a>
                        </p>
                    </div>
                </div>
            `,
        }));

        // 4. Send Emails via Resend
        const { data: resendData, error: resendError } = await resend.batch.send(emails);

        if (resendError) {
            console.error('RESEND_ERROR_DETAIL:', JSON.stringify(resendError, null, 2));
            return NextResponse.json({
                error: 'Failed to deliver emails',
                detail: resendError.message
            }, { status: 500 });
        }

        // 5. Log messages in Database
        const logs = applicants.map(app => ({
            applicant_id: app.id,
            subject,
            body,
            sent_by: 'Admissions Office'
        }));

        const { error: logError } = await supabaseAdmin
            .from('application_messages')
            .insert(logs);

        if (logError) {
            console.error('Log Error:', logError);
            // We don't fail the request here because emails were already sent
        }

        // 6. Log Audit Trail
        await supabaseAdmin
            .from('audit_logs')
            .insert({
                admin_id: user.id,
                admin_email: user.email,
                action: 'SEND_BULK_EMAIL',
                details: {
                    subject,
                    recipient_count: applicants.length,
                    applicant_ids: applicantIds
                }
            });

        return NextResponse.json({
            success: true,
            count: applicants.length,
            batchId: resendData?.id
        });

    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
