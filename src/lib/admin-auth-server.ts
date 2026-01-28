import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This utilizes the standard anon key but can verify identities
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function verifyAdmin(req: NextRequest) {
    // 1. Get token from Authorization header or cookie
    const authHeader = req.headers.get('Authorization');
    let token = authHeader?.replace('Bearer ', '');

    if (!token) {
        // Fallback to cookie if header missing
        // supabase-js client-side usually stores in localStorage, 
        // but we set a manual session-helper cookie or use the default one if available.
        // For simplicity, we expect the client to send the Bearer token.
        return null;
    }

    // 2. Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        console.error('Auth verification failed:', error?.message);
        return null;
    }

    // 3. Optional: Verify admin role (e.g. check for admin@ksa.ac.ke domain or specific metadata)
    // For now, any successful Supabase login in the admin portal counts as an admin.
    return user;
}
