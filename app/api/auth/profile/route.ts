import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

export async function GET() {
  try {
    const user = await Handler.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Get profile API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get profile" },
      { status: 400 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()

    await Handler.updateProfile(updates)

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Update profile API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update profile failed" },
      { status: 400 },
    )
  }
}
