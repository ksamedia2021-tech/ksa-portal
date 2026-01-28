'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, Alert } from '@/components/ui/common';
import { Users, FileText, LogOut, ArrowRight, Activity, AlertTriangle, TrendingUp, PieChart as PieIcon, Map, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';

interface DashboardStats {
    totalApplications: number;
    pendingApplications: number;
    hourlyActivity: { hour: string; count: number }[];
    gradeDistribution: { grade: string; count: number }[];
    fraudAlerts: { mpesa_code: string; count: number }[];
    campusDemand: { campus: string; count: number }[];
    cbetCount: number;
    diplomaCount: number;
    certificateCount: number;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin');
            } else {
                fetchData(session.access_token);
            }
        };
        checkAuth();
    }, [router]);

    const fetchData = async (token: string) => {
        try {
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        // Clear the helper cookie
        document.cookie = "admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/admin');
        router.refresh();
    };

    if (loading || !stats) return <div className="p-8 text-center flex items-center justify-center h-[50vh]"><Activity className="animate-spin mr-2" /> Loading Analytics...</div>;

    // Chart Data Configs
    const pieData = [
        { name: 'CBET', value: stats.cbetCount },
        { name: 'Diploma', value: stats.diplomaCount },
        { name: 'Certificate', value: stats.certificateCount },
    ];
    const COLORS = ['#1a936f', '#e6a15c', '#3b82f6']; // Green, Gold, Blue

    return (
        <div className="space-y-6 max-w-6xl mx-auto pt-6 px-4 pb-12">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Intelligence Dashboard</h1>
                    <p className="text-slate-500">Real-time insights for 2026 Intake</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push('/admin/funnel')} className="gap-2 bg-slate-900 text-white hover:bg-slate-800 border-none">
                        Filing Funnel <Activity size={16} />
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/admin/applications')} className="gap-2">
                        View Applicants <ArrowRight size={16} />
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut size={16} /> Logout
                    </Button>
                </div>
            </div>

            {/* Fraud Alert Banner */}
            {stats.fraudAlerts.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex justify-between items-center animate-pulse">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="text-red-600 h-6 w-6" />
                        <div>
                            <h3 className="font-bold text-red-900">Fraud Detected!</h3>
                            <p className="text-sm text-red-700">
                                {stats.fraudAlerts.length} M-PESA codes have been used multiple times.
                                High risk of double-dipping.
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => router.push('/admin/fraud')} className="bg-red-600 hover:bg-red-700 text-white">
                        Investigate
                    </Button>
                </div>
            )}

            {/* ZONE A: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SummaryCard
                    title="Total Applications"
                    value={stats.totalApplications}
                    icon={<Users className="text-slate-600" size={24} />}
                    className="bg-white border-slate-200"
                    trend="+12% this week"
                />
                <SummaryCard
                    title="Action Required"
                    value={stats.pendingApplications}
                    icon={<FileText className="text-yellow-600" size={24} />}
                    className="bg-white border-yellow-200"
                    subtext="Pending Review"
                />
                <SummaryCard
                    title="Approved Students"
                    value={stats.totalApplications - stats.pendingApplications}
                    icon={<CheckCircleIcon className="text-green-600" />}
                    className="bg-white border-green-200"
                />
            </div>

            {/* ZONE B: Activity (The Pulse) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                <Card className="lg:col-span-2 flex flex-col">
                    <CardHeader>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={18} /> Activity (Last 24 Hours)
                        </h3>
                    </CardHeader>
                    <CardContent className="flex-1 w-full h-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.hourlyActivity}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#1a936f" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <PieIcon size={18} /> Course Breakdown
                        </h3>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-slate-700">{stats.totalApplications}</span>
                                <p className="text-xs text-slate-500">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ZONE C: Deep Dive (Campus & Grades) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Map size={18} /> Campus Demand Heatmap
                        </h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.campusDemand.map((item, idx) => (
                                <div key={item.campus} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-slate-700">{item.campus}</span>
                                        <span className="text-slate-500">{item.count} applicants</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${(item.count / stats.totalApplications) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {stats.campusDemand.length === 0 && <p className="text-slate-400 text-sm">No campus data yet.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-semibold text-slate-800">Academic Quality (KCSE Grade)</h3>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.gradeDistribution} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="grade" type="category" width={40} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                    {stats.gradeDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['A', 'A-', 'B+'].includes(entry.grade) ? '#1a936f' : '#64748b'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon, className, trend, subtext }: any) {
    return (
        <Card className={className}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="opacity-70 text-sm font-medium uppercase tracking-wider">{title}</p>
                        <h3 className="text-4xl font-bold mt-2">{value}</h3>
                        {subtext && <p className="text-sm opacity-60 mt-1">{subtext}</p>}
                        {trend && <p className="text-xs text-green-400 mt-2 font-medium">{trend}</p>}
                    </div>
                    <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    )
}
