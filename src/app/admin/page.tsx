'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Label } from '@/components/ui/common';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Success! Auth session is handled by Supabase client
            // We can also set a simple helper cookie for the Middleware
            document.cookie = `admin_auth=true; path=/; max-age=3600; SameSite=Lax`;

            router.push('/admin/dashboard');
            router.refresh();
        } catch (error: any) {
            alert(error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[80vh] items-center justify-center font-outfit">
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6 p-8 bg-white shadow-2xl rounded-2xl border border-slate-100">
                <div className="text-center space-y-2">
                    <div className="bg-ksa-green/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-ksa-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Portal</h1>
                    <p className="text-sm text-slate-500">Secure access for KSA Staff</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@ksa.ac.ke"
                            className="bg-slate-50 border-none focus:ring-2 focus:ring-ksa-green"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-slate-50 border-none focus:ring-2 focus:ring-ksa-green"
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 bg-ksa-green hover:bg-ksa-green/90 text-white font-semibold transition-all shadow-lg shadow-ksa-green/20"
                    disabled={loading}
                >
                    {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
            </form>
        </div>
    );
}
