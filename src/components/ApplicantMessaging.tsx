'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, Alert, Input } from '@/components/ui/common';
import { Send, History, MessageSquare, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface Message {
    id: string;
    subject: string;
    body: string;
    sent_by: string;
    sent_at: string;
}

interface ApplicantMessagingProps {
    applicantId: string;
    applicantName: string;
    applicantEmail: string;
}

const TEMPLATES = [
    { name: 'Missing Form', subject: 'Incomplete Action: Missing Application Form', body: 'We noticed that you have not yet uploaded your filled application form. Please log in to the portal and upload your scanned form by Feb 6th, 2026.' },
    { name: 'Blurry Scan', subject: 'Action Required: Re-upload Application Form', body: 'The form you uploaded is blurry or unreadable. Please provide a clearer scan or photo of your filled application form.' },
    { name: 'Verified', subject: 'Application Verified: Next Steps', body: 'We have successfully verified your application and documents. Please wait for further instructions regarding your admission letter.' },
];

export const ApplicantMessaging: React.FC<ApplicantMessagingProps> = ({ applicantId, applicantName, applicantEmail }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchHistory();
    }, [applicantId]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const pin = sessionStorage.getItem('admin_pin');
            const response = await fetch(`/api/admin/messages/${applicantId}`, {
                headers: { 'x-admin-pin': pin || '' }
            });
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSend = async () => {
        if (!subject || !body) return;
        setSending(true);
        setStatus(null);

        const pin = sessionStorage.getItem('admin_pin');

        try {
            const response = await fetch('/api/admin/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantIds: [applicantId],
                    subject,
                    body,
                    pin
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Failed to send message');

            setStatus({ type: 'success', message: 'Email sent and logged successfully!' });
            setSubject('');
            setBody('');
            fetchHistory(); // Refresh timeline

        } catch (err: any) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setSending(false);
        }
    };

    const applyTemplate = (tmpl: typeof TEMPLATES[0]) => {
        setSubject(tmpl.subject);
        setBody(tmpl.body);
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            {/* COMPOSER */}
            <div className="xl:col-span-3 space-y-4">
                <Card>
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <MessageSquare size={18} /> Compose New Message
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest w-full">Quick Templates</span>
                            {TEMPLATES.map((tmpl) => (
                                <button
                                    key={tmpl.name}
                                    onClick={() => applyTemplate(tmpl)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-ksa-green hover:text-white rounded-full text-xs font-medium transition-colors"
                                >
                                    {tmpl.name}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">Email Subject</label>
                                <Input
                                    placeholder="Enter subject..."
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">Message Body</label>
                                <textarea
                                    className="w-full mt-1 p-3 text-sm border-slate-200 rounded-lg focus:ring-ksa-green min-h-[150px] bg-slate-50/50"
                                    placeholder="Type your message to the applicant here..."
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                        </div>

                        {status && (
                            <Alert variant={status.type === 'success' ? 'info' : 'destructive'} className="py-2 text-xs">
                                <div className="flex items-center gap-2">
                                    {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    {status.message}
                                </div>
                            </Alert>
                        )}

                        <Button
                            className="w-full"
                            onClick={handleSend}
                            disabled={!subject || !body || sending}
                            isLoading={sending}
                        >
                            <Send size={16} className="mr-2" />
                            {sending ? 'Sending...' : 'Send Branded Email'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* HISTORY TIMELINE */}
            <div className="xl:col-span-2 space-y-4">
                <Card className="h-full flex flex-col">
                    <CardHeader className="bg-slate-50 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <History size={18} /> Correspondence History
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-auto max-h-[500px]">
                        {loadingHistory ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Loader2 className="animate-spin mb-2" />
                                <p className="text-xs">Loading history...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                                <MessageSquare size={32} className="opacity-20 mb-2" />
                                <p className="text-xs font-bold">No message history</p>
                                <p className="text-[10px]">Your communications will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-7 h-7 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10 text-slate-400">
                                            <Clock size={14} />
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-xs font-bold text-slate-900 leading-tight">{msg.subject}</h4>
                                                <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">{new Date(msg.sent_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 line-clamp-3 italic">"{msg.body}"</p>
                                            <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                                                <span className="text-[9px] text-slate-400 uppercase font-bold">Sent by: {msg.sent_by}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
