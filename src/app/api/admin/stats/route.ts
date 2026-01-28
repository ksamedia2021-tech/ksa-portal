import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

import { verifyAdmin } from '@/lib/admin-auth-server';

// Service Role Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    try {
        const user = await verifyAdmin(request as any);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Fetch all applicants for aggregation
        // Note: For large datasets, use Supabase .rpc() or count queries. 
        // For < 1000 records, fetching all and aggregating in JS is fine and faster to implement.
        const { data: applicants, error } = await supabaseAdmin
            .from('applicants')
            .select('*');

        if (error) throw error;

        // --- Aggregation Logic (Mirrors lib/db.ts) ---
        const total = applicants.length;
        const pending = applicants.filter(a => a.status === 'PENDING' || a.status === 'NEEDS_CORRECTION').length;
        const cbet = applicants.filter(a => a.course_track === 'CBET').length;
        const diploma = applicants.filter(a => a.course_track === 'DIPLOMA').length;
        const certificate = applicants.filter(a => a.course_track === 'CERTIFICATE').length;

        // Campus Demand
        const campusCounts: Record<string, number> = {};
        applicants.forEach(a => {
            if (a.preferred_campus) {
                campusCounts[a.preferred_campus] = (campusCounts[a.preferred_campus] || 0) + 1;
            }
        });
        const campusDemand = Object.entries(campusCounts)
            .map(([campus, count]) => ({ campus, count }))
            .sort((a, b) => b.count - a.count);

        // Hourly Activity (Last 24h)
        const hourly: Record<number, number> = {};
        // Initialize last 24h
        for (let i = 0; i < 24; i++) hourly[i] = 0;

        const now = new Date();
        applicants.forEach(a => {
            const d = new Date(a.created_at);
            // Simple logic: just group by hour of day for simplicity, or strictly last 24h?
            // Let's stick to "Hour of Day" regardless of date for this simplified view, or filter by date.
            // Let's do: Today's activity
            if (d.toDateString() === now.toDateString()) {
                const h = d.getHours();
                hourly[h] = (hourly[h] || 0) + 1;
            }
        });
        const hourlyActivity = Object.entries(hourly).map(([hour, count]) => ({
            hour: `${hour}:00`,
            count
        }));

        // Grade Dist
        const grades: Record<string, number> = {};
        applicants.forEach(a => {
            if (a.kcse_mean_grade) {
                grades[a.kcse_mean_grade] = (grades[a.kcse_mean_grade] || 0) + 1;
            }
        });
        const gradeDistribution = Object.entries(grades).map(([grade, count]) => ({ grade, count }));

        // Fraud (Duplicate MPESA)
        const mpesaCounts: Record<string, number> = {};
        const fraudAlerts: any[] = [];
        applicants.forEach(a => {
            if (a.mpesa_code) {
                mpesaCounts[a.mpesa_code] = (mpesaCounts[a.mpesa_code] || 0) + 1;
            }
        });
        Object.entries(mpesaCounts).forEach(([code, count]) => {
            if (count > 1) fraudAlerts.push({ mpesa_code: code, count });
        });

        return NextResponse.json({
            totalApplications: total,
            pendingApplications: pending,
            cbetCount: cbet,
            diplomaCount: diploma,
            certificateCount: certificate,
            campusDemand,
            gradeDistribution,
            fraudAlerts,
            hourlyActivity
        });

    } catch (err: any) {
        console.error('Stats Error:', err);
        return NextResponse.json({ error: 'Stats Error' }, { status: 500 });
    }
}
