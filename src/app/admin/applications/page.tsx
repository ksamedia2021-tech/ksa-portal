'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Label, Select } from '@/components/ui/common';
import { Loader2, Check, X, Download, ArrowLeft, Smartphone, Monitor } from 'lucide-react';

type Applicant = {
    id: string;
    created_at: string;
    full_name: string;
    course_track: 'CBET' | 'DIPLOMA' | 'CERTIFICATE';
    calculated_age: number;
    kcse_mean_grade: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_CORRECTION';
    email: string;
    phone_number: string;
    mpesa_code: string;
    national_id: string;
    ip_address: string | null;
    device_type: string | null;
    preferred_campus: string | null;
    county_of_recidence: string | null;
    highest_qualification: string | null;
    email_sent: boolean;
    admin_note: string | null;
};

export default function ApplicationsPage() {
    const router = useRouter();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [trackFilter, setTrackFilter] = useState('ALL');
    const [campusFilter, setCampusFilter] = useState('ALL');
    const [dateRange, setDateRange] = useState('ALL');

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
        const pin = sessionStorage.getItem('admin_pin');

        try {
            const response = await fetch('/api/admin/applications', {
                headers: {
                    'x-admin-pin': pin || ''
                }
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setApplicants(data);
        } catch (error) {
            console.error('Error fetching:', error);
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
        const pin = sessionStorage.getItem('admin_pin');
        try {
            const response = await fetch('/api/admin/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: newStatus,
                    pin
                })
            });

            if (!response.ok) throw new Error('Update failed');

            setApplicants(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error(error);
            alert('Error updating status');
        }
    };

    const exportToCSV = () => {
        if (applicants.length === 0) return;
        const headers = [
            'ID', 'Date', 'Full Name', 'Email', 'Phone', 'National ID',
            'Track', 'Campus', 'County', 'Qualification', 'Grade', 'Age',
            'MPESA Code', 'Email Sent', 'Admin Note', 'IP Address', 'Device', 'Status'
        ];
        const rows = filteredApplicants.map(app => [
            app.id,
            new Date(app.created_at).toLocaleString(),
            `"${app.full_name}"`,
            app.email,
            app.phone_number,
            app.national_id,
            app.course_track,
            app.preferred_campus || 'N/A',
            app.county_of_recidence || 'N/A',
            app.highest_qualification || 'N/A',
            app.kcse_mean_grade || '-',
            app.calculated_age,
            app.mpesa_code,
            app.email_sent ? 'Yes' : 'No',
            `"${app.admin_note || ''}"`,
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

    // Derived State: Unique Campuses
    const uniqueCampuses = Array.from(new Set(applicants.map(a => a.preferred_campus).filter(Boolean)));

    const filteredApplicants = applicants.filter(app => {
        // 1. Status Filter
        if (statusFilter !== 'ALL' && app.status !== statusFilter) return false;

        // 2. Track Filter
        if (trackFilter !== 'ALL' && app.course_track !== trackFilter) return false;

        // 3. Campus Filter
        if (campusFilter !== 'ALL' && app.preferred_campus !== campusFilter) return false;

        // 4. Date Range
        if (dateRange !== 'ALL') {
            const appDate = new Date(app.created_at);
            const today = new Date();
            if (dateRange === 'TODAY') {
                if (appDate.toDateString() !== today.toDateString()) return false;
            } else if (dateRange === '7_DAYS') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);
                if (appDate < sevenDaysAgo) return false;
            }
        }

        // 5. Global Search (Name, ID, Phone, MPESA)
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matches =
                app.full_name.toLowerCase().includes(q) ||
                (app.national_id && app.national_id.includes(q)) ||
                app.phone_number.includes(q) ||
                app.mpesa_code.toLowerCase().includes(q);
            if (!matches) return false;
        }

        return true;
    });

    return (
        <div className="space-y-6 max-w-[95%] mx-auto pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
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
                    <Button variant="outline" onClick={exportToCSV} disabled={filteredApplicants.length === 0}>
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Smart Filter Bar */}
            <Card className="p-4 border-slate-200 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="md:col-span-1">
                        <Label className="mb-1 text-xs uppercase text-slate-500">Search</Label>
                        <Input
                            placeholder="Name, ID, Phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9"
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <Label className="mb-1 text-xs uppercase text-slate-500">Status</Label>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9">
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </Select>
                    </div>

                    {/* Track */}
                    <div>
                        <Label className="mb-1 text-xs uppercase text-slate-500">Track</Label>
                        <Select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)} className="h-9">
                            <option value="ALL">All Tracks</option>
                            <option value="CBET">CBET (21+)</option>
                            <option value="DIPLOMA">Diploma (Youth)</option>
                            <option value="CERTIFICATE">Certificate (Youth)</option>
                        </Select>
                    </div>

                    {/* Campus */}
                    <div>
                        <Label className="mb-1 text-xs uppercase text-slate-500">Campus</Label>
                        <Select value={campusFilter} onChange={(e) => setCampusFilter(e.target.value)} className="h-9">
                            <option value="ALL">All Campuses</option>
                            {uniqueCampuses.map(c => (
                                <option key={c as string} value={c as string}>{c as string}</option>
                            ))}
                        </Select>
                    </div>

                    {/* Date */}
                    <div>
                        <Label className="mb-1 text-xs uppercase text-slate-500">Date Range</Label>
                        <Select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="h-9">
                            <option value="ALL">All Time</option>
                            <option value="TODAY">Today</option>
                            <option value="7_DAYS">Last 7 Days</option>
                        </Select>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Applicant</th>
                                <th className="px-6 py-3">National ID</th>
                                <th className="px-6 py-3">Contact</th>
                                <th className="px-6 py-3">Track</th>
                                <th className="px-6 py-3">Campus</th>
                                <th className="px-6 py-3">County</th>
                                <th className="px-6 py-3">Age</th>
                                <th className="px-6 py-3">Qual.</th>
                                <th className="px-6 py-3">Grade</th>
                                <th className="px-6 py-3">Payment</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredApplicants.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-8 text-center text-slate-500">No applicants found.</td>
                                </tr>
                            ) : (
                                filteredApplicants.map((app) => (
                                    <tr key={app.id} className="bg-white hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/applications/${app.id}`)}>
                                        <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                                            {new Date(app.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div>{app.full_name}</div>
                                            <div className="text-xs text-slate-500">{app.email}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                            {app.national_id}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {app.phone_number}
                                        </td>
                                        <td className="px-6 py-4">
                                            {app.course_track === 'CBET' ? (
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">CBET</span>
                                            ) : app.course_track === 'DIPLOMA' ? (
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">Diploma</span>
                                            ) : (
                                                <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700">Certificate</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {app.preferred_campus || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {app.county_of_recidence || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono">
                                            {app.calculated_age}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {app.highest_qualification || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                                            {app.kcse_mean_grade || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-mono text-xs text-slate-600 font-bold">{app.mpesa_code}</span>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                    {app.device_type === 'Mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
                                                    <span className="truncate max-w-[60px]">{app.ip_address || '?.?.?.?'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
        NEEDS_CORRECTION: "bg-orange-100 text-orange-800",
    };

    const label = status === 'NEEDS_CORRECTION' ? 'Correction Required' : status;

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
            {label}
        </span>
    );
}
