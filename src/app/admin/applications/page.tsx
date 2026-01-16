'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, Label, Select } from '@/components/ui/common';
import { Loader2, Check, X, Download, ArrowLeft, Smartphone, Monitor } from 'lucide-react';

type Applicant = {
    id: string;
    created_at: string;
    full_name: string;
    course_track: 'CBET' | 'DIPLOMA';
    calculated_age: number;
    kcse_mean_grade: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    email: string;
    phone_number: string;
    mpesa_code: string;
    national_id: string;
    ip_address: string | null;
    device_type: string | null;
};

export default function ApplicationsPage() {
    const router = useRouter();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        const pin = sessionStorage.getItem('admin_pin');
        if (pin !== '2026') {
            router.push('/admin');
        } else {
            fetchApplicants();
        }
    }, [router]);

    const fetchApplicants = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('applicants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching:', error);
            alert('Failed to fetch data');
        } else {
            setApplicants(data as Applicant[]);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
        const { error } = await supabase
            .from('applicants')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Error updating status');
        } else {
            setApplicants(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));
        }
    };

    const exportToCSV = () => {
        if (applicants.length === 0) return;
        const headers = ['ID', 'Created At', 'Full Name', 'Email', 'Phone', 'National ID', 'Track', 'Age', 'Grade', 'MPESA Code', 'IP Address', 'Device', 'Status'];
        const rows = applicants.map(app => [
            app.id,
            new Date(app.created_at).toLocaleString(),
            `"${app.full_name}"`,
            app.email,
            app.phone_number,
            app.national_id,
            app.course_track,
            app.calculated_age,
            app.kcse_mean_grade || '-',
            app.mpesa_code,
            app.ip_address || 'N/A',
            app.device_type || 'Unknown',
            app.status
        ]);
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ksa_applicants_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredApplicants = applicants.filter(app => {
        if (filter === 'ALL') return true;
        return app.status === filter;
    });

    return (
        <div className="space-y-6 max-w-[95%] mx-auto pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')}>
                        <ArrowLeft size={16} className="mr-2" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
                        <p className="text-sm text-slate-500">{filteredApplicants.length} Records Found</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant="outline" onClick={fetchApplicants} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                    </Button>
                    <Button variant="outline" onClick={exportToCSV} disabled={applicants.length === 0}>
                        <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                    <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-[150px]">
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </Select>
                </div>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Applicant</th>
                                <th className="px-6 py-3">Track</th>
                                <th className="px-6 py-3">Age / Grade</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredApplicants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No applicants found.</td>
                                </tr>
                            ) : (
                                filteredApplicants.map((app) => (
                                    <tr key={app.id} className="bg-white hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/applications/${app.id}`)}>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div>{app.full_name}</div>
                                            <div className="text-xs text-slate-500">{app.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {app.course_track === 'CBET' ? (
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">CBET</span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">Diploma</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <div>Age: {app.calculated_age}</div>
                                                {app.kcse_mean_grade && <div>Grade: {app.kcse_mean_grade}</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: "bg-yellow-100 text-yellow-800",
        APPROVED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
            {status}
        </span>
    );
}
