'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardHeader, Label } from '@/components/ui/common';
import {
    Activity, Users, FileWarning, CheckCircle2,
    ArrowRight, Bell, Loader2, FileCheck, Filter,
    ChevronRight, Mail, User, X, Phone, GraduationCap, TrendingUp
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface DashData {
    stats: {
        total: number;
        missingForm: number;
        readyForReview: number;
        processed: number;
        completionRate: number;
        uploadTrend: { date: string; count: number }[];
    };
    priorityQueue: any[];
}

export default function FunnelDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashData | null>(null);
    const [loading, setLoading] = useState(true);
    const [nudging, setNudging] = useState(false);

    // Nudge Modal State
    const [isNudgeModalOpen, setIsNudgeModalOpen] = useState(false);
    const [nudgeSubject] = useState('Final Step Required: Upload Your Filled Application Form');
    const [nudgeBody] = useState('We noticed you have completed your online registration, but your filled application form is still missing. Please log in to the portal and upload your scanned form to complete your application.');

    useEffect(() => {
        const pin = sessionStorage.getItem('admin_pin');
        if (pin !== '2026') {
            router.push('/admin');
        } else {
            fetchStats();
        }
    }, [router]);

    const fetchStats = async () => {
        setLoading(true);
        const pin = sessionStorage.getItem('admin_pin');
        try {
            const response = await fetch('/api/admin/dash-stats', {
                headers: { 'x-admin-pin': pin || '' }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkSendNudge = async () => {
        if (!data || data.stats.missingForm === 0) return;

        setNudging(true);
        const pin = sessionStorage.getItem('admin_pin');
        const missingIds = data.priorityQueue
            .filter(a => a.stage === 'Bio-data Only')
            .map(a => a.id);

        try {
            const response = await fetch('/api/admin/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantIds: missingIds,
                    subject: nudgeSubject,
                    body: nudgeBody,
                    pin
                })
            });

            if (response.ok) {
                alert('Nudge emails sent successfully to ' + missingIds.length + ' applicants!');
                setIsNudgeModalOpen(false);
            } else {
                throw new Error('Failed to send nudges');
            }
        } catch (error) {
            alert('Error sending nudges. Check console.');
        } finally {
            setNudging(false);
        }
    };

    if (loading || !data) return <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-ksa-green" size={40} /></div>;

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Filing Funnel</h1>
                    <p className="text-slate-500 font-medium">Monitoring application completion & document collection</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.push('/admin/applications')} className="bg-white">
                        Advanced Search
                    </Button>
                    <Button
                        onClick={() => setIsNudgeModalOpen(true)}
                        disabled={nudging || data.stats.missingForm === 0}
                        className="bg-ksa-gold hover:bg-amber-500 text-slate-900 border-none font-bold"
                    >
                        <Bell size={18} className="mr-2" />
                        Nudge {data.stats.missingForm} Missing Forms
                    </Button>
                </div>
            </div>

            {/* KPI GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatBox
                    label="Registered"
                    value={data.stats.total}
                    icon={<Users className="text-blue-600" />}
                    subtext="Total unique signups"
                />
                <StatBox
                    label="Missing Forms"
                    value={data.stats.missingForm}
                    icon={<FileWarning className="text-red-500" />}
                    subtext={`${Math.round((data.stats.missingForm / data.stats.total) * 100)}% Dropout rate`}
                    highlight
                />
                <StatBox
                    label="Ready to Review"
                    value={data.stats.readyForReview}
                    icon={<FileCheck className="text-ksa-green" />}
                    subtext="Forms uploaded & pending"
                />
                <StatBox
                    label="Collection Rate"
                    value={`${data.stats.completionRate}%`}
                    icon={<Activity className="text-purple-600" />}
                    subtext="Overall funnel efficiency"
                />
            </div>

            {/* MAIN CONTENT: PRIORITY QUEUE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100 flex flex-row justify-between items-center py-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-ksa-green/10 rounded-lg">
                                <Filter size={20} className="text-ksa-green" />
                            </div>
                            <h2 className="font-bold text-slate-800 text-lg">Priority Processing Queue</h2>
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Top 50 Rows</span>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-black">Applicant</th>
                                        <th className="px-6 py-4 text-left font-black">Stage</th>
                                        <th className="px-6 py-4 text-left font-black">Contact</th>
                                        <th className="px-6 py-4 text-left font-black">Form Submitted</th>
                                        <th className="px-6 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {data.priorityQueue.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/admin/applications/${app.id}`)}>
                                                <div className="font-bold text-slate-900 group-hover:text-ksa-green transition-colors">{app.full_name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{app.national_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StageBadge stage={app.stage} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                                    <Mail size={12} /> {app.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 cursor-pointer" onClick={() => router.push(`/admin/applications/${app.id}`)}>
                                                {app.form_submitted_at ? (
                                                    <div className="text-xs text-slate-500 font-medium group-hover:text-ksa-green transition-colors">
                                                        {new Date(app.form_submitted_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 font-bold uppercase">Pending</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => router.push(`/admin/applications/${app.id}`)}
                                                    className="h-8 w-8 p-0 hover:bg-ksa-green hover:text-white rounded-full transition-all"
                                                >
                                                    <ChevronRight size={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* SIDEBAR: FUNNEL INSIGHTS */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                        <CardHeader className="border-b border-white/5 shadow-sm">
                            <h3 className="font-bold">Funnel Health</h3>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                    <span>Form Collection</span>
                                    <span>{data.stats.total - data.stats.missingForm} / {data.stats.total}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-ksa-green rounded-full" style={{ width: `${data.stats.completionRate}%` }} />
                                </div>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-ksa-green/20 rounded-lg text-ksa-green"><FileCheck size={16} /></div>
                                    <div className="text-xs">
                                        <p className="font-bold text-slate-200">{data.stats.readyForReview} Ready to Review</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Clear these soon.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 rounded-lg text-red-400"><FileWarning size={16} /></div>
                                    <div className="text-xs">
                                        <p className="font-bold text-slate-200">{data.stats.missingForm} Missing Forms</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Action: Send Nudge.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col h-[320px]">
                        <CardHeader className="pb-2 border-b border-white/5 mb-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <TrendingUp size={18} className="text-ksa-green" /> Upload Velocity
                            </h3>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.stats.uploadTrend}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1a936f" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#1a936f" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 10, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                                        itemStyle={{ color: '#1a936f' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#1a936f"
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bulk Nudge Preview Modal */}
            {isNudgeModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl border-none">
                        <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Bell size={18} className="text-ksa-gold" /> Bulk Nudge Preview
                                </h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase mt-1">Sending to {data.stats.missingForm} Pending Students</p>
                            </div>
                            <button onClick={() => setIsNudgeModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                                <div>
                                    <Label className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Subject Line</Label>
                                    <p className="text-sm font-bold text-slate-700 mt-1">{nudgeSubject}</p>
                                </div>
                                <div>
                                    <Label className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Email Content</Label>
                                    <p className="text-xs text-slate-600 leading-relaxed mt-1 italic">
                                        " Dear [Student Name], <br /><br />
                                        {nudgeBody} "
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsNudgeModalOpen(false)}>Cancel</Button>
                                <Button
                                    className="flex-1 bg-ksa-green hover:bg-green-600 font-bold"
                                    onClick={handleBulkSendNudge}
                                    isLoading={nudging}
                                    disabled={nudging}
                                >
                                    {nudging ? 'Sending...' : `Send ${data.stats.missingForm} Emails`}
                                </Button>
                            </div>
                            <p className="text-[9px] text-center text-slate-400 font-medium tracking-tight">
                                Note: Emails will be sent from onboarding@resend.dev until domain is verified.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function StatBox({ label, value, icon, subtext, highlight }: any) {
    return (
        <Card className={`border-none shadow-md ${highlight ? 'bg-white border-l-4 border-l-red-500' : 'bg-white'}`}>
            <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                    <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900">{value}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">{subtext}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function StageBadge({ stage }: { stage: string }) {
    const styles: any = {
        'Ready to Review': 'bg-ksa-green/10 text-ksa-green border-ksa-green/20',
        'Bio-data Only': 'bg-amber-100 text-amber-700 border-amber-200',
        'Processed': 'bg-slate-100 text-slate-500 border-slate-200'
    };

    const icons: any = {
        'Ready to Review': <FileCheck size={12} />,
        'Bio-data Only': <FileWarning size={12} />,
        'Processed': <CheckCircle2 size={12} />
    };

    return (
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${styles[stage]}`}>
            {icons[stage]}
            {stage}
        </span>
    );
}

function ActionButton({ icon, label, color, onClick }: any) {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
        slate: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
        green: 'bg-green-50 text-green-600 hover:bg-green-100'
    };
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${colors[color]}`}
        >
            <span className="flex items-center gap-3 text-sm font-bold">{icon} {label}</span>
            <ChevronRight size={14} />
        </button>
    );
}
