'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Label, Select, CardHeader, CardContent } from '@/components/ui/common';
import {
    Loader2, Check, X, Download, ArrowLeft, Smartphone, Monitor,
    ChevronDown, ChevronRight, User, Mail, Phone, MapPin,
    CreditCard, GraduationCap, Calendar, Info, ArrowRight, File, ExternalLink,
    Square, CheckSquare, Send, MessageSquare
} from 'lucide-react';
import React from 'react';

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
    county_of_residence: string | null;
    highest_qualification: string | null;
    email_sent: boolean;
    admin_note: string | null;
    submitted_form_path: string | null;
};

import { supabase } from '@/lib/supabase';

export default function ApplicationsPage() {
    const router = useRouter();
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [session, setSession] = useState<any>(null);

    // Bulk Messaging State
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkSubject, setBulkSubject] = useState('');
    const [bulkBody, setBulkBody] = useState('');
    const [bulkSending, setBulkSending] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (!currentSession) {
                router.push('/admin');
            } else {
                setSession(currentSession);
                fetchApplicants(currentSession.access_token);
            }
        };
        checkAuth();
    }, [router]);

    const toggleRow = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const applicant = applicants.find(a => a.id === id);

        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else {
                next.add(id);
                // Fetch signed URL if it doesn't exist and path exists
                if (applicant?.submitted_form_path && !signedUrls[id] && session) {
                    getSignedUrl(id, applicant.submitted_form_path, session.access_token);
                }
            }
            return next;
        });
    };

    const getSignedUrl = async (id: string, path: string, token: string) => {
        try {
            const response = await fetch('/api/admin/get-signed-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ path })
            });
            const data = await response.json();
            if (data.signedUrl) {
                setSignedUrls(prev => ({ ...prev, [id]: data.signedUrl }));
            }
        } catch (error) {
            console.error('Error getting signed URL:', error);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredApplicants.length && filteredApplicants.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredApplicants.map(a => a.id)));
        }
    };

    const toggleSelectUser = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkSend = async () => {
        if (!bulkSubject || !bulkBody || selectedIds.size === 0 || !session) return;
        setBulkSending(true);

        try {
            const response = await fetch('/api/admin/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    applicantIds: Array.from(selectedIds),
                    subject: bulkSubject,
                    body: bulkBody
                })
            });

            if (!response.ok) throw new Error('Bulk send failed');

            alert(`Successfully sent messages to ${selectedIds.size} applicants!`);
            setIsBulkModalOpen(false);
            setBulkSubject('');
            setBulkBody('');
            setSelectedIds(new Set());
        } catch (error) {
            console.error(error);
            alert('Failed to send bulk messages');
        } finally {
            setBulkSending(false);
        }
    };

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [trackFilter, setTrackFilter] = useState('ALL');
    const [campusFilter, setCampusFilter] = useState('ALL');
    const [dateRange, setDateRange] = useState('ALL');

    const fetchApplicants = async (token?: string) => {
        const activeToken = token || session?.access_token;
        if (!activeToken) return;

        setLoading(true);
        try {
            const response = await fetch('/api/admin/applications', {
                headers: {
                    'Authorization': `Bearer ${activeToken}`
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
        if (!session) return;
        try {
            const response = await fetch('/api/admin/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    id,
                    status: newStatus
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
            app.county_of_residence || 'N/A',
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
                    <Button variant="outline" onClick={() => fetchApplicants()} disabled={loading}>
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

            <Card className="overflow-hidden border-slate-200 shadow-sm transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="w-10 px-4 py-3 text-center">
                                    <button onClick={toggleSelectAll} className="p-1 hover:bg-slate-200 rounded transition-colors">
                                        {selectedIds.size > 0 && selectedIds.size === filteredApplicants.length ? (
                                            <CheckSquare size={16} className="text-ksa-green" />
                                        ) : (
                                            <Square size={16} className="text-slate-300" />
                                        )}
                                    </button>
                                </th>
                                <th className="w-10 px-4 py-3 text-center"></th>
                                <th className="px-6 py-3">Applicant</th>
                                <th className="px-6 py-3">National ID</th>
                                <th className="px-6 py-3">Track</th>
                                <th className="px-6 py-3">Campus</th>
                                <th className="px-6 py-3">County</th>
                                <th className="px-6 py-3">Age</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredApplicants.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Info className="w-8 h-8 opacity-20" />
                                            <p>No applicants found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredApplicants.map((app) => (
                                    <React.Fragment key={app.id}>
                                        <tr
                                            className={`bg-white hover:bg-slate-50 transition-colors cursor-pointer ${expandedRows.has(app.id) ? 'bg-slate-50/80' : ''} ${selectedIds.has(app.id) ? 'bg-ksa-green/5' : ''}`}
                                            onClick={() => router.push(`/admin/applications/${app.id}`)}
                                        >
                                            <td className="px-4 py-4 text-center" onClick={(e) => toggleSelectUser(app.id, e)}>
                                                <div className="p-1">
                                                    {selectedIds.has(app.id) ? (
                                                        <CheckSquare size={18} className="text-ksa-green inline" />
                                                    ) : (
                                                        <Square size={18} className="text-slate-300 inline" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center" onClick={(e) => toggleRow(app.id, e)}>
                                                {expandedRows.has(app.id) ? (
                                                    <ChevronDown size={18} className="text-ksa-green inline" />
                                                ) : (
                                                    <ChevronRight size={18} className="text-slate-400 inline" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-slate-900">{app.full_name}</div>
                                                    {app.submitted_form_path && (
                                                        <File size={14} className="text-ksa-green" />
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase font-medium">{new Date(app.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                                {app.national_id}
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
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {app.preferred_campus || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                {app.county_of_residence || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                {app.calculated_age}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={app.status} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" className="text-blue-600 h-8 font-bold">
                                                    Open <ArrowRight size={12} className="ml-1" />
                                                </Button>
                                            </td>
                                        </tr>
                                        {/* Expanded Detail Panel */}
                                        {expandedRows.has(app.id) && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={10} className="px-8 py-6 border-l-4 border-l-ksa-green bg-gradient-to-r from-slate-50 to-white">
                                                    <div className="flex flex-col xl:flex-row gap-8">
                                                        {/* LEFT SIDE: DETAILS */}
                                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            {/* Contact & Location */}
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                                    <User size={12} className="text-ksa-green" /> Personal & Contact
                                                                </h4>
                                                                <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Mail size={14} /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Email Address</p>
                                                                            <p className="text-xs font-medium">{app.email}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-green-50 rounded-lg text-green-600"><Phone size={14} /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Phone Number</p>
                                                                            <p className="text-xs font-medium">{app.phone_number}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><MapPin size={14} /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">County of Residence</p>
                                                                            <p className="text-xs font-medium">{app.county_of_residence || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Academic Details */}
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                                    <GraduationCap size={12} className="text-ksa-green" /> Education & Qualifications
                                                                </h4>
                                                                <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Info size={14} /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Highest Qualification</p>
                                                                            <p className="text-xs font-medium">{app.highest_qualification || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Check size={14} /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">KCSE Mean Grade</p>
                                                                            <p className="text-xs font-bold text-slate-700">{app.kcse_mean_grade || 'N/A'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-2 bg-pink-50 rounded-lg text-pink-600"><Calendar size={14} /></div>
                                                                        <div>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Calculated Age</p>
                                                                            <p className="text-xs font-medium">{app.calculated_age} Years Old</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Payment & Meta */}
                                                            <div className="md:col-span-2 space-y-4">
                                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                                                    <CreditCard size={12} className="text-ksa-green" /> Submission Metadata
                                                                </h4>
                                                                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-ksa-gold/10 rounded-lg text-ksa-gold"><Smartphone size={14} /></div>
                                                                            <div>
                                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">MPESA Code</p>
                                                                                <p className="text-xs font-mono font-bold">{app.mpesa_code}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center justify-end">
                                                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.email_sent ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                                                                                {app.email_sent ? 'EMAIL SENT ✓' : 'EMAIL PENDING'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {app.admin_note && (
                                                                        <div className="p-3 bg-amber-50 rounded-lg text-[10px] text-amber-900 border border-amber-100 italic">
                                                                            <span className="font-bold not-italic block mb-1">ADMIN NOTE:</span>
                                                                            {app.admin_note}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* RIGHT SIDE: DOCUMENT PREVIEW */}
                                                        <div className="xl:w-[450px] space-y-4">
                                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between mb-2">
                                                                <span className="flex items-center gap-2"><File size={12} className="text-ksa-green" /> Submitted Form</span>
                                                                {app.submitted_form_path && signedUrls[app.id] && (
                                                                    <a
                                                                        href={signedUrls[app.id]}
                                                                        target="_blank"
                                                                        className="text-ksa-green hover:underline flex items-center gap-1"
                                                                    >
                                                                        Open Full <ExternalLink size={10} />
                                                                    </a>
                                                                )}
                                                            </h4>

                                                            <div className="bg-slate-200 rounded-xl overflow-hidden aspect-[3/4] border border-slate-200 shadow-inner flex items-center justify-center relative">
                                                                {!app.submitted_form_path ? (
                                                                    <div className="text-center p-8">
                                                                        <File size={48} className="text-slate-400 mx-auto mb-4 opacity-20" />
                                                                        <p className="text-sm font-bold text-slate-400">No form uploaded yet</p>
                                                                        <p className="text-[10px] text-slate-400 mt-1">Student has not submitted their scan.</p>
                                                                    </div>
                                                                ) : !signedUrls[app.id] ? (
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <Loader2 className="w-8 h-8 animate-spin text-ksa-green" />
                                                                        <p className="text-xs font-bold text-slate-500">Loading Preview...</p>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        {app.submitted_form_path.toLowerCase().endsWith('.pdf') ? (
                                                                            <iframe
                                                                                src={`${signedUrls[app.id]}#toolbar=0`}
                                                                                className="w-full h-full border-none"
                                                                                title="Application Form"
                                                                            />
                                                                        ) : (
                                                                            <img
                                                                                src={signedUrls[app.id]}
                                                                                alt="Application Form"
                                                                                className="w-full h-full object-contain"
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {app.submitted_form_path && (
                                                                <p className="text-[10px] text-center text-slate-400 py-2">
                                                                    Previewing secure link (valid for 10 min)
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-700">
                        <div className="flex items-center gap-2 pr-6 border-r border-slate-700">
                            <span className="flex items-center justify-center w-6 h-6 bg-ksa-green rounded-full text-[10px] font-bold">{selectedIds.size}</span>
                            <span className="text-sm font-medium">Applicants Selected</span>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="bg-ksa-green hover:bg-green-600 text-white h-9 py-0 text-xs"
                            >
                                <Send size={14} className="mr-2" /> Message Group
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setSelectedIds(new Set())}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9 py-0 text-xs"
                            >
                                Clear Selection
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Message Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl border-none">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-ksa-green" /> Group Messaging
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Ready to send to {selectedIds.size} recipients</p>
                            </div>
                            <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Email Subject</Label>
                                    <Input
                                        placeholder="Enter subject for the group email..."
                                        value={bulkSubject}
                                        onChange={(e) => setBulkSubject(e.target.value)}
                                        className="h-10 mt-1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-slate-400">Message Body</Label>
                                    <textarea
                                        className="w-full mt-1 p-3 text-sm border-slate-200 rounded-lg focus:ring-ksa-green min-h-[150px] bg-slate-50/50"
                                        placeholder="Type your message here. Each recipient will get a personalized copy..."
                                        value={bulkBody}
                                        onChange={(e) => setBulkBody(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                                <Button
                                    className="flex-1 px-8"
                                    onClick={handleBulkSend}
                                    isLoading={bulkSending}
                                    disabled={!bulkSubject || !bulkBody || bulkSending}
                                >
                                    <Send size={16} className="mr-2" /> Send to Group
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
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
