'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Card } from '@/components/ui/common';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

type FraudRecord = {
    id: string;
    created_at: string;
    full_name: string;
    mpesa_code: string;
    national_id: string;
    phone_number: string;
    status: string;
    ip_address: string;
};

export default function FraudReportPage() {
    const router = useRouter();
    const [records, setRecords] = useState<FraudRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/admin');
            } else {
                fetchFraudData();
            }
        };
        checkAuth();
    }, [router]);

    const fetchFraudData = async () => {
        const { data, error } = await supabase
            .from('fraud_incidences')
            .select('*');

        if (!error && data) {
            setRecords(data);
        }
        setLoading(false);
    };

    return (
        <div className="max-w-6xl mx-auto pt-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-red-700 flex items-center gap-2">
                        <AlertTriangle /> Fraud/Duplicate Report
                    </h1>
                    <p className="text-slate-500">Applicants sharing M-PESA codes</p>
                </div>
            </div>

            <Card className="overflow-hidden border-red-100">
                <table className="w-full text-sm text-left">
                    <thead className="bg-red-50 text-red-900 uppercase font-semibold text-xs border-b border-red-100">
                        <tr>
                            <th className="px-6 py-3">M-PESA Code</th>
                            <th className="px-6 py-3">Applicant Name</th>
                            <th className="px-6 py-3">National ID</th>
                            <th className="px-6 py-3">Phone</th>
                            <th className="px-6 py-3">Submission Time</th>
                            <th className="px-6 py-3">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No fraud detected.
                                </td>
                            </tr>
                        ) : (
                            records.map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{rec.mpesa_code}</td>
                                    <td className="px-6 py-4">{rec.full_name}</td>
                                    <td className="px-6 py-4 font-mono">{rec.national_id}</td>
                                    <td className="px-6 py-4">{rec.phone_number}</td>
                                    <td className="px-6 py-4">{new Date(rec.created_at).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-mono text-xs">{rec.ip_address}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
