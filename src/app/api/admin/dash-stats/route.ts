import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    try {
        const pin = req.headers.get('x-admin-pin');
        if (pin !== '2026') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch Funnel Metrics
        const { data: applicants, error } = await supabaseAdmin
            .from('applicants')
            .select('id, status, submitted_form_path, form_submitted_at, full_name, created_at, phone_number, national_id, email');

        if (error) throw error;

        const total = applicants.length;
        const missingForm = applicants.filter(a => !a.submitted_form_path).length;
        const readyForReview = applicants.filter(a => a.submitted_form_path && a.status === 'PENDING').length;
        const processed = applicants.filter(a => a.status !== 'PENDING').length;

        // 2. Calculate Upload Trend (Last 7 Days)
        const uploadTrend: Record<string, number> = {};
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            uploadTrend[dateStr] = 0;
        }

        applicants.forEach(a => {
            if (a.form_submitted_at) {
                const dateStr = new Date(a.form_submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                if (uploadTrend.hasOwnProperty(dateStr)) {
                    uploadTrend[dateStr]++;
                }
            }
        });

        const trendData = Object.entries(uploadTrend).map(([date, count]) => ({ date, count }));

        // 3. Prepare Priority Queue (Ready for Review first, then newest registered)
        const priorityQueue = [...applicants]
            .map(a => {
                let stage = 'Bio-data Only';
                if (a.submitted_form_path) stage = 'Ready to Review';
                if (a.status !== 'PENDING') stage = 'Processed';

                return { ...a, stage };
            })
            .sort((a, b) => {
                // Priority logic: Ready to Review > Bio-data Only > Processed
                const priority: Record<string, number> = { 'Ready to Review': 1, 'Bio-data Only': 2, 'Processed': 3 };
                if (priority[a.stage] !== priority[b.stage]) {
                    return priority[a.stage] - priority[b.stage];
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

        return NextResponse.json({
            stats: {
                total,
                missingForm,
                readyForReview,
                processed,
                completionRate: total > 0 ? Math.round(((total - missingForm) / total) * 100) : 0,
                uploadTrend: trendData
            },
            priorityQueue: priorityQueue.slice(0, 50) // Return top 50 for the dash view
        });

    } catch (err: any) {
        console.error('Dash Stats Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
