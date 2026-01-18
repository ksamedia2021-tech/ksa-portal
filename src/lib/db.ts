import { supabase } from '@/lib/supabase';

export interface DashboardStats {
    totalApplications: number;
    pendingApplications: number;
    hourlyActivity: { hour: string; count: number }[];
    gradeDistribution: { grade: string; count: number }[];
    fraudAlerts: { mpesa_code: string; count: number }[];
    campusDemand: { campus: string; count: number }[];
    cbetCount: number;
    diplomaCount: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    // Parallel fetching for performance
    const [
        { count: total },
        { count: pending },
        { count: cbet },
        { count: diploma },
        { data: hourly },
        { data: grades },
        { data: fraud },
        { data: campus }
    ] = await Promise.all([
        supabase.from('applicants').select('*', { count: 'exact', head: true }),
        supabase.from('applicants').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
        supabase.from('applicants').select('*', { count: 'exact', head: true }).eq('course_track', 'CBET'),
        supabase.from('applicants').select('*', { count: 'exact', head: true }).eq('course_track', 'DIPLOMA'),
        supabase.from('analytics_hourly_activity').select('*'),
        supabase.from('analytics_grade_distribution').select('*'),
        supabase.from('analytics_fraud_guard').select('*'),
        supabase.from('analytics_campus_demand').select('*')
    ]);

    return {
        totalApplications: total || 0,
        pendingApplications: pending || 0,
        cbetCount: cbet || 0,
        diplomaCount: diploma || 0,
        dailyActivity: [], // Deprecated
        hourlyActivity: hourly || [],
        gradeDistribution: grades || [],
        fraudAlerts: fraud || [],
        campusDemand: campus || []
    };
}
