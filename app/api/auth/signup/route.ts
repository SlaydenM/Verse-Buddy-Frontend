import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }
    
    const result = await Handler.signUp(email, password, displayName)
    
    return NextResponse.json({
      success: true,
      autoSignedIn: result.autoSignedIn,
      user: result.data.user,
    })
  } catch (error) {
    console.error("Signup API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signup failed" }, { status: 400 })
  }
}
