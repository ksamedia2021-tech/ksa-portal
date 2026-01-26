'use client';

import React, { useState, useRef } from 'react';
import { Button, Card, CardContent, Alert } from '@/components/ui/common';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface FormUploadProps {
    referenceId: string;
    nationalId: string;
    onSuccess?: () => void;
}

export const FormUpload: React.FC<FormUploadProps> = ({ referenceId, nationalId, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile?: File) => {
        setError(null);
        if (!selectedFile) return;

        // Validation
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF or an Image (JPG/PNG).');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB.');
            return;
        }

        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('nationalId', nationalId);
            formData.append('referenceId', referenceId);

            const response = await fetch('/api/applications/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to upload form');
            }

            setSuccess(true);
            if (onSuccess) onSuccess();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (success) {
        return (
            <Alert variant="info" className="flex flex-col items-center py-8 text-center bg-green-50 border-green-200">
                <CheckCircle2 className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-lg font-bold text-green-900 mb-2">Form Submitted Successfully!</h3>
                <p className="text-green-700">Thank you. Our team will review your document shortly.</p>
            </Alert>
        );
    }

    return (
        <Card className="border-dashed border-2 border-slate-300 hover:border-ksa-green transition-colors">
            <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                    {!file ? (
                        <>
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1">Upload Your Filled Application Form</h3>
                            <p className="text-xs text-slate-500 mb-4 max-w-xs">
                                Please upload a scanned copy of your filled application form. (PDF, JPG or PNG. Max 5MB)
                            </p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,image/jpeg,image/png"
                                onChange={handleFileChange}
                            />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                Select File
                            </Button>
                        </>
                    ) : (
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-ksa-green/10 text-ksa-green rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearFile}
                                    className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                                    disabled={uploading}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="py-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                </Alert>
                            )}

                            <Button
                                className="w-full"
                                onClick={handleUpload}
                                isLoading={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Confirm & Upload'}
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
