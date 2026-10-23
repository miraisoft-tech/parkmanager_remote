import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const users = await query<any>(
      'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials or user not found.' },
        { status: 401 }
      );
    }

    const user = users[0];

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access restricted to administrators only.' },
        { status: 403 }
      );
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password. Please check your credentials.' },
        { status: 401 }
      );
    }

    try {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const userAgent = request.headers.get('user-agent') || 'Next.js Remote Portal';
      await query(
        'INSERT INTO login_activities (user_id, ip_address, user_agent, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [user.id, ip, userAgent]
      );
    } catch {
      // Non-fatal
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name || 'Admin',
      role: user.role
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || 'Admin',
        role: user.role
      }
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'An unexpected server error occurred during authentication.' },
      { status: 500 }
    );
  }
}
