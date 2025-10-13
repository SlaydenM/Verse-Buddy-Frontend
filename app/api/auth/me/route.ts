import { Handler } from '@/lib/api-handler'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) return NextResponse.json({ user: null })
    return NextResponse.json({ user })
  } catch (err) {
    console.error('Error fetching current user:', err)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}
