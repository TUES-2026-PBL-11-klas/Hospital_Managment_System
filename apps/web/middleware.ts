import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard/patient': ['PATIENT'],
  '/dashboard/doctor': ['DOCTOR', 'NURSE', 'ADMIN'],
  '/dashboard/pharmacist': ['PHARMACIST', 'ADMIN'],
  '/dashboard/admin': ['ADMIN'],
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('medinest_token')?.value;
  const roleHeader = request.cookies.get('medinest_role')?.value;

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
      if (pathname.startsWith(route) && roleHeader && !allowedRoles.includes(roleHeader)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
