import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Ignore static files, next internal assets, and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api/') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
    const sessionCookie = request.cookies.get('crm_session')?.value;

    if (!sessionCookie && !isPublicPath) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    if (sessionCookie && isPublicPath) {
        const overviewUrl = new URL('/overview', request.url);
        return NextResponse.redirect(overviewUrl);
    }

    return NextResponse.next();
}

export function middleware(request: NextRequest) {
    return proxy(request);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
