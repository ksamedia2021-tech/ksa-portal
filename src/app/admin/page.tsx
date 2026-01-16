'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, CardHeader, CardContent, Label, Select } from '@/components/ui/common';
import { Loader2, Check, X, Search, Download } from 'lucide-react';

// Type for Key fields from database
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
};

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');

    // Data State
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('ALL');

    // Admin PIN Check (Hardcoded for demo)
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '2026') { // Simple PIN
            setIsAuthenticated(true);
            fetchApplicants();
        } else {
            alert('Invalid Admin PIN');
        }
    };

    const exportToCSV = () => {
        if (applicants.length === 0) return;

        // Define headers
        const headers = ['ID', 'Created At', 'Full Name', 'Email', 'Phone', 'Track', 'Age', 'Grade', 'MPESA Code', 'Status'];

        // Map data to rows
        const rows = applicants.map(app => [
            app.id,
            new Date(app.created_at).toLocaleString(),
            `"${app.full_name}"`, // Escape commas
            app.email,
            app.phone_number,
            app.course_track,
            app.calculated_age,
            app.kcse_mean_grade || '-',
            app.mpesa_code,
            app.status
        ]);

        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ksa_applicants_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
            // Optimistic Update
            setApplicants(prev => prev.map(app =>
                app.id === id ? { ...app, status: newStatus } : app
            ));
        }
    };

    const filteredApplicants = applicants.filter(app => {
        if (filter === 'ALL') return true;
        return app.status === filter;
    });

    if (!isAuthenticated) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8 bg-white shadow-lg rounded-xl border border-slate-200">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
                        <p className="text-sm text-slate-500">Enter secure PIN to continue</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Security PIN</Label>
                        <Input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="••••"
                            className="text-center text-lg tracking-widest"
                            maxLength={4}
                        />
                    </div>
                    <Button type="submit" className="w-full">Access Dashboard</Button>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Applicant Dashboard</h1>
                    <p className="text-slate-500">Manage student applications for 2026 Intake</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Button variant="outline" onClick={fetchApplicants} disabled={loading}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                    </Button>
                    <Button variant="outline" onClick={exportToCSV} disabled={applicants.length === 0} title="Export to Excel">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-[150px]"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </Select>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3">Applicant</th>
                                <th className="px-6 py-3">Track</th>
                                <th className="px-6 py-3">Age / Grade</th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredApplicants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No applicants found.
                                    </td>
                                </tr>
                            ) : (
                                filteredApplicants.map((app) => (
                                    <tr key={app.id} className="bg-white hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div>{app.full_name}</div>
                                            <div className="text-xs text-slate-500 font-normal">{app.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${app.course_track === 'CBET' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {app.course_track}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{app.calculated_age} yrs</div>
                                            {app.kcse_mean_grade && <div className="text-slate-500 text-xs">Grade: {app.kcse_mean_grade}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600">
                                            <div>Phone: {app.phone_number}</div>
                                            <div className="font-mono mt-1">M-PESA: {app.mpesa_code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={app.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {app.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => updateStatus(app.id, 'APPROVED')}
                                                        className="p-1.5 hover:bg-green-100 text-green-600 rounded-md transition-colors"
                                                        title="Approve"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(app.id, 'REJECTED')}
                                                        className="p-1.5 hover:bg-red-100 text-red-600 rounded-md transition-colors"
                                                        title="Reject"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {app.status !== 'PENDING' && (
                                                <span className="text-xs text-slate-400 italic">Decided</span>
                                            )}
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
    const styles = {
        PENDING: "bg-yellow-100 text-yellow-800",
        APPROVED: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-slate-100 text-slate-800'}`}>
            {status}
        </span>
    );
}
