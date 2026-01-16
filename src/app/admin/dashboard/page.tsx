'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card, CardContent, CardHeader } from '@/components/ui/common';
import { Users, FileText, LogOut, ArrowRight, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            const pin = sessionStorage.getItem('admin_pin');
            if (pin !== '2026') {
                router.push('/admin');
            } else {
                fetchStats();
            }
        };
        checkAuth();
    }, [router]);

    const fetchStats = async () => {
        const { count: total, error: err1 } = await supabase.from('applicants').select('*', { count: 'exact', head: true });
        const { count: pending, error: err2 } = await supabase.from('applicants').select('*', { count: 'exact', head: true }).eq('status', 'PENDING');
        const { count: approved, error: err3 } = await supabase.from('applicants').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED');

        setStats({
            total: total || 0,
            pending: pending || 0,
            approved: approved || 0
        });
        setLoading(false);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('admin_pin');
        router.push('/admin');
    };

    if (loading) return <div className="p-8 text-center">Loading stats...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pt-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Admin Home</h1>
                    <p className="text-slate-500">Overview of 2026 Intake</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                    <LogOut size={16} /> Logout
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-slate-900 text-white border-0 shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-400 text-sm font-medium">Total Applications</p>
                                <h3 className="text-4xl font-bold mt-2">{stats.total}</h3>
                            </div>
                            <div className="p-3 bg-slate-800 rounded-lg">
                                <Users className="text-white" size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Pending Review</p>
                                <h3 className="text-4xl font-bold mt-2 text-yellow-600">{stats.pending}</h3>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Activity className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-slate-500 text-sm font-medium">Approved Students</p>
                                <h3 className="text-4xl font-bold mt-2 text-green-600">{stats.approved}</h3>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircleIcon className="text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Card className="transform transition-all hover:shadow-lg cursor-pointer border-slate-200" onClick={() => router.push('/admin/applications')}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-100 rounded-md text-blue-600">
                                <FileText size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800">View Applications</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-500 mb-4">Access the full list of student applications, review details, change statuses, and export data.</p>
                        <div className="flex items-center text-blue-600 text-sm font-medium group">
                            Open Table <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-dashed border-2 border-slate-200 flex items-center justify-center p-6 text-slate-400">
                    <p>More features coming soon...</p>
                </Card>
            </div>
        </div>
    );
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
    )
}
