import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"
// change
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    
    const data = await Handler.signIn(email, password)
    
    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error("Signin API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signin failed" }, { status: 400 })
  }
}
