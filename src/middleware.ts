import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Only run on admin routes (except the login page)
    if (pathname.startsWith('/admin') && pathname !== '/admin') {
        const adminAuth = request.cookies.get('admin_auth');

        // 2. Redirect to login if no auth cookie found
        if (!adminAuth || adminAuth.value !== 'true') {
            const loginUrl = new URL('/admin', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
