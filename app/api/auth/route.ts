import { NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json()
  const { password } = body

  if (checkAdminPassword(password)) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
}
