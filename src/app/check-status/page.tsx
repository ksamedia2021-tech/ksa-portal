'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Input, Card, CardHeader, CardContent, Label } from '@/components/ui/common';
import { ArrowRight, Download, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import StepBioData from '@/components/StepBioData';
import StepDetails from '@/components/StepDetails';
import { ApplicationData, applicationSchema } from '@/lib/schemas';

export default function CheckStatusPage() {
    const [nationalId, setNationalId] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [app, setApp] = useState<any>(null);
    const [error, setError] = useState('');

    // Correction Mode State
    const [isCorrection, setIsCorrection] = useState(false);
    const [formData, setFormData] = useState<ApplicationData | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    const checkStatus = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nationalId, phone })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Check failed');
            }

            if (!result.found || !result.data) {
                setError('No application found. Please check your details.');
                return;
            }

            const data = result.data;
            setApp(data);

            // If needs correction, prep form data
            if (data.status === 'NEEDS_CORRECTION') {
                const initialData: ApplicationData = {
                    fullName: data.full_name,
                    email: data.email,
                    phoneNumber: data.phone_number,
                    nationalId: data.national_id,
                    county: data.county_of_recidence || '',
                    dob: data.dob,
                    courseTrack: data.course_track,
                    highestQualification: data.highest_qualification || '',
                    kcseMeanGrade: data.kcse_mean_grade || 'D-',
                    preferredCampus: data.preferred_campus,
                    mpesaCode: data.mpesa_code
                };
                setFormData(initialData);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'No application found matching these details.');
            setApp(null);
        } finally {
            setLoading(false);
        }
    };

    const handleCorrectionUpdate = (newData: Partial<ApplicationData>) => {
        if (!formData) return;
        setFormData({ ...formData, ...newData });
    };

    const submitCorrection = async () => {
        if (!app || !formData) return;
        setSubmitting(true);

        try {
            // 1. Calculate new age if DOB changed
            const dobDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }

            // 2. Submit via Secure API
            const response = await fetch('/api/applications/correct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: app.id,
                    nationalId: app.national_id, // Critical for verification
                    ...formData,
                    calculatedAge: age
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Update failed');
            }

            alert('Application updated successfully!');
            setIsCorrection(false);
            setApp({ ...app, status: 'PENDING', admin_note: null }); // Optimistic update

        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to update application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isCorrection && app && formData) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r shadow-sm">
                        <div className="flex gap-2 items-start">
                            <AlertTriangle className="text-yellow-700 shrink-0" />
                            <div>
                                <h2 className="font-bold text-yellow-800">Correction Required</h2>
                                <p className="text-sm text-yellow-700 mt-1">Admin Feedback: <span className="font-semibold">"{app.admin_note}"</span></p>
                                <p className="text-xs text-yellow-600 mt-2">Please update the incorrect information below and resubmit.</p>
                            </div>
                        </div>
                    </div>

                    {/* Correction Wizard */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-slate-800">Edit Application</h2>
                                <span className="text-sm font-mono text-slate-500">Step {currentStep} of 2</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {currentStep === 1 && (
                                <StepBioData
                                    defaultValues={formData}
                                    onNext={(data, age) => {
                                        handleCorrectionUpdate({ ...data, calculatedAge: age });
                                        setCurrentStep(2);
                                    }}
                                />
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <StepDetails
                                        age={formData.calculatedAge || 0}
                                        defaultValues={formData}
                                        onNext={(data) => {
                                            handleCorrectionUpdate(data);
                                            submitCorrection();
                                        }}
                                        onBack={() => setCurrentStep(1)}
                                    />
                                </div>
                            )}

                            {/* Submitting Overlay */}
                            {submitting && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-ksa-green mb-2" />
                                        <p className="font-semibold text-slate-700">Resubmitting Application...</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo & Header */}
                <div className="text-center space-y-2">
                    <div className="h-12 w-12 bg-ksa-green rounded-full mx-auto flex items-center justify-center font-bold text-white text-xl">
                        K
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Check Application Status</h1>
                    <p className="text-slate-500">Enter your details to track your admission.</p>
                </div>

                {!app ? (
                    // Login Form
                    <Card className="border-slate-200 shadow-md">
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>National ID</Label>
                                <Input
                                    placeholder="Enter National ID"
                                    value={nationalId}
                                    onChange={(e) => setNationalId(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    placeholder="e.g. 0712345678"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
                            <Button
                                className="w-full bg-ksa-green hover:bg-green-800 text-white"
                                onClick={checkStatus}
                                disabled={loading || !nationalId || !phone}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Check Status"}
                            </Button>

                            <div className="text-center mt-4">
                                <a href="/" className="text-sm text-slate-600 hover:text-ksa-green hover:underline">
                                    ← Back to Application
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    // Status Dashboard
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                        <div className={`h-2 w-full 
                            ${app.status === 'APPROVED' ? 'bg-green-500' : ''}
                            ${app.status === 'REJECTED' ? 'bg-red-500' : ''}
                            ${app.status === 'PENDING' ? 'bg-blue-500' : ''}
                            ${app.status === 'NEEDS_CORRECTION' ? 'bg-yellow-500' : ''}
                        `} />
                        <CardHeader className="text-center border-b border-slate-50 pb-6">
                            <h2 className="text-xl font-bold text-slate-900">{app.full_name}</h2>
                            <p className="text-sm text-slate-500">{app.course_track} Track • {app.preferred_campus || 'No Campus'}</p>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6 text-center">

                            {/* Status Badge */}
                            <div className="inline-flex flex-col items-center">
                                {app.status === 'APPROVED' && <CheckCircle className="h-12 w-12 text-green-500 mb-2" />}
                                {app.status === 'REJECTED' && <XCircle className="h-12 w-12 text-red-500 mb-2" />}
                                {app.status === 'PENDING' && <Loader2 className="h-12 w-12 text-blue-500 mb-2 animate-spin-slow" />}
                                {app.status === 'NEEDS_CORRECTION' && <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />}

                                <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-800 uppercase tracking-wide">
                                    {app.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Status Message */}
                            {/* Status and Note */}
                            <div className="bg-slate-50 p-4 rounded-lg text-left">
                                {app.status === 'APPROVED' && (
                                    <p className="text-slate-700 text-center">Congratulations! Your application has been approved. You can now download your admission letter.</p>
                                )}
                                {app.status === 'PENDING' && (
                                    <p className="text-slate-700 text-center">Your application is currently under review by our admissions team. Please check back later.</p>
                                )}
                                {app.status === 'REJECTED' && (
                                    <p className="text-slate-700 text-center">Unfortunately, your application was not successful at this time.</p>
                                )}
                                {app.status === 'NEEDS_CORRECTION' && (
                                    <div className="space-y-2 border-l-4 border-yellow-500 pl-4 py-1">
                                        <p className="text-slate-900 font-bold flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-600" /> Action Required
                                        </p>
                                        <p className="text-sm text-slate-600">The admin has requested changes:</p>
                                        <p className="text-sm font-medium text-slate-800 bg-yellow-100 p-3 rounded-md">
                                            "{app.admin_note || "Please fix the highlighted errors."}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* View Details Accordion */}
                            <details className="group border border-slate-200 rounded-lg bg-white overflow-hidden text-left">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 font-medium text-slate-700">
                                    <span>View Application Details</span>
                                    <span className="transition-transform group-open:rotate-180">▼</span>
                                </summary>
                                <div className="p-4 border-t border-slate-100 space-y-4 text-sm bg-slate-50/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Personal Info</p>
                                            <p><span className="font-semibold">Email:</span> {app.email}</p>
                                            <p><span className="font-semibold">Phone:</span> {app.phone_number}</p>
                                            <p><span className="font-semibold">National ID:</span> {app.national_id}</p>
                                            <p><span className="font-semibold">DOB:</span> {new Date(app.dob).toLocaleDateString()}</p>
                                            <p><span className="font-semibold">County:</span> {app.county_of_recidence}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Academic Info</p>
                                            <p><span className="font-semibold">Track:</span> {app.course_track}</p>
                                            <p><span className="font-semibold">Campus:</span> {app.preferred_campus}</p>
                                            <p><span className="font-semibold">Qualification:</span> {app.highest_qualification}</p>
                                            <p><span className="font-semibold">KCSE Grade:</span> {app.kcse_mean_grade}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-slate-500 uppercase font-bold">Payment Info</p>
                                            <p><span className="font-semibold">M-PESA Code:</span> {app.mpesa_code}</p>
                                        </div>
                                    </div>
                                </div>
                            </details>

                            {/* Actions */}
                            <div className="pt-2 space-y-3">
                                {app.status === 'APPROVED' && (
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                                        <Download className="mr-2 h-4 w-4" /> Download Admission Letter
                                    </Button>
                                )}
                                {app.status === 'NEEDS_CORRECTION' && (
                                    <Button onClick={() => setIsCorrection(true)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white">
                                        Edit Application & Resubmit
                                    </Button>
                                )}

                                {/* Download Original Application Form */}
                                <a
                                    href={`https://drive.google.com/uc?id=${app.course_track === 'CBET' ? '1uMgdaa8KGlWmyKz24V1HDUpn8z13CHh7' : '1571BpZBELkh3p3j5LlRrj5gXQhQvuO2i'}&export=download`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                >
                                    <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-50">
                                        <Download className="mr-2 h-4 w-4" /> Download Application Form
                                    </Button>
                                </a>

                                <Button variant="ghost" onClick={() => setApp(null)} className="text-slate-500 text-xs">
                                    Logout
                                </Button>
                            </div>

                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
