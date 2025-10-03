import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

export async function POST(request: NextRequest) {
  try {
    console.log("supa signing out")
    await Handler.signOut()
    
    return NextResponse.json({
      success: true,
      message: "Signed out successfully",
    })
  } catch (error) {
    console.error("Signout API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signout failed" }, { status: 400 })
  }
}
