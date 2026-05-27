import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/shared/data/firebase-admin'

const SESSION_DURATION_MS = 60 * 60 * 24 * 5 * 1000 // 5 days

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json()
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    })
    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
}
