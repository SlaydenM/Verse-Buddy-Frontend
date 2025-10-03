import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await Handler.resetPassword(email)

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    })
  } catch (error) {
    console.error("Reset password API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset password failed" },
      { status: 400 },
    )
  }
}
