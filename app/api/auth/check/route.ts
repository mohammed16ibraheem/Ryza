import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// Force dynamic rendering - this route uses cookies which are dynamic
export const dynamic = 'force-dynamic'

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'your-secret-key-change-this-in-production'
)

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, SECRET_KEY)
      
      if (payload.authenticated) {
        return NextResponse.json({ authenticated: true, username: payload.username })
      }
    } catch (error) {
      // Token is invalid or expired
      cookieStore.delete('admin_session')
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

