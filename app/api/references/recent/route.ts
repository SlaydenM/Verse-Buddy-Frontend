import { type NextRequest, NextResponse } from "next/server"
import { Handler } from "@/lib/api-handler"

// GET /api/references/recent - Get recent references
export async function GET(request: NextRequest) {
  try {
    const user = await Handler.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 10

    const recentReferences = await Handler.getRecentReferences()
    const limitedReferences = recentReferences.slice(0, limit)

    return NextResponse.json({
      success: true,
      references: limitedReferences,
      count: limitedReferences.length,
    })
  } catch (error) {
    console.error("Get recent references API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get recent references" },
      { status: 500 },
    )
  }
}
