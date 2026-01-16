'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@/components/ui/common';

export default function AdminLogin() {
    const router = useRouter();
    const [pin, setPin] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '2026') {
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('admin_pin', '2026');
            }
            router.push('/admin/dashboard');
        } else {
            alert('Invalid Admin PIN');
        }
    };

    return (
        <div className="flex h-[80vh] items-center justify-center">
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8 bg-white shadow-lg rounded-xl border border-slate-200">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900">Admin Portal</h1>
                    <p className="text-sm text-slate-500">KSA Student Applications</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pin">Security PIN</Label>
                    <Input
                        id="pin"
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        placeholder="••••"
                        className="text-center text-lg tracking-widest"
                        maxLength={4}
                    />
                </div>
                <Button type="submit" className="w-full">Login</Button>
            </form>
        </div>
    );
}
