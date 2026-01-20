'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader } from '@/components/ui/common';
import { ArrowLeft, Check, X, Shield, Smartphone, Monitor, Clock, MapPin } from 'lucide-react';

export default function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [app, setApp] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const pin = sessionStorage.getItem('admin_pin');
        if (pin !== '2026') {
            router.push('/admin');
        } else {
            fetchApp();
        }
    }, [id]);

    const fetchApp = async () => {
        const pin = sessionStorage.getItem('admin_pin');
        try {
            const response = await fetch(`/api/admin/applications/${id}`, {
                headers: { 'x-admin-pin': pin || '' }
            });

            if (!response.ok) {
                throw new Error('Applicant not found');
            }

            const data = await response.json();
            setApp(data);
        } catch (error) {
            console.error(error);
            alert('Applicant not found');
            router.push('/admin/applications');
        } finally {
            setLoading(false);
        }
    };

    const [correctionNote, setCorrectionNote] = useState('');
    const [isCorrectionMode, setIsCorrectionMode] = useState(false);

    const updateStatus = async (newStatus: 'APPROVED' | 'REJECTED' | 'NEEDS_CORRECTION', note?: string) => {
        const pin = sessionStorage.getItem('admin_pin');

        try {
            const response = await fetch('/api/admin/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    status: newStatus,
                    admin_note: note,
                    pin: pin // Send PIN for validation
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Update failed');
            }

            console.log('Update success:', result.data);
            setApp(result.data);
            setIsCorrectionMode(false);

        } catch (err: any) {
            console.error('Update Request Failed:', err);
            alert('Error: ' + err.message);
        }
    };

    if (loading || !app) return <div className="p-8 text-center">Loading details...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <Button variant="outline" onClick={() => router.push('/admin/applications')}>
                <ArrowLeft size={16} className="mr-2" /> Back to List
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{app.full_name}</h1>
                    <p className="text-slate-500">Application ID: {app.id}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {/* Correction Mode UI */}
                    {isCorrectionMode ? (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 w-full md:w-96 space-y-3">
                            <label className="text-xs font-bold text-yellow-800 uppercase">Correction Note</label>
                            <textarea
                                className="w-full p-2 text-sm border-yellow-300 rounded focus:ring-yellow-500 min-h-[80px]"
                                placeholder="E.g. Your ID photo is blurry. Please re-upload."
                                value={correctionNote}
                                onChange={(e) => setCorrectionNote(e.target.value)}
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setIsCorrectionMode(false)}>Cancel</Button>
                                <Button
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                    onClick={() => updateStatus('NEEDS_CORRECTION', correctionNote)}
                                    disabled={!correctionNote}
                                >
                                    Send Request
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            {app.status === 'PENDING' || app.status === 'NEEDS_CORRECTION' ? (
                                <>
                                    <Button onClick={() => updateStatus('APPROVED')} className="bg-green-600 hover:bg-green-700 text-white">
                                        <Check size={18} className="mr-2" /> Approve
                                    </Button>
                                    <Button onClick={() => setIsCorrectionMode(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                                        <Shield size={18} className="mr-2" /> Request Correction
                                    </Button>
                                    <Button onClick={() => updateStatus('REJECTED')} variant="primary" className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
                                        <X size={18} className="mr-2" /> Reject
                                    </Button>
                                </>
                            ) : (
                                <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 
                                    ${app.status === 'APPROVED' ? 'bg-green-100 text-green-700' : ''}
                                    ${app.status === 'REJECTED' ? 'bg-red-100 text-red-700' : ''}
                                    ${app.status === 'NEEDS_CORRECTION' ? 'bg-yellow-100 text-yellow-700' : ''}
                                `}>
                                    {app.status === 'APPROVED' && <Check size={18} />}
                                    {app.status === 'REJECTED' && <X size={18} />}
                                    {app.status}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Note Display if present */}
            {app.admin_note && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-800">
                    <p className="text-xs font-bold uppercase mb-1">Previous Correction Requested:</p>
                    <p className="text-sm">"{app.admin_note}"</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <Card>
                    <CardHeader><h3 className="font-semibold text-lg">Personal Information</h3></CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Email" value={app.email} />
                        <DetailRow label="Phone" value={app.phone_number} />
                        <DetailRow label="National ID" value={app.national_id} />
                        <DetailRow label="Date of Birth" value={new Date(app.dob).toLocaleDateString()} />
                        <DetailRow label="Age" value={`${app.calculated_age} Years`} />
                        <DetailRow label="County" value={app.county_of_recidence || 'N/A'} />
                    </CardContent>
                </Card>

                {/* Academic */}
                <Card>
                    <CardHeader><h3 className="font-semibold text-lg">Academic Details</h3></CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Course Track" value={app.course_track} />
                        <DetailRow label="Preferred Campus" value={app.preferred_campus || 'N/A'} />
                        <DetailRow label="KCSE Grade" value={app.kcse_mean_grade || 'N/A'} />
                        <DetailRow label="Prior Qualification" value={app.highest_qualification || 'N/A'} />
                    </CardContent>
                </Card>

                {/* Payment */}
                <Card>
                    <CardHeader><h3 className="font-semibold text-lg">Payment - M-PESA</h3></CardHeader>
                    <CardContent className="space-y-3">
                        <DetailRow label="Transaction Code" value={app.mpesa_code} />
                        <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-500">
                            Note: Verify this code against your M-PESA statement or use the search tool.
                        </div>
                    </CardContent>
                </Card>

                {/* Metadata (The "Different Page" content) */}
                <Card className="border-slate-300 shadow-md">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <Shield size={18} /> Technical Metadata
                        </h3>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded text-slate-600">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Submission Time</p>
                                <p className="font-mono text-sm">{new Date(app.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded text-slate-600">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">IP Address</p>
                                <p className="font-mono text-sm">{app.ip_address || 'Not Captured'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded text-slate-600">
                                {app.device_type === 'Mobile' ? <Smartphone size={20} /> : <Monitor size={20} />}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Device Type</p>
                                <p className="font-mono text-sm">{app.device_type || 'Unknown'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between border-b border-slate-50 pb-2 last:border-0">
            <span className="text-slate-500 text-sm">{label}</span>
            <span className="font-medium text-slate-900 text-sm">{value}</span>
        </div>
    );
}
