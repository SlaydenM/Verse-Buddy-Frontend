import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

export async function POST(request: NextRequest) {
  try {
    const { newPassword } = await request.json()

    if (!newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    await Handler.updatePassword(newPassword)

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Update password API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update password failed" },
      { status: 400 },
    )
  }
}
